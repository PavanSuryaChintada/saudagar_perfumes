import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Every query resolves to "nothing yet" so sections render their empty state.
vi.mock('../lib/supabase', () => {
  const result = { data: [], error: null };
  const chain: any = new Proxy(() => chain, {
    get: (_t, prop) => (prop === 'then' ? (resolve: (v: unknown) => void) => resolve(result) : chain),
    apply: () => chain,
  });
  return { supabase: { rpc: async () => ({ data: null, error: null }), from: () => chain }, SUPABASE_URL: 'http://x', SUPABASE_PUBLISHABLE_KEY: 'x' };
});

import { SECTION_TYPES } from './registry';
import { emptyValueFor } from './schema';

function renderSection(type: string, config: Record<string, unknown>) {
  const C = SECTION_TYPES[type].component;
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <C config={config} wishlist={[]} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('section registry', () => {
  it('has a label, description and component for every type', () => {
    for (const [type, def] of Object.entries(SECTION_TYPES)) {
      expect(def.label, type).toBeTruthy();
      expect(def.description, type).toBeTruthy();
      expect(def.component, type).toBeTruthy();
    }
  });

  for (const type of Object.keys(SECTION_TYPES)) {
    it(`${type} renders with empty settings and invents no text`, () => {
      const { container } = renderSection(type, {});
      // No content may come from component code: an empty section shows at most UI control labels.
      const CONTROLS = ['Sound Off', 'Sound On', 'Auto-scrolling', 'Paused ⏸', 'All notes', 'Subscribe'];
      let text = container.textContent ?? '';
      for (const c of CONTROLS) text = text.split(c).join('');
      expect(text.replace(/[→↓↑✦•·|\s+]/g, '')).toBe('');
    });

    it(`${type} renders with every field set to its empty value`, () => {
      const empty = Object.fromEntries(SECTION_TYPES[type].fields.map((f) => [f.key, emptyValueFor(f)]));
      expect(() => renderSection(type, empty)).not.toThrow();
    });
  }
});
