import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { formatINR as formatPrice } from '../../lib/money';
import { toFriendlyError } from '../../lib/errors';
import { formatIndianPhone } from '../../lib/phone';
import { useAccount } from '../account/useAccount';
import AddressModal from '../account/AddressModal';
import MinimalHeader from '../MinimalHeader';
import SamplePicker from '../bag/SamplePicker';
import { CouponRow } from '../bag/CouponSheet';
import { useQuote, useSamplePool } from '../bag/useQuote';
import { PLACEHOLDER_IMAGE } from '../catalog/adapter';
import { payOrder } from '../../lib/razorpay';
import { usePincode } from '../delivery/PincodeCheck';
import { track } from '../../lib/analytics';

const STEPS = [
  { id: 'address', label: '1. Delivery' },
  { id: 'payment', label: '2. Payment' },
  { id: 'review', label: '3. Review' },
];
const h2 = 'text-[18px] sm:text-[20px] font-normal uppercase tracking-[0.02em] text-tk-ink dark:text-white';
const primaryBtn =
  'w-full sm:w-auto px-8 py-3.5 bg-tk-ink hover:bg-tk-accent dark:bg-tk-gold dark:hover:bg-tk-accent-night text-white dark:text-tk-night text-[11px] font-medium uppercase tracking-[0.16em] rounded-full transition-colors cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed';

function newClientRef() {
  try {
    return crypto.randomUUID();
  } catch {
    return 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));
  }
}

