import React from 'react';
import { formatINR } from '../../lib/money';
import { PLACEHOLDER_IMAGE } from '../catalog/adapter';
import { groupPicks } from '../giftpack/packMath';

/** A gift pack in the bag or at checkout: what's in it, its price, and its free sample. */
export default function PackLine({ item, line, problem, onRemove, compact = false }) {
  const name = line?.name || item.name || 'Gift pack';
  const image = line?.image || item.image || line?.picks?.[0]?.image || PLACEHOLDER_IMAGE;
  const contents = line?.picks ? groupPicks(line.picks) : [];
  const price = line?.unit_price ?? item.price ?? 0;
  return (
    <div className="flex gap-3.5 pb-4">
      <div className={`${compact ? 'w-14' : 'w-20'} aspect-[4/5] bg-[#F7F7F6] dark:bg-[#18171C] flex items-center justify-center p-1.5 overflow-hidden rounded-xs shrink-0`}>
        <img src={image} alt={name} className="w-full h-full object-contain" />
      </div>
      <div className="flex-1 min-w-0 text-[12px]">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-bold uppercase tracking-wider text-tk-ink dark:text-white leading-tight">{name}</h4>
          {onRemove && (
            <button onClick={onRemove} className="text-[#5F5F5F] dark:text-white/50 hover:text-rose-600 transition-colors cursor-pointer" title="Remove pack" aria-label="Remove pack">
              ✕
            </button>
          )}
        </div>
        {line?.label && <p className="text-[12px] text-[#666666] dark:text-white/60 uppercase tracking-wider mt-1">{line.label}</p>}
        {contents.length > 0 && (
          <ul className="mt-1.5 space-y-0.5 text-[12px] text-[#444444] dark:text-white/75">
            {contents.map((c) => (
              <li key={c.product_id}>
                {c.name}
                {c.n > 1 && <span className="text-[#666666] dark:text-white/55"> × {c.n}</span>}
              </li>
            ))}
          </ul>
        )}
        {line?.sample_ml > 0 && (
          <p className="mt-1.5 text-[12px] text-tk-accent-ink dark:text-tk-accent-night font-semibold">
            + Free {Number(line.sample_ml)} ml sample, chosen for you
          </p>
        )}
        {problem && (
          <p role="alert" className="text-[12px] text-rose-600 dark:text-rose-400 mt-1 font-semibold">
            {problem.message}
          </p>
        )}
        <p className="mt-2 text-right">
          {line?.compare_at_price > price && <span className="line-through text-[#5F5F5F] dark:text-white/50 mr-1.5">{formatINR(line.compare_at_price)}</span>}
          <span className="font-bold text-[12.5px] text-tk-ink dark:text-white">{formatINR(price)}</span>
        </p>
      </div>
    </div>
  );
}
