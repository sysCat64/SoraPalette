# プロジェクトブリーフ

> このファイルはプロジェクトの**不変の基盤**です。
> スコープや制約の変更がない限り、内容を書き換えないでください。

---

## プロジェクトミッション

気象庁オープンデータを活用した天気予報デスクトップアプリ「SoraPalette」を、
**Electron + Svelte + TypeScript** で開発する。

主な目的は **デスクトップアプリ開発の学習** であるため、
ソースコードには詳細な日本語コメントを付け、実装意図が読み手に伝わるようにする。

---

## 技術スタック（確定）

| レイヤー | 技術 |
|---------|------|
| デスクトップフレームワーク | Electron |
| UIフレームワーク | Svelte |
| 言語 | TypeScript (strict mode) |
| スタイリング | Tailwind CSS + daisyUI |
| ビルドツール | Vite (electron-vite) |
| パッケージャー | 未導入（ローカル学習用ビルドのみ） |
| テスト（ユニット） | Vitest |
| テスト（E2E） | Playwright |
| 対象OS | クロスプラットフォーム（macOS / Windows / Linux） |
| データソース | 気象庁オープンデータAPI（JMA） |

---

## v1 コア機能（確定スコープ）

**✅ 全10機能実装完了（2026-04-30）**

| # | 機能 | 担当AI | 状態 |
|---|------|--------|------|
| 1 | 今日の天気（天気概況・SVGアイコン） | Claude + Gemini | ✅ 完了 |
| 2 | 7日間予報の横並びカード | Gemini | ✅ 完了 |
| 3 | 最高/最低気温表示 | Gemini + Codex | ✅ 完了 |
| 4 | 降水確率（時間帯別バー表示） | Gemini + Codex | ✅ 完了 |
| 5 | 地域選択（全47都道府県） | Codex + Gemini | ✅ 完了 |
| 6 | お気に入りエリア（最大5件） | Codex | ✅ 完了 |
| 7 | テーマ切替（sora-light / sora-dark） | Gemini | ✅ 完了 |
| 8 | 更新ボタン + 自動更新（30分間隔） | Claude + Codex | ✅ 完了 |
| 9 | オフラインキャッシュ + 最終更新表示 | Claude | ✅ 完了 |
| 10 | 気象警報バナー（JMA警報APIから取得） | Claude + Gemini | ✅ 完了 |

### v1 追加実装（スコープ外だが実装済み）

| 機能 | 担当AI | 実装日 |
|------|--------|--------|
| 天気概況テキスト（overview_forecast APIから取得） | Claude | 2026-04-30 |
| アニメーション付きSVGアイコン（`animated` prop、各アイコンにCSS animation実装済み） | Claude | 2026-03-22 |

---

## v2 以降の機能（今はスコープ外）

- システムトレイ統合
- デスクトップ通知（天気変化時）
- Catppuccinテーマ追加
- データエクスポート（JSON/CSV）
- 自動起動（OS起動時）

---

## 不変の制約

- `contextIsolation: true` と `nodeIntegration: false` は変更しない
- JMA APIへのfetchはメインプロセスのみで行う
- 全ソースファイルに詳細な日本語コメントを付ける
- バックエンドサーバーは構築しない
- ユーザー認証・課金機能は実装しない

---

## 未決事項（実装前に決定が必要）

### API・データスコープ
- [x] **JMA予報APIのティア**: `forecast`（構造化JSON）を採用。`overview_forecast` は補足テキストとして追加実装（ADR-003）
- [x] **警報APIの対象範囲**: 選択中の地域のみ取得（`jmaWarningService.ts` 実装済み）

### デスクトップ統合
- [x] **ウィンドウサイズ**: リサイズ可能、最小サイズ 360×600px（`src/main/index.ts` で設定済み）
- [x] **自動起動**: v1スコープ外。v2候補として保留

### 配布・パッケージング
- [x] **配布形式**: ローカル学習用のみ（`npm run dev` / `npm run build`）
- [x] **自動アップデート**: 不使用（`electron-updater` は導入しない）

### 開発ツール
- [x] **パッケージマネージャー**: `npm`（`package.json` ベース、`packageManager` フィールドなし）
- [x] **GitHub Actions CI**: `main` への push / pull request で lint・typecheck・unit test を自動実行

### AI連携プロセス
- [x] **ブランチ戦略**: main 直接コミット方式を採用（ブランチ分離なし）
- [x] **AI切替のトリガー**: フェーズ単位（Phase 1〜4 はすべて完了）
