import {
  CURRENCIES,
  PRODUCTS,
  INGREDIENTS,
  COLLECTIONS,
  getStoredCurrency,
  setStoredCurrency,
  getStoredCart,
  setStoredCart
} from './data/products.js';

// Application State
const state = {
  currentCurrency: getStoredCurrency(),
  cart: getStoredCart(),
  selectedIngredientId: 'sandalwood',
  heroMode: 'triptych' // 'triptych' or 'model'
};

// Formatting Helper for Prices
export function formatPrice(baseInr, currencyKey = state.currentCurrency) {
  const curr = CURRENCIES[currencyKey] || CURRENCIES.INR;
  const converted = Math.round(baseInr * curr.rate);
  return `${curr.symbol}${converted.toLocaleString()}`;
}

// Update all prices across the DOM
function updateDomPrices() {
  document.querySelectorAll('[data-base-price]').forEach(el => {
    const base = parseFloat(el.getAttribute('data-base-price'));
    if (!isNaN(base)) {
      el.textContent = formatPrice(base);
    }
  });
  renderCart();
}

// Cart Management
function getCartItemProduct(item) {
  return PRODUCTS.find(p => p.id === item.productId);
}

export function addToCart(productId, sizeMl = 50, engraving = '') {
  const existing = state.cart.find(item => item.productId === productId && item.sizeMl === sizeMl && item.engraving === engraving);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({ productId, sizeMl, quantity: 1, engraving });
  }
  setStoredCart(state.cart);
  renderCart();
  showToast('Flacon reserved in your shopping bag.');
  openCartDrawer();
}

export function updateCartQuantity(index, delta) {
  if (state.cart[index]) {
    state.cart[index].quantity += delta;
    if (state.cart[index].quantity <= 0) {
      state.cart.splice(index, 1);
    }
    setStoredCart(state.cart);
    renderCart();
  }
}

export function removeCartItem(index) {
  if (state.cart[index]) {
    state.cart.splice(index, 1);
    setStoredCart(state.cart);
    renderCart();
  }
}

function renderCart() {
  const listEl = document.getElementById('cart-items-list');
  const countEl = document.getElementById('cart-count');
  const subtotalEl = document.getElementById('cart-subtotal');
  const totalEl = document.getElementById('cart-total');

  const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  if (countEl) countEl.textContent = totalItems;

  if (!listEl) return;

  if (state.cart.length === 0) {
    listEl.innerHTML = `
      <div class="cart-empty-state">
        <p>Your shopping bag is currently unoccupied.</p>
        <button type="button" class="btn-outline" id="cart-continue-btn">Examine Editions</button>
      </div>
    `;
    const contBtn = document.getElementById('cart-continue-btn');
    if (contBtn) {
      contBtn.addEventListener('click', () => {
        closeCartDrawer();
        document.getElementById('editions')?.scrollIntoView({ behavior: 'smooth' });
      });
    }
    if (subtotalEl) subtotalEl.textContent = formatPrice(0);
    if (totalEl) totalEl.textContent = formatPrice(0);
    return;
  }

  let subtotalInr = 0;
  listEl.innerHTML = state.cart.map((item, idx) => {
    const product = getCartItemProduct(item);
    if (!product) return '';
    const sizeObj = product.sizes.find(s => s.ml === item.sizeMl) || product.sizes[0];
    const unitPriceInr = product.prices.INR * sizeObj.priceMultiplier;
    const lineTotalInr = unitPriceInr * item.quantity;
    subtotalInr += lineTotalInr;

    return `
      <div class="cart-item-row" data-index="${idx}">
        <img src="${product.image}" alt="${product.name}" class="cart-item-img" />
        <div class="cart-item-info">
          <h4>${product.name}</h4>
          <div class="cart-item-meta">${sizeObj.label} ${item.engraving ? '· Engraved: "' + item.engraving + '"' : ''}</div>
          <div class="cart-qty-ctrls">
            <button type="button" class="qty-btn" data-action="decrement" aria-label="Decrease quantity">−</button>
            <span class="qty-val">${item.quantity}</span>
            <button type="button" class="qty-btn" data-action="increment" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <div style="text-align: right;">
          <div class="cart-item-price">${formatPrice(lineTotalInr)}</div>
          <button type="button" class="btn-remove" data-action="remove" style="font-size: 0.65rem; color: var(--color-ash); margin-top: 6px; letter-spacing: 0.1em; text-transform: uppercase;">Remove</button>
        </div>
      </div>
    `;
  }).join('');

  if (subtotalEl) subtotalEl.textContent = formatPrice(subtotalInr);
  if (totalEl) totalEl.textContent = formatPrice(subtotalInr);

  // Bind cart quantity buttons
  listEl.querySelectorAll('.cart-item-row').forEach(row => {
    const idx = parseInt(row.getAttribute('data-index'), 10);
    row.querySelector('[data-action="decrement"]')?.addEventListener('click', () => updateCartQuantity(idx, -1));
    row.querySelector('[data-action="increment"]')?.addEventListener('click', () => updateCartQuantity(idx, 1));
    row.querySelector('[data-action="remove"]')?.addEventListener('click', () => removeCartItem(idx));
  });
}

