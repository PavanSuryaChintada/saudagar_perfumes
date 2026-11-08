import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Shown when the shop's data can't be reached (an outage or a bad connection): says so plainly, keeps trying when the
 * connection comes back, and offers "Try again". Never pretends the shop is empty or a perfume is gone.
 */
export default function ServiceDown({ inline = false }: { inline?: boolean }) {
  const queryClient = useQueryClient();
  const retry = () => queryClient.invalidateQueries();

  useEffect(() => {
    const again = () => queryClient.invalidateQueries();
    window.addEventListener('online', again);
    const timer = window.setInterval(again, 30_000);
    return () => {
      window.removeEventListener('online', again);
      window.clearInterval(timer);
    };
  }, [queryClient]);

  const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
  return (
    <section
      role="alert"
      className={`${inline ? 'py-20' : 'min-h-[100svh]'} flex items-center justify-center px-6 bg-white dark:bg-tk-night text-tk-ink dark:text-white text-center`}
    >
      <div className="max-w-[440px]">
        <p className="sf-eyebrow">{offline ? 'You are offline' : 'Connection problem'}</p>
        <h1 className="text-[24px] sm:text-[28px] font-normal tracking-[-0.01em] mb-3">We can’t reach the shop right now</h1>
        <p className="text-[14px] leading-relaxed text-[#555555] dark:text-white/70 mb-8">
          {offline
            ? 'Check your internet connection. Your bag is saved on this device, and the page comes back as soon as you are online.'
            : 'This is usually over in a moment. Your bag is saved on this device, and we keep trying in the background.'}
        </p>
        <button
          type="button"
          onClick={retry}
          className="h-12 px-8 bg-tk-ink hover:bg-tk-accent dark:bg-tk-gold dark:text-tk-night text-white text-[12px] font-semibold uppercase tracking-[0.16em] rounded-[2px] transition-colors cursor-pointer"
        >
          Try again
        </button>
      </div>
    </section>
  );
}
