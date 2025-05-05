import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Не забудь поле base, если будешь деплоить на GitHub Pages
  // base: '/bs-budget-tracker/',
  server: {
    allowedHosts: ['5362-77-238-245-29.ngrok-free.app'],
  },
});
