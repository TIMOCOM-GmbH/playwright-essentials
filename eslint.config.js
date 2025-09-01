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
    // Turn off formatting-related ESLint rules in favor of Prettier
    prettier
  ),
  // Apply Playwright recommended rules to test files
  {
    files: ['**/*.spec.ts', '**/*.test.ts', 'tests/**/*.ts'],
    plugins: { playwright },
    rules: {
      ...playwright.configs['flat/recommended'].rules,
    },
  },
]
