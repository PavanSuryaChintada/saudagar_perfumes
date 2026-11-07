// Fly-to-cart: the product flacon rises out of a gold glow at the centre of the screen,
// trails a soft ghost, arcs over and drops into the bag. Sparkles burst on the rise,
// and the bag rings, bumps and shows a "+1" when it lands.
// Built on the Web Animations API, so there are no extra dependencies.

// Colours follow the theme tokens (Admin → Site content → Theme).
const tokenColor = (name, fallback) => {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v ? `rgb(${v.split(/\s+/).join(', ')})` : fallback;
  } catch {
    return fallback;
  }
};
const FLIGHT_MS = 1300;
const STEPS = 36;

const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeIn = (t) => t * t * t;

function findCartTarget() {
  const candidates = Array.from(document.querySelectorAll('[data-cart-target]'));
  return candidates.find((el) => el.getBoundingClientRect().width > 0) || null;
}

// Path of the bottle across the whole flight. tau runs 0 -> 1.
// Rise -> settle -> quadratic arc into the bag, shrinking as it lands.
function sampleFlight(tau, dx, dy) {
  if (tau < 0.22) {
    const u = easeOutCubic(tau / 0.22);
    return {
      x: 0,
      y: lerp(0, -115, u),
      s: lerp(0.5, 1.12, u),
      r: lerp(-8, 0, u),
      o: Math.min(1, u * 2.2)
    };
  }
  if (tau < 0.36) {
    const u = easeInOut((tau - 0.22) / 0.14);
    return { x: 0, y: lerp(-115, -80, u), s: lerp(1.12, 1, u), r: 0, o: 1 };
  }
  // Arc toward the bag: P0 = (0,-80), control above the midpoint, P2 = destination
  const t = easeIn((tau - 0.36) / 0.64);
  const p1x = dx * 0.3;
  const p1y = -300;
  const x = 2 * (1 - t) * t * p1x + t * t * dx;
  const y = (1 - t) * (1 - t) * -80 + 2 * (1 - t) * t * p1y + t * t * dy;
  return {
    x,
    y,
    s: lerp(1, 0.14, t),
    r: lerp(0, 16, t),
    o: t > 0.82 ? 1 - (t - 0.82) / 0.18 : 1
  };
}

function flightKeyframes(dx, dy, { opacityMul = 1, scaleMul = 1 } = {}) {
  const frames = [];
  for (let i = 0; i <= STEPS; i++) {
    const tau = i / STEPS;
    const p = sampleFlight(tau, dx, dy);
    frames.push({
      offset: tau,
      transform: `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) rotate(${p.r.toFixed(1)}deg) scale(${(p.s * scaleMul).toFixed(3)})`,
      opacity: +(p.o * opacityMul).toFixed(3),
      easing: 'linear'
    });
  }
  return frames;
}

function makeEl(tag, styles) {
  const el = document.createElement(tag);
  el.setAttribute('aria-hidden', 'true');
  Object.assign(el.style, { position: 'fixed', pointerEvents: 'none', ...styles });
  document.body.appendChild(el);
  return el;
}

