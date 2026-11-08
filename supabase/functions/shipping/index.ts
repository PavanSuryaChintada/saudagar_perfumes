// Shipping actions. Callers: the "packed" database hook and the poll (x-shipping-secret), or an admin (JWT).
//   {action: 'create', order_id}   book with the order's courier (Delhivery now; India Post once its API is added)
//   {action: 'cancel', order_id}   cancel the Delhivery shipment
//   {action: 'poll'}               refresh courier status for undelivered Delhivery orders
//   {action: 'serviceability', pincode}  Delhivery's answer for a pincode (public)
import { CORS, caller, fail, json, safeEqual, serviceClient } from '../_shared/razorpay.ts';
import { codCollectable, parcel } from '../_shared/shipping/core.ts';
import * as delhivery from '../_shared/shipping/delhivery.ts';
import * as indiapost from '../_shared/shipping/indiapost.ts';

async function settings(db: ReturnType<typeof serviceClient>) {
  const { data } = await db.from('settings').select('key, value').or('key.like.delhivery.%,key.like.shipping.%,key.like.indiapost.%');
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return fail('Use POST.', 405);
  const body = (await req.json().catch(() => ({}))) as { action?: string; order_id?: string; pincode?: string };
  const db = serviceClient();
  const s = await settings(db);
  const token = Deno.env.get('DELHIVERY_TOKEN') ?? '';
  const enabled = s['delhivery.enabled'] === true && !!token;
  const cfg: delhivery.DelhiveryConfig = {
    token,
    mode: s['delhivery.mode'] === 'production' ? 'production' : 'staging',
    pickupLocation: String(s['delhivery.pickup_location'] ?? ''),
  };

  if (body.action === 'serviceability') {
    if (!enabled || !/^[1-9][0-9]{5}$/.test(body.pincode ?? '')) return json({ available: false });
    try {
      return json({ available: true, ...(await delhivery.serviceability(cfg, body.pincode!)) });
    } catch (err) {
      console.error('serviceability', err);
      return json({ available: false });
    }
  }

  // Everything else: the hook secret or an admin.
  const secret = Deno.env.get('SHIPPING_HOOK_SECRET') ?? '';
  const viaHook = !!secret && safeEqual(req.headers.get('x-shipping-secret') ?? '', secret);
  if (!viaHook) {
    const user = await caller(req);
    const { data: isAdmin } = user ? await user.client.rpc('is_admin') : { data: false };
    if (!isAdmin) return fail('Not allowed.', 403);
  }
  const indiaPostOn = s['indiapost.enabled'] === true && indiapost.ready;
  if (!enabled && !indiaPostOn) return fail('No courier connection is switched on. Book the parcel by hand and enter its tracking number.', 503);

  if (body.action === 'poll') {
    const { data: rows } = await db
      .from('orders')
      .select('tracking_number')
      .eq('courier', 'delhivery')
      .in('status', ['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY'])
      .not('tracking_number', 'is', null)
      .limit(200);
    const awbs = (rows ?? []).map((r) => r.tracking_number as string);
    let changed = 0;
    for (let i = 0; i < awbs.length; i += 50) {
      for (const t of await delhivery.track(cfg, awbs.slice(i, i + 50))) {
        const { data } = await db.rpc('apply_shipment_status', { p_awb: t.awb, p_raw: t.raw, p_status: t.status });
        if ((data as { changed?: boolean })?.changed) changed += 1;
      }
    }
    return json({ checked: awbs.length, changed });
  }

  if (typeof body.order_id !== 'string') return fail('Missing order.');
  const { data: order } = await db
    .from('orders')
    .select('id, order_number, status, payment_method, payment_status, total, tracking_number, courier, shipping_address, order_items(qty, product_name, line_type, variant_id, product_id)')
    .eq('id', body.order_id)
    .maybeSingle();
  if (!order) return fail('Order not found.', 404);

  if (body.action === 'cancel') {
    if (order.courier !== 'delhivery' || !order.tracking_number) return json({ cancelled: false });
    try {
      await delhivery.cancel(cfg, order.tracking_number);
      return json({ cancelled: true });
    } catch (err) {
      await db.rpc('save_shipment_booking', { p_order: order.id, p_awb: null, p_courier_order_id: null, p_label_url: null, p_pickup: null, p_error: `Cancel failed: ${(err as Error).message}` });
      return fail((err as Error).message, 502);
    }
  }

  if (body.action === 'create') {
    if (order.status !== 'PACKED') return fail('Only packed orders can be booked.', 409);
    if (order.tracking_number) return json({ awb: order.tracking_number, already: true });
    // Each order goes with its own courier, and only when that courier's connection is on.
    if (order.courier === 'india_post') {
      if (!indiaPostOn) return fail('India Post automatic booking is not connected yet. Book at the post office and type the article number.', 503);
    } else if (order.courier !== 'delhivery') {
      return fail('This order is set to be booked by hand. Book it with its courier and type the tracking number.', 409);
    } else if (!enabled) {
      return fail('Delhivery is not switched on. Book the parcel by hand and enter its tracking number.', 503);
    }
    try {
      const all = (order.order_items as { qty: number; product_name: string; line_type: string; variant_id: string | null; product_id: string | null }[]) ?? [];
      // Weight comes from what is sold; free samples and a gift pack's pours ride inside its box.
      const items = all.filter((i) => i.line_type === 'item');
      const variantIds = items.map((i) => i.variant_id).filter(Boolean) as string[];
      const { data: variants } = await db.from('product_variants').select('id, weight_g, length_mm, width_mm, height_mm').in('id', variantIds);
      const { data: products } = await db.from('products').select('id, ships_surface_only').in('id', items.map((i) => i.product_id).filter(Boolean) as string[]);
      const vmap = new Map((variants ?? []).map((v) => [v.id, v]));
      const box = (s['shipping.default_box'] ?? {}) as { length_mm?: number; width_mm?: number; height_mm?: number };
      const p = parcel(
        items.map((i) => ({ qty: i.qty, ...(vmap.get(i.variant_id ?? '') ?? { weight_g: null }) })),
        {
          packaging_g: Number(s['shipping.packaging_g'] ?? 150),
          default_item_g: Number(s['shipping.default_item_g'] ?? 300),
          length_mm: Number(box.length_mm ?? 200),
          width_mm: Number(box.width_mm ?? 150),
          height_mm: Number(box.height_mm ?? 100),
        },
      );
      const a = order.shipping_address as Record<string, string>;
      const paidItems = items.filter((i) => i.line_type === 'item');
      const shipment = {
        orderNumber: order.order_number,
        name: a.full_name,
        phone: a.phone,
        address: [a.line1, a.line2, a.landmark && `Near ${a.landmark}`].filter(Boolean).join(', '),
        city: a.city,
        state: a.state,
        pincode: a.pincode,
        codAmount: codCollectable(order),
        total: Number(order.total),
        weightG: p.weight_g,
        lengthMm: p.length_mm,
        widthMm: p.width_mm,
        heightMm: p.height_mm,
        productsDesc: paidItems.map((i) => `${i.product_name} x${i.qty}`).join(', ') || 'Perfume',
        quantity: items.reduce((n, i) => n + i.qty, 0),
        surface: (products ?? []).some((x) => x.ships_surface_only),
      };
      if (order.courier === 'india_post') {
        const booked = await indiapost.createShipment({ credentials: {} }, shipment);
        await db.rpc('save_shipment_booking', { p_order: order.id, p_awb: booked.awb, p_courier_order_id: booked.refnum, p_label_url: null, p_pickup: null, p_error: null });
        return json({ awb: booked.awb });
      }
      const booked = await delhivery.createShipment(cfg, shipment);
      let pickup: Date | null = null;
      try {
        pickup = await delhivery.schedulePickup(cfg, 1);
      } catch (err) {
        console.error('pickup', err);
      }
      await db.rpc('save_shipment_booking', {
        p_order: order.id,
        p_awb: booked.awb,
        p_courier_order_id: booked.refnum,
        p_label_url: delhivery.labelUrl(cfg, booked.awb),
        p_pickup: pickup ? pickup.toISOString() : null,
        p_error: null,
      });
      return json({ awb: booked.awb });
    } catch (err) {
      await db.rpc('save_shipment_booking', { p_order: order.id, p_awb: null, p_courier_order_id: null, p_label_url: null, p_pickup: null, p_error: (err as Error).message });
      return fail((err as Error).message, 502);
    }
  }

  return fail('Unknown action.');
});
