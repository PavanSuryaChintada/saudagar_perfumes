import React, { useState, useEffect, useCallback } from 'react';
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
import CheckoutPage from './storefront/checkout/CheckoutPage.jsx';
import OrderPage from './storefront/orders/OrderPage.jsx';
import { useCartSync } from './storefront/bag/useQuote';
import { useWishlistSync } from './storefront/wishlistSync';
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
  getStoredCart,
  setStoredCart,
  getStoredWishlist,
  setStoredWishlist,
  getStoredSamples,
  setStoredSamples,
  getStoredNote,
  setStoredNote,
  getStoredCoupon,
  setStoredCoupon
} from './lib/localStore';
import { resolveStorefrontView, AUTH_VIEWS } from './app/routes';
import { useAuth } from './lib/auth';
import { useBlock } from './cms/useSite';
import { resolveLink } from './cms/links';
import { initAnalytics, track, trackPageView } from './lib/analytics';
import { useSetting } from './lib/bootstrap';
import LoginPage from './storefront/auth/LoginPage';
import RegisterPage from './storefront/auth/RegisterPage';
import ForgotPasswordPage from './storefront/auth/ForgotPasswordPage';
import ResetPasswordPage from './storefront/auth/ResetPasswordPage';
import NotFoundPage from './storefront/NotFoundPage';
import ListingPage from './storefront/ListingPage.jsx';
import NotesIndexPage from './storefront/NotesIndexPage.jsx';
import CmsPage from './storefront/CmsPage.jsx';
import { StorefrontProvider } from './cms/StorefrontContext';

