import prettier from 'eslint-config-prettier';
import js from '@eslint/js';
import { includeIgnoreFile } from '@eslint/compat';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default ts.config(
  includeIgnoreFile(gitignorePath),
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs.recommended,
  prettier,
  ...svelte.configs.prettier,
  {
    // Add explicit ignores for built directories
    ignores: [
      'dist/**',
      '.svelte-kit/**',
      'build/**',
      'coverage/**',
      'node_modules/**',
      '**/*.min.js',
    ],
  },
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      'no-undef': 'off',
      // Fixed: Using 'warn' instead of true/false and proper array syntax
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-empty-object-type': 'off', // Simplified - just disable the rule
    },
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.svelte'],
        parser: ts.parser,
        svelteConfig,
      },
    },
    rules: {
      'svelte/require-each-key': 'warn',
      'svelte/no-unused-svelte-ignore': 'warn',
    },
  }
);
