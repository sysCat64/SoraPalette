# ADR-001: Electron + Vite（electron-vite）の採用

- **日付**: 2026-03-21
- **決定者**: プロジェクト立案時（Claude Code）
- **状態**: 採用

---

## 背景・課題

Electronアプリのビルドツールとして何を使うかを選択する必要があった。
主な選択肢は以下の2つ：

1. **electron-webpack** (旧来)
   - 設定が複雑でボイラープレートが多い
   - HMR（ホットモジュールリプレースメント）の設定が煩雑

2. **Vite + electron-vite** (新世代)
   - Viteの高速なビルドとHMRを活用
   - Electronのマルチプロセス構造に対応した設定を提供
   - SvelteとTailwindのViteプラグインが充実

---

## 決定内容

`electron-vite` テンプレートを使用する：

```bash
npm create electron-vite@latest sora-palette -- --template svelte-ts
```

これにより以下が自動設定される：
- メインプロセス・プリロード・レンダラーの分離ビルド
- TypeScript対応
- Svelteプラグイン統合
- HMRによる高速な開発体験

---

## 根拠

| 観点 | electron-webpack | electron-vite |
|------|----------------|---------------|
| セットアップの簡単さ | 複雑 | シンプル |
| 開発体験（HMR） | 遅い | 高速 |
| Svelte対応 | 設定が必要 | プラグインあり |
| TypeScript対応 | 設定が必要 | 標準対応 |
| ドキュメント | 古い情報が多い | 充実 |
| 学習コスト | 高い | 低い |

学習目的のプロジェクトとして、セットアップの複雑さを最小化し、
アプリ実装に集中できる `electron-vite` を選択。

---

## 影響・注意点

- `out/` ディレクトリにビルド結果が生成される（リポジトリには含めない）
- Viteの `type: "module"` と Electron の CJS 環境の混在に注意
  - `electron-vite` の設定がこれを適切に処理してくれる
- 現時点では配布パッケージング設定は導入せず、ローカル学習用の `npm run build` / `npm run preview` を中心に扱う
