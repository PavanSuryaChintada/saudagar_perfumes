import { describe, expect, it } from 'vitest';
import { posterFor } from './media';

describe('posterFor', () => {
  it('finds the still frame saved next to a video that ships with the site', () => {
    expect(posterFor('/videos/Perfume_bottles_in_royal_palace_e1347222_1080p.mp4')).toBe('/videos/posters/Perfume_bottles_in_royal_palace_e1347222_1080p.jpg');
    expect(posterFor('/videos/meganavbar/Perfume_bottle_on_marble_pedestal_215e9d92_1080p.mp4')).toBe(
      '/videos/posters/Perfume_bottle_on_marble_pedestal_215e9d92_1080p.jpg',
    );
  });

  it('prefers the picture the admin chose', () => {
    expect(posterFor('/videos/a.mp4', '/images/own.jpg')).toBe('/images/own.jpg');
  });

  it('has nothing for uploaded videos or no video', () => {
    expect(posterFor('https://cdn.example.com/v.mp4')).toBeUndefined();
    expect(posterFor('')).toBeUndefined();
    expect(posterFor(null)).toBeUndefined();
  });
});
