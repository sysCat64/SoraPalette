/**
 * tests/e2e/global-setup.ts
 *
 * E2E テスト実行前のグローバルセットアップ。
 * Playwright の globalSetup として呼び出される（playwright.config.ts 参照）。
 *
 * electron.launch() は out/main/index.js を起動するため、
 * テスト前に必ず最新のビルドを生成しておく必要がある。
 *
 * 担当: Claude Code（Phase 4）
 */

import { execSync } from 'child_process'
import { join } from 'path'

export default async function globalSetup(): Promise<void> {
  console.log('\nE2Eテスト用にアプリをビルドしています...')

  execSync('npm run build', {
    stdio: 'inherit',
    // プロジェクトルートで実行する（このファイルは tests/e2e/ にあるため2段上）
    cwd: join(__dirname, '../..'),
  })

  console.log('ビルド完了\n')
}
