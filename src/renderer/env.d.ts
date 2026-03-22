/**
 * src/renderer/env.d.ts
 *
 * レンダラープロセスのグローバル型宣言。
 * Svelte ファイルの型を認識させるための参照を含む。
 */

/// <reference types="svelte" />

// window.electronAPI の型は src/preload/types.ts で定義・拡張済み
// tsconfig.web.json に src/preload/types.ts を include しているため、
// Window インターフェース拡張が自動的に有効になる
