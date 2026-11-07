import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

/** The server's answer for a pincode: serviceable, cash on delivery, delivery estimate. */
export function usePincode(pincode, surface = false) {
  const pin = (pincode || '').trim();
  return useQuery({
    queryKey: ['pincode', pin, !!surface],
    enabled: /^[1-9][0-9]{5}$/.test(pin),
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_pincode', { p_pincode: pin, p_surface: !!surface });
      if (error) throw error;
      return data;
    },
  });
}

const STORE_KEY = 'saudagar_pincode';

/** Product page: "Check delivery to your pincode". Remembers the last pincode on this device. */
export default function PincodeCheck({ surface = false }) {
  const [input, setInput] = useState(() => {
    try {
      return localStorage.getItem(STORE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [pin, setPin] = useState(input);
  const { data, isFetching } = usePincode(pin, surface);
  const submit = (e) => {
    e.preventDefault();
    const p = input.trim();
    setPin(p);
    try {
      localStorage.setItem(STORE_KEY, p);
    } catch {
      // not remembered
    }
  };
  return (
    <div className="space-y-1.5">
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={input}
          onChange={(e) => setInput(e.target.value.replace(/\D/g, ''))}
          placeholder="Enter pincode"
          aria-label="Delivery pincode"
          className="w-32 px-3 py-1.5 border border-[#E0E0E0] dark:border-white/20 bg-transparent text-[12px] outline-none focus:border-tk-ink dark:focus:border-white"
        />
        <button type="submit" className="px-3 py-1.5 text-[10.5px] uppercase tracking-wider border border-tk-ink dark:border-white">
          {isFetching ? 'Checking…' : 'Check'}
        </button>
      </form>
      {data && (
        <p role="status" className={`text-[11.5px] ${data.serviceable ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600'}`}>
          {data.message}
        </p>
      )}
    </div>
  );
}
