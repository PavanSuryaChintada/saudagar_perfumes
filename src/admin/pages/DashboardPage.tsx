import { Link } from 'react-router';
import { PageHeader, Panel } from '../ui/PageHeader';
import { useAuth } from '../../lib/auth';

const SETUP = [
  { label: 'Razorpay keys (online payments)', detail: 'Until then the store takes cash on delivery only.' },
  { label: 'Delhivery token and pickup location', detail: 'Until then shipments are booked manually with a tracking number.' },
  { label: 'Email provider (SMTP)', detail: 'Needed before password-reset emails reach customers.' },
  { label: 'Supabase Pro plan', detail: 'Needed before launch for bandwidth and image resizing.' },
  { label: 'GSTIN, business address and policy pages', detail: 'Placeholders are in use.' },
];

export default function DashboardPage() {
  const { profile, user } = useAuth();
  return (
    <div>
      <PageHeader title="Dashboard" description={`Welcome${profile?.full_name ? `, ${profile.full_name}` : user?.email ? `, ${user.email}` : ''}.`} />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title="Before launch" description="Integrations are built and switched off. Each one starts working when its keys are added.">
            <ul className="divide-y divide-[#F0F0F0]">
              {SETUP.map((s) => (
                <li key={s.label} className="py-3 flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 bg-[#C4823F]" aria-hidden />
                  <div>
                    <p className="text-[13px] text-[#111111]">{s.label}</p>
                    <p className="text-[12px] text-[#777777]">{s.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
        <Panel title="Quick links">
          <ul className="space-y-2 text-[13px]">
            <li>
              <Link to="/admin/settings" className="underline underline-offset-4 hover:text-[#C4823F]">
                Store settings
              </Link>
            </li>
            <li>
              <Link to="/admin/media" className="underline underline-offset-4 hover:text-[#C4823F]">
                Media library
              </Link>
            </li>
            <li>
              <a href="/" target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-[#C4823F]">
                Open the store
              </a>
            </li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}
