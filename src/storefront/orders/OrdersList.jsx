import React from 'react';
import { Link } from 'react-router';
import { useMyOrders, formatOrderDate } from './useOrders';
import { ORDER_STATUS_LABEL } from '../../lib/orders';
import { formatINR } from '../../lib/money';
import { toFriendlyError } from '../../lib/errors';
import { PLACEHOLDER_IMAGE } from '../catalog/adapter';
import PageNav from '../PageNav.jsx';
import { usePaged } from '../../lib/paging';

/** Account → Orders. */
export default function OrdersList() {
  const { data: orders = [], isLoading, error } = useMyOrders();
  const paged = usePaged(orders, 10);

  if (isLoading) return <p className="py-16 text-center text-[#666666] text-[13px]">Loading orders…</p>;
  if (error) return <p className="py-16 text-center text-rose-600 text-[13px]">{toFriendlyError(error)}</p>;
  if (orders.length === 0)
    return (
      <div className="py-16 flex flex-col items-center text-center">
        <p className="text-[15px] text-tk-ink dark:text-white">No orders yet</p>
        <p className="mt-1.5 text-[13px] text-[#5F5F5F] dark:text-[#999999]">When you place an order, you can follow it here.</p>
        <Link
          to="/shop"
          className="mt-6 inline-flex items-center justify-center h-11 px-7 bg-tk-ink hover:bg-tk-accent text-white dark:bg-tk-gold dark:text-tk-night text-[11.5px] font-semibold uppercase tracking-[0.16em] rounded-[2px] transition-colors"
        >
          Start shopping
        </Link>
      </div>
    );

  return (
    <div>
    <div className="divide-y divide-[#F0F0F0] dark:divide-white/10">
      {paged.rows.map((o) => {
        const items = o.order_items.filter((i) => i.line_type === 'item');
        const count = items.reduce((n, i) => n + i.qty, 0);
        return (
          <Link key={o.id} to={`/orders/${o.id}`} className="flex items-center gap-4 py-5 group">
            <div className="flex -space-x-3 shrink-0">
              {items.slice(0, 3).map((i) => (
                <img
                  key={i.id}
                  src={i.image_url || PLACEHOLDER_IMAGE}
                  alt=""
                  className="w-12 h-12 object-contain bg-[#F7F7F6] dark:bg-[#18171C] border border-white dark:border-tk-night rounded-[2px]"
                />
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-tk-ink dark:text-white">
                {o.order_number}
                <span className="ml-2 text-[11px] uppercase tracking-[0.14em] text-tk-accent dark:text-tk-accent-night">{ORDER_STATUS_LABEL[o.status] ?? o.status}</span>
              </p>
              <p className="text-[12px] text-[#5F5F5F] dark:text-[#999999] mt-0.5 truncate">
                {formatOrderDate(o.created_at)} · {count} item{count === 1 ? '' : 's'} · {items.map((i) => i.product_name).join(', ')}
              </p>
            </div>
            <span className="text-[13px] font-medium tabular-nums text-tk-ink dark:text-white">{formatINR(Number(o.total))}</span>
            <span className="text-[#767676] group-hover:text-tk-ink dark:group-hover:text-white transition-colors">→</span>
          </Link>
        );
      })}
    </div>
    <PageNav page={paged.page} pageCount={paged.pageCount} label="Order pages" onPage={paged.setPage} />
    </div>
  );
}
