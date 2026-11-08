// The brand intro (logo curtain) welcomes a visitor once, on the home page. It never stands between a shopper and a
// product, collection or checkout page they opened directly, and it does not replay on every reload.

const KEY = 'saudagar_intro_seen';

type Store = { getItem(key: string): string | null; setItem(key: string, value: string): void };

export function shouldPlayIntro(firstView: string, enabled: boolean, store: Store | null): boolean {
  if (!enabled || firstView !== 'home') return false;
  try {
    return store?.getItem(KEY) !== '1';
  } catch {
    return true;
  }
}

export function markIntroSeen(store: Store | null): void {
  try {
    store?.setItem(KEY, '1');
  } catch {
    // Storage blocked: the intro may show again next time, which is harmless.
  }
}

/** Session storage when the browser allows it. */
export function introStore(): Store | null {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    return null;
  }
}