export default function CheckoutPage({
  cart = [],
  samples = [],
  onSamplesChange,
  note = '',
  onNoteChange,
  couponCode = '',
  onCouponChange,
  theme,
  onToggleTheme,
  onNavigateHome,
  onNavigateCollection,
  onOpenBag,
  onOrderPlaced,
}) {
  const { addresses } = useAccount();
  const addressList = addresses.data || [];
  const [step, setStep] = useState('address');
  const [addressId, setAddressId] = useState(null);
  const [addressModal, setAddressModal] = useState(null);
  const [payment, setPayment] = useState('COD');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const clientRef = useRef(newClientRef());

  const { data: quote, isFetching, error: quoteError } = useQuote(cart, samples, couponCode, cart.length > 0);
  const couponBlocked = !!couponCode && quote && !quote.coupon?.ok;
  const { data: pool = [] } = useSamplePool(!!quote?.samples?.enabled);
  const poolName = useMemo(() => new Map(pool.map((p) => [p.variant_id, p.name])), [pool]);

  // Default to the default (or only) address.
  useEffect(() => {
    if (addresses.isFetching) return;
    if (addressId && addressList.some((a) => a.id === addressId)) return;
    const def = addressList.find((a) => a.is_default) || addressList[0];
    setAddressId(def ? def.id : null);
  }, [addressList, addressId, addresses.isFetching]);

  const address = addressList.find((a) => a.id === addressId);
  const hasProblems = (quote?.problems?.length ?? 0) > 0;
  const { data: pinInfo } = usePincode(address?.pincode);
  const unserviceable = pinInfo && !pinInfo.serviceable;
  const codAllowed = !!quote?.cod?.allowed && (!pinInfo || !!pinInfo.cod);
  const onlineAllowed = !!quote?.online?.allowed;
  const noPayment = quote && !codAllowed && !onlineAllowed;

  useEffect(() => {
    if (payment === 'COD' && quote && !codAllowed && onlineAllowed) setPayment('ONLINE');
  }, [payment, quote, codAllowed, onlineAllowed]);

  const placeOrder = async () => {
    if (!address || !quote) return;
    setPlacing(true);
    setError('');
    try {
      const { data, error: rpcError } = await supabase.rpc('create_order', {
        p_address_id: address.id,
        p_items: cart.filter((l) => l.variantId).map((l) => ({ variant_id: l.variantId, qty: l.quantity })),
        p_payment_method: payment,
        p_coupon_code: couponCode || undefined,
        p_samples: samples,
        p_note: note || undefined,
        p_client_ref: clientRef.current,
      });
      if (rpcError) throw rpcError;
      if (payment === 'ONLINE') {
        const result = await payOrder(data.id);
        if (result.status === 'paid') onOrderPlaced && onOrderPlaced(data, 'placed=1');
        else if (result.status === 'dismissed') onOrderPlaced && onOrderPlaced(data, 'payment=cancelled');
        else onOrderPlaced && onOrderPlaced(data, `payment=failed&reason=${encodeURIComponent(result.message)}`);
        return;
      }
      onOrderPlaced && onOrderPlaced(data);
    } catch (err) {
      setError(toFriendlyError(err));
      clientRef.current = newClientRef();
    } finally {
      setPlacing(false);
    }
  };

  const beganCheckout = useRef(false);
  useEffect(() => {
    if (quote && !beganCheckout.current) {
      beganCheckout.current = true;
      track('begin_checkout', { value: quote.total, items: quote.lines.map((l) => ({ item_id: l.slug, item_name: l.name, item_variant: l.label, price: l.unit_price, quantity: l.qty })) });
    }
  }, [quote]);
  const items = quote?.lines ?? [];

  return (
    <div className="min-h-screen bg-white dark:bg-tk-night text-tk-ink dark:text-white transition-colors duration-300 font-sans pb-28">
      <MinimalHeader backLabel="Continue shopping" onBack={onNavigateHome} theme={theme} onToggleTheme={onToggleTheme} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {cart.length === 0 ? (
          <div className="py-24 text-center max-w-md mx-auto">
            <h2 className="text-[22px] font-normal uppercase tracking-tight text-tk-ink dark:text-white">Your bag is empty</h2>
            <p className="text-[12px] text-[#777777] dark:text-[#A09D96] mt-2 font-light leading-relaxed">Add a fragrance to your bag to check out.</p>
            <button
              type="button"
              onClick={() => onNavigateCollection && onNavigateCollection('all')}
              className="mt-6 px-8 py-3 bg-tk-ink hover:bg-tk-accent dark:bg-tk-gold dark:hover:bg-tk-accent-night text-white dark:text-tk-night text-[11px] font-medium uppercase tracking-[0.16em] rounded-full transition-colors cursor-pointer shadow-md"
            >
              Explore Collections →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            {/* ================= LEFT: STEPS ================= */}
            <div className="lg:col-span-7 min-w-0">
              <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.14em] font-medium mb-8 pb-4 border-b border-[#EAEAEA] dark:border-white/10 overflow-x-auto scrollbar-none">
                {STEPS.map((st, i) => (
                  <React.Fragment key={st.id}>
                    {i > 0 && <span className="text-[#CCCCCC] dark:text-white/20">/</span>}
                    <span className={step === st.id ? 'text-tk-ink dark:text-white font-semibold whitespace-nowrap' : 'text-[#888888] dark:text-[#A09D96] whitespace-nowrap'}>{st.label}</span>
                  </React.Fragment>
                ))}
              </div>

              {error && (
                <p role="alert" className="mb-6 px-4 py-3 text-[12px] bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
                  {error}
                </p>
              )}
              {hasProblems && (
                <div role="alert" className="mb-6 px-4 py-3 text-[12px] bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-900/50">
                  {quote.problems.map((p) => (
                    <p key={p.variant_id}>{p.message}</p>
                  ))}
                  <button type="button" onClick={onOpenBag} className="mt-2 underline underline-offset-4 uppercase tracking-wider text-[10.5px]">Update your bag</button>
                </div>
              )}

              {step === 'address' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div>
                    <h2 className={h2}>Delivery address</h2>
                    <p className="text-[11.5px] text-[#777777] dark:text-[#A09D96] mt-0.5 font-light">We deliver across India.</p>
                  </div>
                  {addresses.isLoading && <p className="text-[12px] text-[#888888]">Loading your addresses…</p>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Delivery address">
                    {addressList.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        role="radio"
                        aria-checked={a.id === addressId}
                        onClick={() => setAddressId(a.id)}
                        className={`text-left p-4 rounded-md border transition-colors cursor-pointer ${a.id === addressId ? 'border-tk-ink dark:border-white bg-[#FAF9F6] dark:bg-white/[0.04]' : 'border-[#E0DDD5] dark:border-white/15 hover:border-tk-ink/50'}`}
                      >
                        <span className="flex items-center justify-between text-[10px] uppercase tracking-widest text-[#888888]">
                          {a.label}
                          {a.id === addressId && <span className="text-tk-accent dark:text-tk-accent-night">Selected</span>}
                        </span>
                        <span className="block text-[13px] font-medium mt-1">{a.full_name}</span>
                        <span className="block text-[12px] text-[#666666] dark:text-[#AAAAAA] mt-0.5 leading-relaxed">
                          {[a.line1, a.line2, a.landmark && `Near ${a.landmark}`].filter(Boolean).join(', ')}
                          <br />
                          {a.city}, {a.state} {a.pincode}
                        </span>
                        <span className="block text-[11.5px] text-[#888888] mt-1 font-mono">{formatIndianPhone(a.phone)}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setAddressModal({ address: null })}
                      className="p-4 rounded-md border border-dashed border-[#D5D3CC] dark:border-white/20 text-[11px] uppercase tracking-[0.14em] text-[#777777] hover:text-tk-ink hover:border-tk-ink dark:hover:text-white cursor-pointer min-h-[120px]"
                    >
                      + Add a new address
                    </button>
                  </div>
                  {address && pinInfo && (
                    <p role="status" className={`text-[12px] ${pinInfo.serviceable ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600'}`}>{pinInfo.message}</p>
                  )}
                  <button type="button" className={primaryBtn} disabled={!address || unserviceable} onClick={() => setStep('payment')}>
                    Continue to payment →
                  </button>
                </motion.div>
              )}

              {step === 'payment' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className={h2}>Payment</h2>
                    <button type="button" onClick={() => setStep('address')} className="text-[10.5px] uppercase tracking-wider text-[#777777] underline underline-offset-4">Change address</button>
                  </div>
                  {noPayment ? (
                    <p className="px-4 py-3 text-[12px] bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-900/50">
                      Ordering is paused for a short while. Please try again later.
                    </p>
                  ) : (
                    <div className="space-y-3" role="radiogroup" aria-label="Payment method">
                      <button
                        type="button"
                        role="radio"
                        aria-checked={payment === 'COD'}
                        disabled={!codAllowed}
                        onClick={() => setPayment('COD')}
                        className={`w-full text-left p-4 rounded-md border transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${payment === 'COD' && codAllowed ? 'border-tk-ink dark:border-white bg-[#FAF9F6] dark:bg-white/[0.04]' : 'border-[#E0DDD5] dark:border-white/15'}`}
                      >
                        <span className="block text-[13px] font-medium">Cash on delivery</span>
                        <span className="block text-[11.5px] text-[#777777] dark:text-[#A09D96] mt-0.5">
                          {codAllowed ? 'Pay in cash when your order arrives.' : pinInfo && !pinInfo.cod && quote?.cod?.allowed ? `Not available for pincode ${address?.pincode}.` : quote?.cod?.message}
                        </span>
                      </button>
                      {onlineAllowed && (
                        <button
                          type="button"
                          role="radio"
                          aria-checked={payment === 'ONLINE'}
                          onClick={() => setPayment('ONLINE')}
                          className={`w-full text-left p-4 rounded-md border transition-colors cursor-pointer ${payment === 'ONLINE' ? 'border-tk-ink dark:border-white bg-[#FAF9F6] dark:bg-white/[0.04]' : 'border-[#E0DDD5] dark:border-white/15'}`}
                        >
                          <span className="block text-[13px] font-medium">Pay online</span>
                          <span className="block text-[11.5px] text-[#777777] dark:text-[#A09D96] mt-0.5">UPI, cards and net banking.</span>
                        </button>
                      )}
                    </div>
                  )}
                  <button type="button" className={primaryBtn} disabled={noPayment || (payment === 'COD' && !codAllowed)} onClick={() => setStep('review')}>
                    Review order →
                  </button>
                </motion.div>
              )}

              {step === 'review' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <h2 className={h2}>Review and place order</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
                    <div className="p-4 rounded-md border border-[#E0DDD5] dark:border-white/15">
                      <p className="flex items-center justify-between text-[10px] uppercase tracking-widest text-[#888888]">
                        Delivering to
                        <button type="button" onClick={() => setStep('address')} className="underline underline-offset-4">Change</button>
                      </p>
                      {address && (
                        <p className="mt-1.5 leading-relaxed text-[#555555] dark:text-[#BBBBBB]">
                          <span className="font-medium text-tk-ink dark:text-white">{address.full_name}</span>
                          <br />
                          {[address.line1, address.line2].filter(Boolean).join(', ')}
                          <br />
                          {address.city}, {address.state} {address.pincode}
                        </p>
                      )}
                    </div>
                    <div className="p-4 rounded-md border border-[#E0DDD5] dark:border-white/15">
                      <p className="flex items-center justify-between text-[10px] uppercase tracking-widest text-[#888888]">
                        Payment
                        <button type="button" onClick={() => setStep('payment')} className="underline underline-offset-4">Change</button>
                      </p>
                      <p className="mt-1.5 font-medium">{payment === 'COD' ? 'Cash on delivery' : 'Pay online'}</p>
                      {payment === 'COD' && quote && <p className="text-[#777777] dark:text-[#A09D96] mt-0.5">Keep {formatPrice(quote.total)} ready when it arrives.</p>}
                    </div>
                  </div>

                  {quote?.samples?.enabled && quote.samples.entitlement > 0 && (
                    <SamplePicker samples={quote.samples} picks={samples} onChange={onSamplesChange} />
                  )}

                  <div>
                    <label htmlFor="co-note" className="block text-[10px] font-medium uppercase tracking-[0.12em] text-[#666666] dark:text-[#A09D96] mb-1.5">
                      Note for us (optional)
                    </label>
                    <textarea
                      id="co-note"
                      rows={2}
                      maxLength={500}
                      value={note}
                      onChange={(e) => onNoteChange && onNoteChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-md border border-[#D5D3CC] dark:border-white/15 bg-white dark:bg-[#141318] text-[12px] text-tk-ink dark:text-white outline-none focus:border-tk-accent dark:focus:border-tk-gold transition-colors"
                    />
                  </div>

                  <button
                    type="button"
                    className={primaryBtn}
                    disabled={placing || !quote || isFetching || hasProblems || couponBlocked || !address || unserviceable || (payment === 'COD' && !codAllowed)}
                    onClick={placeOrder}
                  >
                    {placing ? (payment === 'ONLINE' ? 'Opening payment…' : 'Placing your order…') : `${payment === 'ONLINE' ? 'Pay' : 'Place order'} · ${quote ? formatPrice(quote.total) : ''}`}
                  </button>
                  <p className="text-[10.5px] text-[#888888] dark:text-[#A09D96]">
                    By placing the order you agree to our terms and policies.
                  </p>
                </motion.div>
              )}
            </div>

            {/* ================= RIGHT: SUMMARY (server quote) ================= */}
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-24 rounded-2xl bg-[#F8F7F5] dark:bg-[#141318] p-6 sm:p-7 border border-[#EAE8E2] dark:border-white/10 transition-colors">
                <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA] dark:border-white/10">
                  <h3 className="text-[14px] font-medium uppercase tracking-[0.08em] text-tk-ink dark:text-white">Order Summary</h3>
                  <button type="button" onClick={onOpenBag} className="text-[10.5px] uppercase tracking-wider text-[#777777] underline underline-offset-4">Edit bag</button>
                </div>

                {quoteError && <p className="text-[11px] text-rose-600 mt-3">We couldn't load prices. Check your connection.</p>}

                <div className="divide-y divide-[#EAEAEA] dark:divide-white/10 my-2">
                  {items.map((item) => (
                    <div key={item.variant_id} className="py-3 flex items-center gap-3">
                      <div className="w-14 h-14 rounded-md bg-white dark:bg-[#1A1820] flex items-center justify-center p-1.5 shrink-0 border border-[#ECEAE5] dark:border-white/10">
                        <img src={item.image || PLACEHOLDER_IMAGE} alt={item.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0 text-[11.5px]">
                        <h4 className="font-normal uppercase tracking-wide text-tk-ink dark:text-white line-clamp-1">{item.name}</h4>
                        <p className="text-[10.5px] text-[#888888] dark:text-[#A09D96]">{item.label} · Qty {item.qty}</p>
                      </div>
                      <span className="text-[12px] font-medium text-tk-ink dark:text-white tabular-nums shrink-0">{formatPrice(item.line_total)}</span>
                    </div>
                  ))}
                  {quote?.samples?.entitlement > 0 && (
                    <div className="py-3 text-[11px] text-[#666666] dark:text-[#A09D96]">
                      <p className="uppercase tracking-wider text-[10px] text-tk-accent dark:text-tk-accent-night font-medium mb-1">
                        {quote.samples.entitlement} free {quote.samples.sample_size_ml} ml sample{quote.samples.entitlement === 1 ? '' : 's'}
                      </p>
                      {Array.from({ length: quote.samples.entitlement }, (_, i) => (
                        <p key={i}>{samples[i] ? poolName.get(samples[i]) || 'Your pick' : 'Surprise me'}</p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="py-3">
                  <CouponRow quote={quote} couponCode={couponCode} cart={cart} onApply={(c) => onCouponChange && onCouponChange(c)} onRemove={() => onCouponChange && onCouponChange('')} />
                  {couponBlocked && <p className="mt-1.5 text-[10.5px] text-rose-600">Remove the code to place your order.</p>}
                </div>
                <div className={`pt-3 border-t border-[#EAEAEA] dark:border-white/10 space-y-2 text-[11.5px] transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
                  <div className="flex justify-between text-[#666666] dark:text-[#A09D96]">
                    <span>Subtotal</span>
                    <span className="text-tk-ink dark:text-white font-medium">{quote ? formatPrice(quote.subtotal) : '—'}</span>
                  </div>
                  {quote?.discount > 0 && (
                    <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                      <span>Discount{quote.coupon?.ok ? ` (${quote.coupon.code})` : ''}</span>
                      <span>−{formatPrice(quote.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#666666] dark:text-[#A09D96]">
                    <span>Delivery</span>
                    <span className={quote?.shipping === 0 ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-tk-ink dark:text-white'}>
                      {quote ? (quote.shipping === 0 ? 'FREE' : formatPrice(quote.shipping)) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[14px] font-medium text-tk-ink dark:text-white pt-2 border-t border-[#EAEAEA] dark:border-white/10">
                    <span className="uppercase tracking-wider">Total</span>
                    <span className="font-semibold text-tk-ink dark:text-tk-accent-night tabular-nums">{quote ? formatPrice(quote.total) : '—'}</span>
                  </div>
                  <p className="text-[10px] text-[#888888] dark:text-[#88857F]">Prices include GST.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <AddressModal
        open={!!addressModal}
        address={addressModal?.address || null}
        onClose={() => setAddressModal(null)}
        onSaved={(id) => id && setAddressId(id)}
      />
    </div>
  );
}
