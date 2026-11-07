export default function NotFoundPage({
  onNavigateHome,
  onNavigateCollection,
}: {
  onNavigateHome: () => void;
  onNavigateCollection: (slug: string) => void;
}) {
  return (
    <section className="min-h-[70vh] flex items-center justify-center px-4 py-24 text-center">
      <div className="max-w-[460px]">
        <p className="text-[10px] uppercase tracking-[0.22em] text-[#C4823F] dark:text-[#ECC86A] mb-3">Error 404</p>
        <h1 className="text-[26px] sm:text-[32px] font-normal tracking-[-0.015em] mb-4">This page has evaporated</h1>
        <p className="text-[13px] text-[#666666] dark:text-white/60 mb-8">
          The link may be old, or the fragrance may have moved. Let us take you somewhere familiar.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={onNavigateHome}
            className="px-6 py-3 bg-[#111111] hover:bg-[#C4823F] dark:bg-[#D4AF37] dark:hover:bg-[#ECC86A] text-white dark:text-[#0B0A0D] text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors"
          >
            Back to home
          </button>
          <button
            type="button"
            onClick={() => onNavigateCollection('signature')}
            className="px-6 py-3 border border-[#111111] dark:border-white/30 text-[11px] font-semibold uppercase tracking-[0.18em] hover:border-[#C4823F] hover:text-[#C4823F] transition-colors"
          >
            Explore fragrances
          </button>
        </div>
      </div>
    </section>
  );
}
