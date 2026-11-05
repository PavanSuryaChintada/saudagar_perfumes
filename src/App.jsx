import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import BluorngAnnouncementBar from './components/BluorngAnnouncementBar.jsx';
import BluorngHeader from './components/BluorngHeader.jsx';
import BluorngHome from './components/BluorngHome.jsx';
import BluorngPDP from './components/BluorngPDP.jsx';
import BluorngCollectionPage from './components/BluorngCollectionPage.jsx';
import BluorngFooter from './components/BluorngFooter.jsx';
import BluorngMobileBottomNav from './components/BluorngMobileBottomNav.jsx';
import BluorngStoryViewer from './components/BluorngStoryViewer.jsx';
import BluorngCartDrawer from './components/BluorngCartDrawer.jsx';
import BluorngSearchModal from './components/BluorngSearchModal.jsx';
import BluorngQuickBuyModal from './components/BluorngQuickBuyModal.jsx';
import BluorngCheckoutModal from './components/BluorngCheckoutModal.jsx';
import BluorngNavDrawer from './components/BluorngNavDrawer.jsx';
import Toast from './components/Toast.jsx';

// Luxury Motion System
import LuxuryPreloader from './components/motion/LuxuryPreloader.jsx';
import PageTransition from './components/motion/PageTransition.jsx';
import { useSmoothScroll } from './components/motion/SmoothScrollProvider.jsx';

import {
  ALL_PRODUCTS,
  getStoredCurrency,
  setStoredCurrency,
  getStoredCart,
  setStoredCart,
  getStoredWishlist,
  setStoredWishlist
} from './data/bluorngSaudagarData.js';
import { resolveCollectionTheme } from './data/collectionThemes.js';

