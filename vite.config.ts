import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages project site: https://<user>.github.io/campuslens/
  base: process.env.GITHUB_ACTIONS ? '/campuslens/' : '/',
  server: {
    port: 5173,
  },
})
