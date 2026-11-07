import { describe, expect, it, vi } from 'vitest';
import { uploadFiles } from './uploadFiles';

function fakeFile(name: string, type: string, size = 1000): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe('uploadFiles', () => {
  it('keeps uploading the rest when one file is refused', async () => {
    const progress: Record<string, number> = {};
    const errors: Record<string, string> = {};
    const result = await uploadFiles(
      [fakeFile('a.png', 'image/png'), fakeFile('b.heic', 'image/heic'), fakeFile('c.mp4', 'video/mp4')],
      {
        prepare: async (f) => ({ blob: f, type: f.type, ext: f.name.split('.').pop()!, width: null, height: null }),
        put: async (_path, _prepared, onProgress) => onProgress(1),
        record: async (row) => ({ id: row.path, ...row }),
        now: () => new Date('2026-11-07T10:00:00Z'),
        rand: () => 'r1',
        onProgress: (name, p) => (progress[name] = p),
        onError: (name, msg) => (errors[name] = msg),
      },
    );
    expect(result.map((a) => a.path)).toEqual(['images/2026/11/a-r1.png', 'videos/2026/11/c-r1.mp4']);
    expect(errors['b.heic']).toMatch(/Use JPG, PNG, WebP/);
    expect(progress['a.png']).toBe(1);
    expect(progress['c.mp4']).toBe(1);
  });

  it('reports an upload failure for that file only', async () => {
    const errors: Record<string, string> = {};
    const record = vi.fn(async (row) => ({ id: '1', ...row }));
    const result = await uploadFiles([fakeFile('x.png', 'image/png')], {
      prepare: async (f) => ({ blob: f, type: f.type, ext: 'png', width: 10, height: 10 }),
      put: async () => {
        throw new Error('The resource already exists');
      },
      record,
      now: () => new Date(),
      rand: () => 'r',
      onProgress: () => {},
      onError: (name, msg) => (errors[name] = msg),
    });
    expect(result).toEqual([]);
    expect(errors['x.png']).toBe('The resource already exists');
    expect(record).not.toHaveBeenCalled();
  });
});
