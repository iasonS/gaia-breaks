import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ command }) => ({
  plugins: command === 'build' ? [viteSingleFile()] : [],
  build: { assetsInlineLimit: 100000000, cssCodeSplit: false },
}));
