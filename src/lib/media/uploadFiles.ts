import { buildStoragePath, IMAGE_TYPES, MAX_UPLOAD_BYTES, validateUpload, VIDEO_TYPES, type PreparedFile } from './upload';
import type { MediaAsset, NewMediaAsset } from './types';

export interface UploadDeps {
  prepare: (file: File) => Promise<PreparedFile>;
  put: (path: string, prepared: PreparedFile, onProgress: (fraction: number) => void) => Promise<void>;
  record: (row: NewMediaAsset & { path: string }) => Promise<MediaAsset>;
  now: () => Date;
  rand: () => string;
  onProgress: (fileName: string, fraction: number) => void;
  onError: (fileName: string, message: string) => void;
  bucket?: string;
  publicUrlFor?: (path: string) => string;
  accept?: string[];
  maxBytes?: number;
}

/** Uploads files one after another. A file that fails is reported and skipped; the rest continue. */
export async function uploadFiles(files: File[], deps: UploadDeps): Promise<MediaAsset[]> {
  const done: MediaAsset[] = [];
  const accept = deps.accept ?? [...IMAGE_TYPES, ...VIDEO_TYPES];
  for (const file of files) {
    const problem = validateUpload(file, { maxBytes: deps.maxBytes ?? MAX_UPLOAD_BYTES, accept });
    if (problem) {
      deps.onError(file.name, problem);
      continue;
    }
    try {
      deps.onProgress(file.name, 0);
      const prepared = await deps.prepare(file);
      const path = buildStoragePath(file.name, prepared.ext, deps.now(), deps.rand());
      await deps.put(path, prepared, (fraction) => deps.onProgress(file.name, fraction));
      const asset = await deps.record({
        bucket: deps.bucket ?? 'media',
        path,
        url: deps.publicUrlFor ? deps.publicUrlFor(path) : path,
        kind: prepared.type.startsWith('video/') ? 'video' : prepared.type.startsWith('image/') ? 'image' : 'other',
        mime: prepared.type,
        bytes: prepared.blob.size,
        width: prepared.width,
        height: prepared.height,
        alt: null,
        original_name: file.name,
      });
      done.push(asset);
    } catch (err) {
      deps.onError(file.name, err instanceof Error ? err.message : 'Upload failed.');
    }
  }
  return done;
}
