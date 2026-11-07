export interface MediaAsset {
  id: string;
  bucket: string;
  path: string;
  url: string;
  kind: 'image' | 'video' | 'other';
  mime: string | null;
  bytes: number | null;
  width: number | null;
  height: number | null;
  alt: string | null;
  original_name: string | null;
  created_at?: string;
}

export type NewMediaAsset = Omit<MediaAsset, 'id' | 'created_at'>;
