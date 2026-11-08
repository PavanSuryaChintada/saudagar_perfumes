import { useShopWords } from '../cms/shopWords';

export default function NotFoundPage({
  onNavigateHome,
  onNavigateCollection,
}: {
  onNavigateHome: () => void;
  onNavigateCollection: (slug: string) => void;
}) {
  const words = useShopWords();
  return (
    <section className="min-h-[70vh] flex items-center justify-center px-4 py-24 text-center">
      <div className="max-w-[460px]">
        <p className="text-[12px] uppercase tracking-[0.22em] text-tk-accent-ink dark:text-tk-accent-night mb-3">{words.notfound_eyebrow}</p>
        <h1 className="text-[26px] sm:text-[32px] font-normal tracking-[-0.015em] mb-4">{words.notfound_title}</h1>
        <p className="text-[13px] text-[#666666] dark:text-white/60 mb-8">
          {words.notfound_text}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={onNavigateHome}
            className="px-6 py-3 bg-tk-ink hover:bg-tk-accent dark:bg-tk-gold dark:hover:bg-tk-accent-night text-white dark:text-tk-night text-[12px] font-semibold uppercase tracking-[0.18em] transition-colors"
          >
            {words.notfound_home}
          </button>
          <button
            type="button"
            onClick={() => onNavigateCollection('signature')}
            className="px-6 py-3 border border-tk-ink dark:border-white/30 text-[12px] font-semibold uppercase tracking-[0.18em] hover:border-tk-accent hover:text-tk-accent transition-colors"
          >
            {words.notfound_shop}
          </button>
        </div>
      </div>
    </section>
  );
}
