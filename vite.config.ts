import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    base: '/jugaad-ai/',,  // 👈 THIS is the only important addition

    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    plugins: [react(), tailwindcss()],

    define: {
      'process.env.API_KEY': JSON.stringify("AIzaSyDRI0k1vcQSjnNh5xHnyT6MI4ZbAv3muOA"),
      'process.env.GEMINI_API_KEY': JSON.stringify("AIzaSyDRI0k1vcQSjnNh5xHnyT6MI4ZbAv3muOA"),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
