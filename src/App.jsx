import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
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
import BluorngCheckoutPage from './components/BluorngCheckoutPage.jsx';
import BluorngNavDrawer from './components/BluorngNavDrawer.jsx';
import BluorngWishlistPage from './components/BluorngWishlistPage.jsx';
import BluorngAccountPage from './components/BluorngAccountPage.jsx';
import BluorngStoryPage from './components/BluorngStoryPage.jsx';
import Toast from './components/Toast.jsx';
import { playSound } from './utils/sound.js';
import { flyToCart } from './utils/flyToCart.js';

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
import { resolveStorefrontView, AUTH_VIEWS } from './app/routes';
import { useAuth } from './lib/auth';
import LoginPage from './storefront/auth/LoginPage';
import RegisterPage from './storefront/auth/RegisterPage';
import ForgotPasswordPage from './storefront/auth/ForgotPasswordPage';
import ResetPasswordPage from './storefront/auth/ResetPasswordPage';
import NotFoundPage from './storefront/NotFoundPage';

const productExists = (id) => ALL_PRODUCTS.some((p) => p.id === id);

export default function App() {
  // The URL is the source of truth for which page is showing (src/app/routes.ts).
  const location = useLocation();
  const routerNavigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const resolved = resolveStorefrontView(location.pathname, location.search, productExists);
  const view = resolved.view;
  const selectedProductId = resolved.productId || 'saudagar-deep-canopy';
  const selectedCategory = resolved.collectionSlug || 'signature';
  const isAuthView = AUTH_VIEWS.includes(view);
  const needsSignIn = view === 'account' || view === 'checkout';

  // Global State
  const [activeCurrency, setActiveCurrency] = useState(getStoredCurrency());
  const [cart, setCart] = useState(getStoredCart());
  const [wishlist, setWishlist] = useState(getStoredWishlist());

  // Theme State: 'light' (Editorial Clean Canvas) | 'dark' (Noir Obsidian Luxury)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('saudagar_theme_mode') || 'light';
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
    localStorage.setItem('saudagar_theme_mode', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      triggerToast(nextTheme === 'dark' ? 'Switched to Noir Obsidian Theme' : 'Switched to Editorial Light Theme', 'theme');
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

  // Luxury Preloader State: plays smoothly on initial site entry / reload
  const [isPreloaderDone, setIsPreloaderDone] = useState(false);

  // Global Keyboard Shortcut: Cmd+K / Ctrl+K toggles luxury search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Toast State
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg, sound) => {
    if (sound) playSound(sound);
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3200);
  };

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
    } else if (view === 'wishlist') {
      document.title = 'SAVED FRAGRANCES | SAUDAGAR PERFUMES';
    } else if (view === 'story') {
      document.title = 'THE MAISON & COMPLETE BRAND JOURNEY | SAUDAGAR PERFUMES';
    } else if (view === 'account') {
      document.title = 'CONNOISSEUR ACCOUNT & PROFILE | SAUDAGAR PERFUMES';
    } else if (view === 'checkout') {
      document.title = 'SECURE CHECKOUT | SAUDAGAR PERFUMES · Haute Parfumerie';
    } else if (view === 'login') {
      document.title = 'SIGN IN | SAUDAGAR PERFUMES';
    } else if (view === 'register') {
      document.title = 'CREATE ACCOUNT | SAUDAGAR PERFUMES';
    } else if (view === 'forgot-password' || view === 'reset-password') {
      document.title = 'RESET PASSWORD | SAUDAGAR PERFUMES';
    } else if (view === 'notfound') {
      document.title = 'PAGE NOT FOUND | SAUDAGAR PERFUMES';
    } else {
      document.title = 'SAUDAGAR PERFUMES | Haute Parfumerie & Artisanal Fragrances';
    }
  }, [view, selectedProductId, selectedCategory]);

  const { scrollTo } = useSmoothScroll();

  // Fast instant scroll reset helper
  const resetScrollToTop = () => {
    window.scrollTo(0, 0);
    if (window.__lenis) {
      window.__lenis.scrollTo(0, { immediate: true });
    }
  };

  // Idle preloader for key collection and product flacon images
  useEffect(() => {
    const preloadHeroImages = () => {
      const topProducts = ALL_PRODUCTS.slice(0, 8);
      topProducts.forEach((p) => {
        const imgs = p.images || (p.image ? [p.image] : []);
        imgs.forEach((src) => {
          const img = new Image();
          img.src = src;
        });
      });
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(preloadHeroImages, { timeout: 1500 });
    } else {
      setTimeout(preloadHeroImages, 300);
    }
  }, []);

  // Navigation Handlers
  const navigateToProduct = (id) => {
    routerNavigate(`/product/${id}`);
    resetScrollToTop();
  };

  const navigateToHome = () => {
    routerNavigate('/');
    resetScrollToTop();
  };

  const navigateToWishlist = () => {
    routerNavigate('/wishlist');
    resetScrollToTop();
  };

  const navigateToAccount = () => {
    playSound('nav');
    routerNavigate('/account');
    resetScrollToTop();
  };

  const navigateToStory = () => {
    playSound('nav');
    routerNavigate('/story');
    resetScrollToTop();
  };

  const navigateToCheckout = (data = null) => {
    if (data) {
      setCheckoutData(data);
    }
    setIsCartOpen(false);
    routerNavigate('/checkout');
    resetScrollToTop();
  };

  const navigateToCollection = (categorySlug = 'signature') => {
    if (categorySlug === 'wishlist') {
      navigateToWishlist();
      return;
    }
    let target = categorySlug;
    if (categorySlug === 'all') target = 'signature';
    const wasInCollection = view === 'collection';
    routerNavigate(`/collections/${target}`);
    if (!wasInCollection) {
      resetScrollToTop();
    }
  };

  const scrollToStores = () => {
    triggerToast('Private Boutique Concierge: Delhi, Mumbai & Dubai salons available by appointment.');
  };

  // Currency Handler
  const handleCurrencyChange = (newCurr) => {
    setActiveCurrency(newCurr);
    setStoredCurrency(newCurr);
    triggerToast(`Currency updated to ${newCurr}.`, 'currency');
  };

  // Wishlist Handler
  const handleToggleWishlist = (productId) => {
    setWishlist((prevList) => {
      let updated;
      if (prevList.includes(productId)) {
        updated = prevList.filter((id) => id !== productId);
        triggerToast('Removed from your saved Wishlist.', 'remove');
      } else {
        updated = [...prevList, productId];
        triggerToast('Saved to your Wishlist.', 'wishlist');
      }
      setStoredWishlist(updated);
      return updated;
    });
  };

  // Cart Handlers
  const handleAddToCart = (item, { openCart = true } = {}) => {
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
    const productImage = prod ? prod.images?.[0] || prod.image : null;

    triggerToast(`${prod ? prod.name : 'Fragrance'} added to your bag.`);

    // Product flies into the bag; the bag chime plays as it lands, then the drawer opens
    flyToCart({
      src: productImage,
      onLand: () => {
        playSound('bag');
        if (openCart) setIsCartOpen(true);
      }
    });
  };

  const handleBuyNow = (item) => {
    handleAddToCart(item, { openCart: false });
    setIsCartOpen(false);
    const prod = ALL_PRODUCTS.find((p) => p.id === item.productId);
    const price = item.price || (prod ? prod.price : 5500);
    const total = price * (item.quantity || 1);
    navigateToCheckout({
      items: [item],
      subtotal: total,
      discount: 0,
      total,
      note: ''
    });
  };

  const handleUpdateQuantity = (index, delta) => {
    playSound('tap');
    setCart((prevCart) => {
      const target = prevCart[index];
      if (!target) return prevCart;

      // Pure update (no mutation): React StrictMode runs updaters twice in development
      const newQuantity = target.quantity + delta;
      const updated =
        newQuantity <= 0
          ? prevCart.filter((_, i) => i !== index)
          : prevCart.map((item, i) => (i === index ? { ...item, quantity: newQuantity } : item));

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
    triggerToast('Item removed from your bag.', 'remove');
  };

  const handleOrderSuccess = (orderInfo) => {
    setCart([]);
    setStoredCart([]);
    triggerToast(`Order ${orderInfo.orderId} confirmed! Check your email.`, 'success');
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (resolved.redirectTo) {
    return <Navigate to={resolved.redirectTo} replace />;
  }
  if (needsSignIn && !authLoading && !user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  if (needsSignIn && authLoading) {
    return <div className="min-h-screen bg-white dark:bg-[#0B0A0D]" aria-busy="true" />;
  }
  if (isAuthView) {
    return (
      <>
        {view === 'login' && <LoginPage />}
        {view === 'register' && <RegisterPage />}
        {view === 'forgot-password' && <ForgotPasswordPage />}
        {view === 'reset-password' && <ResetPasswordPage />}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] dark:bg-[#0B0A0D] text-[#111111] dark:text-[#FFFFFF] flex flex-col font-sans selection:bg-[#C4823F] dark:selection:bg-[#D4AF37] dark:selection:text-[#0B0A0D] selection:text-white transition-colors duration-300">
      {/* Toast Notification */}
      <Toast message={toastMessage} />

      {/* 1. MAIN HEADER (Logo, mega menu, search, story, stores, cart badge, theme toggle) */}
      {view !== 'product' && view !== 'checkout' && view !== 'account' && view !== 'story' && (
        <BluorngHeader
          isHomePage={view === 'home'}
          cartCount={totalCartCount}
          wishlistCount={wishlist.length}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenStory={navigateToStory}
          onOpenNavDrawer={() => setIsNavDrawerOpen(true)}
          onNavigateHome={navigateToHome}
          onNavigateCollection={navigateToCollection}
          onScrollToStores={scrollToStores}
          onOpenAccount={navigateToAccount}
        />
      )}

      {/* Luxury Branded Preloader (runs smoothly on initial application mount / reload) */}
      {!isPreloaderDone && (
        <LuxuryPreloader onComplete={() => setIsPreloaderDone(true)} />
      )}

      {/* 3. MAIN PAGE CONTENT VIEW WITH LUXURY ROUTE TRANSITIONS */}
      <main className="flex-1">
        <PageTransition routeKey={view === 'product' ? `product-${selectedProductId}` : view === 'collection' ? 'collection' : view === 'wishlist' ? 'wishlist' : view === 'checkout' ? 'checkout' : view === 'account' ? 'account' : view === 'story' ? 'story' : 'home'}>
          {view === 'checkout' ? (
            <BluorngCheckoutPage
              cart={cart}
              checkoutData={checkoutData}
              activeCurrency={activeCurrency}
              theme={theme}
              onToggleTheme={toggleTheme}
              onNavigateHome={navigateToHome}
              onNavigateCollection={navigateToCollection}
              onOrderSuccess={handleOrderSuccess}
              onClearCart={() => setCart([])}
            />
          ) : view === 'story' ? (
            <BluorngStoryPage
              theme={theme}
              onToggleTheme={toggleTheme}
              onNavigateHome={navigateToHome}
              onNavigateCollection={navigateToCollection}
            />
          ) : view === 'account' ? (
            <BluorngAccountPage
              activeCurrency={activeCurrency}
              onChangeCurrency={handleCurrencyChange}
              theme={theme}
              onToggleTheme={toggleTheme}
              onNavigateHome={navigateToHome}
              onNavigateCollection={navigateToCollection}
              onSelectProduct={navigateToProduct}
            />
          ) : view === 'wishlist' ? (
            <BluorngWishlistPage
              wishlist={wishlist}
              activeCurrency={activeCurrency}
              onToggleWishlist={handleToggleWishlist}
              onSelectProduct={navigateToProduct}
              onQuickBuy={(prod) => setQuickBuyProduct(prod)}
              onNavigateCollection={navigateToCollection}
            />
          ) : view === 'product' ? (
            <BluorngPDP
              productId={selectedProductId}
              activeCurrency={activeCurrency}
              cartCount={totalCartCount}
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
              theme={theme}
              onToggleTheme={toggleTheme}
              onOpenCart={() => setIsCartOpen(true)}
              onOpenSearch={() => setIsSearchOpen(true)}
              onOpenStory={navigateToStory}
              onOpenNavDrawer={() => setIsNavDrawerOpen(true)}
              onSelectProduct={navigateToProduct}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              onNavigateHome={navigateToHome}
              onNavigateCollection={navigateToCollection}
            />
          ) : view === 'notfound' ? (
            <NotFoundPage onNavigateHome={navigateToHome} onNavigateCollection={navigateToCollection} />
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
              onOpenStory={navigateToStory}
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
              onOpenStory={navigateToStory}
            />
          )}
        </PageTransition>
      </main>

      {/* 4. MASTER LUXURY FOOTER (Links, newsletter, currency, massive SAUDAGAR brand wordmark) */}
      {view !== 'checkout' && view !== 'account' && view !== 'story' && (
        <BluorngFooter
          activeCurrency={activeCurrency}
          onCurrencyChange={handleCurrencyChange}
          theme={theme}
          onToggleTheme={toggleTheme}
          onNavigateHome={navigateToHome}
          onNavigateCollection={navigateToCollection}
          onScrollToStores={scrollToStores}
          onOpenStory={navigateToStory}
        />
      )}

      {/* 5. MOBILE BOTTOM NAVIGATION (Explore, Account, Stories, Boutiques, Bag) */}
      {view !== 'checkout' && (
        <BluorngMobileBottomNav
          cartCount={totalCartCount}
          theme={theme}
          onToggleTheme={toggleTheme}
          onNavigateHome={navigateToHome}
          onNavigateCollection={navigateToCollection}
          onScrollToStores={scrollToStores}
          onOpenStory={() => setIsStoryOpen(true)}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenAccount={navigateToAccount}
        />
      )}

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
          navigateToCheckout(data);
        }}
      />

      {/* Search Modal */}
      <BluorngSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProduct={navigateToProduct}
        activeCurrency={activeCurrency}
        wishlist={wishlist}
        onToggleWishlist={handleToggleWishlist}
      />

      {/* Quick Buy Size Modal (Triggered by "+" on Product Cards) */}
      <AnimatePresence>
        {quickBuyProduct && (
          <BluorngQuickBuyModal
            key="quick-buy-modal"
            product={quickBuyProduct}
            activeCurrency={activeCurrency}
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
            onClose={() => setQuickBuyProduct(null)}
            onAddToCart={handleAddToCart}
            onViewDetails={(productId) => {
              setQuickBuyProduct(null);
              navigateToProduct(productId);
            }}
          />
        )}
      </AnimatePresence>

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
          navigateToStory();
        }}
        onOpenAccount={() => {
          setIsNavDrawerOpen(false);
          navigateToAccount();
        }}
      />
    </div>
  );
}
