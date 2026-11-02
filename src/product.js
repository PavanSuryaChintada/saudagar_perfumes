import {
  PRODUCTS,
  CURRENCIES,
  getStoredCurrency,
  setStoredCurrency,
  getStoredCart,
  setStoredCart,
  formatPrice
} from './data/products.js';

// PDP Local State
const pdpState = {
  currentProduct: null,
  selectedSizeMl: 50,
  quantity: 1,
  engravingEnabled: false,
  engravingInitials: '',
  activeGalleryIndex: 0
};

// Cart and Currency State
let currentCart = getStoredCart();
let activeCurrency = getStoredCurrency();

// Extract Product ID from URL
function getActiveProductId() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const found = PRODUCTS.find(p => p.id === id);
  return found ? found.id : 'rooh-mysore';
}

// Set Active Product
function initProduct() {
  const prodId = getActiveProductId();
  pdpState.currentProduct = PRODUCTS.find(p => p.id === prodId) || PRODUCTS[0];
  pdpState.selectedSizeMl = 50;
  pdpState.quantity = 1;
  pdpState.activeGalleryIndex = 0;

  // Update Page Title and Metadata
  document.title = `${pdpState.currentProduct.name} · Extrait de Parfum | DEZEL SAUDAGAR`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute('content', `${pdpState.currentProduct.name}: ${pdpState.currentProduct.subheading}. Formulated by Maison Saudagar.`);
  }

  renderPdp();
}

// Calculate Current Price
function getCurrentPrice() {
  const prod = pdpState.currentProduct;
  const sizeObj = prod.sizes.find(s => s.ml === pdpState.selectedSizeMl) || prod.sizes[0];
  const unitPrice = prod.prices.INR * sizeObj.priceMultiplier;
  return Math.round(unitPrice * pdpState.quantity);
}

// Render the Entire Product Page
function renderPdp() {
  const prod = pdpState.currentProduct;
  if (!prod) return;

  // 1. Breadcrumb Trail
  const breadcrumbEl = document.getElementById('pdp-breadcrumb-current');
  if (breadcrumbEl) breadcrumbEl.textContent = prod.name;

  // 2. Quick Switcher Pills
  document.querySelectorAll('.edition-switch-pill').forEach(pill => {
    pill.classList.toggle('active', pill.getAttribute('data-id') === prod.id);
  });

  // 3. Flacon Gallery
  renderGallery();

  // 4. Dossier & Spec Column
  const eyebrowEl = document.getElementById('pdp-eyebrow-text');
  const titleEl = document.getElementById('pdp-title-text');
  const concEl = document.getElementById('pdp-concentration-text');
  const subheadEl = document.getElementById('pdp-subheading-text');
  const descEl = document.getElementById('pdp-desc-text');
  const priceEl = document.getElementById('pdp-main-price');

  if (eyebrowEl) eyebrowEl.textContent = prod.family;
  if (titleEl) titleEl.textContent = `${prod.name} · ${prod.roman}`;
  if (concEl) concEl.textContent = prod.concentration;
  if (subheadEl) subheadEl.textContent = prod.subheading;
  if (descEl) descEl.textContent = prod.description;
  if (priceEl) priceEl.textContent = formatPrice(getCurrentPrice(), activeCurrency);

  // 5. Size Options
  renderSizeOptions();

  // 6. Monogram Inscription
  renderEngravingStudio();

  // 7. Quantity Stepper
  const qtyValEl = document.getElementById('pdp-qty-val');
  if (qtyValEl) qtyValEl.textContent = pdpState.quantity;

  // 8. Olfactory Pyramid Section
  renderPyramid();

  // 9. Terroir & Extraction Dossier
  renderTerroirDossier();

  // 10. Application Ritual
  renderRitual();

  // 11. Scent Layering Duet
  renderLayeringDuet();

  // 12. Related Editions
  renderRelatedEditions();

  // 13. Sticky Acquisition Bar
  updateStickyBar();

  // 14. Synchronize Cart and Currency
  renderCart();
}

