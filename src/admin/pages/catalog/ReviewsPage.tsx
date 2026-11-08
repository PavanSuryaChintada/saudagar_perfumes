import { useState } from 'react';
import { usePaged } from '../../../lib/paging';
import { Pager } from '../../ui/Pager';
import { Link } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase, SUPABASE_URL } from '../../../lib/supabase';
import { toFriendlyError } from '../../../lib/errors';
import { publicUrl } from '../../../lib/media/upload';
import { formatOrderDateTime } from '../../../storefront/orders/useOrders';
import { PageHeader } from '../../ui/PageHeader';
import { Button } from '../../ui/Button';
import { rpc, throwIf } from '../../catalog/api';

interface ReviewRow {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  display_name: string;
  city: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN';
  created_at: string;
  helpful_count: number;
  product: { id: string; name: string; slug: string } | null;
  review_media: { path: string; position: number }[];
  longevity: { label: string } | null;
  sillage: { label: string } | null;
}

const TABS: [ReviewRow['status'] | '', string][] = [
  ['PENDING', 'Waiting'],
  ['APPROVED', 'Live'],
  ['HIDDEN', 'Hidden'],
  ['REJECTED', 'Rejected'],
  ['', 'All'],
];

export default function ReviewsPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<ReviewRow['status'] | ''>('PENDING');
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['admin', 'reviews', status],
    queryFn: async () => {
      let q = supabase
        .from('reviews')
        .select('id, rating, title, body, display_name, city, status, created_at, helpful_count, product:products(id, name, slug), review_media(path, position), longevity:attribute_options!reviews_longevity_option_id_fkey(label), sillage:attribute_options!reviews_sillage_option_id_fkey(label)')
        .order('created_at', { ascending: false })
        .limit(200);
      if (status) q = q.eq('status', status);
      return (await throwIf(q)) as unknown as ReviewRow[];
    },
  });
  const paged = usePaged(rows, 20, rows.length);

  const moderate = async (id: string, next: ReviewRow['status']) => {
    try {
      await rpc('moderate_review', { p_review: id, p_status: next, p_note: null });
      await qc.invalidateQueries({ queryKey: ['admin', 'reviews'] });
      await qc.invalidateQueries({ queryKey: ['catalog'] });
      toast.success(next === 'APPROVED' ? 'Review is live.' : next === 'HIDDEN' ? 'Review hidden.' : next === 'REJECTED' ? 'Review rejected.' : 'Moved back to waiting.');
    } catch (err) {
      toast.error(toFriendlyError(err));
    }
  };

  return (
    <div>
      <PageHeader title="Reviews" description="Only customers with a delivered order can review. Nothing shows on the site until you approve it; ratings count approved reviews only." />
      <div className="flex flex-wrap gap-1 mb-4">
        {TABS.map(([v, l]) => (
          <button key={v || 'all'} type="button" onClick={() => setStatus(v)} className={`px-3 py-1.5 text-[13px] border ${status === v ? 'bg-tk-ink text-white border-tk-ink' : 'bg-white border-[#C4C1B9] text-[#454545] hover:border-tk-ink'}`}>
            {l}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {isLoading && <p className="text-[14px] text-[#4A4A4A]">Loading…</p>}
        {!isLoading && rows.length === 0 && <p className="bg-white border border-[#E2E0DB] px-4 py-6 text-[14px] text-[#4A4A4A]">No reviews here.</p>}
        {paged.rows.map((r) => (
          <div key={r.id} className="bg-white border border-[#E2E0DB] p-4 text-[14px] space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-tk-accent">{'★'.repeat(r.rating)}<span className="text-[#DDDDDD]">{'★'.repeat(5 - r.rating)}</span></span>
              {r.title && <span className="font-medium">{r.title}</span>}
              <span className="text-[12px] text-[#4F4F4F]">
                {r.display_name}{r.city ? `, ${r.city}` : ''} · {formatOrderDateTime(r.created_at)} · {r.product ? <Link to={`/admin/products/${r.product.id}`} className="underline">{r.product.name}</Link> : 'Deleted product'}
              </span>
              <span className="ml-auto text-[12.5px] text-[#4A4A4A] font-medium">{r.status.toLowerCase()}{r.helpful_count ? ` · ${r.helpful_count} helpful` : ''}</span>
            </div>
            {r.body && <p className="text-[#444444] whitespace-pre-line">{r.body}</p>}
            {(r.longevity || r.sillage) && <p className="text-[12px] text-[#4F4F4F]">{[r.longevity && `Longevity: ${r.longevity.label}`, r.sillage && `Sillage: ${r.sillage.label}`].filter(Boolean).join(' · ')}</p>}
            {r.review_media.length > 0 && (
              <div className="flex gap-2">
                {[...r.review_media].sort((a, b) => a.position - b.position).map((m) => (
                  <a key={m.path} href={publicUrl(SUPABASE_URL, 'reviews', m.path)} target="_blank" rel="noreferrer" className="w-16 h-16 bg-[#F4F3EE] overflow-hidden block">
                    <img src={publicUrl(SUPABASE_URL, 'reviews', m.path)} alt="" className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              {r.status !== 'APPROVED' && <Button size="sm" onClick={() => moderate(r.id, 'APPROVED')}>Approve</Button>}
              {r.status === 'APPROVED' && <Button size="sm" variant="secondary" onClick={() => moderate(r.id, 'HIDDEN')}>Hide</Button>}
              {r.status !== 'REJECTED' && <Button size="sm" variant="secondary" onClick={() => moderate(r.id, 'REJECTED')}>Reject</Button>}
            </div>
          </div>
        ))}
      </div>
      <Pager page={paged.page} pageCount={paged.pageCount} onPage={paged.setPage} from={paged.from} to={paged.to} total={paged.total} noun="reviews" />
    </div>
  );
}
