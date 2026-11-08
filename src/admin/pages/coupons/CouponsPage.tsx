import { useMemo, useState } from 'react';
import { usePaged } from '../../../lib/paging';
import { Pager } from '../../ui/Pager';
import { useSearchParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { toFriendlyError } from '../../../lib/errors';
import { formatRupees as formatINR } from '../../../lib/money';
import { PageHeader } from '../../ui/PageHeader';
import { Button } from '../../ui/Button';
import { FieldShell, TextArea, TextInput, Toggle } from '../../ui/Field';
import { Modal } from '../../ui/Modal';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { SearchMultiSelect, categoryOptions } from '../../ui/SearchSelect';
import { useEditParam } from '../../ui/useEditParam';
import { rpc, throwIf, useCategories } from '../../catalog/api';
import { useProductLookup } from '../../cms/lookups';
import WelcomeTab from './WelcomeTab';
import BirthdayTab from './BirthdayTab';

export interface CouponRow {
  id: string;
  code: string;
  kind: 'general' | 'welcome' | 'birthday';
  description: string | null;
  discount_type: 'PERCENT' | 'FLAT';
  value: number;
  max_discount: number | null;
  min_order: number;
  usage_limit: number | null;
  per_customer_limit: number | null;
  first_order_only: boolean;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  is_listed: boolean;
  assigned_user_id: string | null;
  admin_note: string | null;
  coupon_categories: { category_id: string }[];
  coupon_excluded_products: { product_id: string }[];
  coupon_redemptions: { id: string; released_at: string | null }[];
  assigned?: { email: string | null; full_name: string | null } | null;
}

type Draft = {
  id?: string;
  code: string;
  description: string;
  discount_type: 'PERCENT' | 'FLAT';
  value: string;
  max_discount: string;
  min_order: string;
  usage_limit: string;
  per_customer_limit: string;
  first_order_only: boolean;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  is_listed: boolean;
  assigned_user_id: string;
  assigned_label: string;
  admin_note: string;
  category_ids: string[];
  excluded_product_ids: string[];
};

const EMPTY: Draft = {
  code: '', description: '', discount_type: 'PERCENT', value: '', max_discount: '', min_order: '', usage_limit: '', per_customer_limit: '1',
  first_order_only: false, starts_at: '', expires_at: '', is_active: true, is_listed: true, assigned_user_id: '', assigned_label: '', admin_note: '',
  category_ids: [], excluded_product_ids: [],
};

const toLocal = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function couponStatus(c: Pick<CouponRow, 'is_active' | 'starts_at' | 'expires_at' | 'usage_limit'> & { used: number }): { label: string; tone: string } {
  const now = Date.now();
  if (!c.is_active) return { label: 'Off', tone: 'bg-[#F4F3EE] text-[#4A4A4A] border-[#D3D0C8]' };
  if (c.expires_at && new Date(c.expires_at).getTime() <= now) return { label: 'Expired', tone: 'bg-[#F4F3EE] text-[#4A4A4A] border-[#D3D0C8]' };
  if (c.usage_limit !== null && c.used >= c.usage_limit) return { label: 'Used up', tone: 'bg-[#F4F3EE] text-[#4A4A4A] border-[#D3D0C8]' };
  if (c.starts_at && new Date(c.starts_at).getTime() > now) return { label: 'Scheduled', tone: 'bg-sky-50 text-sky-800 border-sky-200' };
  return { label: 'Live', tone: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
}

export function describeOffer(c: { discount_type: string; value: number; max_discount: number | null; min_order: number }) {
  const base = c.discount_type === 'PERCENT' ? `${Number(c.value)}% off` : `${formatINR(Number(c.value))} off`;
  return [base, c.max_discount ? `up to ${formatINR(Number(c.max_discount))}` : '', Number(c.min_order) > 0 ? `on ${formatINR(Number(c.min_order))}+` : ''].filter(Boolean).join(' · ');
}

export default function CouponsPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'welcome' ? 'welcome' : params.get('tab') === 'birthday' ? 'birthday' : 'coupons';
  return (
    <div>
      <PageHeader title="Coupons" description="Codes customers type or pick at checkout, the welcome gift every new customer gets, and birthday codes." />
      <div role="tablist" aria-label="Coupons" className="flex gap-1 border-b border-[#E2E0DB] mb-5">
        {([
          ['coupons', 'Coupons'],
          ['welcome', 'Welcome offer'],
          ['birthday', 'Birthdays'],
        ] as const).map(([k, l]) => (
          <button
            key={k}
            role="tab"
            type="button"
            aria-selected={tab === k}
            onClick={() => setParams(k === 'coupons' ? {} : { tab: k })}
            className={`px-3 py-2 text-[13px] -mb-px border-b-2 ${tab === k ? 'border-tk-ink text-tk-ink' : 'border-transparent text-[#4A4A4A] hover:text-tk-ink'}`}
          >
            {l}
          </button>
        ))}
      </div>
      {tab === 'coupons' && <CouponsTab />}
      {tab === 'welcome' && <WelcomeTab />}
      {tab === 'birthday' && <BirthdayTab />}
    </div>
  );
}

function CouponsTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<'' | 'general' | 'welcome' | 'birthday'>('general');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<CouponRow | null>(null);
  const { data: categories = [] } = useCategories();
  const { data: products = [] } = useProductLookup();
  const [custSearch, setCustSearch] = useState('');

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['admin', 'coupons', kind],
    queryFn: async () => {
      let q = supabase
        .from('coupons')
        .select('*, coupon_categories(category_id), coupon_excluded_products(product_id), coupon_redemptions(id, released_at)')
        .order('created_at', { ascending: false })
        .limit(500);
      if (kind) q = q.eq('kind', kind);
      return (await throwIf(q)) as unknown as CouponRow[];
    },
  });

  const customers = useQuery({
    queryKey: ['admin', 'customer-search', custSearch],
    enabled: !!draft && custSearch.trim().length >= 2,
    queryFn: async () => {
      const term = custSearch.trim().replace(/[%,()]/g, ' ');
      return (await throwIf(
        supabase.from('profiles').select('id, full_name, email, phone').or(`email.ilike.%${term}%,full_name.ilike.%${term}%,phone.ilike.%${term}%`).limit(8),
      )) as { id: string; full_name: string | null; email: string | null; phone: string | null }[];
    },
  });

  const filtered = useMemo(() => {
    const t = search.trim().toUpperCase();
    return rows.filter((r) => !t || r.code.includes(t) || (r.description ?? '').toUpperCase().includes(t));
  }, [rows, search]);

  const paged = usePaged(filtered, 25, `${search}|${kind}`);
  const used = (r: CouponRow) => r.coupon_redemptions.filter((x) => !x.released_at).length;
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'coupons'] });

  const edit = (r: CouponRow) => {
    setError('');
    setDraft({
      id: r.id, code: r.code, description: r.description ?? '', discount_type: r.discount_type, value: String(r.value), max_discount: r.max_discount ? String(r.max_discount) : '',
      min_order: Number(r.min_order) ? String(r.min_order) : '', usage_limit: r.usage_limit ? String(r.usage_limit) : '', per_customer_limit: r.per_customer_limit ? String(r.per_customer_limit) : '',
      first_order_only: r.first_order_only, starts_at: toLocal(r.starts_at), expires_at: toLocal(r.expires_at), is_active: r.is_active, is_listed: r.is_listed,
      assigned_user_id: r.assigned_user_id ?? '', assigned_label: r.assigned_user_id ? 'Personal code' : '', admin_note: r.admin_note ?? '',
      category_ids: r.coupon_categories.map((c) => c.category_id), excluded_product_ids: r.coupon_excluded_products.map((p) => p.product_id),
    });
  };

  useEditParam(rows, (r) => { setKind(''); edit(r); });

  const save = async () => {
    if (!draft) return;
    const code = draft.code.trim().toUpperCase().replace(/\s+/g, '');
    const value = Number(draft.value);
    if (!/^[A-Z0-9_-]{2,40}$/.test(code)) return setError('Use 2–40 letters, numbers, - or _ for the code.');
    if (!(value > 0)) return setError('Enter a discount above 0.');
    if (draft.discount_type === 'PERCENT' && value > 100) return setError('A percent discount can be at most 100.');
    if (draft.starts_at && draft.expires_at && new Date(draft.expires_at) <= new Date(draft.starts_at)) return setError('The end must be after the start.');
    for (const [k, label] of [['max_discount', 'Maximum discount'], ['min_order', 'Minimum order'], ['usage_limit', 'Total uses'], ['per_customer_limit', 'Uses per customer']] as const) {
      if (draft[k].trim() && !(Number(draft[k]) > 0)) return setError(`${label} must be a number above 0, or empty.`);
    }
    setBusy(true);
    setError('');
    try {
      await rpc('save_coupon', {
        payload: {
          id: draft.id ?? '', code, description: draft.description, discount_type: draft.discount_type, value, max_discount: draft.max_discount.trim(),
          min_order: draft.min_order.trim(), usage_limit: draft.usage_limit.trim(), per_customer_limit: draft.per_customer_limit.trim(),
          first_order_only: draft.first_order_only, starts_at: draft.starts_at ? new Date(draft.starts_at).toISOString() : '',
          expires_at: draft.expires_at ? new Date(draft.expires_at).toISOString() : '', is_active: draft.is_active,
          is_listed: draft.assigned_user_id ? false : draft.is_listed, assigned_user_id: draft.assigned_user_id, admin_note: draft.admin_note,
          category_ids: draft.category_ids, excluded_product_ids: draft.excluded_product_ids,
        },
      });
      setDraft(null);
      await refresh();
      toast.success('Coupon saved.');
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setBusy(false);
    }
  };


  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <TextInput placeholder="Search codes" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-[260px]" aria-label="Search coupons" />
        <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className="border border-[#C4C1B9] px-2 py-2 text-[14px] bg-white sm:max-w-[200px]" aria-label="Kind">
          <option value="general">Store codes</option>
          <option value="welcome">Welcome codes</option>
          <option value="birthday">Birthday codes</option>
          <option value="">All</option>
        </select>
        <span className="flex-1" />
        <Button onClick={() => { setError(''); setDraft({ ...EMPTY }); setCustSearch(''); }}>
          <Plus size={14} /> New coupon
        </Button>
      </div>

      <div className="bg-white border border-[#E2E0DB] overflow-x-auto">
        <table className="w-full text-[14px] min-w-[680px]">
          <thead>
            <tr className="text-left text-[12px] text-[#4A4A4A] border-b border-[#E2E0DB] font-medium">
              <th className="px-3 py-2 font-medium">Code</th>
              <th className="px-3 py-2 font-medium">Offer</th>
              <th className="px-3 py-2 font-medium">Used</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E9E7E2]">
            {isLoading && <tr><td colSpan={5} className="px-3 py-6 text-[#4A4A4A]">Loading…</td></tr>}
            {!isLoading && filtered.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-[#4A4A4A]">No coupons yet.</td></tr>}
            {paged.rows.map((r) => {
              const st = couponStatus({ ...r, used: used(r) });
              return (
                <tr key={r.id}>
                  <td className="px-3 py-2.5">
                    <p className="font-mono font-medium">{r.code}</p>
                    <p className="text-[12px] text-[#4F4F4F]">
                      {r.assigned_user_id ? 'Personal' : r.is_listed ? 'Shown at checkout' : 'Hidden — must be typed'}
                      {r.coupon_categories.length ? ` · ${r.coupon_categories.length} categor${r.coupon_categories.length === 1 ? 'y' : 'ies'}` : ''}
                    </p>
                  </td>
                  <td className="px-3 py-2.5 text-[13.5px]">
                    {describeOffer(r)}
                    {r.description && <p className="text-[12px] text-[#4F4F4F]">{r.description}</p>}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-[13.5px]">{used(r)} / {r.usage_limit ?? '∞'}</td>
                  <td className="px-3 py-2.5"><span className={`inline-block px-2 py-0.5 border text-[12.5px] ${st.tone} font-medium`}>{st.label}</span></td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <button type="button" aria-label={`Edit ${r.code}`} className="p-1.5 text-[#4A4A4A] hover:text-tk-ink" onClick={() => edit(r)}><Pencil size={14} /></button>
                    <button type="button" aria-label={`Delete ${r.code}`} className="p-1.5 text-[#4A4A4A] hover:text-rose-600" onClick={() => setDeleting(r)}><Trash2 size={14} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pager page={paged.page} pageCount={paged.pageCount} onPage={paged.setPage} from={paged.from} to={paged.to} total={paged.total} noun="coupons" />

      <Modal
        open={!!draft}
        onOpenChange={(o) => !o && !busy && setDraft(null)}
        title={draft?.id ? `Edit ${draft.code}` : 'New coupon'}
        wide
        footer={
          <>
            <Button variant="secondary" onClick={() => setDraft(null)} disabled={busy}>Cancel</Button>
            <Button onClick={save} busy={busy}>Save coupon</Button>
          </>
        }
      >
        {draft && (
          <div className="space-y-5">
            {error && <p className="text-[13px] text-rose-600">{error}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldShell label="Code" htmlFor="c-code" help="Letters, numbers, - and _. Saved in capitals.">
                <TextInput id="c-code" placeholder="e.g. DIWALI15" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })} className="font-mono" />
              </FieldShell>
              <FieldShell label="What the customer sees" htmlFor="c-desc">
                <TextInput id="c-desc" placeholder="e.g. 15% off for Diwali" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
              </FieldShell>
              <FieldShell label="Discount type" htmlFor="c-type">
                <select id="c-type" value={draft.discount_type} onChange={(e) => setDraft({ ...draft, discount_type: e.target.value as Draft['discount_type'] })} className="w-full border border-[#C4C1B9] px-2 py-2 text-[14px] bg-white">
                  <option value="PERCENT">Percent off</option>
                  <option value="FLAT">Flat ₹ off</option>
                </select>
              </FieldShell>
              <FieldShell label={draft.discount_type === 'PERCENT' ? 'Percent' : 'Amount (₹)'} htmlFor="c-value">
                <TextInput id="c-value" inputMode="decimal" placeholder={draft.discount_type === 'PERCENT' ? 'e.g. 15' : 'e.g. 500'} value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} />
              </FieldShell>
              <FieldShell label="Maximum discount (₹)" htmlFor="c-max" help="Optional cap for percent codes.">
                <TextInput id="c-max" inputMode="decimal" placeholder="e.g. 1000" value={draft.max_discount} onChange={(e) => setDraft({ ...draft, max_discount: e.target.value })} />
              </FieldShell>
              <FieldShell label="Minimum order (₹)" htmlFor="c-min" help="Counts only the items the code covers.">
                <TextInput id="c-min" inputMode="decimal" placeholder="e.g. 2999" value={draft.min_order} onChange={(e) => setDraft({ ...draft, min_order: e.target.value })} />
              </FieldShell>
              <FieldShell label="Total uses" htmlFor="c-uses" help="Empty = unlimited.">
                <TextInput id="c-uses" inputMode="numeric" placeholder="e.g. 200" value={draft.usage_limit} onChange={(e) => setDraft({ ...draft, usage_limit: e.target.value })} />
              </FieldShell>
              <FieldShell label="Uses per customer" htmlFor="c-per" help="Empty = unlimited (also works without sign-in).">
                <TextInput id="c-per" inputMode="numeric" placeholder="e.g. 1" value={draft.per_customer_limit} onChange={(e) => setDraft({ ...draft, per_customer_limit: e.target.value })} />
              </FieldShell>
              <FieldShell label="Starts (IST)" htmlFor="c-start" help="Empty = now.">
                <TextInput id="c-start" type="datetime-local" value={draft.starts_at} onChange={(e) => setDraft({ ...draft, starts_at: e.target.value })} />
              </FieldShell>
              <FieldShell label="Ends (IST)" htmlFor="c-end" help="Empty = never.">
                <TextInput id="c-end" type="datetime-local" value={draft.expires_at} onChange={(e) => setDraft({ ...draft, expires_at: e.target.value })} />
              </FieldShell>
            </div>
            <div className="flex flex-wrap gap-6 text-[14px]">
              <label className="flex items-center gap-2"><Toggle checked={draft.is_active} onChange={(on) => setDraft({ ...draft, is_active: on })} label="Active" /> Active</label>
              <label className="flex items-center gap-2"><Toggle checked={draft.first_order_only} onChange={(on) => setDraft({ ...draft, first_order_only: on })} label="First order only" /> First order only</label>
              {!draft.assigned_user_id && (
                <label className="flex items-center gap-2"><Toggle checked={draft.is_listed} onChange={(on) => setDraft({ ...draft, is_listed: on })} label="Show at checkout" /> Show in the checkout offer list</label>
              )}
            </div>

            <fieldset className="border border-[#E2E0DB] p-3 space-y-2">
              <legend className="px-1 text-[12px] font-medium text-[#454545]">Where it applies</legend>
              <p className="text-[12px] text-[#4F4F4F]">No categories = the whole store. A category includes its sub-categories.</p>
              <SearchMultiSelect
                ariaLabel="Categories this code covers"
                options={categoryOptions(categories)}
                values={draft.category_ids}
                onChange={(v) => setDraft({ ...draft, category_ids: v })}
                placeholder="Search categories, or leave empty for the whole store"
              />
              <p className="text-[12px] text-[#454545] pt-2 font-medium">Never applies to</p>
              <SearchMultiSelect
                ariaLabel="Products this code never covers"
                options={products.map((p) => ({ value: p.id, label: p.name }))}
                values={draft.excluded_product_ids}
                onChange={(v) => setDraft({ ...draft, excluded_product_ids: v })}
                placeholder="Search products to exclude"
              />
            </fieldset>

            <fieldset className="border border-[#E2E0DB] p-3 space-y-2">
              <legend className="px-1 text-[12px] font-medium text-[#454545]">Personal code (optional)</legend>
              <p className="text-[12px] text-[#4F4F4F]">Only this customer can use it; it shows in their account under Offers.</p>
              {draft.assigned_user_id ? (
                <p className="text-[14px]">
                  {draft.assigned_label}{' '}
                  <button type="button" className="ml-2 text-[13px] underline" onClick={() => setDraft({ ...draft, assigned_user_id: '', assigned_label: '' })}>Remove</button>
                </p>
              ) : (
                <>
                  <TextInput placeholder="Search customers by name, email or phone" value={custSearch} onChange={(e) => setCustSearch(e.target.value)} aria-label="Search customers" />
                  {(customers.data ?? []).length > 0 && (
                    <div className="border border-[#E2E0DB] max-h-36 overflow-y-auto">
                      {(customers.data ?? []).map((c) => (
                        <button key={c.id} type="button" className="block w-full text-left px-3 py-1.5 text-[13.5px] hover:bg-[#FAFAF7]" onClick={() => { setDraft({ ...draft, assigned_user_id: c.id, assigned_label: `${c.full_name || 'Customer'} · ${c.email ?? ''}`, is_listed: false }); setCustSearch(''); }}>
                          {c.full_name || 'Customer'} <span className="text-[#4F4F4F]">· {c.email}{c.phone ? ` · ${c.phone}` : ''}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </fieldset>

            <FieldShell label="Internal note" htmlFor="c-note" help="Only admins see this.">
              <TextArea id="c-note" rows={2} value={draft.admin_note} onChange={(e) => setDraft({ ...draft, admin_note: e.target.value })} />
            </FieldShell>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.code}?`}
        description={deleting && used(deleting) > 0 ? 'It has been used on orders. Switch it off instead to keep the history.' : 'This cannot be undone.'}
        confirmLabel={deleting && used(deleting) > 0 ? 'Switch off' : 'Delete'}
        danger
        onConfirm={async () => {
          if (!deleting) return;
          try {
            if (used(deleting) > 0) await throwIf(supabase.from('coupons').update({ is_active: false }).eq('id', deleting.id));
            else await throwIf(supabase.from('coupons').delete().eq('id', deleting.id));
            await refresh();
            toast.success(used(deleting) > 0 ? 'Coupon switched off.' : 'Coupon deleted.');
          } catch (err) {
            toast.error(toFriendlyError(err));
          }
        }}
      />
    </div>
  );
}