// Gallery Renderer
function renderGallery() {
  const prod = pdpState.currentProduct;
  const mainImg = document.getElementById('gallery-main-img');
  const sealEl = document.getElementById('gallery-batch-seal');
  const captionEl = document.getElementById('gallery-active-caption');
  const thumbsContainer = document.getElementById('gallery-thumbs-row');

  const activeItem = prod.gallery[pdpState.activeGalleryIndex] || prod.gallery[0];

  if (mainImg) {
    mainImg.src = activeItem.url;
    mainImg.alt = `${prod.name}: ${activeItem.title}`;
  }

  if (sealEl && prod.specs) {
    sealEl.textContent = prod.specs.batchNumber;
  }

  if (captionEl) {
    captionEl.textContent = activeItem.caption;
  }

  if (thumbsContainer) {
    thumbsContainer.innerHTML = prod.gallery.map((item, idx) => `
      <button type="button" class="gallery-thumb-btn ${idx === pdpState.activeGalleryIndex ? 'active' : ''}" data-gallery-index="${idx}" aria-label="View perspective: ${item.title}">
        <div class="thumb-preview-wrap">
          <img src="${item.url}" alt="${item.title}" loading="lazy" />
        </div>
        <span class="thumb-title">${item.title}</span>
      </button>
    `).join('');

    thumbsContainer.querySelectorAll('.gallery-thumb-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-gallery-index'), 10);
        pdpState.activeGalleryIndex = idx;
        renderGallery();
      });
    });
  }
}

