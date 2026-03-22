# SoraPalette - OpenAI Codex 設定

> OpenAI Codex がこのプロジェクトで作業する際の専用ガイドラインです。
> 共通規約は `AGENT.md` を参照してください。
> Codex 固有の判断基準・担当範囲・受け渡し条件だけをこのファイルにまとめます。

---

## このファイルの位置づけ

- ルートの `AGENTS.md` を Codex 向けガイドの正本とする
- `.agent/AGENTS.md` は移行期間中の互換用ファイルとして扱う
- `.agent/AGENTS.md` は将来的に削除予定とし、新しい判断基準の追加先は常にルートの `AGENTS.md` とする
- 共通ルールは `AGENT.md` を優先して参照する

---

## Codex の主担当

- `src/renderer/stores/` — Svelte ストア設計と状態管理
- `src/renderer/lib/` — データ変換・整形・マッピング・純粋関数
- `src/renderer/types/` — JMA API レスポンス型とアプリ内部型
- `tests/unit/` — `lib` / `stores` 中心のユニットテスト

## Codex が特に得意な作業

- `writable` / `derived` / `readable` を使った Svelte ストア設計
- JMA API のネストした JSON を内部データへ落とし込む変換処理
- 天気コード判定、更新判定、フォーマット処理などのロジック実装
- TypeScript strict mode 前提の型設計
- 純粋関数とストアロジックに対する Vitest テスト追加

## Codex の担当外

- `src/main/` の実装
- `src/preload/` の実装
- `src/preload/types.ts` の変更判断
- `src/renderer/components/` の UI 実装
- `tailwind.config.ts` や `src/renderer/app.css` のテーマ実装
- `.agent/MemoryBank/` の主更新

`src/preload/types.ts` の変更が必要になった場合は、自分で変更を進めず、`progress.md` に影響範囲を記録して Claude Code に委ねること。
Codex が直接更新してよい MemoryBank は原則として `progress.md` の進捗・引き継ぎメモに限る。

---

## 作業開始チェックリスト

```text
□ .agent/MemoryBank/progress.md を読んで現在フェーズを把握する
□ .agent/MemoryBank/jma-api-notes.md を確認して JMA API の構造を把握する
□ AGENT.md を確認して共通規約を再確認する
□ src/preload/types.ts を確認して利用可能な IPC API を把握する
□ 既存の store / lib / types / tests の実装パターンを参照する
□ 既存の `settingsStore.ts` や類似ストアがあれば、命名・公開 shape・状態の持ち方を合わせる
```

---

## 作業終了チェックリスト

```text
□ 追加・変更した store / lib / types に TypeScript 型が付いている
□ 純粋関数やストアロジックに対応するユニットテストを追加した
□ npm run lint と npm run typecheck が通る
□ preload 型に不足があった場合は progress.md に記録した
□ Claude または Gemini への受け渡し条件があれば progress.md に明記した
□ 公開する store の shape が変わった場合は、変更点を progress.md に短く要約した
```

---

## 実装原則

### 1. レンダラーから直接 Node.js API に触れない

レンダラープロセスは `window.electronAPI` を通じてのみメインプロセスと通信する。
`electron-store` や `fs` などを直接 import しない。

```typescript
// ✅ 正しい: IPC 経由で設定値を取得する
async function loadSettings() {
  const theme = await window.electronAPI.store.get('theme');
  settingsStore.update((state) => ({ ...state, theme }));
}

// ❌ 禁止: レンダラーから Node.js API を直接使う
// import Store from 'electron-store';
```

### 2. ストアは UI 都合ではなくデータ責務で分ける

- API レスポンスをそのまま公開せず、アプリ内部型へ変換してから保持する
- コンポーネント向けの表示文言生成は、可能なら `lib/` の純粋関数に寄せる
- 副作用のある処理と、表示用の派生値は分離する

### 2.1 store に置く責務と lib に置く責務を分ける

store に置いてよい責務:

- IPC 呼び出し
- `loading` / `error` / `lastUpdated` などの状態管理
- 取得済みデータの保持
- `derived` を使った軽量な派生値の公開

lib に置く責務:

- JMA レスポンスの正規化
- 天気コード解決
- 日付・時刻・表示文字列の整形
- 条件分岐が多い変換ロジック
- 単独でユニットテストできる処理

store が肥大化してきた場合は、まず `lib/` へ切り出せる純粋関数がないかを検討すること。

### 3. 型は「JMA の生データ」と「アプリ内部表現」を分ける

