import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router';
import { useAccount } from '../storefront/account/useAccount';
import { fieldErrors, personalDetailsSchema } from '../storefront/account/schemas';
import AddressModal from '../storefront/account/AddressModal';
import OrdersList from '../storefront/orders/OrdersList';
import { formatIndianPhone } from '../lib/phone';
import { toFriendlyError } from '../lib/errors';
import { useAuth } from '../lib/auth';

const inputClass =
  'w-full px-3 py-2 border border-[#E0E0E0] dark:border-white/20 rounded-[2px] bg-transparent outline-none focus:border-tk-ink dark:focus:border-white';
const labelClass = 'block text-[10.5px] uppercase tracking-wider text-[#777777] mb-1';
const errorClass = 'text-[10.5px] text-rose-600 dark:text-rose-400 mt-1';

const TABS = ['orders', 'addresses', 'details'];

function formatBirthday(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export default function BluorngAccountPage({ theme = 'light', onToggleTheme, onNavigateHome }) {
  const { signOut } = useAuth();
  const { user, profile, addresses, saveProfile, saveAddress, deleteAddress, setDefault } = useAccount();
  const location = useLocation();
  const navigate = useNavigate();
  const tabFromPath = location.pathname.split('/')[2];
  const activeTab = TABS.includes(tabFromPath) ? tabFromPath : 'orders';
  const setActiveTab = (tab) => navigate(tab === 'orders' ? '/account' : `/account/${tab}`, { replace: true });

  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2600);
  };

  // ---------------- Personal details form ----------------
  const [details, setDetails] = useState({ full_name: '', phone: '', date_of_birth: '', whatsapp_opt_in: false });
  const [detailErrors, setDetailErrors] = useState({});
  useEffect(() => {
    if (!profile) return;
    setDetails({
      full_name: profile.full_name || '',
      phone: profile.phone || '',
      date_of_birth: profile.date_of_birth || '',
      whatsapp_opt_in: !!profile.whatsapp_opt_in,
    });
  }, [profile]);

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    const parsed = personalDetailsSchema.safeParse(details);
    if (!parsed.success) {
      setDetailErrors(fieldErrors(parsed.error));
      return;
    }
    setDetailErrors({});
    try {
      await saveProfile.mutateAsync(parsed.data);
      showToast('Details saved.');
    } catch (err) {
      showToast(toFriendlyError(err));
    }
  };

  // ---------------- Address modal ----------------
  const [addressModal, setAddressModal] = useState(null); // null | { address?: object }
  const openNewAddress = () => setAddressModal({ address: null });
  const openEditAddress = (a) => setAddressModal({ address: a });

  const handleRemoveAddress = async (id) => {
    try {
      await deleteAddress.mutateAsync(id);
      showToast('Address removed.');
    } catch (err) {
      showToast(toFriendlyError(err));
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefault.mutateAsync(id);
      showToast('Default address updated.');
    } catch (err) {
      showToast(toFriendlyError(err));
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onNavigateHome();
  };

  const addressList = addresses.data || [];
  const displayName = profile?.full_name || 'Your account';

  return (
    <div className="min-h-screen bg-[#FFFFFF] dark:bg-tk-night text-tk-ink dark:text-white transition-colors duration-300 font-sans pb-28">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            role="status"
            className="fixed top-6 right-6 left-6 sm:left-auto z-50 bg-tk-ink dark:bg-white text-white dark:text-tk-night px-4 py-2.5 rounded-[2px] text-[11.5px] tracking-wide shadow-md"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= 1. MINIMAL HEADER ========================== */}
      <header className="w-full border-b border-[#F0F0F0] dark:border-white/10 bg-white/90 dark:bg-tk-night/90 backdrop-blur-md sticky top-0 z-30 transition-colors">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
          <button
            onClick={onNavigateHome}
            className="text-[11px] uppercase tracking-[0.18em] text-[#777777] hover:text-tk-ink dark:text-[#999999] dark:hover:text-white transition-colors cursor-pointer flex items-center gap-2"
          >
            <span>←</span>
            <span>Boutique</span>
          </button>

          <button onClick={onNavigateHome} className="cursor-pointer" aria-label="Saudagar Home">
            <img src="/images/saudagar_logo_black.png" alt="Saudagar Perfumers" className="h-6 w-auto object-contain dark:hidden block" />
            <img src="/images/saudagar_logo_gold.png" alt="Saudagar Perfumers" className="h-6 w-auto object-contain hidden dark:block" />
          </button>

          <div className="flex items-center gap-4">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="text-[11px] uppercase tracking-wider text-[#777777] dark:text-[#999999] hover:text-tk-ink dark:hover:text-white transition-colors cursor-pointer"
                title="Toggle Theme"
              >
                {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ================= 2. CLEAN EDITORIAL HERO ==================== */}
      <section className="max-w-5xl mx-auto px-6 sm:px-10 pt-12 sm:pt-16 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-6 pb-10 border-b border-[#F0F0F0] dark:border-white/10">
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-[0.24em] text-[#888888] dark:text-[#777777] block mb-2 font-medium">Client Account</span>
            <h1 className="text-[28px] sm:text-[36px] font-normal tracking-[-0.015em] text-tk-ink dark:text-white leading-tight break-words">{displayName}</h1>
            <p className="text-[12.5px] text-[#777777] dark:text-[#999999] mt-1 font-light break-all">
              {[user?.email, profile?.phone ? formatIndianPhone(profile.phone) : null].filter(Boolean).join(' · ')}
            </p>
            {!profile?.full_name && (
              <button
                onClick={() => setActiveTab('details')}
                className="mt-3 text-[11px] uppercase tracking-[0.14em] text-tk-accent dark:text-tk-accent-night underline underline-offset-4 cursor-pointer"
              >
                Add your name, phone and birthday
              </button>
            )}
          </div>

          <div className="flex items-center gap-6 text-[12px] text-[#777777] dark:text-[#888888]">
            <button
              onClick={handleSignOut}
              className="text-[10px] uppercase tracking-[0.16em] text-[#999999] hover:text-tk-ink dark:hover:text-white transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Minimal Underline Tabs */}
        <nav className="flex items-center gap-8 text-[11px] uppercase tracking-[0.2em] pt-4 overflow-x-auto scrollbar-none border-b border-[#F0F0F0] dark:border-white/10">
          {[
            { id: 'orders', label: 'Orders' },
            { id: 'addresses', label: `Addresses (${addressList.length})` },
            { id: 'details', label: 'Personal Details' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 relative transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-tk-ink dark:text-white font-medium'
                  : 'text-[#888888] hover:text-tk-ink dark:text-[#777777] dark:hover:text-white font-normal'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && <motion.span layoutId="minimalTabIndicator" className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-tk-ink dark:bg-tk-accent-night" />}
            </button>
          ))}
        </nav>
      </section>

      {/* ================= 3. MINIMAL TAB CONTENTS ==================== */}
      <main className="max-w-5xl mx-auto px-6 sm:px-10">
        {/* TAB 1: ORDERS */}
        {activeTab === 'orders' && (
          <OrdersList />
        )}

        {/* TAB 2: ADDRESSES */}
        {activeTab === 'addresses' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F0F0] dark:border-white/10">
              <span className="text-[11px] uppercase tracking-[0.16em] text-[#888888] font-medium">Saved Addresses ({addressList.length})</span>
              <button onClick={openNewAddress} className="text-[11px] uppercase tracking-[0.16em] text-tk-ink dark:text-white hover:underline cursor-pointer font-medium">
                + Add Address
              </button>
            </div>

            {addresses.isLoading && <p className="text-[12.5px] text-[#888888]">Loading addresses…</p>}
            {addresses.error && <p className={errorClass}>{toFriendlyError(addresses.error)}</p>}
            {!addresses.isLoading && addressList.length === 0 && (
              <p className="py-10 text-center text-[13px] text-[#888888]">No saved addresses yet. Add one to check out faster.</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {addressList.map((a) => (
                <div
                  key={a.id}
                  className={`p-6 rounded-[2px] border transition-colors ${a.is_default ? 'border-tk-ink dark:border-white/30' : 'border-[#EEEEEE] dark:border-white/10'}`}
                >
                  <div className="flex items-center justify-between mb-3 text-[11px]">
                    <span className="uppercase tracking-widest text-[#888888] font-medium">{a.label}</span>
                    {a.is_default && <span className="text-[10px] uppercase tracking-wider text-tk-accent dark:text-tk-accent-night font-semibold">Default</span>}
                  </div>
                  <p className="text-[13.5px] font-medium text-tk-ink dark:text-white">{a.full_name}</p>
                  <p className="text-[12.5px] text-[#666666] dark:text-[#AAAAAA] mt-1 leading-relaxed font-light">
                    {a.line1}
                    {a.line2 ? <>, {a.line2}</> : null}
                    <br />
                    {a.landmark ? (
                      <>
                        Near {a.landmark}
                        <br />
                      </>
                    ) : null}
                    {a.city}, {a.state} {a.pincode}
                  </p>
                  <p className="text-[11.5px] text-[#888888] mt-2 font-mono">{formatIndianPhone(a.phone)}</p>

                  <div className="mt-4 pt-3 border-t border-[#F0F0F0] dark:border-white/10 flex flex-wrap gap-4">
                    <button onClick={() => openEditAddress(a)} className="text-[11px] uppercase tracking-wider text-[#777777] hover:text-tk-ink dark:hover:text-white cursor-pointer">
                      Edit
                    </button>
                    {!a.is_default && (
                      <button onClick={() => handleSetDefault(a.id)} className="text-[11px] uppercase tracking-wider text-[#777777] hover:text-tk-ink dark:hover:text-white cursor-pointer">
                        Make Default
                      </button>
                    )}
                    <button onClick={() => handleRemoveAddress(a.id)} className="text-[11px] uppercase tracking-wider text-red-500 hover:text-red-700 cursor-pointer">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <AddressModal
              open={!!addressModal}
              address={addressModal?.address || null}
              onClose={() => setAddressModal(null)}
              onSaved={() => showToast(addressModal?.address ? 'Address updated.' : 'Address added.')}
            />
          </div>
        )}

        {/* TAB 3: PERSONAL DETAILS */}
        {activeTab === 'details' && (
          <div className="max-w-xl space-y-8 py-4">
            <form onSubmit={handleSaveDetails} noValidate className="space-y-5 text-[12.5px]">
              <div>
                <label htmlFor="pd-name" className={labelClass}>Full Name</label>
                <input id="pd-name" type="text" value={details.full_name} onChange={(e) => setDetails((d) => ({ ...d, full_name: e.target.value }))} className={inputClass} autoComplete="name" />
                {detailErrors.full_name && <p className={errorClass}>{detailErrors.full_name}</p>}
              </div>

              <div>
                <label htmlFor="pd-email" className={labelClass}>Email</label>
                <input id="pd-email" type="email" value={user?.email || ''} readOnly className={`${inputClass} text-[#888888] cursor-not-allowed`} />
              </div>

              <div>
                <label htmlFor="pd-phone" className={labelClass}>Mobile</label>
                <input
                  id="pd-phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="98765 43210"
                  value={details.phone}
                  onChange={(e) => setDetails((d) => ({ ...d, phone: e.target.value }))}
                  className={inputClass}
                  autoComplete="tel-national"
                />
                {detailErrors.phone && <p className={errorClass}>{detailErrors.phone}</p>}
              </div>

              <div>
                <label htmlFor="pd-dob" className={labelClass}>Birthday</label>
                {profile?.dob_locked ? (
                  <>
                    <p id="pd-dob" className="px-3 py-2 border border-[#F0F0F0] dark:border-white/10 rounded-[2px] text-tk-ink dark:text-white">
                      {formatBirthday(profile.date_of_birth)}
                    </p>
                    <p className="text-[10.5px] text-[#888888] mt-1">Your birthday is saved. Contact us if it needs correcting.</p>
                  </>
                ) : (
                  <>
                    <input
                      id="pd-dob"
                      type="date"
                      max={new Date().toISOString().slice(0, 10)}
                      value={details.date_of_birth}
                      onChange={(e) => setDetails((d) => ({ ...d, date_of_birth: e.target.value }))}
                      className={inputClass}
                    />
                    <p className="text-[10.5px] text-[#888888] mt-1">We send a birthday gift every year. It can only be set once.</p>
                  </>
                )}
                {detailErrors.date_of_birth && <p className={errorClass}>{detailErrors.date_of_birth}</p>}
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={details.whatsapp_opt_in}
                  onChange={(e) => setDetails((d) => ({ ...d, whatsapp_opt_in: e.target.checked }))}
                  className="mt-0.5 accent-tk-ink dark:accent-tk-gold"
                />
                <span className="text-[12.5px] text-[#555555] dark:text-[#AAAAAA]">Send me new launches and offers on WhatsApp. Order updates are always sent.</span>
              </label>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saveProfile.isPending}
                  className="px-6 py-2.5 bg-tk-ink text-white dark:bg-white dark:text-tk-night text-[11px] uppercase tracking-wider rounded-[2px] cursor-pointer font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {saveProfile.isPending ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
