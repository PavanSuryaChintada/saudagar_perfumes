import { useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Download, FileUp } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { toFriendlyError } from '../../lib/errors';
import { fetchAll } from '../../lib/fetchAll';
import { PageHeader, Panel } from '../ui/PageHeader';
import { Button } from '../ui/Button';
import { downloadCsv } from '../export/csv';
import { rpc, throwIf, useCategories, useCollectionsAdmin, useInvalidateCatalog, useNotes } from '../catalog/api';
import { slugify, toSavePayload } from '../catalog/productForm';
import {
  IMPORT_TEMPLATE, diffPriceStock, planImport, priceStockSheet, resolveIds,
  type Lookup, type PlannedProduct, type SheetProblem, type SizeChange, type VariantRow,
} from '../bulk/sheets';

const today = () => new Date().toISOString().slice(0, 10);

function useVariantRows() {
  return useQuery({
    queryKey: ['admin', 'catalog', 'variant-sheet'],
    queryFn: async () => {
      const rows = await fetchAll<{
        sku: string; label: string; kind: string; price: number | null; compare_at_price: number | null; stock: number; product_id: string;
        products: { name: string; base_price: number; archived_at: string | null; stock_unit: 'ml' | 'piece'; stock_ml: number } | null;
      }>((from, to) =>
        supabase
          .from('product_variants')
          .select('sku, label, kind, price, compare_at_price, stock, product_id, products!inner(name, base_price, archived_at, stock_unit, stock_ml)', { count: 'exact' })
          .order('sku')
          .range(from, to) as never,
      );
      return rows
        .filter((r) => r.products && !r.products.archived_at)
        .map<VariantRow>((r) => ({
          sku: r.sku,
          product_id: r.product_id,
          product: r.products!.name,
          stock_unit: r.products!.stock_unit,
          liquid_ml: Number(r.products!.stock_ml),
          label: r.label,
          kind: r.kind,
          base_price: Number(r.products!.base_price),
          price: r.price === null ? null : Number(r.price),
          compare_at_price: r.compare_at_price === null ? null : Number(r.compare_at_price),
          stock: r.stock,
        }))
        .sort((a, b) => a.product.localeCompare(b.product) || a.label.localeCompare(b.label));
    },
  });
}

function FilePick({ onText, label }: { onText: (text: string, name: string) => void; label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          if (!/\.csv$/i.test(f.name)) return toast.error('Save the sheet as CSV first (Excel: File → Save as → CSV UTF-8; Google Sheets: File → Download → CSV).');
          onText(await f.text(), f.name);
        }}
      />
      <Button onClick={() => ref.current?.click()}>
        <FileUp size={14} /> {label}
      </Button>
    </>
  );
}

function Problems({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="border border-rose-200 bg-rose-50 px-4 py-3">
      <p className="text-[14px] font-medium text-rose-800 mb-1">
        {items.length} {items.length === 1 ? 'row has a problem' : 'rows have problems'} and will be skipped
      </p>
      <ul className="text-[13px] text-rose-800 list-disc pl-5 space-y-0.5 max-h-48 overflow-y-auto">
        {items.map((m, i) => <li key={i}>{m}</li>)}
      </ul>
    </div>
  );
}

