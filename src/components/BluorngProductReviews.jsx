import React from 'react';

// Reviews come only from verified buyers and are approved by the admin before they show (spec §13).
// Until the review flow ships (phase 9) every product honestly shows "No reviews yet".
export default function BluorngProductReviews({ productName, ratingAvg = 0, ratingCount = 0 }) {
  return (
    <section
      id="reviews-section"
      className="w-full bg-[#FFFFFF] dark:bg-[#0B0A0D] border-t border-[#EAEAEA] dark:border-white/10 px-6 sm:px-10 lg:px-16 py-14 sm:py-16 transition-colors duration-300"
      aria-label="Customer reviews"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#EAEAEA] dark:border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#C4823F] dark:bg-[#ECC86A]" />
              <span className="text-[11px] uppercase tracking-[0.18em] font-medium text-[#C4823F] dark:text-[#ECC86A]">
                Customer Reviews
              </span>
            </div>
            <h2 className="text-[26px] sm:text-[34px] font-normal tracking-[-0.015em] text-[#111111] dark:text-white">
              Client Experiences & Ratings
            </h2>
            <p className="text-[13px] text-[#666666] dark:text-[#999999] mt-1 max-w-xl">
              Reviews of {productName} from customers who bought it.
            </p>
          </div>
          {ratingCount > 0 && (
            <div className="text-right">
              <p className="text-[32px] font-light text-[#111111] dark:text-white leading-none">{Number(ratingAvg).toFixed(1)}</p>
              <p className="text-[11px] text-[#777777] dark:text-[#999999] mt-1">{ratingCount} review{ratingCount === 1 ? '' : 's'}</p>
            </div>
          )}
        </div>

        {ratingCount === 0 && (
          <div className="py-14 text-center">
            <p className="text-[15px] text-[#111111] dark:text-white">No reviews yet</p>
            <p className="text-[12.5px] text-[#777777] dark:text-[#999999] mt-1.5">
              Bought this fragrance? You'll be able to review it from your orders once it's delivered.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
