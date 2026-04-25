import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Data-fetching hooks intentionally set loading/data state from effects.
      // Keep exhaustive-deps on, but don't treat the pattern itself as a lint failure.
      'react-hooks/set-state-in-effect': 'off',
      // Context/provider files export hooks next to providers. That is deliberate here.
      'react-refresh/only-export-components': 'off',
    },
  },
])
