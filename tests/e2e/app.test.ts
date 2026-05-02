/**
 * tests/e2e/app.test.ts
 *
 * SoraPalette E2E テスト（Phase 4）。
 * Playwright + Electron により実際のアプリを起動して4つの基本フローを検証する。
 *
 * テスト一覧:
 *   1. アプリ起動 → 天気データが表示されること
 *   2. エリア切替 → 再取得後も天気データが表示されること
 *   3. テーマ切替 → data-theme 属性が変化すること
 *   4. 更新ボタン → リフレッシュが完了して天気データが維持されること
 *
 * 前提: JMA API への実ネットワークアクセスが必要。
 * ビルドは global-setup.ts が自動実行する（playwright.config.ts 参照）。
 *
 * 担当: Claude Code（Phase 4）
 */

import { test, expect, _electron as electron } from '@playwright/test'
import type { ElectronApplication, Page } from '@playwright/test'
import { join } from 'path'

// ---------------------------------------------------------------------------
// アプリインスタンスとウィンドウをテスト間で共有する
// （Electron の起動コストを節約するため、テストスイート全体で1インスタンス）
// ---------------------------------------------------------------------------

let app: ElectronApplication
let page: Page

test.beforeAll(async () => {
  // ビルド済みメインプロセス（out/main/index.js）を起動する
  app = await electron.launch({
    args: [join(__dirname, '../../out/main/index.js')],
  })

  // メインウィンドウを取得し、DOM が準備できるまで待つ
  page = await app.firstWindow()
  await page.waitForLoadState('domcontentloaded')
})

test.afterAll(async () => {
  // テスト終了後にアプリを閉じる
  await app.close()
})

// ---------------------------------------------------------------------------
// テスト1: アプリ起動 → 天気データ表示確認
// ---------------------------------------------------------------------------

test('アプリが起動して天気データが表示される', async () => {
  // WeatherCard (.card) が表示されるまで待つ
  // （loading → weatherData のフローが完了するまで最大60秒）
  await expect(page.locator('.card').first()).toBeVisible({ timeout: 60_000 })

  // エラーバナーが表示されていないことを確認する
  await expect(page.locator('.alert-error')).not.toBeVisible()
})

// ---------------------------------------------------------------------------
// テスト2: エリア切替 → 再取得確認
// ---------------------------------------------------------------------------

test('エリアを切り替えると天気データが再取得される', async () => {
  const select = page.locator('select').first()

  // 現在選択中のエリア名を取得し、別のエリアをラベルで選ぶ
  // （コード値はareaCodeMap.tsの実装依存のため、ラベル指定の方が堅牢）
  const currentLabel = await select.evaluate(
    (el: HTMLSelectElement) => el.options[el.selectedIndex]?.text ?? ''
  )
  const nextLabel = currentLabel === '東京都' ? '北海道' : '東京都'
  await select.selectOption({ label: nextLabel })

  // ローディングが完了し、WeatherCard が再表示されるまで待つ
  await expect(page.locator('.card').first()).toBeVisible({ timeout: 60_000 })

  // エラーが発生していないことを確認する
  await expect(page.locator('.alert-error')).not.toBeVisible()
})

// ---------------------------------------------------------------------------
// テスト3: テーマ切替 → data-theme 属性変化確認
// ---------------------------------------------------------------------------

test('テーマボタンを押すと data-theme が切り替わる', async () => {
  // 切替前の data-theme を記録する
  const themeBefore = await page.evaluate(
    () => document.documentElement.getAttribute('data-theme')
  )

  // テーマ切替ボタンをクリックする
  await page.getByLabel('テーマを切り替える').click()

  // data-theme が変化したことを確認する
  const themeAfter = await page.evaluate(
    () => document.documentElement.getAttribute('data-theme')
  )
  expect(themeAfter).not.toBe(themeBefore)
  expect(['sora-light', 'sora-dark']).toContain(themeAfter)

  // 後続テストへの影響を防ぐため元のテーマに戻す
  await page.getByLabel('テーマを切り替える').click()
  const themeRestored = await page.evaluate(
    () => document.documentElement.getAttribute('data-theme')
  )
  expect(themeRestored).toBe(themeBefore)
})

// ---------------------------------------------------------------------------
// テスト4: 更新ボタン → refreshing 状態表示確認
// ---------------------------------------------------------------------------

test('更新ボタンを押すとリフレッシュが実行され天気データが維持される', async () => {
  const refreshBtn = page.getByLabel('天気を更新')

  // 更新ボタンが有効であることを確認してからクリックする
  await expect(refreshBtn).toBeEnabled()
  await refreshBtn.click()

  // refreshing 中はボタンが disabled になる。
  // 完了後（ボタンが再び enabled になった後）に WeatherCard が維持されることを確認する。
  await expect(refreshBtn).toBeEnabled({ timeout: 60_000 })
  await expect(page.locator('.card').first()).toBeVisible()

  // エラーが発生していないことを確認する
  await expect(page.locator('.alert-error')).not.toBeVisible()
})
