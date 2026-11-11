import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/**', 'playwright-report/**', 'test-results/**'] },
  js.configs.recommended,
  {
    files: ['**/*.mjs', 'web/sw.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
    },
  },
  { files: ['web/**/*.mjs'], languageOptions: { globals: globals.browser } },
  { files: ['web/sw.js'], languageOptions: { globals: globals.serviceworker } },
  { files: ['tests/**/*.mjs', '*.config.mjs'], languageOptions: { globals: globals.node } },
  { files: ['tests/browser/**/*.mjs'], languageOptions: { globals: globals.browser } },
];
