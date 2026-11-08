import React from 'react';
import { useNavigate } from 'react-router';
import { useBlock } from '../../cms/useSite';
import { useGiftPackOptions } from './useQuote';
import { hasPack } from './bagLines';
import { fillPackText } from '../giftpack/packMath';

/** "Try our Premium Gift Pack" in the bag. Hidden once a pack is in the bag, or when the pack is switched off. */
export default function GiftPackCard({ cart, onNavigate }) {
  const navigate = useNavigate();
  const block = useBlock('gift_pack');
  const { data: opts } = useGiftPackOptions(cart.length > 0 && !hasPack(cart));
  if (!opts?.enabled || opts.perfumes.length === 0 || cart.length === 0 || hasPack(cart)) return null;
  const heading = fillPackText(block?.bag_heading || 'Try our Premium Gift Pack', opts);
  const text = fillPackText(block?.bag_text || '{count} perfumes of your choice, {size} ml each, in one gift box.', opts);
  const button = fillPackText(block?.bag_button || 'Build your pack', opts);
  return (
    <div className="flex gap-3 items-center rounded-xs border border-tk-ink/15 dark:border-white/15 bg-[#FAF9F6] dark:bg-[#141318] p-3.5">
      {block?.image && <img src={block.image} alt="" className="w-14 h-14 object-cover shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-[11.5px] font-bold uppercase tracking-wider text-tk-ink dark:text-white">{heading}</p>
        <p className="text-[11px] text-[#555555] dark:text-white/70 mt-0.5 leading-relaxed">{text}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          navigate('/gift-pack');
        }}
        className="shrink-0 px-3.5 py-2 bg-tk-ink dark:bg-tk-gold text-white dark:text-tk-night text-[10px] font-bold uppercase tracking-[0.12em] cursor-pointer"
      >
        {button}
      </button>
    </div>
  );
}
