// Videos that ship with the site have a still frame in /videos/posters, shown while the video loads (or when a
// phone saves data and does not play it), so a tile is never an empty black box.

export function posterFor(video: string | null | undefined, chosen?: string | null): string | undefined {
  if (chosen) return chosen;
  const m = /^\/videos\/(?:[^/]+\/)*([^/]+)\.mp4$/i.exec(String(video ?? ''));
  return m ? `/videos/posters/${m[1]}.jpg` : undefined;
}
