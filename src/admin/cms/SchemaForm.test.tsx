import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../lib/supabase', () => {
  const result = { data: [], error: null };
  const chain: any = new Proxy(() => chain, {
    get: (_t, prop) => (prop === 'then' ? (resolve: (v: unknown) => void) => resolve(result) : chain),
    apply: () => chain,
  });
  return { supabase: { rpc: async () => ({ data: null, error: null }), from: () => chain, storage: { from: () => chain } }, SUPABASE_URL: 'http://x', SUPABASE_PUBLISHABLE_KEY: 'x' };
});

import { SchemaForm } from './SchemaForm';
import type { FieldDef } from '../../cms/schema';
import { SECTION_TYPES } from '../../cms/registry';
import { BLOCK_SCHEMAS } from './blocks';

function Harness({ fields, initial, spy }: { fields: FieldDef[]; initial: Record<string, unknown>; spy: (v: unknown) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <QueryClientProvider client={new QueryClient()}>
      <SchemaForm
        fields={fields}
        value={value}
        onChange={(v) => {
          setValue(v);
          spy(v);
        }}
      />
    </QueryClientProvider>
  );
}

describe('SchemaForm', () => {
  it('edits a text field', () => {
    const spy = vi.fn();
    render(<Harness fields={[{ key: 'heading', label: 'Heading', type: 'text' }]} initial={{ heading: 'Old' }} spy={spy} />);
    fireEvent.change(screen.getByLabelText('Heading'), { target: { value: 'New heading' } });
    expect(spy).toHaveBeenLastCalledWith({ heading: 'New heading' });
  });

  it('edits a field inside a list item', () => {
    const spy = vi.fn();
    const fields: FieldDef[] = [{ key: 'tiles', label: 'Tiles', type: 'list', itemLabel: 'Tile', fields: [{ key: 'title', label: 'Title', type: 'text' }] }];
    render(<Harness fields={fields} initial={{ tiles: [{ title: 'One' }, { title: 'Two' }] }} spy={spy} />);
    fireEvent.click(screen.getByRole('button', { name: /Two/ }));
    fireEvent.change(screen.getByDisplayValue('Two'), { target: { value: 'Second' } });
    expect(spy).toHaveBeenLastCalledWith({ tiles: [{ title: 'One' }, { title: 'Second' }] });
  });

  it('adds, moves and removes list items', () => {
    const spy = vi.fn();
    const fields: FieldDef[] = [{ key: 'tiles', label: 'Tiles', type: 'list', itemLabel: 'Tile', fields: [{ key: 'title', label: 'Title', type: 'text' }] }];
    render(<Harness fields={fields} initial={{ tiles: [{ title: 'One' }] }} spy={spy} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add tile' }));
    expect(spy).toHaveBeenLastCalledWith({ tiles: [{ title: 'One' }, { title: '' }] });
    fireEvent.click(screen.getAllByRole('button', { name: 'Move up' })[1]);
    expect(spy).toHaveBeenLastCalledWith({ tiles: [{ title: '' }, { title: 'One' }] });
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0]);
    expect(spy).toHaveBeenLastCalledWith({ tiles: [{ title: 'One' }] });
  });

  it('respects a list maximum', () => {
    const fields: FieldDef[] = [{ key: 'items', label: 'Points', type: 'list', itemLabel: 'Point', max: 1, fields: [{ key: 'title', label: 'Title', type: 'text' }] }];
    render(<Harness fields={fields} initial={{ items: [{ title: 'Only' }] }} spy={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Add point' })).toBeDisabled();
  });

  it('edits a list of phrases', () => {
    const spy = vi.fn();
    render(<Harness fields={[{ key: 'items', label: 'Phrases', type: 'strings' }]} initial={{ items: ['A'] }} spy={spy} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(spy).toHaveBeenLastCalledWith({ items: ['A', ''] });
  });

  it('hides fields whose condition is not met', () => {
    const fields: FieldDef[] = [
      { key: 'show', label: 'Show extra', type: 'boolean' },
      { key: 'extra', label: 'Extra', type: 'text', showIf: { field: 'show', truthy: true } },
    ];
    render(<Harness fields={fields} initial={{ show: false }} spy={vi.fn()} />);
    expect(screen.queryByLabelText('Extra')).toBeNull();
    fireEvent.click(screen.getByRole('switch', { name: 'Show extra' }));
    expect(screen.getByLabelText('Extra')).toBeInTheDocument();
  });

  it('chooses a link by type and value', () => {
    const spy = vi.fn();
    render(<Harness fields={[{ key: 'cta', label: 'Button link', type: 'link' }]} initial={{}} spy={spy} />);
    fireEvent.change(screen.getByLabelText('Button link — goes to'), { target: { value: 'path' } });
    fireEvent.change(screen.getByLabelText('Button link — address'), { target: { value: '/shop' } });
    expect(spy).toHaveBeenLastCalledWith({ cta: { type: 'path', value: '/shop' } });
  });

  it('renders every section and block schema with real seed-shaped values without crashing', () => {
    for (const def of Object.values(SECTION_TYPES)) {
      const { unmount } = render(<Harness fields={def.fields} initial={{}} spy={vi.fn()} />);
      unmount();
    }
    for (const def of Object.values(BLOCK_SCHEMAS)) {
      const { unmount } = render(<Harness fields={def.fields} initial={{}} spy={vi.fn()} />);
      unmount();
    }
  });
});
