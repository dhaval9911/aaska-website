import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['**/dist/**', '**/.next/**', '**/node_modules/**', 'apps/web/next-env.d.ts'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    files: ['apps/api/**/*.ts', 'packages/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}', 'packages/ui/**/*.{ts,tsx}'],
    rules: {},
  },
  {
    files: ['apps/web/postcss.config.js'],
    languageOptions: {
      globals: {
        module: 'readonly',
      },
    },
  },
];
