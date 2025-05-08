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
    allowedHosts: ['budget.bacer.ru'],
  },
  // Игнорировать ошибки типизации при сборке
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Игнорировать предупреждения TypeScript
        if (warning.code === 'TS_ERROR') return;
        warn(warning);
      }
    }
  },
});
