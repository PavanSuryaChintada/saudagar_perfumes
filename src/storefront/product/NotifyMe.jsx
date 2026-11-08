import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { toFriendlyError } from '../../lib/errors';

/** Sold-out size: save a "tell me when it's back" request (signed-in customers, or an email). */
export default function NotifyMe({ variantId, label }) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');
  if (!variantId) return null;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setState('busy');
    const { error: err } = await supabase.rpc('request_back_in_stock', { p_variant: variantId, p_email: user ? undefined : email });
    if (err) {
      setError(toFriendlyError(err));
      setState('idle');
    } else setState('done');
  };

  if (state === 'done') return <p role="status" className="text-[11.5px] text-emerald-700 dark:text-emerald-400">We'll let you know when {label || 'this size'} is back.</p>;
  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2 text-[11.5px]">
      {!user && (
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          aria-label="Email for the back-in-stock alert"
          className="flex-1 min-w-[160px] px-3 py-2 border border-[#E0E0E0] dark:border-white/20 bg-transparent outline-none focus:border-tk-ink dark:focus:border-white"
        />
      )}
      <button type="submit" disabled={state === 'busy'} className="px-4 py-2 border border-tk-ink dark:border-white uppercase tracking-wider text-[11.5px] disabled:opacity-60">
        {state === 'busy' ? 'Saving…' : "Notify me when it's back"}
      </button>
      {error && <p className="w-full text-rose-600">{error}</p>}
    </form>
  );
}
