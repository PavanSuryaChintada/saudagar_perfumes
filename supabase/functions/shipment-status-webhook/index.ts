// Courier status push (Delhivery). Authenticated by a shared secret in the x-shipping-secret header or the
// ?secret= query parameter (whichever the courier supports). Always answers 200 for unknown AWBs.
import { fail, json, safeEqual, serviceClient } from '../_shared/razorpay.ts';
import { mapDelhiveryStatus } from '../_shared/shipping/core.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return fail('Use POST.', 405);
  const secret = Deno.env.get('SHIPPING_HOOK_SECRET') ?? '';
  const given = req.headers.get('x-shipping-secret') ?? new URL(req.url).searchParams.get('secret') ?? '';
  if (!secret || !safeEqual(given, secret)) return fail('Not allowed.', 401);

  const payload = (await req.json().catch(() => null)) as
    | { Shipment?: { AWB?: string; Status?: { Status?: string; StatusType?: string } } }
    | { Shipment?: { AWB?: string; Status?: { Status?: string; StatusType?: string } } }[]
    | null;
  const events = Array.isArray(payload) ? payload : payload ? [payload] : [];
  const db = serviceClient();
  let matched = 0;
  for (const e of events) {
    const awb = e.Shipment?.AWB;
    if (!awb) continue;
    const raw = `${e.Shipment?.Status?.Status ?? ''} (${e.Shipment?.Status?.StatusType ?? ''})`;
    const { data } = await db.rpc('apply_shipment_status', {
      p_awb: awb,
      p_raw: raw,
      p_status: mapDelhiveryStatus(e.Shipment?.Status?.Status ?? '', e.Shipment?.Status?.StatusType),
    });
    if ((data as { matched?: boolean })?.matched) matched += 1;
  }
  return json({ received: events.length, matched });
});
