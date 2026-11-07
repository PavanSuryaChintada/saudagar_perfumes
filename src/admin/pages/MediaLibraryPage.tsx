import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { toFriendlyError } from '../../lib/errors';
import { useUpload } from '../../lib/media/useUpload';
import type { MediaAsset } from '../../lib/media/types';
import { PageHeader } from '../ui/PageHeader';
import { Button } from '../ui/Button';
import { TextInput } from '../ui/Field';
import { ConfirmDialog } from '../ui/ConfirmDialog';

function formatBytes(n: number | null) {
  if (!n) return '';
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaLibraryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState<MediaAsset | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const { upload, items, busy, clear } = useUpload({ bucket: 'media' });

  const { data: assets = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'media', search],
    queryFn: async () => {
      let q = supabase.from('media_assets').select('*').order('created_at', { ascending: false }).limit(200);
      const term = search.trim();
      if (term) q = q.or(`original_name.ilike.%${term.replace(/[%,()]/g, '')}%,path.ilike.%${term.replace(/[%,()]/g, '')}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as MediaAsset[];
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'media'] });

  const onFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    try {
      const done = await upload(Array.from(list));
      if (done.length) toast.success(`Uploaded ${done.length} file${done.length === 1 ? '' : 's'}.`);
      refresh();
    } catch (err) {
      toast.error(toFriendlyError(err));
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const saveAlt = async (asset: MediaAsset, alt: string) => {
    if ((asset.alt ?? '') === alt) return;
    const { error } = await supabase.from('media_assets').update({ alt }).eq('id', asset.id);
    if (error) toast.error(toFriendlyError(error));
    else {
      toast.success('Description saved.');
      refresh();
    }
  };

  const remove = async (asset: MediaAsset) => {
    const { error: storageError } = await supabase.storage.from(asset.bucket).remove([asset.path]);
    if (storageError) {
      toast.error(toFriendlyError(storageError));
      return;
    }
    const { error } = await supabase.from('media_assets').delete().eq('id', asset.id);
    if (error) toast.error(toFriendlyError(error));
    else toast.success('File deleted.');
    refresh();
  };

  return (
    <div>
      <PageHeader
        title="Media library"
        description="Every image and video uploaded to the store. Images are compressed to WebP automatically. Videos can be up to 50 MB."
        actions={
          <>
            <input ref={fileInput} type="file" multiple accept="image/*,video/mp4,video/webm,video/quicktime" className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <Button onClick={() => fileInput.current?.click()} busy={busy}>
              <Upload size={14} /> Upload files
            </Button>
          </>
        }
      />

      {items.length > 0 && (
        <div className="mb-5 border border-[#EAEAEA] bg-white p-4 space-y-2.5">
          {items.map((it) => (
            <div key={it.name}>
              <div className="flex justify-between text-[12px]">
                <span className="truncate pr-4">{it.name}</span>
                <span className={it.error ? 'text-rose-600' : 'text-[#777777]'}>{it.error ? 'Failed' : `${Math.round(it.progress * 100)}%`}</span>
              </div>
              {it.error ? (
                <p className="text-[11px] text-rose-600 mt-0.5">{it.error}</p>
              ) : (
                <div className="h-1 bg-[#EEEEEE] mt-1">
                  <div className="h-1 bg-tk-accent transition-all" style={{ width: `${it.progress * 100}%` }} />
                </div>
              )}
            </div>
          ))}
          {!busy && (
            <button type="button" onClick={clear} className="text-[11px] text-[#777777] underline underline-offset-4">
              Clear list
            </button>
          )}
        </div>
      )}

      <div className="mb-5 max-w-[360px]">
        <TextInput placeholder="Search by file name" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search media" />
      </div>

      {isLoading && <p className="text-[13px] text-[#777777]">Loading…</p>}
      {error && <p className="text-[13px] text-rose-600">{toFriendlyError(error)}</p>}
      {!isLoading && assets.length === 0 && (
        <div className="border border-dashed border-[#D5D3CC] bg-white p-10 text-center text-[13px] text-[#777777]">
          {search ? 'No files match that search.' : 'No uploads yet. Upload product photos, banners and videos here.'}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {assets.map((a) => (
          <figure key={a.id} className="bg-white border border-[#EAEAEA] flex flex-col">
            <div className="aspect-square bg-[#F4F3EE] flex items-center justify-center overflow-hidden">
              {a.kind === 'video' ? (
                <video src={a.url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
              ) : (
                <img src={a.url} alt={a.alt ?? ''} loading="lazy" className="w-full h-full object-contain" />
              )}
            </div>
            <figcaption className="p-2.5 space-y-2 text-[11px]">
              <p className="truncate text-tk-ink" title={a.original_name ?? a.path}>
                {a.original_name ?? a.path}
              </p>
              <p className="text-[#888888]">
                {[a.kind, a.width && a.height ? `${a.width}×${a.height}` : '', formatBytes(a.bytes)].filter(Boolean).join(' · ')}
              </p>
              <TextInput
                aria-label="Description for screen readers"
                placeholder="Description (alt text)"
                defaultValue={a.alt ?? ''}
                onBlur={(e) => saveAlt(a, e.target.value.trim())}
                className="text-[11px] py-1.5"
              />
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(a.url);
                      toast.success('Link copied.');
                    } catch {
                      toast.error("Couldn't copy. Select the link from the file instead.");
                    }
                  }}
                >
                  <Copy size={12} /> Copy link
                </Button>
                <Button size="sm" variant="secondary" aria-label="Delete file" onClick={() => setPendingDelete(a)}>
                  <Trash2 size={12} />
                </Button>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Delete this file?"
        description="It will disappear from any page that still uses it. This can't be undone."
        confirmLabel="Delete"
        danger
        onConfirm={() => (pendingDelete ? remove(pendingDelete) : undefined)}
      />
    </div>
  );
}
