const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const path = require('path');

module.exports = defineConfig({
  base: './', // ✅ Add this line
  plugins: [react()],
  resolve: {
    alias: {
      '@studio-tak/shared-ui': path.resolve(__dirname, '../../packages/shared-ui'),
    },
  },
});
