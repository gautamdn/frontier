import { defineConfig } from 'vitest/config'

// Logic tests are pure TypeScript (no React/DOM), so this config loads no Vite
// plugins — keeping it decoupled from the app's rolldown-based build config.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
