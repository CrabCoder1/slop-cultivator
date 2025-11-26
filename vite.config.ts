import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './game'),
    },
  },
  root: mode === 'admin' ? './admin' : './',
  build: {
    rollupOptions: {
      input: mode === 'admin' 
        ? path.resolve(__dirname, 'admin/index.html')
        : path.resolve(__dirname, 'index.html'),
    },
    outDir: mode === 'admin' 
      ? path.resolve(__dirname, 'dist-admin')
      : path.resolve(__dirname, 'dist'),
  },
  server: {
    port: mode === 'admin' ? 5177 : 5173,
  },
}))
