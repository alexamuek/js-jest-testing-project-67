import js from '@eslint/js'
import globals from 'globals'
import { defineConfig } from 'eslint/config'
import stylistic from '@stylistic/eslint-plugin'
import eslintPluginJest from 'eslint-plugin-jest'

export default defineConfig([
  stylistic.configs.recommended,
  { files: ['**/*.{js,mjs,cjs}'], plugins: { js }, extends: ['js/recommended'] },
  { files: ['**/*.{js,mjs,cjs}'], languageOptions: { globals: globals.node } },
  { files: ['**/*.test.js', '**/*.spec.js'], plugins: { jest: eslintPluginJest }, languageOptions: { globals: { ...eslintPluginJest.environments.globals.globals } }, rules: { 'jest/no-disabled-tests': 'error', 'jest/no-focused-tests': 'error' } },
])
