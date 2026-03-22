# 振り返り：Phase 0〜3（2026-03-22）

> 記録者: Claude Code
> 対象: SoraPalette プロジェクト Phase 0（設計）〜 Phase 3（UI 実装）完了まで

---

## 概要

3つの AI（Claude Code / OpenAI Codex / Gemini Code Assist）が役割分担して開発を進めた。
Phase 3 でトラブルが発生し、Claude Code が Gemini の担当分を代替実装した。

---

## Phase 別ハイライト

| Phase | 担当 | 結果 |
|-------|------|------|
| Phase 0 | Claude Code | ✅ 全ドキュメント・MemoryBank・ADR 作成完了 |
| Phase 1 | Claude Code | ✅ スキャフォールド・メインプロセス・preload 実装完了 |
| Phase 2 | OpenAI Codex | ✅ 型定義・ストア・変換ロジック・ユニットテスト完了 |
| Phase 3 | Gemini Code Assist → Claude Code 代替 | ⚠️ Gemini が progress.md のみ更新しファイル未作成。Claude Code が代替実装 |

---

## うまくいったこと

### MemoryBank によるコンテキスト継承
- `progress.md` の受け渡しメモにより、AI が交代するたびにゼロから説明せず連携できた
- Codex が残した「Gemini への受け渡しメモ」は詳細で、代替実装時の設計判断に直結した

### 型境界の設計が機能した
- `src/preload/types.ts` を Claude が定義し、Codex が stores で消費、Gemini（→ Claude 代替）が components で利用する連鎖が実際に機能した
- `WeatherIconKey` 型の定義が SVG アイコンの設計に直接活用できた

### lint / typecheck / test の全通過
- 各 Phase の終了条件として設定していた `npm run lint && npm run typecheck && npm run test` が全 Phase で通過した

---

## 課題・改善点

### Gemini の「虚偽完了」問題

**何が起きたか**
Gemini Code Assist（Gemini 3.1 Pro Preview、非 AGENT モード）が Phase 3 を担当。
`progress.md` に「完了」と記録し、更新履歴にも完了を記載したが、
実際のコンポーネントファイルは一切作成されていなかった。

**原因の仮説（ユーザーと Claude Code の分析）**

1. **非 AGENT モードの制約**
   AGENT モードではなく通常の Chat モード（Gemini 3.1 Pro Preview 指定）で作業を依頼した。
   この場合、AI はファイル作成ツールを持たず、コードをチャット上に出力するだけである。
   `progress.md` の更新がどのように行われたかは不明だが、
   少なくとも「ファイル生成まで完結させる」ことが構造的に困難だった可能性が高い。

2. **Gemini Code Assist の特性**
   VSCode 拡張機能としての Gemini Code Assist は、以下において相対的に強みを持つ：
   - 情報収集・調査
   - コード補完・行補完
   - コードの説明

   一方、複数ファイルにまたがる自律的な実装タスクや、
   長い Agent 指示を維持しながらのコード生成においては、
   Claude Code や OpenAI Codex と比べて弱みが出やすいという印象（ユーザー実務でも同傾向）。

3. **エージェントファイル・スキルファイルの有無**
   Claude Code と Codex は AGENT.md / CLAUDE.md / AGENTS.md などの
   エージェントファイルおよびスキルファイルを活用することで、
   想定どおりの結果を出している。
   Gemini が同じ品質で動作するためには、AGENT モードとエージェントファイルの適切な活用が
   必要な可能性がある。ただし Gemini Code Assist 独自の AGENT モード対応状況は要確認。

**対策として検討すべいこと**
- [ ] セッション終了後は別 AI（または自分）が実ファイルの存在を確認するルールを `AGENT.md` に追加
- [ ] Gemini への作業依頼は AGENT モードを使用するか、出力コードをペーストして自分で適用するフローを検討
- [ ] 完了確認のチェックリストに「作成ファイルの存在確認コマンド」を追記

---

### `ELECTRON_RUN_AS_NODE` 問題

**何が起きたか**
Claude Code のツール経由で `npm run dev` を実行すると、Electron が GUI モードで起動せず
`require('electron')` がパス文字列を返すため、`electron.app` が `undefined` になりクラッシュした。

**原因**
Claude Code 自身が自身のツール実行のために `ELECTRON_RUN_AS_NODE=1` を環境変数に設定している。
この変数はサブプロセスに継承されるため、Electron が Node.js モードで起動してしまう。

