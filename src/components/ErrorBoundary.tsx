import { Component, type ErrorInfo, type ReactNode } from 'react';

const RELOADED = 'saudagar_reloaded_for_new_release';

/** The error a browser gives when a tab opened before a new release asks for a file that release replaced. */
export function isStaleBundleError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError/i.test(message);
}

/**
 * Catches anything that breaks while a page is drawn, so the visitor sees a calm message with a way out instead of a
 * blank screen. An old tab that missed a new release is reloaded once, quietly.
 */
export default class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Page error', error, info.componentStack);
    if (isStaleBundleError(error)) {
      try {
        if (!sessionStorage.getItem(RELOADED)) {
          sessionStorage.setItem(RELOADED, '1');
          window.location.reload();
        }
      } catch {
        // Storage blocked: show the message instead of risking a reload loop.
      }
    }
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    // Moving to another page gives it a fresh try.
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="min-h-[100svh] flex items-center justify-center px-6 py-16 bg-white dark:bg-tk-night text-tk-ink dark:text-white text-center">
        <div className="max-w-[440px]">
          <p className="sf-eyebrow">Sorry about this</p>
          <h1 className="text-[24px] sm:text-[28px] font-normal tracking-[-0.01em] mb-3">Something went wrong on this page</h1>
          <p className="text-[14px] leading-relaxed text-[#555555] dark:text-white/70 mb-8">
            Your bag and account are safe. Reload the page, or go back to the home page and try again.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="h-12 px-7 bg-tk-ink hover:bg-tk-accent dark:bg-tk-gold dark:text-tk-night text-white text-[12px] font-semibold uppercase tracking-[0.16em] rounded-[2px] transition-colors cursor-pointer"
            >
              Reload page
            </button>
            <a
              href="/"
              className="h-12 px-7 inline-flex items-center justify-center border border-tk-ink dark:border-white/40 text-[12px] font-semibold uppercase tracking-[0.16em] rounded-[2px] hover:bg-tk-ink hover:text-white transition-colors"
            >
              Go to home
            </a>
          </div>
        </div>
      </main>
    );
  }
}
