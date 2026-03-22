/**
 * src/renderer/main.ts
 *
 * Svelte アプリのエントリポイント。
 * #app 要素にルートコンポーネントをマウントする。
 *
 * 担当: Gemini（コンポーネント実装後に更新）/ Claude（初期スタブ）
 */

import './app.css'
import App from './App.svelte'
import { mount } from 'svelte'

// ルートコンポーネントをマウント
const app = mount(App, {
  target: document.getElementById('app')!
})

export default app
