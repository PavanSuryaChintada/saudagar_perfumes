import React, { useState } from 'react';
import { formatPrice, ALL_PRODUCTS } from '../data/bluorngSaudagarData.js';

export default function BluorngCheckoutModal({
  isOpen,
  onClose,
  checkoutData,
  activeCurrency = 'INR',
  onOrderSuccess
}) {
  const [step, setStep] = useState('shipping'); // 'shipping' | 'payment' | 'confirmation'

  // Form State
  const [email, setEmail] = useState('connoisseur@saudagar.com');
  const [phone, setPhone] = useState('+91 98200 44211');
  const [firstName, setFirstName] = useState('Aditya');
  const [lastName, setLastName] = useState('Verma');
  const [address, setAddress] = useState('42 Altamount Road, Malabar Hill');
  const [city, setCity] = useState('Mumbai');
  const [state, setState] = useState('Maharashtra');
  const [pinCode, setPinCode] = useState('400026');
  const [shippingMethod, setShippingMethod] = useState('express'); // 'express' | 'priority'
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'cod'

  // Generated Order state
  const [orderId, setOrderId] = useState('');

  if (!isOpen || !checkoutData) return null;

  const { items = [], subtotal = 0, discount = 0, total = 0, note = '' } = checkoutData;

  const shippingCost = shippingMethod === 'priority' ? 500 : 0;
  const grandTotal = total + shippingCost;

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    const newOrderId = `SAU-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderId(newOrderId);
    setStep('confirmation');
    if (onOrderSuccess) {
      onOrderSuccess({
        orderId: newOrderId,
        email,
        items,
        total: grandTotal
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#FFFFFF] text-[#111111] rounded-xs shadow-2xl border border-[#E5E5E5] overflow-hidden my-8">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-[#E5E5E5] flex items-center justify-between bg-[#FAF9F6]">
          <div className="flex items-center gap-2">
            <span className="font-sans font-black tracking-[0.2em] text-[16px] uppercase">
              SAUDAGAR
            </span>
            <span className="text-[#888888]">•</span>
            <span className="text-[11px] font-bold tracking-widest uppercase text-[#C4823F]">
              Secure Checkout
            </span>
          </div>

          {step !== 'confirmation' && (
            <button
              onClick={onClose}
              className="p-1 text-[#777777] hover:text-[#111111] transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>

        {/* Multi-Step Flow */}
        <div className="p-5 sm:p-7">
          
          {/* ================= STEP 1: SHIPPING & CONTACT ================= */}
          {step === 'shipping' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStep('payment');
              }}
              className="space-y-5"
            >
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#111111]">
                  1. Contact & Delivery Address
                </h3>
                <span className="text-[11px] text-[#777777] font-semibold">Step 1 of 2</span>
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11.5px]">
                <div>
                  <label className="block text-[10.5px] font-bold uppercase tracking-wider mb-1 text-[#555555]">
                    Email Address:
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-[#CCCCCC] rounded-xs outline-none focus:border-[#111111]"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold uppercase tracking-wider mb-1 text-[#555555]">
                    Mobile (for courier tracking):
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-[#CCCCCC] rounded-xs outline-none focus:border-[#111111]"
                  />
                </div>
              </div>

              {/* Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11.5px]">
                <div>
                  <label className="block text-[10.5px] font-bold uppercase tracking-wider mb-1 text-[#555555]">
                    First Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-[#CCCCCC] rounded-xs outline-none focus:border-[#111111]"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold uppercase tracking-wider mb-1 text-[#555555]">
                    Last Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-[#CCCCCC] rounded-xs outline-none focus:border-[#111111]"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="text-[11.5px]">
                <label className="block text-[10.5px] font-bold uppercase tracking-wider mb-1 text-[#555555]">
                  Street Address & Apartment:
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CCCCCC] rounded-xs outline-none focus:border-[#111111]"
                />
              </div>

              {/* City, State, PIN */}
              <div className="grid grid-cols-3 gap-3 text-[11.5px]">
                <div>
                  <label className="block text-[10.5px] font-bold uppercase tracking-wider mb-1 text-[#555555]">
                    City:
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-[#CCCCCC] rounded-xs outline-none focus:border-[#111111]"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold uppercase tracking-wider mb-1 text-[#555555]">
                    State:
                  </label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 border border-[#CCCCCC] rounded-xs outline-none focus:border-[#111111]"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold uppercase tracking-wider mb-1 text-[#555555]">
                    PIN / Postal Code:
                  </label>
                  <input
                    type="text"
                    required
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="w-full px-3 py-2 border border-[#CCCCCC] rounded-xs outline-none focus:border-[#111111]"
                  />
                </div>
              </div>

              {/* Shipping Method Options */}
              <div>
                <label className="block text-[10.5px] font-bold uppercase tracking-wider mb-2 text-[#555555]">
                  Select Delivery Courier:
                </label>
                <div className="space-y-2 text-[11.5px]">
                  <label
                    onClick={() => setShippingMethod('express')}
                    className={`flex items-center justify-between p-3 border rounded-xs cursor-pointer transition-all ${
                      shippingMethod === 'express'
                        ? 'border-[#111111] bg-[#FAF9F6]'
                        : 'border-[#E5E5E5]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={shippingMethod === 'express'}
                        onChange={() => setShippingMethod('express')}
                      />
                      <span className="font-bold">Standard Insured Air Courier (2-3 Days)</span>
                    </div>
                    <span className="font-semibold text-emerald-700">FREE</span>
                  </label>

                  <label
                    onClick={() => setShippingMethod('priority')}
                    className={`flex items-center justify-between p-3 border rounded-xs cursor-pointer transition-all ${
                      shippingMethod === 'priority'
                        ? 'border-[#111111] bg-[#FAF9F6]'
                        : 'border-[#E5E5E5]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={shippingMethod === 'priority'}
                        onChange={() => setShippingMethod('priority')}
                      />
                      <span className="font-bold">Priority White-Glove Concierge (Next Day AM)</span>
                    </div>
                    <span className="font-semibold text-[#111111]">+ {formatPrice(500, activeCurrency)}</span>
                  </label>
                </div>
              </div>

              {/* Continue to Payment button */}
              <div className="pt-3 border-t flex justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#111111] hover:bg-[#C4823F] text-white text-[11.5px] font-bold uppercase tracking-[0.2em] rounded-xs transition-colors"
                >
                  Continue to Payment →
                </button>
              </div>
            </form>
          )}

          {/* ================= STEP 2: PAYMENT METHOD ================= */}
          {step === 'payment' && (
            <form onSubmit={handlePlaceOrder} className="space-y-5">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#111111]">
                  2. Select Payment Method
                </h3>
                <button
                  type="button"
                  onClick={() => setStep('shipping')}
                  className="text-[11px] text-[#C4823F] font-bold uppercase tracking-wider"
                >
                  ← Edit Address
                </button>
              </div>

              {/* Order Summary Snapshot */}
              <div className="bg-[#FAF9F6] p-3.5 border border-[#EEEEEE] text-[11px] space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Shipping to:</span>
                  <span>{firstName} {lastName}, {city} ({pinCode})</span>
                </div>
                <div className="flex justify-between text-[#666666]">
                  <span>Items Total ({items.length}):</span>
                  <span>{formatPrice(total, activeCurrency)}</span>
                </div>
                {shippingCost > 0 && (
                  <div className="flex justify-between text-[#666666]">
                    <span>Priority Shipping:</span>
                    <span>+{formatPrice(shippingCost, activeCurrency)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-[13px] text-[#111111] pt-1 border-t">
                  <span>Payable Amount:</span>
                  <span>{formatPrice(grandTotal, activeCurrency)}</span>
                </div>
              </div>

              {/* Payment Options */}
              <div className="space-y-2.5 text-[12px]">
                {/* UPI Option */}
                <label
                  onClick={() => setPaymentMethod('upi')}
                  className={`flex flex-col p-3.5 border rounded-xs cursor-pointer transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-[#111111] bg-[#FAF9F6]'
                      : 'border-[#E5E5E5]'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={paymentMethod === 'upi'}
                        onChange={() => setPaymentMethod('upi')}
                      />
                      <span>UPI Instant (GPay / PhonePe / Paytm / QR)</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                      FASTEST
                    </span>
                  </div>
                  {paymentMethod === 'upi' && (
                    <p className="mt-2 text-[10.5px] text-[#666666] pl-5">
                      A secure UPI payment prompt or QR code will appear after placing your order.
                    </p>
                  )}
                </label>

                {/* Credit / Debit Card Option */}
                <label
                  onClick={() => setPaymentMethod('card')}
                  className={`flex flex-col p-3.5 border rounded-xs cursor-pointer transition-all ${
                    paymentMethod === 'card'
                      ? 'border-[#111111] bg-[#FAF9F6]'
                      : 'border-[#E5E5E5]'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                      />
                      <span>Credit / Debit Card (Visa, Mastercard, Amex)</span>
                    </div>
                    <span className="text-[10.5px] text-[#777777]">256-Bit SSL</span>
                  </div>
                </label>

                {/* Cash on Delivery Option */}
                <label
                  onClick={() => setPaymentMethod('cod')}
                  className={`flex flex-col p-3.5 border rounded-xs cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-[#111111] bg-[#FAF9F6]'
                      : 'border-[#E5E5E5]'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                      />
                      <span>Cash on Delivery (Verified Pin Codes)</span>
                    </div>
                    <span className="text-[10px] text-[#777777]">India Only</span>
                  </div>
                </label>
              </div>

              {/* Submit / Authorize Order Button */}
              <div className="pt-3 border-t flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('shipping')}
                  className="text-[11px] font-bold tracking-wider uppercase text-[#777777] hover:text-[#111111]"
                >
                  ← Back
                </button>

                <button
                  type="submit"
                  className="px-8 py-4 bg-[#111111] hover:bg-[#C4823F] text-white text-[12px] font-bold uppercase tracking-[0.2em] rounded-xs transition-colors shadow-xl"
                >
                  Authorize Order • {formatPrice(grandTotal, activeCurrency)}
                </button>
              </div>
            </form>
          )}

          {/* ================= STEP 3: ORDER CONFIRMATION ================= */}
          {step === 'confirmation' && (
            <div className="text-center py-6 space-y-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl font-bold">
                ✓
              </div>

              <div>
                <span className="text-[10.5px] font-bold tracking-[0.24em] uppercase text-[#C4823F]">
                  Order Placed Successfully
                </span>
                <h2 className="text-[22px] font-black uppercase tracking-wider text-[#111111] mt-1">
                  Thank you, {firstName}!
                </h2>
                <p className="text-[12px] text-[#666666] tracking-wide mt-1">
                  Your reference number is <strong className="text-[#111111]">{orderId}</strong>
                </p>
              </div>

              <div className="bg-[#FAF9F6] p-4 border border-[#EEEEEE] rounded-xs text-left text-[11.5px] space-y-2 max-w-md mx-auto">
                <div className="flex justify-between border-b pb-1 font-bold">
                  <span>Shipping Details:</span>
                  <span>{firstName} {lastName}</span>
                </div>
                <p className="text-[#666666]">{address}, {city}, {state} - {pinCode}</p>
                <div className="flex justify-between border-t pt-1 font-bold text-[#111111]">
                  <span>Total Amount Paid:</span>
                  <span>{formatPrice(grandTotal, activeCurrency)}</span>
                </div>
                <p className="text-[10px] text-emerald-700 font-semibold">
                  ✓ Order confirmation and tracking dispatched to {email}.
                </p>
              </div>

              <button
                onClick={onClose}
                className="mt-4 px-8 py-3.5 bg-[#111111] hover:bg-[#C4823F] text-white text-[11.5px] font-bold uppercase tracking-widest transition-colors rounded-xs"
              >
                Return to Saudagar Home
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