function spawnSparkles(cx, cy) {
  for (let i = 0; i < 14; i++) {
    const angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
    const dist = 70 + Math.random() * 90;
    const size = 3 + Math.random() * 4;
    const dot = makeEl('span', {
      left: `${cx - size / 2}px`,
      top: `${cy - size / 2}px`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '9999px',
      background: tokenColor('--c-accent-night', 'rgb(236, 200, 106)'),
      boxShadow: `0 0 8px ${tokenColor('--c-accent-night', 'rgb(236, 200, 106)')}`,
      zIndex: '1001'
    });
    dot.animate(
      [
        { transform: 'translate(0px, 0px) scale(1)', opacity: 1 },
        { transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) scale(0.2)`, opacity: 0 }
      ],
      { duration: 720 + Math.random() * 260, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' }
    ).onfinish = () => dot.remove();
  }
}

function landingEffects(tx, ty) {
  // Ring that expands out of the bag
  const ring = makeEl('span', {
    left: `${tx - 14}px`,
    top: `${ty - 14}px`,
    width: '28px',
    height: '28px',
    borderRadius: '9999px',
    border: `1.5px solid ${tokenColor('--c-accent', 'rgb(196, 130, 63)')}`,
    zIndex: '1001'
  });
  ring.animate(
    [
      { transform: 'scale(0.3)', opacity: 0.95 },
      { transform: 'scale(2.6)', opacity: 0 }
    ],
    { duration: 650, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' }
  ).onfinish = () => ring.remove();

  // "+1" rising from the bag
  const plus = makeEl('span', {
    left: `${tx - 12}px`,
    top: `${ty - 26}px`,
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.08em',
    color: tokenColor('--c-accent', 'rgb(196, 130, 63)'),
    zIndex: '1001'
  });
  plus.textContent = '+1';
  plus.animate(
    [
      { transform: 'translateY(0px)', opacity: 0 },
      { transform: 'translateY(-6px)', opacity: 1, offset: 0.25 },
      { transform: 'translateY(-34px)', opacity: 0 }
    ],
    { duration: 900, easing: 'ease-out', fill: 'forwards' }
  ).onfinish = () => plus.remove();
}

export function flyToCart({ src, onLand } = {}) {
  const land = () => {
    if (typeof onLand === 'function') onLand();
  };

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const target = findCartTarget();

  if (!src || !target || reduceMotion) {
    land();
    return;
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const size = vw < 640 ? 120 : 150;

  // Centre of the screen, a little above middle (where product visuals sit)
  const cx = vw / 2;
  const cy = vh * 0.42;
  const startX = cx - size / 2;
  const startY = cy - size / 2;

  const tRect = target.getBoundingClientRect();
  const tx = tRect.left + tRect.width / 2;
  const ty = tRect.top + tRect.height / 2;
  const dx = tx - cx;
  const dy = ty - cy;

  // 1. Gold glow that blooms behind the bottle
  const glowSize = size * 2.1;
  const glow = makeEl('span', {
    left: `${cx - glowSize / 2}px`,
    top: `${cy - glowSize / 2}px`,
    width: `${glowSize}px`,
    height: `${glowSize}px`,
    borderRadius: '9999px',
    background: `radial-gradient(circle, rgba(236,200,106,0.5) 0%, rgba(196,130,63,0.18) 40%, transparent 70%)`,
    zIndex: '999'
  });
  glow.animate(
    [
      { transform: 'scale(0.3)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.3 },
      { transform: 'scale(1.25)', opacity: 0 }
    ],
    { duration: 1000, easing: 'ease-out', fill: 'forwards' }
  ).onfinish = () => glow.remove();

  // 2. Ghost trail: faint copies that follow the same path, slightly behind
  const ghostDelays = [90, 170, 250];
  ghostDelays.forEach((delay, i) => {
    const ghost = makeEl('img', {
      left: `${startX}px`,
      top: `${startY}px`,
      width: `${size}px`,
      height: `${size}px`,
      objectFit: 'contain',
      zIndex: '1000'
    });
    ghost.src = src;
    ghost.alt = '';
    ghost.animate(flightKeyframes(dx, dy, { opacityMul: 0.22 - i * 0.05, scaleMul: 0.96 - i * 0.04 }), {
      duration: FLIGHT_MS,
      delay,
      fill: 'both'
    }).onfinish = () => ghost.remove();
  });

  // 3. The bottle itself
  const bottle = makeEl('img', {
    left: `${startX}px`,
    top: `${startY}px`,
    width: `${size}px`,
    height: `${size}px`,
    objectFit: 'contain',
    zIndex: '1000',
    filter: 'drop-shadow(0 24px 30px rgba(0,0,0,0.38))',
    willChange: 'transform, opacity'
  });
  bottle.src = src;
  bottle.alt = '';

  // Sparkles burst as the bottle reaches the top of its rise
  setTimeout(() => spawnSparkles(cx, cy - 60), 240);

  const anim = bottle.animate(flightKeyframes(dx, dy), {
    duration: FLIGHT_MS,
    fill: 'forwards'
  });

  anim.onfinish = () => {
    bottle.remove();
    landingEffects(tx, ty);
    land();

    // Bag bump on arrival
    target.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(1.28)', offset: 0.3 },
        { transform: 'scale(0.94)', offset: 0.65 },
        { transform: 'scale(1)' }
      ],
      { duration: 560, easing: 'ease-out' }
    );
  };
}
