import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from './useAccount';
import { addressSchema, fieldErrors } from './schemas';
import { INDIAN_STATES } from '../../lib/indianStates';
import { toFriendlyError } from '../../lib/errors';

const inputClass =
  'w-full px-3 py-2 border border-[#E0E0E0] dark:border-white/20 rounded-[2px] bg-transparent outline-none focus:border-tk-ink dark:focus:border-white';
const labelClass = 'block text-[10.5px] uppercase tracking-wider text-[#777777] mb-1';
const errorClass = 'text-[10.5px] text-rose-600 dark:text-rose-400 mt-1';
const EMPTY_ADDRESS = { label: 'Home', full_name: '', phone: '', line1: '', line2: '', landmark: '', city: '', state: '', pincode: '' };

/** Add or edit a delivery address. `address` null = new. Calls onSaved(id) after saving. */
export default function AddressModal({ open, address = null, onClose, onSaved }) {
  const { profile, saveAddress } = useAccount();
  const [addr, setAddr] = useState(EMPTY_ADDRESS);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (address) {
      setAddr({
        label: address.label, full_name: address.full_name, phone: address.phone, line1: address.line1, line2: address.line2 || '',
        landmark: address.landmark || '', city: address.city, state: address.state, pincode: address.pincode,
      });
    } else {
      setAddr({ ...EMPTY_ADDRESS, full_name: profile?.full_name || '', phone: profile?.phone || '' });
    }
  }, [open, address, profile]);

  const setField = (key) => (e) => setAddr((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const parsed = addressSchema.safeParse(addr);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    try {
      const id = await saveAddress.mutateAsync({ id: address?.id, values: parsed.data });
      onSaved && onSaved(id);
      onClose();
    } catch (err) {
      setErrors({ form: toFriendlyError(err) });
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="address-modal-title"
            data-lenis-prevent="true"
            className="relative w-full max-w-md max-h-[90svh] overflow-y-auto bg-white dark:bg-[#141318] text-tk-ink dark:text-white p-7 rounded-[2px] border border-[#EAEAEA] dark:border-white/10 shadow-xl space-y-5"
          >
            <div className="flex items-center justify-between border-b border-[#F0F0F0] dark:border-white/10 pb-3">
              <h3 id="address-modal-title" className="text-[15px] font-medium tracking-tight">
                {address ? 'Edit Address' : 'New Address'}
              </h3>
              <button type="button" onClick={onClose} aria-label="Close" className="text-[#888888] hover:text-tk-ink dark:hover:text-white cursor-pointer text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={submit} noValidate className="space-y-4 text-[12.5px]">
              {errors.form && <p className={errorClass}>{errors.form}</p>}
              <div>
                <span className={labelClass}>Label</span>
                <div className="flex gap-2">
                  {['Home', 'Work', 'Other'].map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setAddr((p) => ({ ...p, label: l }))}
                      className={`px-3 py-1.5 text-[11px] uppercase tracking-wider rounded-[2px] cursor-pointer ${
                        addr.label === l ? 'bg-tk-ink text-white dark:bg-white dark:text-tk-night' : 'border border-[#E0E0E0] dark:border-white/20 text-[#666666] dark:text-[#AAAAAA]'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="addr-name" className={labelClass}>Recipient Name</label>
                  <input id="addr-name" type="text" value={addr.full_name} onChange={setField('full_name')} className={inputClass} autoComplete="name" />
                  {errors.full_name && <p className={errorClass}>{errors.full_name}</p>}
                </div>
                <div>
                  <label htmlFor="addr-phone" className={labelClass}>Mobile</label>
                  <input id="addr-phone" type="tel" inputMode="tel" value={addr.phone} onChange={setField('phone')} className={inputClass} autoComplete="tel-national" />
                  {errors.phone && <p className={errorClass}>{errors.phone}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="addr-line1" className={labelClass}>House / Flat, Street</label>
                <input id="addr-line1" type="text" value={addr.line1} onChange={setField('line1')} className={inputClass} autoComplete="address-line1" />
                {errors.line1 && <p className={errorClass}>{errors.line1}</p>}
              </div>
              <div>
                <label htmlFor="addr-line2" className={labelClass}>Area / Locality (optional)</label>
                <input id="addr-line2" type="text" value={addr.line2} onChange={setField('line2')} className={inputClass} autoComplete="address-line2" />
              </div>
              <div>
                <label htmlFor="addr-landmark" className={labelClass}>Landmark (optional)</label>
                <input id="addr-landmark" type="text" value={addr.landmark} onChange={setField('landmark')} className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="addr-city" className={labelClass}>City</label>
                  <input id="addr-city" type="text" value={addr.city} onChange={setField('city')} className={inputClass} autoComplete="address-level2" />
                  {errors.city && <p className={errorClass}>{errors.city}</p>}
                </div>
                <div>
                  <label htmlFor="addr-pin" className={labelClass}>Pincode</label>
                  <input id="addr-pin" type="text" inputMode="numeric" maxLength={6} value={addr.pincode} onChange={setField('pincode')} className={inputClass} autoComplete="postal-code" />
                  {errors.pincode && <p className={errorClass}>{errors.pincode}</p>}
                </div>
              </div>
              <div>
                <label htmlFor="addr-state" className={labelClass}>State</label>
                <select id="addr-state" value={addr.state} onChange={setField('state')} className={`${inputClass} dark:bg-[#141318]`}>
                  <option value="">Choose a state</option>
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
                {errors.state && <p className={errorClass}>{errors.state}</p>}
              </div>

              <div className="pt-3 border-t border-[#F0F0F0] dark:border-white/10 flex items-center justify-end gap-3">
                <button type="button" onClick={onClose} className="text-[11px] uppercase tracking-wider text-[#777777]">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveAddress.isPending}
                  className="px-5 py-2 bg-tk-ink text-white dark:bg-white dark:text-tk-night text-[11px] uppercase tracking-wider rounded-[2px] cursor-pointer font-medium disabled:opacity-60"
                >
                  {saveAddress.isPending ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
