import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ImagePlus, Link2, Library, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { toFriendlyError } from '../../lib/errors';
import { useUpload } from '../../lib/media/useUpload';
import type { MediaAsset } from '../../lib/media/types';
import { Button } from './Button';
import { TextInput } from './Field';
import { Modal } from './Modal';

export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
}

export function MediaPreview({ url, className = 'w-full h-full object-cover' }: { url: string; className?: string }) {
  if (!url) return null;
  return isVideoUrl(url) ? <video src={url} className={className} muted playsInline preload="metadata" /> : <img src={url} alt="" className={className} loading="lazy" />;
}

/** Choose from the media library. */
export function MediaPicker({
  open,
  onOpenChange,
  onPick,
  kind,
  multiple,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onPick: (assets: MediaAsset[]) => void;
  kind?: 'image' | 'video';
  multiple?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<MediaAsset[]>([]);
  const { data = [], isLoading } = useQuery({
    queryKey: ['admin', 'media', 'picker', search, kind],
    enabled: open,
    queryFn: async () => {
      let q = supabase.from('media_assets').select('*').order('created_at', { ascending: false }).limit(120);
      if (kind) q = q.eq('kind', kind);
      const term = search.trim().replace(/[%,()]/g, '');
      if (term) q = q.or(`original_name.ilike.%${term}%,path.ilike.%${term}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as MediaAsset[];
    },
  });
  const toggle = (a: MediaAsset) =>
    setSelected((prev) => (prev.some((p) => p.id === a.id) ? prev.filter((p) => p.id !== a.id) : multiple ? [...prev, a] : [a]));
  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        if (!o) setSelected([]);
        onOpenChange(o);
      }}
      title="Media library"
      description="Pick a file you uploaded before."
      wide
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={selected.length === 0}
            onClick={() => {
              onPick(selected);
              setSelected([]);
              onOpenChange(false);
            }}
          >
            Use {selected.length > 1 ? `${selected.length} files` : 'file'}
          </Button>
        </>
      }
    >
      <TextInput placeholder="Search files" value={search} onChange={(e) => setSearch(e.target.value)} className="mb-4" aria-label="Search media" />
      {isLoading && <p className="text-[13px] text-[#4A4A4A]">Loading…</p>}
      {!isLoading && data.length === 0 && <p className="text-[13px] text-[#4A4A4A]">No files yet. Upload one first.</p>}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {data.map((a) => {
          const on = selected.some((s) => s.id === a.id);
          return (
            <button
              type="button"
              key={a.id}
              onClick={() => toggle(a)}
              className={`aspect-square bg-[#F4F3EE] border-2 overflow-hidden ${on ? 'border-tk-accent' : 'border-transparent'}`}
              title={a.original_name ?? a.path}
            >
              <MediaPreview url={a.url} className="w-full h-full object-contain" />
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

/** Upload with progress, pick from the library, or paste a link. One value. */
export function MediaField({
  value,
  onChange,
  kind,
  label = 'Add media',
}: {
  value: string;
  onChange: (url: string) => void;
  kind?: 'image' | 'video';
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const { upload, items, busy } = useUpload();
  const [picker, setPicker] = useState(false);
  const [pasting, setPasting] = useState(false);
  const [pasted, setPasted] = useState('');
  const accept = kind === 'video' ? 'video/mp4,video/webm,video/quicktime' : kind === 'image' ? 'image/*' : 'image/*,video/mp4,video/webm,video/quicktime';
  const progress = items[0];

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      const done = await upload([files[0]]);
      if (done[0]) onChange(done[0].url);
    } catch (err) {
      toast.error(toFriendlyError(err));
    } finally {
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="flex items-center gap-3">
          <div className="w-20 h-20 bg-[#F4F3EE] border border-[#E2E0DB] overflow-hidden shrink-0">
            <MediaPreview url={value} className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-[#4A4A4A] break-all line-clamp-2">{value}</p>
            <div className="flex gap-2 mt-1.5">
              <Button size="sm" variant="secondary" onClick={() => input.current?.click()} busy={busy}>
                Replace
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onChange('')} aria-label="Remove">
                <Trash2 size={12} /> Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => input.current?.click()} busy={busy}>
            <Upload size={12} /> {label}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setPicker(true)}>
            <Library size={12} /> From library
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setPasting((p) => !p)}>
            <Link2 size={12} /> Paste link
          </Button>
        </div>
      )}
      {pasting && !value && (
        <div className="flex gap-2">
          <TextInput placeholder="https://… or /images/…" value={pasted} onChange={(e) => setPasted(e.target.value)} aria-label="Media link" />
          <Button
            size="sm"
            onClick={() => {
              if (pasted.trim()) onChange(pasted.trim());
              setPasted('');
              setPasting(false);
            }}
          >
            Use
          </Button>
        </div>
      )}
      {progress && busy && (
        <div className="h-1 bg-[#EEEEEE]">
          <div className="h-1 bg-tk-accent transition-all" style={{ width: `${Math.round(progress.progress * 100)}%` }} />
        </div>
      )}
      {progress?.error && <p className="text-[12px] text-rose-600">{progress.error}</p>}
      <input ref={input} type="file" accept={accept} className="hidden" onChange={(e) => onFiles(e.target.files)} />
      <MediaPicker open={picker} onOpenChange={setPicker} kind={kind} onPick={(a) => a[0] && onChange(a[0].url)} />
    </div>
  );
}

/** Several images/videos, uploaded or picked, in order. */
export function MediaGalleryInput({ onAdd }: { onAdd: (assets: { url: string; kind: 'image' | 'video' }[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const { upload, items, busy } = useUpload();
  const [picker, setPicker] = useState(false);
  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      const done = await upload(Array.from(files));
      onAdd(done.map((a) => ({ url: a.url, kind: a.kind === 'video' ? 'video' : 'image' })));
    } catch (err) {
      toast.error(toFriendlyError(err));
    } finally {
      if (input.current) input.current.value = '';
    }
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => input.current?.click()} busy={busy}>
          <ImagePlus size={12} /> Upload photos or videos
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setPicker(true)}>
          <Library size={12} /> From library
        </Button>
      </div>
      {items.map((it) => (
        <div key={it.name} className="text-[12px]">
          <span className="text-[#454545]">{it.name}</span>{' '}
          {it.error ? <span className="text-rose-600">{it.error}</span> : <span className="text-[#4F4F4F]">{Math.round(it.progress * 100)}%</span>}
        </div>
      ))}
      <input ref={input} type="file" multiple accept="image/*,video/mp4,video/webm,video/quicktime" className="hidden" onChange={(e) => onFiles(e.target.files)} />
      <MediaPicker
        open={picker}
        onOpenChange={setPicker}
        multiple
        onPick={(assets) => onAdd(assets.map((a) => ({ url: a.url, kind: a.kind === 'video' ? 'video' : 'image' })))}
      />
    </div>
  );
}
