import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoredUserProfile, saveStoredUserProfile } from '../data/userProfileData.js';
import { formatPrice } from '../data/bluorngSaudagarData.js';

export default function BluorngAccountPage({
  activeCurrency = 'INR',
  onChangeCurrency,
  theme = 'light',
  onToggleTheme,
  onNavigateHome,
  onNavigateCollection,
  onSelectProduct
}) {
  const [profile, setProfile] = useState(() => getStoredUserProfile());
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'addresses', 'engraving', 'settings'
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Form states
  const [firstName, setFirstName] = useState(profile.firstName || 'Aditya');
  const [lastName, setLastName] = useState(profile.lastName || 'Verma');
  const [email, setEmail] = useState(profile.email || '');
  const [phone, setPhone] = useState(profile.phone || '');

  // Engraving state
  const [engravingText, setEngravingText] = useState(profile.defaultEngraving || 'A. VERMA');

  // Address modal states
  const [addrTag, setAddrTag] = useState('Residence');
  const [addrName, setAddrName] = useState(`${profile.firstName || ''} ${profile.lastName || ''}`.trim());
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrPostal, setAddrPostal] = useState('');
  const [addrCountry, setAddrCountry] = useState('India');
  const [addrPhone, setAddrPhone] = useState(profile.phone || '');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2600);
  };

  const updateProfile = (nextProfile) => {
    setProfile(nextProfile);
    saveStoredUserProfile(nextProfile);
  };

  // Save Settings
  const handleSaveSettings = (e) => {
    e.preventDefault();
    const updated = {
      ...profile,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim()
    };
    updateProfile(updated);
    showToast('Changes saved.');
  };

  // Save Engraving Plaque
  const handleSaveEngraving = (e) => {
    e.preventDefault();
    const updated = {
      ...profile,
      defaultEngraving: engravingText.trim().toUpperCase()
    };
    updateProfile(updated);
    showToast('Plaque preference saved.');
  };

  // Add Address
  const handleAddAddress = (e) => {
    e.preventDefault();
    if (!addrStreet.trim() || !addrCity.trim()) return;

    const newAddr = {
      id: `addr-${Date.now()}`,
      isDefault: profile.addresses.length === 0,
      tag: addrTag.trim() || 'Residence',
      fullName: addrName.trim() || `${firstName} ${lastName}`,
      street: addrStreet.trim(),
      city: addrCity.trim(),
      state: addrState.trim(),
      postalCode: addrPostal.trim(),
      country: addrCountry.trim(),
      phone: addrPhone.trim()
    };

    const updated = {
      ...profile,
      addresses: [...profile.addresses, newAddr]
    };
    updateProfile(updated);
    setIsAddressModalOpen(false);
    showToast('Address added.');

    setAddrStreet('');
    setAddrCity('');
    setAddrState('');
    setAddrPostal('');
  };

  // Set default address
  const handleSetDefault = (id) => {
    const updated = {
      ...profile,
      addresses: profile.addresses.map((a) => ({
        ...a,
        isDefault: a.id === id
      }))
    };
    updateProfile(updated);
    showToast('Default address updated.');
  };

  // Remove address
  const handleRemoveAddress = (id) => {
    const updated = {
      ...profile,
      addresses: profile.addresses.filter((a) => a.id !== id)
    };
    updateProfile(updated);
    showToast('Address removed.');
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] dark:bg-[#0B0A0D] text-[#111111] dark:text-white transition-colors duration-300 font-sans pb-28">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-6 right-6 z-50 bg-[#111111] dark:bg-white text-white dark:text-[#0B0A0D] px-4 py-2.5 rounded-[2px] text-[11.5px] tracking-wide shadow-md"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* ================= 1. MINIMAL HEADER ========================== */}
      {/* ============================================================== */}
      <header className="w-full border-b border-[#F0F0F0] dark:border-white/10 bg-white/90 dark:bg-[#0B0A0D]/90 backdrop-blur-md sticky top-0 z-30 transition-colors">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
          
          <button
            onClick={onNavigateHome}
            className="text-[11px] uppercase tracking-[0.18em] text-[#777777] hover:text-[#111111] dark:text-[#999999] dark:hover:text-white transition-colors cursor-pointer flex items-center gap-2"
          >
            <span>←</span>
            <span>Boutique</span>
          </button>

          <button onClick={onNavigateHome} className="cursor-pointer" aria-label="Saudagar Home">
            <img
              src="/images/saudagar_logo_black.png"
              alt="Saudagar Perfumers"
              className="h-6 w-auto object-contain dark:hidden block"
            />
            <img
              src="/images/saudagar_logo_gold.png"
              alt="Saudagar Perfumers"
              className="h-6 w-auto object-contain hidden dark:block"
            />
          </button>

          <div className="flex items-center gap-4">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="text-[11px] uppercase tracking-wider text-[#777777] dark:text-[#999999] hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer"
                title="Toggle Theme"
              >
                {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            )}
          </div>

        </div>
      </header>

      {/* ============================================================== */}
      {/* ================= 2. CLEAN EDITORIAL HERO ==================== */}
      {/* ============================================================== */}
      <section className="max-w-5xl mx-auto px-6 sm:px-10 pt-12 sm:pt-16 pb-10">
        
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-6 pb-10 border-b border-[#F0F0F0] dark:border-white/10">
          <div>
            <span className="text-[10px] uppercase tracking-[0.24em] text-[#888888] dark:text-[#777777] block mb-2 font-medium">
              Client Account
            </span>
            <h1 className="text-[28px] sm:text-[36px] font-normal tracking-[-0.015em] text-[#111111] dark:text-white leading-tight">
              {profile.firstName} {profile.lastName}
            </h1>
            <p className="text-[12.5px] text-[#777777] dark:text-[#999999] mt-1 font-light">
              {profile.email} · {profile.phone}
            </p>
          </div>

          <div className="flex items-center gap-6 text-[12px] text-[#777777] dark:text-[#888888]">
            <div>
              <span className="text-[13px] font-mono text-[#111111] dark:text-white block">
                {profile.points}
              </span>
              <span className="text-[9.5px] uppercase tracking-[0.14em]">Loyalty Points</span>
            </div>

            <div className="w-[1px] h-5 bg-[#EEEEEE] dark:bg-white/15" />

            <div>
              <span className="text-[13px] font-mono text-[#111111] dark:text-white block">
                {profile.orders.length}
              </span>
              <span className="text-[9.5px] uppercase tracking-[0.14em]">Orders</span>
            </div>

            <div className="w-[1px] h-5 bg-[#EEEEEE] dark:bg-white/15" />

            <button
              onClick={() => {
                if (confirm('Sign out of your account?')) {
                  showToast('Signed out');
                  setTimeout(() => onNavigateHome(), 400);
                }
              }}
              className="text-[10px] uppercase tracking-[0.16em] text-[#999999] hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Minimal Underline Tabs */}
        <nav className="flex items-center gap-8 text-[11px] uppercase tracking-[0.2em] pt-4 overflow-x-auto scrollbar-none border-b border-[#F0F0F0] dark:border-white/10">
          {[
            { id: 'orders', label: `Orders (${profile.orders.length})` },
            { id: 'addresses', label: `Addresses (${profile.addresses.length})` },
            { id: 'engraving', label: 'Bespoke Plaque' },
            { id: 'settings', label: 'Preferences' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 relative transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-[#111111] dark:text-white font-medium'
                  : 'text-[#888888] hover:text-[#111111] dark:text-[#777777] dark:hover:text-white font-normal'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.span
                  layoutId="minimalTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#111111] dark:bg-[#ECC86A]"
                />
              )}
            </button>
          ))}
        </nav>

      </section>

      {/* ============================================================== */}
      {/* ================= 3. MINIMAL TAB CONTENTS ==================== */}
      {/* ============================================================== */}
      <main className="max-w-5xl mx-auto px-6 sm:px-10">

        {/* ------------------------------------------------------------ */}
        {/* TAB 1: ORDERS (Clean, open flacon list)                       */}
        {/* ------------------------------------------------------------ */}
        {activeTab === 'orders' && (
          <div className="space-y-12">
            {profile.orders.length === 0 ? (
              <div className="py-16 text-center text-[#888888] text-[13px]">
                No orders yet.
              </div>
            ) : (
              profile.orders.map((order) => (
                <div key={order.id} className="space-y-5">
                  
                  {/* Order Meta Bar */}
                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-[12px] pb-3 border-b border-[#F0F0F0] dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-medium text-[#111111] dark:text-white">
                        {order.id}
                      </span>
                      <span className="text-[#888888] dark:text-[#777777]">·</span>
                      <span className="text-[#666666] dark:text-[#AAAAAA]">{order.date}</span>
                      <span className="text-[#888888] dark:text-[#777777]">·</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium text-[11px] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        {order.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-[11px]">
                      <span className="font-mono font-medium text-[#111111] dark:text-white">
                        {formatPrice(order.totalAmount, activeCurrency)}
                      </span>
                      <button
                        onClick={() => showToast(`Tracking ${order.trackingCode}`)}
                        className="text-[#777777] dark:text-[#999999] hover:text-[#111111] dark:hover:text-white underline cursor-pointer"
                      >
                        Track package →
                      </button>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-4">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-4 py-2"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-16 bg-[#FAFAFA] dark:bg-white/5 rounded-[2px] flex items-center justify-center p-2 shrink-0">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                          <div>
                            <h3 className="text-[13.5px] font-normal text-[#111111] dark:text-white">
                              {item.name}
                            </h3>
                            <div className="text-[11.5px] text-[#777777] dark:text-[#888888] mt-0.5 flex items-center gap-2">
                              <span>{item.size}</span>
                              <span>·</span>
                              <span>Qty {item.quantity}</span>
                              {item.engraving && (
                                <>
                                  <span>·</span>
                                  <span className="text-[#C4823F] dark:text-[#ECC86A]">
                                    Plaque: &ldquo;{item.engraving}&rdquo;
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => onSelectProduct && onSelectProduct(item.id)}
                            className="text-[11px] uppercase tracking-wider text-[#666666] dark:text-[#999999] hover:text-[#111111] dark:hover:text-white cursor-pointer"
                          >
                            View
                          </button>
                          <button
                            onClick={() => showToast(`Added ${item.name} to cart.`)}
                            className="text-[11px] uppercase tracking-wider text-[#111111] dark:text-white hover:underline cursor-pointer font-medium"
                          >
                            Reorder
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              ))
            )}
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* TAB 2: ADDRESSES                                             */}
        {/* ------------------------------------------------------------ */}
        {activeTab === 'addresses' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F0F0] dark:border-white/10">
              <span className="text-[11px] uppercase tracking-[0.16em] text-[#888888] font-medium">
                Saved Residences ({profile.addresses.length})
              </span>
              <button
                onClick={() => setIsAddressModalOpen(true)}
                className="text-[11px] uppercase tracking-[0.16em] text-[#111111] dark:text-white hover:underline cursor-pointer font-medium"
              >
                + Add Address
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profile.addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`p-6 rounded-[2px] border transition-colors ${
                    addr.isDefault
                      ? 'border-[#111111] dark:border-white/30'
                      : 'border-[#EEEEEE] dark:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 text-[11px]">
                    <span className="uppercase tracking-widest text-[#888888] font-medium">
                      {addr.tag}
                    </span>
                    {addr.isDefault ? (
                      <span className="text-[10px] uppercase tracking-wider text-[#C4823F] dark:text-[#ECC86A] font-semibold">
                        Default
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRemoveAddress(addr.id)}
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <p className="text-[13.5px] font-medium text-[#111111] dark:text-white">
                    {addr.fullName}
                  </p>
                  <p className="text-[12.5px] text-[#666666] dark:text-[#AAAAAA] mt-1 leading-relaxed font-light">
                    {addr.street}<br />
                    {addr.city}, {addr.state} {addr.postalCode}<br />
                    {addr.country}
                  </p>
                  <p className="text-[11.5px] text-[#888888] mt-2 font-mono">
                    {addr.phone}
                  </p>

                  {!addr.isDefault && (
                    <div className="mt-4 pt-3 border-t border-[#F0F0F0] dark:border-white/10">
                      <button
                        onClick={() => handleSetDefault(addr.id)}
                        className="text-[11px] uppercase tracking-wider text-[#777777] hover:text-[#111111] dark:hover:text-white cursor-pointer"
                      >
                        Make Default
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Clean Modal for Add Address */}
            <AnimatePresence>
              {isAddressModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    className="relative w-full max-w-md bg-white dark:bg-[#141318] p-7 rounded-[2px] border border-[#EAEAEA] dark:border-white/10 shadow-xl space-y-5"
                  >
                    <div className="flex items-center justify-between border-b border-[#F0F0F0] dark:border-white/10 pb-3">
                      <h3 className="text-[15px] font-medium tracking-tight">
                        New Address
                      </h3>
                      <button
                        onClick={() => setIsAddressModalOpen(false)}
                        className="text-[#888888] hover:text-[#111111] dark:hover:text-white cursor-pointer text-sm"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleAddAddress} className="space-y-4 text-[12.5px]">
                      <div>
                        <label className="block text-[10.5px] uppercase tracking-wider text-[#777777] mb-1">
                          Label
                        </label>
                        <input
                          type="text"
                          required
                          value={addrTag}
                          onChange={(e) => setAddrTag(e.target.value)}
                          placeholder="Residence, Penthouse, Office"
                          className="w-full px-3 py-2 border border-[#E0E0E0] dark:border-white/20 rounded-[2px] bg-transparent outline-none focus:border-[#111111] dark:focus:border-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10.5px] uppercase tracking-wider text-[#777777] mb-1">
                            Recipient Name
                          </label>
                          <input
                            type="text"
                            required
                            value={addrName}
                            onChange={(e) => setAddrName(e.target.value)}
                            className="w-full px-3 py-2 border border-[#E0E0E0] dark:border-white/20 rounded-[2px] bg-transparent outline-none focus:border-[#111111] dark:focus:border-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10.5px] uppercase tracking-wider text-[#777777] mb-1">
                            Mobile
                          </label>
                          <input
                            type="text"
                            required
                            value={addrPhone}
                            onChange={(e) => setAddrPhone(e.target.value)}
                            className="w-full px-3 py-2 border border-[#E0E0E0] dark:border-white/20 rounded-[2px] bg-transparent outline-none focus:border-[#111111] dark:focus:border-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10.5px] uppercase tracking-wider text-[#777777] mb-1">
                          Street Address
                        </label>
                        <input
                          type="text"
                          required
                          value={addrStreet}
                          onChange={(e) => setAddrStreet(e.target.value)}
                          placeholder="42 Altamount Road, Malabar Hill"
                          className="w-full px-3 py-2 border border-[#E0E0E0] dark:border-white/20 rounded-[2px] bg-transparent outline-none focus:border-[#111111] dark:focus:border-white"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10.5px] uppercase tracking-wider text-[#777777] mb-1">
                            City
                          </label>
                          <input
                            type="text"
                            required
                            value={addrCity}
                            onChange={(e) => setAddrCity(e.target.value)}
                            className="w-full px-3 py-2 border border-[#E0E0E0] dark:border-white/20 rounded-[2px] bg-transparent outline-none focus:border-[#111111] dark:focus:border-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10.5px] uppercase tracking-wider text-[#777777] mb-1">
                            State
                          </label>
                          <input
                            type="text"
                            value={addrState}
                            onChange={(e) => setAddrState(e.target.value)}
                            className="w-full px-3 py-2 border border-[#E0E0E0] dark:border-white/20 rounded-[2px] bg-transparent outline-none focus:border-[#111111] dark:focus:border-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10.5px] uppercase tracking-wider text-[#777777] mb-1">
                            PIN
                          </label>
                          <input
                            type="text"
                            value={addrPostal}
                            onChange={(e) => setAddrPostal(e.target.value)}
                            className="w-full px-3 py-2 border border-[#E0E0E0] dark:border-white/20 rounded-[2px] bg-transparent outline-none focus:border-[#111111] dark:focus:border-white"
                          />
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#F0F0F0] dark:border-white/10 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setIsAddressModalOpen(false)}
                          className="text-[11px] uppercase tracking-wider text-[#777777]"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-[#111111] text-white dark:bg-white dark:text-[#0B0A0D] text-[11px] uppercase tracking-wider rounded-[2px] cursor-pointer font-medium"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* TAB 3: BESPOKE ENGRAVING PLAQUE                              */}
        {/* ------------------------------------------------------------ */}
        {activeTab === 'engraving' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-6">
            
            {/* Minimal Flacon Plaque Simulation */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-8 bg-[#FAFAFA] dark:bg-white/5 rounded-[2px]">
              <div className="relative w-48 h-64 flex items-center justify-center">
                <img
                  src="/images/saudagar_amber_gold.png"
                  alt="Flacon Preview"
                  className="max-h-full w-auto object-contain filter drop-shadow-sm"
                />
                
                <motion.div
                  key={engravingText}
                  initial={{ opacity: 0.7 }}
                  animate={{ opacity: 1 }}
                  className="absolute bottom-10 px-3 py-1 rounded-[1px] bg-[#C4823F] text-white shadow-xs text-center max-w-[120px]"
                >
                  <span className="block text-[8px] font-serif font-bold uppercase tracking-[0.2em] truncate">
                    {engravingText || 'SAUDAGAR'}
                  </span>
                </motion.div>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-[#888888] mt-3 font-light">
                Live Inscription
              </span>
            </div>

            {/* Input & Save */}
            <div className="md:col-span-7 space-y-5">
              <div>
                <h2 className="text-[16px] font-medium text-[#111111] dark:text-white">
                  Default Flacon Plaque
                </h2>
                <p className="text-[12.5px] text-[#777777] dark:text-[#AAAAAA] mt-1 font-light leading-relaxed">
                  Complimentary hand-calligraphy engraving applied to all full-size commissions.
                </p>
              </div>

              <form onSubmit={handleSaveEngraving} className="space-y-4">
                <div>
                  <label className="block text-[10.5px] uppercase tracking-wider text-[#777777] mb-1">
                    Plaque Inscription (Up to 14 characters)
                  </label>
                  <input
                    type="text"
                    maxLength={14}
                    value={engravingText}
                    onChange={(e) => setEngravingText(e.target.value.toUpperCase())}
                    placeholder="A. VERMA"
                    className="w-full max-w-sm px-3.5 py-2.5 border border-[#E0E0E0] dark:border-white/20 rounded-[2px] bg-transparent text-[13px] font-serif tracking-widest uppercase outline-none focus:border-[#111111] dark:focus:border-white"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#111111] text-white dark:bg-white dark:text-[#0B0A0D] text-[11px] uppercase tracking-wider rounded-[2px] cursor-pointer font-medium hover:opacity-90 transition-opacity"
                >
                  Save Inscription
                </button>
              </form>
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* TAB 4: SETTINGS / PREFERENCES                                */}
        {/* ------------------------------------------------------------ */}
        {activeTab === 'settings' && (
          <div className="max-w-xl space-y-8 py-4">
            
            <form onSubmit={handleSaveSettings} className="space-y-5 text-[12.5px]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10.5px] uppercase tracking-wider text-[#777777] mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E0E0E0] dark:border-white/20 rounded-[2px] bg-transparent outline-none focus:border-[#111111] dark:focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] uppercase tracking-wider text-[#777777] mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E0E0E0] dark:border-white/20 rounded-[2px] bg-transparent outline-none focus:border-[#111111] dark:focus:border-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] uppercase tracking-wider text-[#777777] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E0E0E0] dark:border-white/20 rounded-[2px] bg-transparent outline-none focus:border-[#111111] dark:focus:border-white"
                />
              </div>

              <div>
                <label className="block text-[10.5px] uppercase tracking-wider text-[#777777] mb-1">
                  Mobile
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E0E0E0] dark:border-white/20 rounded-[2px] bg-transparent outline-none focus:border-[#111111] dark:focus:border-white"
                />
              </div>

              {/* Currency */}
              <div>
                <label className="block text-[10.5px] uppercase tracking-wider text-[#777777] mb-1.5">
                  Boutique Currency
                </label>
                <div className="flex items-center gap-2">
                  {['INR', 'AED', 'USD', 'EUR', 'GBP', 'SAR'].map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => {
                        if (onChangeCurrency) onChangeCurrency(curr);
                        showToast(`Currency: ${curr}`);
                      }}
                      className={`px-3 py-1.5 text-[11px] font-mono rounded-[2px] transition-colors cursor-pointer ${
                        activeCurrency === curr
                          ? 'bg-[#111111] text-white dark:bg-white dark:text-[#0B0A0D] font-bold'
                          : 'border border-[#E0E0E0] dark:border-white/20 text-[#666666] dark:text-[#AAAAAA] hover:text-[#111111] dark:hover:text-white'
                      }`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#111111] text-white dark:bg-white dark:text-[#0B0A0D] text-[11px] uppercase tracking-wider rounded-[2px] cursor-pointer font-medium hover:opacity-90 transition-opacity"
                >
                  Save Changes
                </button>
              </div>
            </form>

          </div>
        )}

      </main>

    </div>
  );
}
