import { useCallback, useState } from 'react';
import { supabase, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../supabase';
import { prepareFile, publicUrl, uploadWithProgress } from './upload';
import { uploadFiles } from './uploadFiles';
import type { MediaAsset } from './types';

export interface UploadItem {
  name: string;
  progress: number;
  error?: string;
}

/** The one upload path for every uploader in the app (spec §11.5). */
export function useUpload({ bucket = 'media' }: { bucket?: string } = {}) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [busy, setBusy] = useState(false);

  const patch = (name: string, next: Partial<UploadItem>) =>
    setItems((prev) => prev.map((it) => (it.name === name ? { ...it, ...next } : it)));

  const upload = useCallback(
    async (files: File[]): Promise<MediaAsset[]> => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Please sign in again to upload.');
      setBusy(true);
      setItems(files.map((f) => ({ name: f.name, progress: 0 })));
      try {
        return await uploadFiles(files, {
          bucket,
          prepare: prepareFile,
          put: (path, prepared, onProgress) =>
            uploadWithProgress({
              baseUrl: SUPABASE_URL,
              apiKey: SUPABASE_PUBLISHABLE_KEY,
              accessToken: token,
              bucket,
              path,
              body: prepared.blob,
              contentType: prepared.type,
              onProgress,
            }),
          record: async (row) => {
            const { data: inserted, error } = await supabase.from('media_assets').insert(row).select().single();
            if (error) throw error;
            return inserted as MediaAsset;
          },
          publicUrlFor: (path) => publicUrl(SUPABASE_URL, bucket, path),
          now: () => new Date(),
          rand: () => Math.random().toString(36).slice(2, 8),
          onProgress: (name, progress) => patch(name, { progress }),
          onError: (name, error) => patch(name, { error }),
        });
      } finally {
        setBusy(false);
      }
    },
    [bucket],
  );

  return { upload, items, busy, clear: () => setItems([]) };
}