export default function App() {
  // Navigation State: 'home' | 'product' | 'collection'
  const [view, setView] = useState('home');
  const [selectedProductId, setSelectedProductId] = useState('saudagar-thunderstruck-oud');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Global State
  const [activeCurrency, setActiveCurrency] = useState(getStoredCurrency());
  const [cart, setCart] = useState(getStoredCart());
  const [wishlist, setWishlist] = useState(getStoredWishlist());

  // Theme State: 'dark' (Noir Obsidian Luxury) | 'light' (Editorial Clean Canvas)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('saudagar_theme') || 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
    localStorage.setItem('saudagar_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      triggerToast(nextTheme === 'dark' ? 'Switched to Noir Obsidian Theme' : 'Switched to Editorial Light Theme');
      return nextTheme;
    });
  };

  // Modals & Overlays State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);
  const [quickBuyProduct, setQuickBuyProduct] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3200);
  };

  // URL Sync supporting both /collections/:slug and ?collection=:slug
  useEffect(() => {
    const handleUrl = () => {
      const pathname = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const prodId = params.get('id');
      const cat = params.get('collection');

      // Product route check
      if (pathname.startsWith('/product/')) {
        const pId = pathname.replace('/product/', '').replace(/\/$/, '');
        if (ALL_PRODUCTS.some((p) => p.id === pId)) {
          setSelectedProductId(pId);
          setView('product');
          return;
        }
      }

      if (prodId && ALL_PRODUCTS.some((p) => p.id === prodId)) {
        setSelectedProductId(prodId);
        setView('product');
        return;
      }

      // Dedicated collection routes (/collections/signature, /collections/royal, /collections/exotic)
      if (pathname.startsWith('/collections/')) {
        const colSlug = pathname.replace('/collections/', '').replace(/\/$/, '');
        setSelectedCategory(colSlug || 'signature');
        setView('collection');
        return;
      }

      if (cat) {
        setSelectedCategory(cat);
        setView('collection');
        return;
      }

      // Root path
      setView('home');
    };

    handleUrl();
    window.addEventListener('popstate', handleUrl);
    return () => window.removeEventListener('popstate', handleUrl);
  }, []);

  // Dynamic Themed Title Update
  useEffect(() => {
    if (view === 'product') {
      const prod = ALL_PRODUCTS.find((p) => p.id === selectedProductId);
      if (prod) {
        document.title = `${prod.name} | SAUDAGAR PERFUMES · Haute Parfumerie`;
      }
    } else if (view === 'collection') {
      const currentTheme = resolveCollectionTheme(selectedCategory);
      document.title = `${currentTheme.name.toUpperCase()} · ${currentTheme.headline} | SAUDAGAR PERFUMES`;
    } else {
      document.title = 'SAUDAGAR PERFUMES | Haute Parfumerie & Artisanal Fragrances';
    }
  }, [view, selectedProductId, selectedCategory]);

  const { scrollTo } = useSmoothScroll();

  // Navigation Handlers
  const navigateToProduct = (id) => {
    setSelectedProductId(id);
    setView('product');
    const newUrl = `/product/${id}`;
    window.history.pushState({ id }, '', newUrl);
    scrollTo(0, { duration: 0.85 });
  };

  const navigateToHome = () => {
    setView('home');
    window.history.pushState({}, '', '/');
    scrollTo(0, { duration: 0.85 });
  };

  const navigateToCollection = (categorySlug = 'signature') => {
    let target = categorySlug;
    if (categorySlug === 'all') target = 'signature';
    setSelectedCategory(target);
    setView('collection');
    const newUrl = `/collections/${target}`;
    window.history.pushState({ categorySlug: target }, '', newUrl);
    scrollTo(0, { duration: 0.85 });
  };

  const scrollToStores = () => {
    triggerToast('Private Boutique Concierge: Delhi, Mumbai & Dubai salons available by appointment.');
  };

  // Currency Handler
  const handleCurrencyChange = (newCurr) => {
    setActiveCurrency(newCurr);
    setStoredCurrency(newCurr);
    triggerToast(`Currency updated to ${newCurr}.`);
  };

  // Wishlist Handler
  const handleToggleWishlist = (productId) => {
    setWishlist((prevList) => {
      let updated;
      if (prevList.includes(productId)) {
        updated = prevList.filter((id) => id !== productId);
        triggerToast('Removed from your saved Wishlist.');
      } else {
        updated = [...prevList, productId];
        triggerToast('Saved to your Wishlist.');
      }
      setStoredWishlist(updated);
      return updated;
    });
  };

  // Cart Handlers
  const handleAddToCart = (item) => {
    setCart((prevCart) => {
      const existing = prevCart.find(
        (i) =>
          i.productId === item.productId &&
          i.size === item.size &&
          i.engraving === (item.engraving || '')
      );
      let updated;
      if (existing) {
        updated = prevCart.map((i) =>
          i === existing ? { ...i, quantity: i.quantity + (item.quantity || 1) } : i
        );
      } else {
        updated = [...prevCart, { ...item, quantity: item.quantity || 1 }];
      }
      setStoredCart(updated);
      return updated;
    });

    const prod = ALL_PRODUCTS.find((p) => p.id === item.productId);
    triggerToast(`${prod ? prod.name : 'Fragrance'} added to your bag.`);
    setIsCartOpen(true);
  };

  const handleBuyNow = (item) => {
    handleAddToCart(item);
    setIsCartOpen(false);
    const prod = ALL_PRODUCTS.find((p) => p.id === item.productId);
    const price = item.price || (prod ? prod.price : 5500);
    const total = price * (item.quantity || 1);
    setCheckoutData({
      items: [item],
      subtotal: total,
      discount: 0,
      total,
      note: ''
    });
  };

  const handleUpdateQuantity = (index, delta) => {
    setCart((prevCart) => {
      const updated = [...prevCart];
      if (updated[index]) {
        updated[index].quantity += delta;
        if (updated[index].quantity <= 0) {
          updated.splice(index, 1);
        }
      }
      setStoredCart(updated);
      return updated;
    });
  };

  const handleRemoveItem = (index) => {
    setCart((prevCart) => {
      const updated = prevCart.filter((_, i) => i !== index);
      setStoredCart(updated);
      return updated;
    });
    triggerToast('Item removed from your bag.');
  };

  const handleOrderSuccess = (orderInfo) => {
    setCart([]);
    setStoredCart([]);
    triggerToast(`Order ${orderInfo.orderId} confirmed! Check your email.`);
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <div className="min-h-screen bg-[#FFFFFF] dark:bg-[#0B0A0D] text-[#111111] dark:text-[#FFFFFF] flex flex-col font-sans selection:bg-[#C4823F] selection:text-white transition-colors duration-300">
      {/* Toast Notification */}
      <Toast message={toastMessage} />

      {/* 1. MAIN HEADER (Logo, mega menu, search, story, stores, cart badge, theme toggle) */}
      <BluorngHeader
        isHomePage={view === 'home'}
        cartCount={totalCartCount}
        wishlistCount={wishlist.length}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenStory={() => setIsStoryOpen(true)}
        onOpenNavDrawer={() => setIsNavDrawerOpen(true)}
        onNavigateHome={navigateToHome}
        onNavigateCollection={navigateToCollection}
        onScrollToStores={scrollToStores}
        onOpenAccount={() => alert('Customer Account: Welcome to Saudagar VIP Privileges. Logged in as VIP Client.')}
      />

      {/* Luxury Branded Preloader */}
      <LuxuryPreloader />

      {/* 3. MAIN PAGE CONTENT VIEW WITH LUXURY ROUTE TRANSITIONS */}
      <main className="flex-1">
        <PageTransition routeKey={view === 'product' ? `product-${selectedProductId}` : view === 'collection' ? `collection-${selectedCategory}` : 'home'}>
          {view === 'product' ? (
            <BluorngPDP
              productId={selectedProductId}
              activeCurrency={activeCurrency}
              onSelectProduct={navigateToProduct}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              onNavigateHome={navigateToHome}
              onNavigateCollection={navigateToCollection}
            />
          ) : view === 'collection' ? (
            <BluorngCollectionPage
              initialCategory={selectedCategory}
              activeCurrency={activeCurrency}
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
              onSelectProduct={navigateToProduct}
              onQuickBuy={(prod) => setQuickBuyProduct(prod)}
              onNavigateHome={navigateToHome}
              onNavigateCollection={navigateToCollection}
              onOpenStory={() => setIsStoryOpen(true)}
            />
          ) : (
            <BluorngHome
              activeCurrency={activeCurrency}
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
              onSelectProduct={navigateToProduct}
              onQuickBuy={(prod) => setQuickBuyProduct(prod)}
              onNavigateCollection={navigateToCollection}
              onSelectCategory={(cat) => navigateToCollection(cat)}
              onScrollToStores={scrollToStores}
              onOpenStory={() => setIsStoryOpen(true)}
            />
          )}
        </PageTransition>
      </main>

      {/* 4. MASTER LUXURY FOOTER (Links, newsletter, currency, massive SAUDAGAR brand wordmark) */}
      <BluorngFooter
        activeCurrency={activeCurrency}
        onCurrencyChange={handleCurrencyChange}
        theme={theme}
        onToggleTheme={toggleTheme}
        onNavigateHome={navigateToHome}
        onNavigateCollection={navigateToCollection}
        onScrollToStores={scrollToStores}
        onOpenStory={() => setIsStoryOpen(true)}
      />

      {/* 5. MOBILE BOTTOM NAVIGATION (Explore, Account, Stories, Boutiques, Bag) */}
      <BluorngMobileBottomNav
        cartCount={totalCartCount}
        theme={theme}
        onToggleTheme={toggleTheme}
        onNavigateHome={navigateToHome}
        onNavigateCollection={navigateToCollection}
        onScrollToStores={scrollToStores}
        onOpenStory={() => setIsStoryOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAccount={() => alert('Customer Account: Welcome to Saudagar VIP Privileges.')}
      />

      {/* ================= GLOBAL OVERLAYS & MODALS ================= */}

      {/* Stories Viewer Modal */}
      <BluorngStoryViewer
        isOpen={isStoryOpen}
        onClose={() => setIsStoryOpen(false)}
        onSelectProduct={navigateToProduct}
      />

      {/* Cart Drawer */}
      <BluorngCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        activeCurrency={activeCurrency}
        onProceedToCheckout={(data) => {
          setCheckoutData(data);
        }}
      />

      {/* Search Modal */}
      <BluorngSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProduct={navigateToProduct}
        activeCurrency={activeCurrency}
      />

      {/* Quick Buy Size Modal (Triggered by "+" on Product Cards) */}
      <AnimatePresence>
        {quickBuyProduct && (
          <BluorngQuickBuyModal
            key="quick-buy-modal"
            product={quickBuyProduct}
            activeCurrency={activeCurrency}
            onClose={() => setQuickBuyProduct(null)}
            onAddToCart={handleAddToCart}
          />
        )}
      </AnimatePresence>

      {/* Full Checkout Journey Modal */}
      {checkoutData && (
        <BluorngCheckoutModal
          isOpen={Boolean(checkoutData)}
          checkoutData={checkoutData}
          activeCurrency={activeCurrency}
          onClose={() => setCheckoutData(null)}
          onOrderSuccess={handleOrderSuccess}
        />
      )}

      {/* Side Navigation Drawer */}
      <BluorngNavDrawer
        isOpen={isNavDrawerOpen}
        onClose={() => setIsNavDrawerOpen(false)}
        activeCurrency={activeCurrency}
        onCurrencyChange={handleCurrencyChange}
        theme={theme}
        onToggleTheme={toggleTheme}
        onNavigateHome={navigateToHome}
        onNavigateCollection={navigateToCollection}
        onScrollToStores={scrollToStores}
        onOpenStory={() => {
          setIsNavDrawerOpen(false);
          setIsStoryOpen(true);
        }}
        onOpenAccount={() => {
          setIsNavDrawerOpen(false);
          alert('Customer Account: Welcome to Saudagar VIP Privileges.');
        }}
      />
    </div>
  );
}
