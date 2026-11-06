import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function heroVideosPlugin() {
  const syncVideos = () => {
    const rootDir = typeof import.meta !== 'undefined' && import.meta.dirname ? import.meta.dirname : process.cwd();
    const videosDir = path.resolve(rootDir, 'public/videos');
    const outFile = path.resolve(rootDir, 'src/data/heroVideos.json');

    if (!fs.existsSync(videosDir)) {
      fs.mkdirSync(videosDir, { recursive: true });
    }

    const files = fs
      .readdirSync(videosDir)
      .filter((f) => /\.(mp4|webm|mov|m4v)$/i.test(f) && !f.startsWith('.'))
      .sort((a, b) => {
        if (a.includes('Perfume_bottles_in_royal_palace')) return -1;
        if (b.includes('Perfume_bottles_in_royal_palace')) return 1;
        if (a.includes('Automotive_Noir_Night')) return -1;
        if (b.includes('Automotive_Noir_Night')) return 1;
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
      });

    const videoList = files.map((file, idx) => {
      let title = file
        .replace(/\.(mp4|webm|mov|m4v)$/i, '')
        .replace(/[_]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      return {
        id: `hero-vid-${idx + 1}`,
        src: `/videos/${encodeURIComponent(file)}`,
        filename: file,
        label: String(idx + 1).padStart(2, '0'),
        title: title || `Campaign Film ${idx + 1}`
      };
    });

    const dir = path.dirname(outFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const currentContent = fs.existsSync(outFile) ? fs.readFileSync(outFile, 'utf8') : '';
    const newContent = JSON.stringify(videoList, null, 2);

    if (currentContent !== newContent) {
      fs.writeFileSync(outFile, newContent, 'utf8');
      console.log(`[hero-videos] Dynamically synced ${videoList.length} hero videos into src/data/heroVideos.json`);
    }

    return videoList;
  };

  return {
    name: 'vite-plugin-hero-videos',
    buildStart() {
      syncVideos();
    },
    configureServer(server) {
      syncVideos();
      const rootDir = typeof import.meta !== 'undefined' && import.meta.dirname ? import.meta.dirname : process.cwd();
      const videosDir = path.resolve(rootDir, 'public/videos');
      server.watcher.add(videosDir);
      server.watcher.on('all', (event, filePath) => {
        if (filePath.includes('public/videos') && /\.(mp4|webm|mov|m4v)$/i.test(filePath)) {
          syncVideos();
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), heroVideosPlugin()],
});