// ============================================================ prices and stock
function PriceStockTab() {
  const { data: rows = [], isLoading, refetch } = useVariantRows();
  const invalidate = useInvalidateCatalog();
  const [file, setFile] = useState<string | null>(null);
  const [plan, setPlan] = useState<{ changes: SizeChange[]; problems: SheetProblem[]; rows: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const counts = useMemo(() => {
    const c = plan?.changes ?? [];
    return { price: c.filter((x) => x.price || x.compare_at_price).length, stock: c.filter((x) => x.stock || x.liquid).length };
  }, [plan]);

  return (
    <div className="space-y-5">
      <Panel title="1 · Download the current sheet" description="Every bottle size and sample vial with its SKU, price and stock, ready for Excel or Google Sheets.">
        <Button variant="secondary" disabled={isLoading || !rows.length} onClick={() => downloadCsv(`prices-and-stock-${today()}.csv`, priceStockSheet(rows))}>
          <Download size={14} /> Download {rows.length ? `${rows.length} sizes` : 'sheet'}
        </Button>
        <ul className="mt-3 text-[13px] text-[#454545] list-disc pl-5 space-y-1">
          <li>Change <strong>Price</strong>, <strong>Compare-at price</strong>, <strong>Liquid left (ml)</strong> for perfumes, or <strong>Stock</strong> for sets and accessories. Don't change the SKU; it's how each row is matched.</li>
          <li>An empty Price means the size uses the product's base price. A perfume's liquid is shared by its sizes, so it repeats on each of its rows; change it on any one. Every change is logged in the stock history.</li>
          <li>You can delete rows or columns you aren't changing. Save as CSV.</li>
        </ul>
      </Panel>

      <Panel title="2 · Upload it and check the changes" description="Nothing is saved until you press Apply.">
        <div className="flex flex-wrap items-center gap-3">
          <FilePick
            label="Upload edited sheet (CSV)"
            onText={(text, name) => {
              setFile(name);
              setPlan(diffPriceStock(text, rows));
            }}
          />
          {file && <span className="text-[13px] text-[#454545]">{file}</span>}
        </div>

        {plan && (
          <div className="mt-5 space-y-4">
            <p className="text-[14px] text-tk-ink">
              {plan.changes.length
                ? `${plan.changes.length} ${plan.changes.length === 1 ? 'size changes' : 'sizes change'}: ${counts.price} price, ${counts.stock} stock.`
                : 'Nothing changes: the sheet matches the store.'}{' '}
              <span className="text-[#4A4A4A]">({plan.rows} rows read)</span>
            </p>
            <Problems items={plan.problems.map((p) => `Row ${p.line}${p.sku ? ` · ${p.sku}` : ''}: ${p.message}`)} />
            {plan.changes.length > 0 && (
              <div className="border border-[#E2E0DB] overflow-x-auto max-h-[420px]">
                <table className="w-full text-[13.5px] min-w-[640px]">
                  <thead className="sticky top-0 bg-[#F8F7F5]">
                    <tr className="text-left text-[12px] border-b border-[#E2E0DB] font-medium">
                      <th className="px-3 py-2 font-medium">Size</th>
                      <th className="px-3 py-2 font-medium">Price</th>
                      <th className="px-3 py-2 font-medium">Compare-at</th>
                      <th className="px-3 py-2 font-medium">Liquid / stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9E7E2]">
                    {plan.changes.map((c) => (
                      <tr key={c.sku}>
                        <td className="px-3 py-2">
                          {c.product} · {c.label}
                          <span className="block text-[12px] font-mono text-[#4A4A4A]">{c.sku}</span>
                        </td>
                        {(['price', 'compare_at_price', 'stock'] as const).map((k) => {
                          const ch = k === 'stock' ? c.liquid ?? c.stock : c[k];
                          return (
                          <td key={k} className="px-3 py-2 tabular-nums">
                            {ch ? (
                              <>
                                <span className="text-[#575757] line-through mr-1.5">{ch.from}</span>
                                <span className="font-medium text-tk-ink">{ch.to}</span>
                              </>
                            ) : (
                              <span className="text-[#666666]">—</span>
                            )}
                          </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                busy={busy}
                disabled={!plan.changes.length}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const r = await rpc<{ updated: number; stock_changes: number; errors: { sku: string; message: string }[] }>('bulk_update_variants', {
                      p_rows: plan.changes.map((c) => c.payload),
                    });
                    toast.success(`${r.updated} sizes updated${r.stock_changes ? `, ${r.stock_changes} stock changes logged` : ''}.`);
                    if (r.errors.length) toast.warning(`${r.errors.length} rows were refused`, { description: r.errors.slice(0, 6).map((e) => `${e.sku}: ${e.message}`).join('  ·  '), duration: 12000 });
                    await Promise.all([invalidate(), refetch()]);
                    setPlan(null);
                    setFile(null);
                  } catch (err) {
                    toast.error(toFriendlyError(err));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Apply {plan.changes.length} changes
              </Button>
              <Button variant="secondary" disabled={busy} onClick={() => { setPlan(null); setFile(null); }}>Cancel</Button>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}

// ============================================================ import new products
function ImportTab() {
  const { data: categories = [], refetch: refetchCategories } = useCategories();
  const { data: collections = [], refetch: refetchCollections } = useCollectionsAdmin();
  const { data: notes = [], refetch: refetchNotes } = useNotes();
  const { data: variants = [] } = useVariantRows();
  const { data: slugs = [] } = useQuery({
    queryKey: ['admin', 'catalog', 'all-slugs'],
    queryFn: async () => ((await throwIf(supabase.from('products').select('slug'))) as { slug: string }[]).map((r) => r.slug),
  });
  const invalidate = useInvalidateCatalog();
  const [plan, setPlan] = useState<{ products: PlannedProduct[]; problems: string[]; file: string } | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [results, setResults] = useState<{ handle: string; name: string; id?: string; error?: string }[] | null>(null);

  const ready = plan?.products.filter((p) => !p.errors.length) ?? [];
  const blocked = plan?.products.filter((p) => p.errors.length) ?? [];
  const toCreate = useMemo(() => {
    const u = (k: 'categories' | 'collections' | 'notes') => [...new Set(ready.flatMap((p) => p.create[k]))];
    return { categories: u('categories'), collections: u('collections'), notes: u('notes') };
  }, [ready]);

  const freeSlug = (name: string, taken: string[]) => {
    const base = slugify(name) || 'item';
    let slug = base;
    for (let i = 2; taken.includes(slug); i += 1) slug = `${base}-${i}`;
    return slug;
  };

  const runImport = async () => {
    setResults(null);
    try {
      // 1. Everything the products need: missing categories, collections and notes.
      const cats: Lookup[] = [...categories];
      for (const name of toCreate.categories) {
        setProgress(`Creating category “${name}”…`);
        const leaf = name.split(/>|›/).pop()!.trim();
        const row = (await throwIf(supabase.from('categories').insert({ name: leaf, slug: freeSlug(leaf, cats.map((c) => c.slug ?? '')) }).select('id, name, slug').single())) as Lookup;
        cats.push(row);
      }
      const cols: Lookup[] = [...collections];
      for (const name of toCreate.collections) {
        setProgress(`Creating collection “${name}”…`);
        cols.push((await throwIf(supabase.from('collections').insert({ name, slug: freeSlug(name, cols.map((c) => c.slug ?? '')) }).select('id, name, slug').single())) as Lookup);
      }
      const nts: Lookup[] = [...notes];
      for (const name of toCreate.notes) {
        setProgress(`Adding note “${name}”…`);
        nts.push((await throwIf(supabase.from('notes').insert({ name, slug: freeSlug(name, nts.map((n) => n.slug ?? '')) }).select('id, name, slug').single())) as Lookup);
      }
      // 2. The products, one by one, so one problem doesn't stop the rest.
      const out: { handle: string; name: string; id?: string; error?: string }[] = [];
      for (const [i, p] of ready.entries()) {
        setProgress(`Importing ${i + 1} of ${ready.length}: ${p.form.name}`);
        try {
          const id = await rpc<string>('save_product', { payload: toSavePayload(resolveIds(p, { categories: cats, collections: cols, notes: nts })) });
          out.push({ handle: p.handle, name: p.form.name, id });
        } catch (err) {
          out.push({ handle: p.handle, name: p.form.name, error: toFriendlyError(err) });
        }
      }
      setResults(out);
      setPlan(null);
      const ok = out.filter((r) => r.id).length;
      toast.success(`${ok} product${ok === 1 ? '' : 's'} imported.`);
    } catch (err) {
      toast.error(toFriendlyError(err));
    } finally {
      setProgress(null);
      await Promise.all([invalidate(), refetchCategories(), refetchCollections(), refetchNotes()]);
    }
  };

  return (
    <div className="space-y-5">
      <Panel title="1 · Download the template" description="One row per bottle size. Product details go on the first row of each product; the next rows with the same handle add more sizes.">
        <Button variant="secondary" onClick={() => downloadCsv('product-import-template.csv', IMPORT_TEMPLATE)}>
          <Download size={14} /> Download template
        </Button>
        <ul className="mt-3 text-[13px] text-[#454545] list-disc pl-5 space-y-1">
          <li><strong>handle</strong> becomes the web address (amber-noir → /product/amber-noir). Rows with the same handle are one product.</li>
          <li><strong>main_category</strong> is required. Separate several categories, collections or notes with a | bar, e.g. <em>Saffron | Rose</em>.</li>
          <li>Categories, collections and notes that don't exist yet are created for you.</li>
          <li><strong>kept_as</strong>: ml for perfumes (then <strong>liquid_in_stock</strong> with <strong>liquid_unit</strong> ml, L or tola), or pieces for sets and accessories (then a <strong>stock</strong> count on each size row).</li>
          <li><strong>size_price</strong> empty = the base price. <strong>live</strong> = yes to sell straight away; otherwise the product is saved as a draft.</li>
          <li>Add photos, the scent profile and the story afterwards on each product's page.</li>
        </ul>
      </Panel>

      <Panel title="2 · Upload the filled sheet and check it" description="Nothing is saved until you press Import.">
        <FilePick
          label="Upload product sheet (CSV)"
          onText={(text, file) => {
            setResults(null);
            const r = planImport(text, {
              categories,
              collections,
              notes,
              existingSlugs: new Set(slugs),
              existingSkus: new Set(variants.map((v) => v.sku.toUpperCase())),
            });
            setPlan({ ...r, file });
          }}
        />

        {plan && (
          <div className="mt-5 space-y-4">
            <p className="text-[14px]">
              <strong>{plan.file}</strong>: {ready.length} product{ready.length === 1 ? '' : 's'} ready to import
              {blocked.length > 0 && `, ${blocked.length} with problems (skipped)`}.
            </p>
            <Problems items={[...plan.problems, ...blocked.flatMap((p) => p.errors.map((e) => `Row ${p.line} · ${p.form.name || p.handle}: ${e}`))]} />
            {(toCreate.categories.length > 0 || toCreate.collections.length > 0 || toCreate.notes.length > 0) && (
              <div className="border border-sky-200 bg-sky-50 px-4 py-3 text-[13px] text-sky-900 space-y-1">
                <p className="font-medium">These will be created:</p>
                {toCreate.categories.length > 0 && <p>Categories: {toCreate.categories.join(', ')}</p>}
                {toCreate.collections.length > 0 && <p>Collections: {toCreate.collections.join(', ')}</p>}
                {toCreate.notes.length > 0 && <p>Notes: {toCreate.notes.join(', ')}</p>}
              </div>
            )}
            {ready.length > 0 && (
              <ul className="border border-[#E2E0DB] divide-y divide-[#E9E7E2] max-h-[360px] overflow-y-auto">
                {ready.map((p) => (
                  <li key={p.handle} className="px-3 py-2 flex flex-wrap gap-x-4 gap-y-1 text-[13.5px]">
                    <span className="font-medium">{p.form.name}</span>
                    <span className="text-[#4A4A4A]">/{p.handle}</span>
                    <span className="text-[#454545]">{p.mainCategory}</span>
                    <span className="text-[#454545]">{p.sizes} size{p.sizes === 1 ? '' : 's'}</span>
                    <span className="text-[#454545]">{p.noteNames.length} notes</span>
                    <span className={p.form.is_active ? 'text-emerald-700' : 'text-amber-700'}>{p.form.is_active ? 'live' : 'draft'}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <Button busy={!!progress} disabled={!ready.length} onClick={runImport}>
                Import {ready.length} product{ready.length === 1 ? '' : 's'}
              </Button>
              <Button variant="secondary" disabled={!!progress} onClick={() => setPlan(null)}>Cancel</Button>
              {progress && <span role="status" className="text-[13px] text-[#454545]">{progress}</span>}
            </div>
          </div>
        )}

        {results && (
          <div className="mt-5 border border-[#E2E0DB]">
            <p className="px-3 py-2 bg-[#F8F7F5] text-[14px] font-medium">Import finished</p>
            <ul className="divide-y divide-[#E9E7E2]">
              {results.map((r) => (
                <li key={r.handle} className="px-3 py-2 text-[13.5px] flex flex-wrap gap-3 justify-between">
                  <span>{r.name}</span>
                  {r.id ? (
                    <Link to={`/admin/products/${r.id}`} className="underline underline-offset-4">Open to add photos →</Link>
                  ) : (
                    <span className="text-rose-700">{r.error}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Panel>
    </div>
  );
}

export default function SpreadsheetsPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'import' ? 'import' : 'prices';
  return (
    <div className="max-w-[1000px]">
      <PageHeader
        title="Spreadsheets"
        description="Change many prices and stock counts at once, or add many products, using Excel or Google Sheets."
      />
      <div role="tablist" aria-label="Spreadsheet tasks" className="flex gap-1 mb-5 border-b border-[#E2E0DB]">
        {[
          ['prices', 'Update prices & stock'],
          ['import', 'Import new products'],
        ].map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setParams(k === 'prices' ? {} : { tab: k })}
            className={`px-4 py-2.5 text-[14px] border-b-2 -mb-px ${tab === k ? 'border-tk-accent text-tk-ink font-semibold' : 'border-transparent text-[#454545] hover:text-tk-ink'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'prices' ? <PriceStockTab /> : <ImportTab />}
    </div>
  );
}
