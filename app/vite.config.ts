/// <reference types="vitest/config" />

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_DEV_PROXY_TARGET?.trim()
  const basePath = env.VITE_BASE_PATH?.trim() || '/'
  const baseServer = {
    fs: {
      allow: ['..'],
    },
  }

  return {
    base: basePath,
    plugins: [vue()],
    test: {
      environment: 'node',
      include: ['../交付材料/单元测试/**/*.test.ts', 'src/**/*.test.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json-summary', 'html'],
        include: [
          'src/utils/scoring.ts',
          'src/data/questionBank.ts',
          'src/prompts/personaNarrator.ts',
        ],
        thresholds: {
          lines: 80,
          statements: 80,
          functions: 80,
          branches: 70,
        },
      },
    },
    server: proxyTarget
      ? {
          ...baseServer,
          proxy: {
            '/api': {
              target: proxyTarget,
              changeOrigin: true,
            },
          },
        }
      : baseServer,
  }
})
