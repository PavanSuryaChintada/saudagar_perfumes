import { writeFileSync } from 'node:fs';
import * as m from '../../src/data/bluorngSaudagarData.js';
const out = {
  stories: m.STORY_REELS,
  stockists: m.BOUTIQUE_STORES,
  gallery: m.DISCOVER_GALLERY_TILES,
  searches: m.POPULAR_SEARCHES_TABS,
  megamenu: m.MEGA_MENU_COLLECTIONS,
  notifications: m.NOTIFICATIONS,
};
writeFileSync('scripts/tmp/data.json', JSON.stringify(out, null, 1));
console.log(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, Array.isArray(v) ? v.length : Object.keys(v)])));
