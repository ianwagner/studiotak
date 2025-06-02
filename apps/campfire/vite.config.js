// apps/campfire/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@studio-tak/shared-ui': path.resolve(__dirname, '../../packages/shared-ui'),
    },
  },
});

