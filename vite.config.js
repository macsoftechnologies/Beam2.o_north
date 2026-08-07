import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  base: '/m3north/',
  plugins: [
    react(),
    babel({
      presets: [reactCompilerPreset()],
      exclude: [/node_modules/, /src\/data\//]
    })
  ],
})
