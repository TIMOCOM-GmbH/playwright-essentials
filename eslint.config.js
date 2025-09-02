// ESLint flat config for TypeScript + NodeNext
import tseslint from 'typescript-eslint'
import playwright from 'eslint-plugin-playwright'
import prettier from 'eslint-config-prettier'

export default [
  ...tseslint.config(
    {
      ignores: ['dist/**', 'node_modules/**'],
    },
    {
      files: ['**/*.ts'],
      languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
          project: ['./tsconfig.json'],
          tsconfigRootDir: import.meta.dirname,
          sourceType: 'module',
          ecmaVersion: 'latest',
        },
      },
      plugins: {
        '@typescript-eslint': tseslint.plugin,
        playwright,
      },
      rules: {
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      },
    },
    // Override parser project for test files so ESLint can type-check them
    {
      files: ['**/*.spec.ts', '**/*.test.ts', 'tests/**/*.ts'],
      languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
          project: ['./tsconfig.vitest.json'],
          tsconfigRootDir: import.meta.dirname,
          sourceType: 'module',
          ecmaVersion: 'latest',
        },
      },
    },
    // Turn off formatting-related ESLint rules in favor of Prettier
    prettier
  ),
  // Apply Playwright recommended rules to test files
  {
    files: ['**/*.spec.ts', 'e2e/**/*.ts', 'playwright/**/*.ts'],
    plugins: { playwright },
    rules: {
      ...playwright.configs['flat/recommended'].rules,
    },
  },
]
