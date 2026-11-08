import React from 'react';
import { useNavigate } from 'react-router';
import { useBlock } from '../../cms/useSite';
import { useGiftPackOptions } from './useQuote';
import { hasPack } from './bagLines';
import { fillPackText, packFacts } from '../giftpack/packMath';

/** "Try our Premium Gift Pack" in the bag. Hidden once a pack is in the bag, or when the pack is switched off. */
export default function GiftPackCard({ cart, onNavigate }) {
  const navigate = useNavigate();
  const block = useBlock('gift_pack');
  const { data: opts } = useGiftPackOptions(cart.length > 0 && !hasPack(cart));
  if (!opts?.enabled || opts.perfumes.length === 0 || cart.length === 0 || hasPack(cart)) return null;
  const heading = fillPackText(block?.bag_heading || 'Try our Premium Gift Pack', opts);
  const text = fillPackText(block?.bag_text || 'Your own selection of our perfumes, in one gift box.', opts);
  const button = fillPackText(block?.bag_button || 'Build your pack', opts);
  return (
    <div className="rounded-[2px] border border-tk-ink/15 dark:border-white/15 bg-[#FAF9F6] dark:bg-[#141318] p-4">
      <div className="flex gap-3 items-start">
        {block?.image && <img src={block.image} alt="" className="w-14 h-14 object-cover shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold uppercase tracking-wider text-tk-ink dark:text-white">{heading}</p>
          <p className="text-[12.5px] text-[#555555] dark:text-white/70 mt-1 leading-relaxed">{text}</p>
          <p className="text-[12px] text-tk-accent-ink dark:text-tk-accent-night font-semibold mt-1.5">{packFacts(opts).join(' · ')}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          navigate('/gift-pack');
        }}
        className="mt-3.5 w-full h-10 rounded-[2px] border border-tk-ink dark:border-white/70 text-tk-ink dark:text-white hover:bg-tk-ink hover:text-white dark:hover:bg-white dark:hover:text-tk-night text-[12px] font-bold uppercase tracking-[0.14em] transition-colors cursor-pointer"
      >
        {button} →
      </button>
    </div>
  );
}
