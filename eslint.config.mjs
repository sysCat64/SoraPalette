/**
 * eslint.config.mjs
 *
 * ESLint 9 フラット設定。
 * TypeScript + Svelte ファイルを対象に静的解析を行う。
 */

import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import sveltePlugin from 'eslint-plugin-svelte'
import svelteParser from 'svelte-eslint-parser'
import globals from 'globals'

export default tseslint.config(
  // JavaScript 推奨ルール
  js.configs.recommended,

  // TypeScript 推奨ルール
  ...tseslint.configs.recommended,

  // Svelte 推奨ルール
  ...sveltePlugin.configs['flat/recommended'],

  // グローバル設定
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },

  // Svelte ファイル用の設定
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tseslint.parser
      }
    }
  },

  // 除外パターン
  {
    ignores: [
      'out/**',
      'dist/**',
      'node_modules/**',
      '**/*.js' // ビルド成果物の .js ファイルは除外（src 配下はすべて .ts/.svelte）
    ]
  }
)
