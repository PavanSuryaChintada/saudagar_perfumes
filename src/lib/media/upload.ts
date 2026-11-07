import { istParts } from '../ist';

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // Supabase free plan per-file limit
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif'];
export const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const VIDEO_EXTS = ['mp4', 'webm', 'mov', 'm4v'];
const PASSTHROUGH_TYPES = ['image/gif', 'image/svg+xml'];

export function fitWithin(width: number, height: number, max = 2400): { width: number; height: number } {
  const longEdge = Math.max(width, height);
  if (longEdge <= max) return { width, height };
  const scale = max / longEdge;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export function validateUpload(
  file: { size: number; type: string; name?: string },
  opts: { maxBytes: number; accept: string[] },
): string | null {
  if (!opts.accept.includes(file.type)) {
    return "This file type isn't supported. Use JPG, PNG, WebP, GIF, SVG or AVIF for images, and MP4, WebM or MOV for video.";
  }
  if (file.size > opts.maxBytes) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    const limit = Math.round(opts.maxBytes / (1024 * 1024));
    return `${file.name ? `"${file.name}" is` : 'This file is'} ${mb} MB. The limit is ${limit} MB.`;
  }
  return null;
}

function slugify(name: string): string {
  const base = name.replace(/\.[^.]+$/, '');
  return (
    base
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'file'
  );
}

export function buildStoragePath(originalName: string, ext: string, now: Date, rand: string): string {
  const { year, month } = istParts(now);
  const folder = VIDEO_EXTS.includes(ext.toLowerCase()) ? 'videos' : 'images';
  return `${folder}/${year}/${month}/${slugify(originalName)}-${rand}.${ext.toLowerCase()}`;
}

export function publicUrl(baseUrl: string, bucket: string, path: string): string {
  return `${baseUrl}/storage/v1/object/public/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`;
}

export function extensionOf(name: string, type: string): string {
  const fromName = name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';
  if (fromName) return fromName;
  const map: Record<string, string> = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
    'image/svg+xml': 'svg', 'image/avif': 'avif', 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov',
  };
  return map[type] ?? 'bin';
}

export interface PreparedFile {
  blob: Blob;
  type: string;
  ext: string;
  width: number | null;
  height: number | null;
}

/** Images (except GIF/SVG) are re-encoded to WebP with the long edge capped at 2400 px. */
export async function prepareFile(file: File): Promise<PreparedFile> {
  if (VIDEO_TYPES.includes(file.type) || PASSTHROUGH_TYPES.includes(file.type)) {
    return { blob: file, type: file.type, ext: extensionOf(file.name, file.type), width: null, height: null };
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Couldn't read this image. Use JPG, PNG or WebP.");
  }
  const size = fitWithin(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not process this image.');
  ctx.drawImage(bitmap, 0, 0, size.width, size.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82));
  if (!blob) throw new Error('Your browser could not process this image.');
  return { blob, type: 'image/webp', ext: 'webp', ...size };
}

export function uploadWithProgress(args: {
  baseUrl: string;
  apiKey: string;
  accessToken: string;
  bucket: string;
  path: string;
  body: Blob;
  contentType: string;
  onProgress: (fraction: number) => void;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${args.baseUrl}/storage/v1/object/${args.bucket}/${args.path}`);
    xhr.setRequestHeader('Authorization', `Bearer ${args.accessToken}`);
    xhr.setRequestHeader('apikey', args.apiKey);
    xhr.setRequestHeader('Content-Type', args.contentType);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.setRequestHeader('cache-control', 'max-age=31536000');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) args.onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        args.onProgress(1);
        resolve();
        return;
      }
      let message = `Upload failed (${xhr.status}).`;
      try {
        const data = JSON.parse(xhr.responseText);
        message = data.message || data.error || message;
      } catch {
        // response was not JSON; keep the status message
      }
      reject(new Error(message));
    };
    xhr.onerror = () => reject(new Error('Upload failed: check your connection and try again.'));
    xhr.send(args.body);
  });
}
