import { defineConfig } from 'vite';
import { resolve } from 'path';

/** @type {import('vite').UserConfig} */
export default defineConfig({
  base: '',
  build: {
    chunkSizeWarningLimit: 1024,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        tictactoe: resolve(__dirname, 'tictactoe.html'),
        snake: resolve(__dirname, 'snake.html'),
        gofish: resolve(__dirname, 'gofish.html')
      }
    }
  }
});