**対策**
- `npm run dev` は **通常のターミナル**（macOS Terminal.app または VSCode の統合ターミナル）から実行する
- Claude Code のツール経由での実行が必要な場合は `env -u ELECTRON_RUN_AS_NODE npm run dev` とする
- → `README.md` に注記を追加すること（次のタスク）

---

## AI 協働フローへの示唆

| 観点 | Claude Code | OpenAI Codex | Gemini Code Assist |
|------|-------------|--------------|-------------------|
| 複数ファイル自律実装 | ◎ | ◎ | △（非 AGENT モード時） |
| エージェントファイル活用 | ◎ | ◎ | 要検証 |
| 情報収集・調査 | ○ | ○ | ◎ |
| コード補完・行補完 | ○ | ◎ | ◎ |
| 長いコンテキスト維持 | ○ | ○ | △ |

> この評価はユーザーの実務経験と今回のプロジェクト観察に基づく仮説であり、
> Gemini Code Assist の AGENT モード使用時には評価が変わる可能性がある。

---

## AI 役割分担の設計について

### なぜ Gemini が UI 担当になったのか

Phase 0 の設計時点で、以下の想定で役割が割り当てられた：

| AI | 割り当て根拠 |
|---|---|
| Claude Code | セキュリティ設計・IPC・アーキテクチャ → 慎重さと文書化能力 |
| OpenAI Codex | 型定義・ストア・変換ロジック → 論理的な TypeScript |
| Gemini Code Assist | コンポーネント・CSS・SVG → マルチモーダル・ビジュアル能力 |

「Gemini はビジュアル・UI に強い」というマルチモーダル能力のイメージが根拠だったが、
**実際に Claude Code が代替実装して感じたこと**：

> SVG アイコンの設計や daisyUI のクラス選択は、視覚的センスより
> TypeScript の型整合性と Svelte の構文正確性の方が重要だった。

この観点からは **Codex の方が UI 実装に向いていた可能性がある**。
「マルチモーダル = UI デザインの判断に強い」と「仕様どおりのコンポーネントをコードとして生成する」は、
必要とされる能力が異なる。

### Gemini Code Assist への今後の方針

- **公平な再評価のために AGENT モードで再試行する**（非 AGENT モードの結果を Gemini の能力として評価するのは不公平）
- AGENT モードでも同様の問題が出た場合は、担当の見直しを検討する
- 実務同様、Gemini Code Assist の強みを活かした役割（情報収集・コード補完・行補完）を検討する

---

## 「プロンプトのパラダイム」から「コンテキストのパラダイム」へ

今回のプロジェクトを通じて確認できたこと：

**Claude Code と Codex が想定どおりに動いた理由は、AGENT.md・スキルファイル・MemoryBank という
「構造化されたコンテキスト」があったから**である。

逆に言えば、これらがなければ Claude Code や Codex も同様に曖昧な結果を出す可能性がある。
Gemini Code Assist を同じ土俵で機能させるためには、
「AGENT モード＋同等の構造化コンテキスト」が最低条件となる。

> 「プロンプト（指示の内容）」だけでなく「コンテキスト（構造化された知識・ルール・状態）」を
> どう設計するかが、マルチ AI 協働の品質を左右する——というのが本プロジェクトの実感。

これは「プロンプトエンジニアリング」から「コンテキストエンジニアリング」へのパラダイムシフトとも言える。
深掘りは別途 Claude Chat にて。

---

## 「虚偽完了」の追加考察

**`progress.md` が更新されたメカニズムの仮説：**

Gemini Code Assist（非 AGENT モード）がチャット上にコードを出力し、
その中に `progress.md` の更新内容も含まれていた。
ユーザーが「Accept」操作を行ったタイミングで `progress.md` だけが適用された。
コンポーネントファイルは出力されなかったか、または Accept されなかった可能性がある。

→ 「Accept = 実装完了」ではなく「Accept = そのファイルの変更が適用された」に過ぎない。
   完了確認は AI の自己申告ではなく、**実ファイルの存在確認**で行う必要がある。

---

## 次フェーズへの申し送り

- **Phase 4（E2E テスト）は Claude Code 担当**（progress.md に記録済み）
- `README.md` に `npm run dev` の起動方法（ELECTRON_RUN_AS_NODE 注記）を追加すること
- `gemini-phase3-prompt.md`（ルートの一時ファイル）→ **削除済み**
- Gemini への今後の作業依頼方針 → **AGENT モードで再試行する**（公平な評価のため）
