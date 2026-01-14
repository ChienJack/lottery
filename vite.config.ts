import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Set base to "./" so file:// loads work in Electron without a dev server.
export default defineConfig({
  base: './',
  plugins: [vue()],
});
