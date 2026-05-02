/**
 * playwright.config.ts
 *
 * Playwright E2E テスト設定（Phase 4）。
 * Electron アプリを直接起動して動作を検証する。
 *
 * 実行前に npm run build が必要（global-setup.ts が自動実行する）。
 * JMA API への実ネットワークアクセスが必要なため、タイムアウトは長めに設定する。
 *
 * 担当: Claude Code（Phase 4）
 */

import { defineConfig } from '@playwright/test'

export default defineConfig({
  // E2E テストディレクトリ
  testDir: './tests/e2e',

  // 1テストあたりのタイムアウト（JMA API 応答待ちを考慮して90秒）
  timeout: 90_000,

  // ネットワーク不安定時のためリトライ1回
  retries: 1,

  // レポート: HTML（自動オープン禁止）+ コンソール出力
  reporter: [['html', { open: 'never' }], ['line']],

  // テスト前にアプリをビルドする
  globalSetup: './tests/e2e/global-setup.ts',
})