export function openCartDrawer() {
  const overlay = document.getElementById('cart-drawer-overlay');
  if (overlay) {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
}

export function closeCartDrawer() {
  const overlay = document.getElementById('cart-drawer-overlay');
  if (overlay) {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

// Olfactory Profile Modal
export function openOlfactoryModal(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const modalOverlay = document.getElementById('olfactory-modal-overlay');
  const modalContent = document.getElementById('modal-card-content');
  if (!modalOverlay || !modalContent) return;

  modalContent.innerHTML = `
    <div class="modal-visual-frame">
      <img src="${product.image}" alt="${product.name}" />
    </div>
    <div class="modal-body">
      <span class="modal-eyebrow">${product.family}</span>
      <h3 class="modal-title font-serif">${product.name}</h3>
      <div class="modal-subhead">${product.subheading}</div>
      <p class="modal-desc">${product.description}</p>
      
      <div class="modal-pyramid">
        <div class="pyramid-level">
          <span class="pyramid-label">Top Accords</span>
          <span class="pyramid-notes">${product.notes.top.join(' · ')}</span>
        </div>
        <div class="pyramid-level">
          <span class="pyramid-label">Heart Soul</span>
          <span class="pyramid-notes">${product.notes.heart.join(' · ')}</span>
        </div>
        <div class="pyramid-level">
          <span class="pyramid-label">Resinous Base</span>
          <span class="pyramid-notes">${product.notes.base.join(' · ')}</span>
        </div>
      </div>

      <div style="font-size: 0.78rem; color: var(--color-sand); margin-bottom: 24px;">
        <div style="margin-bottom: 6px;"><strong>Sillage:</strong> ${product.sillage}</div>
        <div style="margin-bottom: 6px;"><strong>Ideal Hours:</strong> ${product.season}</div>
        <div><strong>Extraction:</strong> ${product.harvest}</div>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-subtle); padding-top: 20px; gap: 12px; flex-wrap: wrap;">
        <div>
          <span style="font-size: 0.65rem; color: var(--color-ash); letter-spacing: 0.15em; text-transform: uppercase;">Acquisition</span>
          <div style="font-family: var(--font-serif); font-size: 1.6rem; color: var(--color-gold-light);">${formatPrice(product.prices.INR)}</div>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <a href="product.html?id=${product.id}" class="btn-outline" style="padding: 10px 18px; font-size: 0.72rem; letter-spacing: 0.16em; text-transform: uppercase; border: 1px solid var(--color-gold-border); color: var(--color-gold-light); text-decoration: none;">Full Dossier</a>
          <button type="button" class="btn-outline btn-filled" id="modal-acquire-btn">Reserve Flacon</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('modal-acquire-btn')?.addEventListener('click', () => {
    addToCart(product.id, 50);
    closeOlfactoryModal();
  });

  modalOverlay.classList.add('open');
  modalOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

export function closeOlfactoryModal() {
  const modalOverlay = document.getElementById('olfactory-modal-overlay');
  if (modalOverlay) {
    modalOverlay.classList.remove('open');
    modalOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

// Ingredient Dossier Renderer
function renderIngredientDossier(id) {
  const ing = INGREDIENTS.find(item => item.id === id);
  if (!ing) return;

  const card = document.getElementById('ingredient-dossier-card');
  if (!card) return;

  card.innerHTML = `
    <div class="dossier-header">
      <span class="botanical">${ing.botanical}</span>
      <h3 class="font-serif">${ing.name}</h3>
      <p class="profile-quote">"${ing.profile}"</p>
    </div>
    <div class="dossier-details">
      <ul class="dossier-specs-list">
        <li class="dossier-spec-row">
          <span class="label">Geographic Provenance</span>
          <span class="val">${ing.origin}</span>
        </li>
        <li class="dossier-spec-row">
          <span class="label">Altitude</span>
          <span class="val">${ing.elevation}</span>
        </li>
        <li class="dossier-spec-row">
          <span class="label">Artisanal Extraction</span>
          <span class="val">${ing.distillation}</span>
        </li>
        <li class="dossier-spec-row">
          <span class="label">Harvest Period</span>
          <span class="val">${ing.harvestPeriod}</span>
        </li>
        <li class="dossier-spec-row">
          <span class="label">Botanical Status</span>
          <span class="val">${ing.rarity}</span>
        </li>
      </ul>
    </div>
  `;

  document.querySelectorAll('.ingredient-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-ingredient-id') === id);
  });
}

// Toast Feedback
let toastTimeout = null;
export function showToast(message) {
  const toast = document.getElementById('toast-msg');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

// Search Drawer Logic
function setupSearch() {
  const searchOverlay = document.getElementById('search-overlay');
  const searchInput = document.getElementById('site-search-input');
  const resultsContainer = document.getElementById('search-results-list');
  const searchTriggers = document.querySelectorAll('[data-open-search]');
  const searchClose = document.getElementById('close-search-btn');

  function openSearch() {
    searchOverlay?.classList.add('open');
    searchOverlay?.setAttribute('aria-hidden', 'false');
    searchInput?.focus();
    document.body.style.overflow = 'hidden';
    runSearch('');
  }

  function closeSearch() {
    searchOverlay?.classList.remove('open');
    searchOverlay?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  searchTriggers.forEach(t => t.addEventListener('click', openSearch));
  searchClose?.addEventListener('click', closeSearch);

  function runSearch(query) {
    if (!resultsContainer) return;
    const q = query.trim().toLowerCase();
    const matched = PRODUCTS.filter(p => {
      if (!q) return true;
      const matchName = p.name.toLowerCase().includes(q);
      const matchFamily = p.family.toLowerCase().includes(q);
      const matchNotes = [
        ...p.notes.top,
        ...p.notes.heart,
        ...p.notes.base
      ].some(note => note.toLowerCase().includes(q));
      return matchName || matchFamily || matchNotes;
    });

    if (matched.length === 0) {
      resultsContainer.innerHTML = `
        <div style="color: var(--color-ash); font-size: 0.9rem; padding: 20px 0;">
          No bespoke formulations matched "${query}". Try searching "sandalwood", "oud", or "vetiver".
        </div>
      `;
      return;
    }

    resultsContainer.innerHTML = matched.map(p => `
      <div class="search-result-item" data-product-id="${p.id}">
        <div>
          <h4 style="font-size: 1.15rem; color: var(--color-ivory); margin-bottom: 2px;">${p.name}</h4>
          <span style="font-size: 0.72rem; color: var(--color-gold-muted); letter-spacing: 0.12em; text-transform: uppercase;">${p.family}</span>
        </div>
        <div style="font-family: var(--font-serif); font-size: 1.25rem; color: var(--color-gold-light);">
          ${formatPrice(p.prices.INR)}
        </div>
      </div>
    `).join('');

    resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const pId = item.getAttribute('data-product-id');
        closeSearch();
        openOlfactoryModal(pId);
      });
    });
  }

  searchInput?.addEventListener('input', (e) => {
    runSearch(e.target.value);
  });
}

// Hero Switcher Logic (Triptych vs Editorial Model)
function setupHeroSwitcher() {
  const tabs = document.querySelectorAll('.view-tab');
  const triptychView = document.getElementById('hero-triptych-view');
  const modelView = document.getElementById('hero-model-view');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const mode = tab.getAttribute('data-view');
      tabs.forEach(t => t.classList.toggle('active', t === tab));
      if (mode === 'triptych') {
        if (triptychView) triptychView.style.display = 'grid';
        if (modelView) modelView.style.display = 'none';
      } else {
        if (triptychView) triptychView.style.display = 'none';
        if (modelView) modelView.style.display = 'grid';
      }
    });
  });
}

// Bespoke Monogram Engraving Simulation
function setupEngravingSimulator() {
  const input = document.getElementById('masterwork-engraving-input');
  const preview = document.getElementById('engraving-live-preview');
  const acquireBtn = document.getElementById('masterwork-acquire-btn');

  input?.addEventListener('input', (e) => {
    const val = e.target.value.toUpperCase().slice(0, 4);
    e.target.value = val;
    if (preview) {
      preview.textContent = val ? `Custom Plaque: "${val}"` : 'Default Inscription: "SAUDAGAR I"';
    }
  });

  acquireBtn?.addEventListener('click', () => {
    const initials = input?.value.trim().toUpperCase() || '';
    addToCart('masterwork-saudagar-i', 50, initials);
  });
}

// Mobile Navigation Logic
function setupMobileNav() {
  const toggle = document.getElementById('mobile-nav-toggle');
  const navLinks = document.getElementById('nav-links');

  toggle?.addEventListener('click', () => {
    const isOpen = navLinks?.classList.toggle('mobile-active');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  navLinks?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('mobile-active');
      toggle?.setAttribute('aria-expanded', 'false');
    });
  });
}

// Currency Switcher
function setupCurrencySelector() {
  const select = document.getElementById('currency-select');
  if (select) {
    select.value = state.currentCurrency;
    select.addEventListener('change', (e) => {
      state.currentCurrency = e.target.value;
      setStoredCurrency(state.currentCurrency);
      updateDomPrices();
      showToast(`Currency converted to ${state.currentCurrency}.`);
    });
  }
}

// Global Keyboard Accessibility (ESC closes modals & drawers)
function setupKeyboardListeners() {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCartDrawer();
      closeOlfactoryModal();
      document.getElementById('search-overlay')?.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
}

// Product Action Bindings
function bindProductActions() {
  // Collection cards "Examine Scent" buttons
  document.querySelectorAll('[data-open-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pId = btn.getAttribute('data-open-modal');
      openOlfactoryModal(pId);
    });
  });

  // Collection cards "Add To Bag" buttons
  document.querySelectorAll('[data-add-to-cart]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pId = btn.getAttribute('data-add-to-cart');
      addToCart(pId, 50);
    });
  });

  // Discovery coffret reserve button
  document.getElementById('reserve-coffret-btn')?.addEventListener('click', () => {
    addToCart('rooh-mysore', 50);
    showToast('Discovery Coffret reserved.');
  });
}

// Ingredient selector buttons
function setupIngredientSelectors() {
  document.querySelectorAll('.ingredient-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const ingId = btn.getAttribute('data-ingredient-id');
      renderIngredientDossier(ingId);
    });
  });
}

// Newsletter form feedback
function setupNewsletter() {
  const form = document.getElementById('newsletter-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.querySelector('input[type="email"]');
    if (input && input.value) {
      showToast('Invitation dispatched. Welcome to the Maison Saudagar salon.');
      input.value = '';
    }
  });
}

// Cart Drawer open/close buttons
function setupCartControls() {
  document.getElementById('open-cart-btn')?.addEventListener('click', openCartDrawer);
  document.getElementById('close-cart-btn')?.addEventListener('click', closeCartDrawer);
  document.getElementById('cart-drawer-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'cart-drawer-overlay') {
      closeCartDrawer();
    }
  });
  document.getElementById('olfactory-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'olfactory-modal-overlay') {
      closeOlfactoryModal();
    }
  });
  document.getElementById('close-modal-btn')?.addEventListener('click', closeOlfactoryModal);
  document.getElementById('checkout-action-btn')?.addEventListener('click', () => {
    showToast('Secure checkout initiated with Maison Saudagar concierge.');
  });
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  renderCart();
  renderIngredientDossier('sandalwood');
  setupHeroSwitcher();
  setupSearch();
  setupEngravingSimulator();
  setupMobileNav();
  setupCurrencySelector();
  setupKeyboardListeners();
  bindProductActions();
  setupIngredientSelectors();
  setupNewsletter();
  setupCartControls();
});