// Size Options Renderer
function renderSizeOptions() {
  const prod = pdpState.currentProduct;
  const container = document.getElementById('size-options-grid');
  if (!container) return;

  container.innerHTML = prod.sizes.map(size => {
    const isSelected = size.ml === pdpState.selectedSizeMl;
    const priceVal = formatPrice(Math.round(prod.prices.INR * size.priceMultiplier), activeCurrency);
    return `
      <div class="size-option-card ${isSelected ? 'active' : ''}" data-size-ml="${size.ml}" role="button" tabindex="0" aria-pressed="${isSelected}">
        <div class="size-card-title">${size.label}</div>
        <div class="size-card-sub">Height: ${size.height} · Sealed Flacon</div>
        <div class="size-card-price">${priceVal}</div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.size-option-card').forEach(card => {
    const ml = parseInt(card.getAttribute('data-size-ml'), 10);
    const selectHandler = () => {
      pdpState.selectedSizeMl = ml;
      renderSizeOptions();
      updatePriceDisplay();
      updateStickyBar();
    };
    card.addEventListener('click', selectHandler);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectHandler();
      }
    });
  });
}

// Update Price Display across DOM
function updatePriceDisplay() {
  const priceEl = document.getElementById('pdp-main-price');
  if (priceEl) {
    priceEl.textContent = formatPrice(getCurrentPrice(), activeCurrency);
  }
  updateStickyBar();
}

// Bespoke Monogram Inscription Studio
function renderEngravingStudio() {
  const toggle = document.getElementById('engraving-toggle-checkbox');
  const body = document.getElementById('engraving-studio-body');
  const input = document.getElementById('engraving-text-input');
  const preview = document.getElementById('engraving-plaque-render');
  const flaconBadge = document.getElementById('flacon-engraving-badge');

  if (toggle) {
    toggle.checked = pdpState.engravingEnabled;
    toggle.onchange = () => {
      pdpState.engravingEnabled = toggle.checked;
      if (body) body.classList.toggle('open', pdpState.engravingEnabled);
      if (flaconBadge) flaconBadge.classList.toggle('active', pdpState.engravingEnabled && pdpState.engravingInitials.length > 0);
    };
  }

  if (input) {
    input.value = pdpState.engravingInitials;
    input.oninput = (e) => {
      const val = e.target.value.toUpperCase().slice(0, 3);
      input.value = val;
      pdpState.engravingInitials = val;
      const displayVal = val || 'MK';
      if (preview) preview.textContent = displayVal;
      if (flaconBadge) {
        flaconBadge.textContent = displayVal;
        flaconBadge.classList.toggle('active', pdpState.engravingEnabled && val.length > 0);
      }
    };
  }
}

// Olfactory Pyramid Renderer
function renderPyramid() {
  const prod = pdpState.currentProduct;
  const container = document.getElementById('pyramid-stack-container');
  if (!container || !prod.pyramidDetails) return;

  const tiers = [
    {
      key: 'top',
      badge: '01 / Opening Accords',
      name: 'Head Soul',
      timeframe: '0 to 30 mins',
      notes: prod.notes.top,
      detail: prod.pyramidDetails.top
    },
    {
      key: 'heart',
      badge: '02 / Heart Emersion',
      name: 'Heart & Essence',
      timeframe: '30 mins to 6 hours',
      notes: prod.notes.heart,
      detail: prod.pyramidDetails.heart
    },
    {
      key: 'base',
      badge: '03 / Sovereign Trail',
      name: 'Resinous Ground',
      timeframe: '6 to 14+ hours',
      notes: prod.notes.base,
      detail: prod.pyramidDetails.base
    }
  ];

  container.innerHTML = tiers.map(tier => `
    <article class="pyramid-tier-card" aria-label="${tier.name}">
      <div class="tier-top-row">
        <div class="tier-title-wrap">
          <span class="tier-badge">${tier.badge}</span>
          <h3 class="tier-name">${tier.name}</h3>
        </div>
        <span class="tier-timeframe">${tier.timeframe}</span>
      </div>
      <div class="tier-accords-tags">
        ${tier.notes.map(n => `<span class="accord-pill">${n}</span>`).join('')}
      </div>
      <p class="tier-desc">${tier.detail.description}</p>
    </article>
  `).join('');
}

// Terroir & Provenance Dossier Renderer
function renderTerroirDossier() {
  const prod = pdpState.currentProduct;
  const visualCol = document.getElementById('terroir-visual-col');
  const specsList = document.getElementById('specs-dossier-list');

  if (visualCol) {
    visualCol.innerHTML = `
      <img src="${prod.gallery[2]?.url || prod.image}" alt="${prod.name} terroir raw botanical ingredients" loading="lazy" />
      <div class="terroir-caption-box">
        <div class="terroir-caption-tag">Botanical Provenance</div>
        <p class="terroir-caption-text">${prod.specs.harvest}</p>
      </div>
    `;
  }

  if (specsList && prod.specs) {
    specsList.innerHTML = `
      <div class="spec-entry-row">
        <span class="spec-entry-label">Maceration Cycle</span>
        <span class="spec-entry-value">${prod.specs.maceration}</span>
      </div>
      <div class="spec-entry-row">
        <span class="spec-entry-label">Distillation Art</span>
        <span class="spec-entry-value">${prod.specs.distillation}</span>
      </div>
      <div class="spec-entry-row">
        <span class="spec-entry-label">Sillage Horizon</span>
        <span class="spec-entry-value">${prod.specs.sillage}</span>
      </div>
      <div class="spec-entry-row">
        <span class="spec-entry-label">Optimal Season</span>
        <span class="spec-entry-value">${prod.specs.season}</span>
      </div>
      <div class="spec-entry-row">
        <span class="spec-entry-label">Reserve Provenance</span>
        <span class="spec-entry-value">${prod.specs.harvest}</span>
      </div>
      <div class="spec-entry-row">
        <span class="spec-entry-label">Batch Serialization</span>
        <span class="spec-entry-value">${prod.specs.batchNumber}</span>
      </div>
    `;
  }
}

// Application Ritual Renderer
function renderRitual() {
  const prod = pdpState.currentProduct;
  const container = document.getElementById('ritual-cards-grid');
  const leadEl = document.getElementById('ritual-lead-text');

  if (leadEl && prod.ritual) {
    leadEl.textContent = prod.ritual.lead;
  }

  if (container && prod.ritual) {
    container.innerHTML = prod.ritual.steps.map(step => `
      <div class="ritual-card">
        <div class="ritual-num">${step.num}</div>
        <h4 class="ritual-heading">${step.heading}</h4>
        <p class="ritual-text">${step.text}</p>
      </div>
    `).join('');
  }
}

// Layering Duet Renderer
function renderLayeringDuet() {
  const prod = pdpState.currentProduct;
  const container = document.getElementById('layering-container');
  if (!container || !prod.layering) return;

  const companion = PRODUCTS.find(p => p.id === prod.layering.pairId);
  if (!companion) return;

  container.innerHTML = `
    <div class="layering-card-duet">
      <div class="layering-thumb">
        <img src="${companion.image}" alt="${companion.name}" loading="lazy" />
      </div>
      <div class="layering-content">
        <span class="layering-tag">${prod.layering.concept}</span>
        <h3 class="layering-title">Pair With ${companion.name}</h3>
        <p class="layering-desc">${prod.layering.description}</p>
      </div>
      <div>
        <button type="button" class="layering-action-btn" id="btn-acquire-companion" data-companion-id="${companion.id}">
          Acquire ${companion.name} (${formatPrice(companion.prices.INR, activeCurrency)})
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-acquire-companion')?.addEventListener('click', () => {
    addToCart(companion.id, 50);
    showToast(`${companion.name} added to your shopping bag.`);
  });
}

