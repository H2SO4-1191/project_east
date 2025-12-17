import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'
import { join } from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-htaccess',
      closeBundle() {
        // Copy .htaccess to dist folder after build
        try {
          copyFileSync(
            join(__dirname, '.htaccess'),
            join(__dirname, 'dist', '.htaccess')
          )
        } catch (error) {
          // .htaccess might not exist, that's okay
          console.log('Note: .htaccess not found, skipping copy')
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  }
})

