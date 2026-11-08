// Admin → Connections: which keys the server has (yes/no only, never the values) and a harmless test of each.
//   {action: 'status'}                         what is configured
//   {action: 'test', service: 'razorpay'}      reads one payment list page with the keys (changes nothing)
//   {action: 'test', service: 'delhivery', pincode?}  asks Delhivery about one pincode (changes nothing)
import { CORS, caller, fail, json, keys, serviceClient } from '../_shared/razorpay.ts';
import * as delhivery from '../_shared/shipping/delhivery.ts';

const has = (name: string) => !!(Deno.env.get(name) ?? '').trim();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return fail('Use POST.', 405);
  const user = await caller(req);
  const { data: isAdmin } = user ? await user.client.rpc('is_admin') : { data: false };
  if (!isAdmin) return fail('Not allowed.', 403);
  const body = (await req.json().catch(() => ({}))) as { action?: string; service?: string; pincode?: string };

  if (body.action === 'status') {
    const { keyId } = keys();
    return json({
      razorpay: {
        key_id: has('RAZORPAY_KEY_ID'),
        key_secret: has('RAZORPAY_KEY_SECRET'),
        webhook_secret: has('RAZORPAY_WEBHOOK_SECRET'),
        mode: keyId.startsWith('rzp_live_') ? 'live' : keyId.startsWith('rzp_test_') ? 'test' : null,
      },
      delhivery: { token: has('DELHIVERY_TOKEN') },
      hook: { secret: has('SHIPPING_HOOK_SECRET') },
    });
  }

  if (body.action === 'test' && body.service === 'razorpay') {
    const { keyId, keySecret, configured } = keys();
    if (!configured) return json({ ok: false, message: 'The Razorpay keys are not on the server yet.' });
    const res = await fetch('https://api.razorpay.com/v1/payments?count=1', {
      headers: { Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}` },
    }).catch(() => null);
    if (!res) return json({ ok: false, message: 'Razorpay could not be reached. Try again in a minute.' });
    if (res.status === 401) return json({ ok: false, message: 'Razorpay did not accept the keys. Check the Key ID and Key Secret.' });
    if (!res.ok) return json({ ok: false, message: `Razorpay answered with an error (${res.status}).` });
    return json({ ok: true, message: keyId.startsWith('rzp_live_') ? 'Razorpay live keys work. Real payments are on.' : 'Razorpay test keys work. Payments are in test mode.' });
  }

  if (body.action === 'test' && body.service === 'delhivery') {
    const token = Deno.env.get('DELHIVERY_TOKEN') ?? '';
    if (!token) return json({ ok: false, message: 'The Delhivery token is not on the server yet.' });
    const db = serviceClient();
    const { data } = await db.from('settings').select('key, value').like('key', 'delhivery.%');
    const s = Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as Record<string, unknown>;
    const cfg: delhivery.DelhiveryConfig = {
      token,
      mode: s['delhivery.mode'] === 'production' ? 'production' : 'staging',
      pickupLocation: String(s['delhivery.pickup_location'] ?? ''),
    };
    const pin = /^[1-9][0-9]{5}$/.test(body.pincode ?? '') ? body.pincode! : '110001';
    try {
      const r = await delhivery.serviceability(cfg, pin);
      const where = cfg.mode === 'production' ? 'live' : 'test (staging)';
      return json({
        ok: true,
        message: `Delhivery ${where} token works. Pincode ${pin}: ${r.serviceable ? `delivers${r.cod ? ', cash on delivery available' : ', prepaid only'}` : 'not served'}.${cfg.pickupLocation ? '' : ' Add the pickup location name before going live.'}`,
      });
    } catch (err) {
      return json({ ok: false, message: `Delhivery did not accept the token or the request: ${(err as Error).message}` });
    }
  }

  return fail('Unknown action.');
});