// Related Editions Renderer
function renderRelatedEditions() {
  const prod = pdpState.currentProduct;
  const container = document.getElementById('related-grid');
  if (!container) return;

  const others = PRODUCTS.filter(p => p.id !== prod.id);

  container.innerHTML = others.map(p => `
    <article class="related-card" aria-label="${p.name}">
      <div class="related-img-wrap">
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
      </div>
      <span class="related-num">Edition ${p.roman}</span>
      <h3 class="related-title">${p.name}</h3>
      <p class="related-family">${p.family}</p>
      <div class="related-price">${formatPrice(p.prices.INR, activeCurrency)}</div>
      <a href="product.html?id=${p.id}" class="btn-related-view">Examine Edition</a>
    </article>
  `).join('');
}

// Sticky Acquisition Bar
function updateStickyBar() {
  const prod = pdpState.currentProduct;
  if (!prod) return;

  const thumb = document.getElementById('sticky-thumb');
  const title = document.getElementById('sticky-title');
  const meta = document.getElementById('sticky-meta');
  const price = document.getElementById('sticky-price');

  if (thumb) thumb.src = prod.image;
  if (title) title.textContent = prod.name;
  if (meta) meta.textContent = `${pdpState.selectedSizeMl}ml Flacon · ${prod.concentration}`;
  if (price) price.textContent = formatPrice(getCurrentPrice(), activeCurrency);
}

function setupStickyBarScroll() {
  const bar = document.getElementById('sticky-acquisition-bar');
  const heroSection = document.getElementById('pdp-hero');

  window.addEventListener('scroll', () => {
    if (!heroSection || !bar) return;
    const heroBottom = heroSection.getBoundingClientRect().bottom;
    if (heroBottom < 100) {
      bar.classList.add('visible');
    } else {
      bar.classList.remove('visible');
    }
  });
}

// Toast Feedback System
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

// Shared Cart Management
export function addToCart(productId, sizeMl = 50, engraving = '') {
  const existing = currentCart.find(
    item => item.productId === productId && item.sizeMl === sizeMl && item.engraving === engraving
  );
  if (existing) {
    existing.quantity += 1;
  } else {
    currentCart.push({ productId, sizeMl, quantity: 1, engraving });
  }
  setStoredCart(currentCart);
  renderCart();
  openCartDrawer();
}

