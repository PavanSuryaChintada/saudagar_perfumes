import { supabase } from '../supabase';
import { IMAGE_TYPES, VIDEO_TYPES, MAX_UPLOAD_BYTES, prepareFile, validateUpload } from './upload';

/**
 * Customer uploads (returns, reviews) go to a private bucket under the customer's own folder:
 * {uid}/{folder}/{random}.{ext}. Returns the storage path.
 */
export async function uploadPrivate(bucket: 'returns' | 'reviews', file: File, folder: string): Promise<string> {
  const problem = validateUpload(file, { maxBytes: MAX_UPLOAD_BYTES, accept: [...IMAGE_TYPES, ...VIDEO_TYPES] });
  if (problem) throw new Error(problem);
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Please sign in again.');
  const prepared = await prepareFile(file);
  const rand = Math.random().toString(36).slice(2, 10);
  const path = `${auth.user.id}/${folder}/${Date.now().toString(36)}-${rand}.${prepared.ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, prepared.blob, { contentType: prepared.type, upsert: false });
  if (error) throw error;
  return path;
}

/** Short-lived links for private files (admin review, customer's own view). */
export async function signedUrls(bucket: 'returns' | 'reviews', paths: string[], seconds = 3600): Promise<Record<string, string>> {
  if (!paths.length) return {};
  const { data, error } = await supabase.storage.from(bucket).createSignedUrls(paths, seconds);
  if (error) throw error;
  return Object.fromEntries((data ?? []).filter((d) => d.signedUrl).map((d) => [d.path ?? '', d.signedUrl as string]));
}
