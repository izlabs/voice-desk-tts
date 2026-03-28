import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['dist/**', 'train/**', 'public/code/**', 'public/onnx-runtime/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'no-console': 'off',
      'no-control-regex': 'off',
      'no-empty': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-useless-escape': 'off',
    },
  },
  {
    files: ['**/*.jsx'],
    rules: {
      'no-unused-vars': 'off',
    },
  },
];
