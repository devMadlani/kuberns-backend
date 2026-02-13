const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const importPlugin = require('eslint-plugin-import');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  {
    ignores: ['node_modules/**', 'dist/**'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.ts'],
        },
      },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...importPlugin.configs.recommended.rules,
      ...prettierConfig.rules,
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      eqeqeq: ['error', 'always'],
      'import/no-duplicates': 'error',
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
  },
];
