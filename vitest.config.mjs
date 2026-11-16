import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': root,
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.{js,mjs}'],
    // Integration tests spin up an in-memory MongoDB; give them room.
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // Env defaults so crypto/auth libs have their required secrets during tests.
    env: {
      APP_ENCRYPTION_KEY:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      AUTH_SECRET: 'test-auth-secret',
      DB_NAME: 'solocrm_test',
    },
  },
})
