import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/jugaad-ai/',   // 🔥 THIS IS CRITICAL
  plugins: [react()],
})