- `src/renderer/types/jma.ts` には外部 API に忠実な型を書く
- `src/renderer/types/app.ts` には UI やストアが扱いやすい内部型を書く
- `any` で逃げず、必要なら nullable / union で不確実性を表現する
- 欠損しうる値は「存在しないこと」を型に表す。無理に空文字へ潰さない

### 4. 複雑な変換処理は lib に逃がし、テストで固定する

- store ファイルに長い変換ロジックを直接書きすぎない
- 日付整形、天気コード解決、レスポンス正規化は `lib/` に切り出す
- 切り出した純粋関数には `tests/unit/` で正常系・異常系・境界値を用意する

### 4.1 エラー状態は throw しっぱなしにせず state 化する

- store では取得失敗を UI が扱える形の `error` 状態に落とし込む
- 例外を握り潰さず、必要な情報だけを整形して保持する
- UI に渡すエラー表現は、可能なら `string | null` など単純な shape に揃える
- `window.electronAPI` の戻り値が成功/失敗を持つ場合は、その shape に従って分岐する

### 4.2 JMA の欠損データを楽観視しない

- `timeSeries` や `areas` の長さを固定で仮定しない
- 配列インデックス参照前に存在確認を行う
- 値欠損は `app.ts` の型と変換関数で吸収する
- 「通常は来るはず」の値でも fallback を用意する

### 5. Svelte のリアクティブ処理は意図をコメントで補う

学習用プロジェクトのため、`$:` や derived store など Svelte 特有の挙動には日本語コメントで意図を残す。

### 6. subscribe を使う場合は必ず解放を意識する

コンポーネント側で `store.subscribe()` を使う場合は `onDestroy()` で unsubscribe する。
可能なら `$store` 構文や derived store を優先する。

---

## Codex から見た連携境界

### Claude Code に渡すケース

- 新しい IPC チャンネルが必要
- `src/preload/types.ts` の変更が必要
- `src/main/` での fetch / cache / Electron API 実装が必要
- 設計判断を ADR に残すべき変更がある

### Gemini Code Assist に渡すケース

- 新しい Svelte コンポーネントの作成が必要
- Tailwind / daisyUI / テーマ変数の設計が必要
- アイコン、レイアウト、アニメーション、アクセシビリティ調整が主題

### Codex が先に整えるべきもの

- コンポーネントが読むための内部型
- ストアが返す値の形
- 表示ロジックの土台になる純粋関数

### 引き継ぎ時に `progress.md` へ残す内容

Claude Code に渡すとき:

- 必要な IPC チャンネル名または preload 型の不足
- 追加が必要な引数と戻り値の shape
- 失敗時に store 側で必要なエラー情報

Gemini Code Assist に渡すとき:

- store が公開する主要フィールド
- `loading` / `error` / `empty` の各状態
- UI が前提にしてよい nullability と fallback
- 表示用にすでに整形済みの値と、生値のまま残している値

---

## JMA 関連の注意

### JMA 天気コードは `weatherCodeMap.ts` で管理する

JMA の天気コードは少なくとも以下の範囲をカバーすること。

| 範囲 | 天気種別 |
|------|---------|
| 100〜199 | 晴れ系 |
| 200〜299 | くもり系 |
| 300〜399 | 雨系 |
| 400〜413 | 雪系 |

参照: `.agent/MemoryBank/jma-api-notes.md`

### デフォルトエリアコード

- 初期対象は `130000`（東京地方）
- area code の扱いはマジックナンバー化せず、定数または map に寄せる

### JMA レスポンスの扱い

- `timeSeries[n].areas[m]` の対応関係を決め打ちしすぎない
- JMA の文言は UI 用の完成データとはみなさず、必要なら `lib/` で整形する
- 変換ロジックの前提は、必要に応じて `progress.md` かテスト名で明文化する

---

## 参照すべき型定義

| ファイル | 内容 | Codex の扱い |
|----------|------|--------------|
| `src/preload/types.ts` | `window.electronAPI` の型定義 | 参照のみ。変更は Claude に相談 |
| `src/renderer/types/jma.ts` | JMA API レスポンス型 | 主担当 |
| `src/renderer/types/app.ts` | アプリ内部データ型 | 主担当 |

---

## Codex の成果物イメージ

良い成果物は、次の状態を満たすものとする。

- store が UI から見て読みやすい
- API 依存の複雑さが `types/` と `lib/` に閉じている
- テストが変換仕様を固定している
- preload / main / component 側へ渡す前提が明文化されている
