import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    'backend/uploads/*',
    'vite-mobile*.log',
    'backend/server-live*.log',
  ]),
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['src/context/**/*.{js,jsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['src/pages/Admin.jsx', 'src/pages/RestaurantDetail.jsx'],
    rules: {
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  {
    files: ['backend/**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
      parserOptions: {
        sourceType: 'commonjs',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^(?:[A-Z_]|motion)$' }],
    },
  },
])
