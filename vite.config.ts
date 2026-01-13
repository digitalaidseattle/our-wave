import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'], // ✅ include your setup file
    css: false, // ⬅ ignore css imports
    server: {
      deps: {
        inline: [
          '@mui/material',
          '@mui/system',
          '@mui/icons-material',
          '@mui/x-data-grid',
          '@mui/x-date-pickers',
        ],
      },
    }
  },
})
