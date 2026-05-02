/**
 * vitest.config.ts
 *
 * Vitest（ユニットテスト）専用設定。
 * tests/e2e/ は Playwright が担当するため、Vitest の検索対象から除外する。
 *
 * 担当: Claude Code（Phase 4）
 */

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // ユニットテストのみを対象とし、E2E テストは除外する
    include: ['tests/unit/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
  },
})
