import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatOrderDateTime } from '../storefront/orders/useOrders';

interface Note {
  id: number;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  created_at: string;
  read_at: string | null;
}

/** New orders, courier failures, returns, low stock, reviews waiting — live. */
export default function NotificationsBell() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  // Each mounted bell needs its own channel: reusing a subscribed channel name makes supabase-js throw.
  const channelName = `admin-notifications-${useId()}`;
  const { data: notes = [] } = useQuery({
    queryKey: ['admin', 'notifications'],
    queryFn: async () => {
      const { data, error } = await supabase.from('admin_notifications').select('*').order('created_at', { ascending: false }).limit(30);
      if (error) throw error;
      return (data ?? []) as Note[];
    },
  });
  const unread = notes.filter((n) => !n.read_at).length;

  useEffect(() => {
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_notifications' }, () => {
        void qc.invalidateQueries({ queryKey: ['admin', 'notifications'] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc, channelName]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  const markRead = async (ids?: number[]) => {
    let q = supabase.from('admin_notifications').update({ read_at: new Date().toISOString() }).is('read_at', null);
    if (ids) q = q.in('id', ids);
    await q;
    await qc.invalidateQueries({ queryKey: ['admin', 'notifications'] });
  };

  return (
    <div className="relative" ref={box}>
      <button type="button" onClick={() => setOpen(!open)} aria-label={`Notifications${unread ? `, ${unread} new` : ''}`} aria-expanded={open} className="relative p-2 text-[#555555] hover:text-tk-ink">
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-tk-accent text-white text-[10px] leading-4 text-center rounded-full tabular-nums">{unread > 9 ? '9+' : unread}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[min(360px,calc(100vw-32px))] max-h-[70vh] overflow-y-auto bg-white border border-[#EAEAEA] shadow-xl z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#EAEAEA]">
            <p className="text-[12px] font-medium">Notifications</p>
            {unread > 0 && <button type="button" onClick={() => markRead()} className="text-[11px] underline">Mark all read</button>}
          </div>
          {notes.length === 0 && <p className="px-3 py-6 text-[12px] text-[#777777]">Nothing yet.</p>}
          <ul className="divide-y divide-[#F0F0F0]">
            {notes.map((n) => (
              <li key={n.id}>
                <Link
                  to={n.link || '/admin'}
                  onClick={() => {
                    setOpen(false);
                    if (!n.read_at) void markRead([n.id]);
                  }}
                  className={`block px-3 py-2.5 hover:bg-[#FAFAF7] ${n.read_at ? '' : 'bg-[#FFF9F2]'}`}
                >
                  <p className="text-[12.5px] text-tk-ink">{n.title}</p>
                  {n.body && <p className="text-[11.5px] text-[#666666]">{n.body}</p>}
                  <p className="text-[10.5px] text-[#999999] mt-0.5">{formatOrderDateTime(n.created_at)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
