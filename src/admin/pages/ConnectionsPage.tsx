import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, CircleDashed, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { toFriendlyError } from '../../lib/errors';
import { invokeFunction } from '../../lib/razorpay';
import { PageHeader, Panel } from '../ui/PageHeader';
import { Button } from '../ui/Button';
import { TextInput } from '../ui/Field';

interface Readiness {
  hook_secret: boolean;
  functions_url: string | null;
  online_payments: boolean;
  delhivery_enabled: boolean;
  delhivery_mode: string;
  delhivery_pickup_location: string;
  indiapost_enabled: boolean;
  status_updates: string;
  default_courier: string;
  ga4_id: string;
  gtm_id: string;
  meta_pixel_id: string;
}

interface ServerKeys {
  razorpay: { key_id: boolean; key_secret: boolean; webhook_secret: boolean; mode: 'test' | 'live' | null };
  delhivery: { token: boolean };
  hook: { secret: boolean };
}

/** Admin → Connections: each outside service, whether it is connected, what is still needed, and a test. */
export default function ConnectionsPage() {
  const readiness = useQuery({
    queryKey: ['admin', 'connections', 'readiness'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('integration_readiness');
      if (error) throw error;
      return data as unknown as Readiness;
    },
  });
  const server = useQuery({
    queryKey: ['admin', 'connections', 'server'],
    queryFn: () => invokeFunction<ServerKeys>('integrations', { action: 'status' }),
    retry: false,
  });
  const r = readiness.data;
  const k = server.data;

  if (readiness.error) return <p className="text-[14px] text-rose-600">{toFriendlyError(readiness.error)}</p>;
  if (!r) return <p className="text-[14px] text-[#4A4A4A]">Loading…</p>;

  const link = !!k?.hook.secret && r.hook_secret;
  const rzpKeys = !!k?.razorpay.key_id && !!k?.razorpay.key_secret;
  const rzpLive = rzpKeys && r.online_payments;
  const dlvLive = !!k?.delhivery.token && r.delhivery_enabled;
  const base = r.functions_url ?? '';

  return (
    <div className="pb-10">
      <PageHeader
        title="Connections"
        description="Payments, couriers and tracking. Each one shows whether it is connected, what is still needed, and a button to test it. Keys are kept on the server and never shown here."
      />
      {server.error && (
        <p className="mb-5 text-[13.5px] bg-amber-50 border border-amber-200 text-amber-900 px-3 py-2">
          The connection checker isn’t reachable right now, so key status is unknown. Everything else below is up to date.
        </p>
      )}
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          title="Online payments: Razorpay"
          description="Cards, UPI, net banking and wallets at checkout. Refunds go back automatically when a paid order is cancelled."
          action={<StatusPill on={rzpLive} label={rzpLive ? (k?.razorpay.mode === 'live' ? 'Connected · live' : 'Connected · test mode') : 'Not connected'} />}
        >
          <Checklist
            items={[
              ['Keys on the server', rzpKeys],
              ['Webhook secret on the server', !!k?.razorpay.webhook_secret],
              ['Online payments offered at checkout', r.online_payments],
              ['Automatic refunds link', link],
            ]}
          />
          <Needed>
            <li><b>Key ID</b> and <b>Key Secret</b>: Razorpay Dashboard → Account &amp; Settings → API Keys (start with test keys).</li>
            <li><b>Webhook secret</b>: any long password you type when adding the webhook below.</li>
          </Needed>
          <Copyable label="Webhook URL to add in Razorpay → Webhooks" value={base ? `${base}/razorpay-webhook` : ''} />
          <p className="mt-2 text-[12.5px] text-[#4A4A4A]">Tick these events: payment.captured, payment.failed, refund.processed, refund.failed.</p>
          <TestButton service="razorpay" disabled={!rzpKeys} />
        </Panel>

        <Panel
          title="Courier: Delhivery"
          description="When you mark an order packed with Delhivery, the store books it: tracking number (AWB), label to print and pickup. Tracking then updates by itself."
          action={<StatusPill on={dlvLive} label={dlvLive ? (r.delhivery_mode === 'production' ? 'Connected · live' : 'Connected · test (staging)') : 'Not connected'} />}
        >
          <Checklist
            items={[
              ['Token on the server', !!k?.delhivery.token],
              ['Automatic booking switched on', r.delhivery_enabled],
              [`Pickup location${r.delhivery_pickup_location ? `: ${r.delhivery_pickup_location}` : ''}`, !!r.delhivery_pickup_location],
              [r.status_updates === 'poll' ? 'Tracking checked every 30 minutes' : 'Tracking pushed by Delhivery (set up with Delhivery)', r.status_updates === 'poll' || r.delhivery_enabled],
              ['Booking link (database to courier)', link],
            ]}
          />
          <p className="mt-2 text-[13px] text-[#3F3F3F]">New orders go with: <b>{r.default_courier === 'delhivery' ? 'Delhivery' : r.default_courier === 'india_post' ? 'India Post' : 'manual courier'}</b>. You can change it per order when packing. <Link to="/admin/shipping" className="underline">Shipping settings</Link></p>
          <Needed>
            <li><b>API token</b> from your Delhivery business account (ask your Delhivery account manager if you can’t find it).</li>
            <li><b>Pickup location name</b>, exactly as registered with Delhivery (your warehouse or shop).</li>
            <li>Whether to start in <b>test (staging)</b> or <b>live</b>.</li>
          </Needed>
          <TestButton service="delhivery" disabled={!k?.delhivery.token} pincode />
        </Panel>

        <Panel
          title="Courier: India Post"
          description="Speed Post and registered parcels."
          action={<StatusPill on={r.indiapost_enabled} label={r.indiapost_enabled ? 'Connected' : 'Waiting for API details'} />}
        >
          <p className="text-[13.5px] text-[#3F3F3F]">
            Works by hand today: book at the post office, then open the order, press <b>Mark shipped</b> and type the article number. Customers get a tracking link.
          </p>
          <Needed>
            <li>The <b>API documents and credentials</b> India Post gives with your business account. Automatic booking and tracking are added from those documents.</li>
          </Needed>
        </Panel>

        <Panel
          title="Visitor and sales tracking"
          description="Google Analytics and the Meta (Facebook / Instagram) Pixel. They only need IDs, no secret keys."
          action={<StatusPill on={!!(r.ga4_id || r.gtm_id || r.meta_pixel_id)} label={r.ga4_id || r.gtm_id || r.meta_pixel_id ? 'On' : 'Not set'} />}
        >
          <Checklist
            items={[
              [`Google Analytics 4${r.ga4_id ? `: ${r.ga4_id}` : ''}`, !!r.ga4_id],
              [`Google Tag Manager${r.gtm_id ? `: ${r.gtm_id}` : ''} (optional)`, !!r.gtm_id],
              [`Meta Pixel${r.meta_pixel_id ? `: ${r.meta_pixel_id}` : ''}`, !!r.meta_pixel_id],
            ]}
          />
          <Needed>
            <li><b>GA4 measurement ID</b> (looks like G-XXXXXXX): Google Analytics → Admin → Data streams.</li>
            <li><b>Meta Pixel ID</b> (a long number): Meta Events Manager → Data sources.</li>
          </Needed>
          <p className="mt-3 text-[13px]"><Link to="/admin/settings" className="underline">Enter or change the IDs in Settings → Analytics</Link></p>
        </Panel>
      </div>
    </div>
  );
}