export function updateCartQuantity(index, delta) {
  if (currentCart[index]) {
    currentCart[index].quantity += delta;
    if (currentCart[index].quantity <= 0) {
      currentCart.splice(index, 1);
    }
    setStoredCart(currentCart);
    renderCart();
  }
}

export function removeCartItem(index) {
  if (currentCart[index]) {
    currentCart.splice(index, 1);
    setStoredCart(currentCart);
    renderCart();
  }
}

function renderCart() {
  const listEl = document.getElementById('cart-items-list');
  const countEl = document.getElementById('cart-count');
  const totalEl = document.getElementById('cart-total');

  const totalItems = currentCart.reduce((sum, item) => sum + item.quantity, 0);
  if (countEl) countEl.textContent = totalItems;

  if (!listEl) return;

  if (currentCart.length === 0) {
    listEl.innerHTML = `
      <div class="cart-empty-state" style="padding: 40px 20px; text-align: center; color: var(--color-ash);">
        <p style="margin-bottom: 20px;">Your shopping bag is currently unoccupied.</p>
        <button type="button" class="btn-gold-pill" id="cart-continue-btn" style="padding: 10px 24px; font-size: 0.72rem; letter-spacing: 0.18em;">Examine Editions</button>
      </div>
    `;
    document.getElementById('cart-continue-btn')?.addEventListener('click', () => {
      closeCartDrawer();
      window.location.href = 'index.html#editions';
    });
    if (totalEl) totalEl.textContent = formatPrice(0, activeCurrency);
    return;
  }

  let subtotalInr = 0;
  listEl.innerHTML = currentCart.map((item, idx) => {
    const product = PRODUCTS.find(p => p.id === item.productId);
    if (!product) return '';
    const sizeObj = product.sizes.find(s => s.ml === item.sizeMl) || product.sizes[0];
    const unitPriceInr = product.prices.INR * sizeObj.priceMultiplier;
    const lineTotalInr = unitPriceInr * item.quantity;
    subtotalInr += lineTotalInr;

    return `
      <div class="cart-item-row" data-index="${idx}" style="display: flex; gap: 14px; padding: 16px 0; border-bottom: 1px solid var(--border-subtle); align-items: center;">
        <img src="${product.image}" alt="${product.name}" class="cart-item-img" style="width: 54px; height: 54px; object-fit: cover; border: 1px solid var(--border-subtle);" />
        <div class="cart-item-info" style="flex: 1;">
          <h4 style="font-size: 0.95rem; color: var(--color-ivory); margin-bottom: 2px;">${product.name}</h4>
          <div class="cart-item-meta" style="font-size: 0.72rem; color: var(--color-ash); margin-bottom: 8px;">
            ${sizeObj.label} ${item.engraving ? '· Inscribed: "' + item.engraving + '"' : ''}
          </div>
          <div class="cart-qty-ctrls" style="display: flex; align-items: center; gap: 10px;">
            <button type="button" class="qty-btn" data-action="decrement" aria-label="Decrease quantity" style="border: 1px solid var(--border-subtle); width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 0.9rem;">−</button>
            <span class="qty-val" style="font-size: 0.85rem; color: var(--color-ivory);">${item.quantity}</span>
            <button type="button" class="qty-btn" data-action="increment" aria-label="Increase quantity" style="border: 1px solid var(--border-subtle); width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 0.9rem;">+</button>
          </div>
        </div>
        <div style="text-align: right;">
          <div class="cart-item-price" style="font-family: var(--font-serif); font-size: 1.15rem; color: var(--color-gold-light);">${formatPrice(lineTotalInr, activeCurrency)}</div>
          <button type="button" class="btn-remove" data-action="remove" style="font-size: 0.65rem; color: var(--color-ash); margin-top: 6px; letter-spacing: 0.1em; text-transform: uppercase;">Remove</button>
        </div>
      </div>
    `;
  }).join('');

  if (totalEl) totalEl.textContent = formatPrice(subtotalInr, activeCurrency);

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

// Setup Event Listeners
function setupEventListeners() {
  // Quantity buttons on hero
  document.getElementById('pdp-qty-decrement')?.addEventListener('click', () => {
    if (pdpState.quantity > 1) {
      pdpState.quantity -= 1;
      document.getElementById('pdp-qty-val').textContent = pdpState.quantity;
      updatePriceDisplay();
    }
  });

  document.getElementById('pdp-qty-increment')?.addEventListener('click', () => {
    if (pdpState.quantity < 10) {
      pdpState.quantity += 1;
      document.getElementById('pdp-qty-val').textContent = pdpState.quantity;
      updatePriceDisplay();
    }
  });

  // Primary Acquire Action on hero
  document.getElementById('btn-pdp-acquire')?.addEventListener('click', () => {
    const engraving = pdpState.engravingEnabled ? pdpState.engravingInitials : '';
    addToCart(pdpState.currentProduct.id, pdpState.selectedSizeMl, engraving);
    showToast(`${pdpState.currentProduct.name} reserved in your shopping bag.`);
  });

  // Sticky Bar Acquire Action
  document.getElementById('btn-sticky-acquire')?.addEventListener('click', () => {
    const engraving = pdpState.engravingEnabled ? pdpState.engravingInitials : '';
    addToCart(pdpState.currentProduct.id, pdpState.selectedSizeMl, engraving);
    showToast(`${pdpState.currentProduct.name} reserved in your shopping bag.`);
  });

  // Cart open/close triggers
  document.getElementById('open-cart-btn')?.addEventListener('click', openCartDrawer);
  document.getElementById('close-cart-btn')?.addEventListener('click', closeCartDrawer);
  document.getElementById('cart-drawer-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'cart-drawer-overlay') closeCartDrawer();
  });
  document.getElementById('checkout-action-btn')?.addEventListener('click', () => {
    showToast('Secure checkout initiated with Maison Saudagar concierge.');
  });

  // Currency Switcher
  const currSelect = document.getElementById('currency-select');
  if (currSelect) {
    currSelect.value = activeCurrency;
    currSelect.addEventListener('change', (e) => {
      activeCurrency = e.target.value;
      setStoredCurrency(activeCurrency);
      renderPdp();
      showToast(`Currency converted to ${activeCurrency}.`);
    });
  }

  // Keyboard navigation (ESC closes drawers/overlays)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCartDrawer();
      document.getElementById('search-overlay')?.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  // Search logic
  setupSearch();

  // Sticky bar scroll
  setupStickyBarScroll();
}

// Search Drawer Setup
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
          No bespoke formulations matched "${query}".
        </div>
      `;
      return;
    }

    resultsContainer.innerHTML = matched.map(p => `
      <div class="search-result-item" data-product-id="${p.id}" style="display: flex; justify-content: space-between; padding: 14px; border: 1px solid var(--border-subtle); margin-bottom: 8px; cursor: pointer;">
        <div>
          <h4 style="font-size: 1.1rem; color: var(--color-ivory);">${p.name}</h4>
          <span style="font-size: 0.7rem; color: var(--color-gold); letter-spacing: 0.12em; text-transform: uppercase;">${p.family}</span>
        </div>
        <div style="font-family: var(--font-serif); font-size: 1.2rem; color: var(--color-gold-light);">
          ${formatPrice(p.prices.INR, activeCurrency)}
        </div>
      </div>
    `).join('');

    resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const pId = item.getAttribute('data-product-id');
        window.location.href = `product.html?id=${pId}`;
      });
    });
  }

  searchInput?.addEventListener('input', (e) => {
    runSearch(e.target.value);
  });
}

// Initializer
document.addEventListener('DOMContentLoaded', () => {
  initProduct();
  setupEventListeners();
});
