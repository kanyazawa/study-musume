import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isCloudflareBuild = process.env.CF_PAGES === '1' || process.env.WORKERS_CI === '1'
const liteDeploy = process.env.VITE_LITE_DEPLOY === 'true' || isCloudflareBuild

const pruneHeavyStaticAssets = () => ({
  name: 'prune-heavy-static-assets',
  apply: 'build',
  async closeBundle() {
    if (!liteDeploy) return

    const targets = [
      path.resolve(__dirname, 'dist/audio/tts-generated'),
      path.resolve(__dirname, 'dist/assets/VRoid.vrm'),
      path.resolve(__dirname, 'dist/gacha_animation (2).mp4'),
    ]

    await Promise.all(targets.map((target) => fs.rm(target, { recursive: true, force: true })))
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), pruneHeavyStaticAssets()],
  define: {
    'import.meta.env.VITE_LITE_DEPLOY': JSON.stringify(liteDeploy ? 'true' : 'false'),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@react-three') || id.includes('@pixiv/three-vrm') || id.includes('/three/')) {
              return 'three-vrm'
            }

            if (id.includes('/firebase/')) {
              return 'firebase'
            }

            if (id.includes('function-plot') || id.includes('d3')) {
              return 'charts'
            }

            if (id.includes('/react/') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor'
            }
          }
        },
      },
    },
  },
  server: {
    allowedHosts: true,
  },
})