export default function App() {
  // The URL is the source of truth for which page is showing (src/app/routes.ts).
  const location = useLocation();
  const routerNavigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const brandBlock = useBlock('brand');
  const resolved = resolveStorefrontView(location.pathname, location.search);
  const view = resolved.view;
  const selectedProductId = resolved.productId || 'saudagar-deep-canopy';
  const selectedCategory = resolved.collectionSlug || 'signature';
  const isAuthView = AUTH_VIEWS.includes(view);
  const needsSignIn = view === 'account' || view === 'checkout' || view === 'order';

  // Global State
  const [cart, setCart] = useState(() => getStoredCart().filter((i) => i && i.variantId));
  const [samples, setSamplesState] = useState(getStoredSamples);
  const [bagNote, setBagNoteState] = useState(getStoredNote);
  const setSamples = useCallback((next) => {
    setSamplesState(next);
    setStoredSamples(next);
  }, []);
  const setBagNote = useCallback((next) => {
    setBagNoteState(next);
    setStoredNote(next);
  }, []);
  const [couponCode, setCouponCodeState] = useState(getStoredCoupon);
  const setCouponCode = useCallback((next) => {
    setCouponCodeState(next || '');
    setStoredCoupon(next || '');
  }, []);
  const replaceCart = useCallback((next) => {
    setCart(next);
    setStoredCart(next);
  }, []);
  useCartSync(cart, replaceCart, samples, setSamples);
  const ga4Id = useSetting('analytics.ga4_id', '');
  const gtmId = useSetting('analytics.gtm_id', '');
  useEffect(() => {
    initAnalytics(ga4Id, gtmId);
  }, [ga4Id, gtmId]);
  useEffect(() => {
    const t = setTimeout(() => trackPageView(location.pathname, document.title), 300);
    return () => clearTimeout(t);
  }, [location.pathname, ga4Id, gtmId]);
  const [wishlist, setWishlist] = useState(getStoredWishlist());
  useWishlistSync(wishlist, (next) => {
    setWishlist(next);
    setStoredWishlist(next);
  });

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
    if (view === 'product' || view === 'collection' || view === 'listing') {
      // These pages set their own title once their data has loaded.
    } else if (view === 'notes') {
      document.title = 'FRAGRANCE NOTES | SAUDAGAR PERFUMES';
    } else if (view === 'wishlist') {
      document.title = 'SAVED FRAGRANCES | SAUDAGAR PERFUMES';
    } else if (view === 'story') {
      document.title = 'THE MAISON & COMPLETE BRAND JOURNEY | SAUDAGAR PERFUMES';
    } else if (view === 'order') {
      document.title = 'YOUR ORDER | SAUDAGAR PERFUMES';
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
    }
    // Home and CMS pages set their own title and meta tags (Admin → Pages / Site content → SEO).
  }, [view, selectedProductId, selectedCategory]);

  const { scrollTo } = useSmoothScroll();

  // Fast instant scroll reset helper
  const resetScrollToTop = () => {
    window.scrollTo(0, 0);
    if (window.__lenis) {
      window.__lenis.scrollTo(0, { immediate: true });
    }
  };

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

  const navigateToCheckout = () => {
    setIsCartOpen(false);
    routerNavigate('/checkout');
    resetScrollToTop();
  };

  const navigateToCollection = (categorySlug = 'signature') => {
    if (categorySlug === 'wishlist') {
      navigateToWishlist();
      return;
    }
    if (categorySlug === 'all' || categorySlug === 'shop') {
      // Admin → Site content → Brand → "Shop all" buttons go to (defaults to every product).
      const shopLink = resolveLink(brandBlock?.shop_link);
      if (shopLink?.external) window.open(shopLink.href, '_blank', 'noopener,noreferrer');
      else routerNavigate(shopLink?.href || '/shop');
      resetScrollToTop();
      return;
    }
    const target = categorySlug;
    const wasInCollection = view === 'collection';
    routerNavigate(`/collections/${target}`);
    if (!wasInCollection) {
      resetScrollToTop();
    }
  };

  // Boutiques live on the "boutiques" page (Admin → Pages). Until Brand → "Show boutiques" is on,
  // the concierge message from the Brand block is shown instead.
  const scrollToStores = () => {
    if (brandBlock?.show_boutiques) {
      routerNavigate('/pages/boutiques');
      resetScrollToTop();
    } else if (brandBlock?.boutiques_message) {
      triggerToast(brandBlock.boutiques_message);
    }
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
          (item.variantId ? i.variantId === item.variantId : i.productId === item.productId && i.size === item.size)
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

    track('add_to_cart', { value: (Number(item.price) || 0) * (item.quantity || 1), items: [{ item_id: item.productId, item_name: item.name, item_variant: item.size, price: Number(item.price) || 0, quantity: item.quantity || 1 }] });
    const productImage = item.image || null;

    triggerToast(`${item.name || 'Fragrance'} added to your bag.`);

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
    navigateToCheckout();
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

  const handleOrderPlaced = (order, query = 'placed=1') => {
    if (query === 'placed=1') track('purchase', { transaction_id: order.order_number, value: Number(order.total) || 0 });
    replaceCart([]);
    setSamples([]);
    setBagNote('');
    setCouponCode('');
    routerNavigate(`/orders/${order.id}?${query}`, { replace: true });
    resetScrollToTop();
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Shop actions every CMS section can use (product cards, reels, stories, boutiques).
  const storefrontActions = {
    wishlist,
    onToggleWishlist: handleToggleWishlist,
    onSelectProduct: navigateToProduct,
    onQuickBuy: (prod) => setQuickBuyProduct(prod),
    onOpenStory: () => setIsStoryOpen(true),
    onScrollToStores: scrollToStores,
    onNavigateCollection: navigateToCollection,
  };

  if (resolved.redirectTo) {
    return <Navigate to={resolved.redirectTo} replace />;
  }
  if (needsSignIn && !authLoading && !user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  if (needsSignIn && authLoading) {
    return <div className="min-h-screen bg-white dark:bg-tk-night" aria-busy="true" />;
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
    <StorefrontProvider value={storefrontActions}>
    <div className="min-h-screen bg-[#FFFFFF] dark:bg-tk-night text-tk-ink dark:text-[#FFFFFF] flex flex-col font-sans selection:bg-tk-accent dark:selection:bg-tk-gold dark:selection:text-tk-night selection:text-white transition-colors duration-300">
      {/* Toast Notification */}
      <Toast message={toastMessage} />

      {/* 1. MAIN HEADER (Logo, mega menu, search, story, stores, cart badge, theme toggle) */}
      {view !== 'product' && view !== 'checkout' && view !== 'account' && view !== 'order' && view !== 'story' && (
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
      {!isPreloaderDone && brandBlock?.show_preloader !== false && (
        <LuxuryPreloader onComplete={() => setIsPreloaderDone(true)} />
      )}

      {/* 3. MAIN PAGE CONTENT VIEW WITH LUXURY ROUTE TRANSITIONS */}
      <main className="flex-1">
        <PageTransition routeKey={view === 'product' ? `product-${selectedProductId}` : view === 'collection' ? 'collection' : `${view}:${location.pathname}`}>
          {view === 'checkout' ? (
            <CheckoutPage
              cart={cart}
              samples={samples}
              onSamplesChange={setSamples}
              note={bagNote}
              onNoteChange={setBagNote}
              couponCode={couponCode}
              onCouponChange={setCouponCode}
              theme={theme}
              onToggleTheme={toggleTheme}
              onNavigateHome={navigateToHome}
              onNavigateCollection={navigateToCollection}
              onOpenBag={() => setIsCartOpen(true)}
              onOrderPlaced={handleOrderPlaced}
            />
          ) : view === 'story' ? (
            <BluorngStoryPage
              theme={theme}
              onToggleTheme={toggleTheme}
              onNavigateHome={navigateToHome}
              onNavigateCollection={navigateToCollection}
            />
          ) : view === 'order' ? (
            <OrderPage orderId={resolved.orderId} theme={theme} onToggleTheme={toggleTheme} onNavigateHome={navigateToHome} />
          ) : view === 'account' ? (
            <BluorngAccountPage
              theme={theme}
              onToggleTheme={toggleTheme}
              onNavigateHome={navigateToHome}
              onNavigateCollection={navigateToCollection}
              onSelectProduct={navigateToProduct}
            />
          ) : view === 'wishlist' ? (
            <BluorngWishlistPage
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
              onSelectProduct={navigateToProduct}
              onQuickBuy={(prod) => setQuickBuyProduct(prod)}
              onNavigateCollection={navigateToCollection}
            />
          ) : view === 'product' ? (
            <BluorngPDP
              productId={selectedProductId}
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
              onQuickBuy={(prod) => setQuickBuyProduct(prod)}
              onNavigateHome={navigateToHome}
              onNavigateCollection={navigateToCollection}
            />
          ) : view === 'listing' ? (
            <ListingPage
              listing={resolved.listing}
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
              onSelectProduct={navigateToProduct}
              onQuickBuy={(prod) => setQuickBuyProduct(prod)}
              onNavigateHome={navigateToHome}
              onNavigateCollection={navigateToCollection}
            />
          ) : view === 'page' ? (
            <CmsPage slug={resolved.pageSlug} onNavigateHome={navigateToHome} onNavigateCollection={navigateToCollection} />
          ) : view === 'notes' ? (
            <NotesIndexPage />
          ) : view === 'notfound' ? (
            <NotFoundPage onNavigateHome={navigateToHome} onNavigateCollection={navigateToCollection} />
          ) : view === 'collection' ? (
            <BluorngCollectionPage
              initialCategory={selectedCategory}
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
              onSelectProduct={navigateToProduct}
              onQuickBuy={(prod) => setQuickBuyProduct(prod)}
              onNavigateHome={navigateToHome}
              onNavigateCollection={navigateToCollection}
              onOpenStory={navigateToStory}
            />
          ) : (
            <BluorngHome />
          )}
        </PageTransition>
      </main>

      {/* 4. MASTER LUXURY FOOTER (Links, newsletter, currency, massive SAUDAGAR brand wordmark) */}
      {view !== 'checkout' && view !== 'account' && view !== 'order' && view !== 'story' && (
        <BluorngFooter
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
        samples={samples}
        onSamplesChange={setSamples}
        note={bagNote}
        onNoteChange={setBagNote}
        couponCode={couponCode}
        onCouponChange={setCouponCode}
        onProceedToCheckout={() => navigateToCheckout()}
      />

      {/* Search Modal */}
      <BluorngSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProduct={navigateToProduct}
        wishlist={wishlist}
        onToggleWishlist={handleToggleWishlist}
      />

      {/* Quick Buy Size Modal (Triggered by "+" on Product Cards) */}
      <AnimatePresence>
        {quickBuyProduct && (
          <BluorngQuickBuyModal
            key="quick-buy-modal"
            product={quickBuyProduct}
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
    </StorefrontProvider>
  );
}
