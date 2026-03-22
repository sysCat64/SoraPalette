import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // メインプロセス設定
  main: {
    plugins: [externalizeDepsPlugin()]
  },

  // プリロード設定
  preload: {
    plugins: [externalizeDepsPlugin()]
  },

  // レンダラープロセス設定（Svelte + Tailwind CSS v4）
  renderer: {
    root: 'src/renderer',
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer')
      }
    },
    plugins: [svelte(), tailwindcss()]
  }
})