function StatusPill({ on, label }: { on: boolean; label: string }) {
  return (
    <span className={`inline-block px-2.5 py-1 text-[12px] font-semibold border ${on ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-[#EFEDE8] text-[#3F3F3F] border-[#D6D1C6]'}`}>{label}</span>
  );
}

function Checklist({ items }: { items: [string, boolean][] }) {
  return (
    <ul className="space-y-1.5">
      {items.map(([label, done]) => (
        <li key={label} className="flex items-start gap-2 text-[13.5px]">
          {done ? <CheckCircle2 size={16} className="mt-0.5 text-emerald-700 shrink-0" aria-hidden /> : <CircleDashed size={16} className="mt-0.5 text-[#8A8A8A] shrink-0" aria-hidden />}
          <span className={done ? 'text-tk-ink' : 'text-[#4A4A4A]'}>
            {label}
            <span className="sr-only">{done ? ' (done)' : ' (not yet)'}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function Needed({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 bg-[#FAF8F4] border border-[#E6DFD0] px-3 py-2.5">
      <p className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-[#555555] mb-1">What to send</p>
      <ul className="list-disc pl-5 space-y-1 text-[13px] text-[#2F2F2F]">{children}</ul>
    </div>
  );
}

function Copyable({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4">
      <p className="text-[12.5px] font-medium text-[#3F3F3F] mb-1">{label}</p>
      <div className="flex gap-2">
        <TextInput readOnly value={value} aria-label={label} className="font-mono text-[12.5px]" />
        <Button
          variant="secondary"
          disabled={!value}
          onClick={() => {
            void navigator.clipboard?.writeText(value);
            toast.success('Copied.');
          }}
        >
          <Copy size={14} /> Copy
        </Button>
      </div>
    </div>
  );
}

function TestButton({ service, disabled, pincode }: { service: 'razorpay' | 'delhivery'; disabled?: boolean; pincode?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [pin, setPin] = useState('');
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  return (
    <div className="mt-4 pt-4 border-t border-[#E9E5DC] space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {pincode && (
          <TextInput inputMode="numeric" maxLength={6} placeholder="Pincode to check (optional)" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} className="max-w-[220px]" aria-label="Pincode to check" />
        )}
        <Button
          variant="secondary"
          busy={busy}
          disabled={disabled}
          onClick={async () => {
            setBusy(true);
            setResult(null);
            try {
              setResult(await invokeFunction<{ ok: boolean; message: string }>('integrations', { action: 'test', service, pincode: pin || undefined }));
            } catch (err) {
              setResult({ ok: false, message: toFriendlyError(err) });
            } finally {
              setBusy(false);
            }
          }}
        >
          Test connection
        </Button>
        {disabled && <span className="text-[12.5px] text-[#4A4A4A]">Available once the keys are added.</span>}
      </div>
      {result && (
        <p role="status" className={`text-[13.5px] px-3 py-2 border ${result.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
          {result.message}
        </p>
      )}
    </div>
  );
}
