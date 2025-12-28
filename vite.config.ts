
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Это нужно для правильной работы на GitHub Pages
  // Если твой репозиторий называется 'neuroguide-app', и ссылка будет user.github.io/neuroguide-app/
  // то лучше использовать base: './' для относительных путей.
  base: './', 
  server: {
    host: true
  }
});
