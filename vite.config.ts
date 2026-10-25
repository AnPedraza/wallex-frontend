import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      // Dos páginas: la app en la raíz y la landing en /inicio
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        inicio: resolve(import.meta.dirname, 'inicio/index.html'),
      },
    },
  },
})
