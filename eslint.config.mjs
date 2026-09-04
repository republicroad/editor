import { defineConfig, globalIgnores } from 'eslint/config';
import { fixupConfigRules } from '@eslint/compat';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-plugin-prettier';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  globalIgnores([
    '**/dist',
    '**/static',
    '**/.eslintrc.cjs',
    '**/target',
    'jdm-editor/**',
    'storybook-static/**',
    'tmp/**',
  ]),
  {
    extends: fixupConfigRules(
      compat.extends('eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:react-hooks/recommended'),
    ),

    plugins: {
      'react-refresh': reactRefresh,
      prettier,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        __MONACO_VS_BASE__: 'readonly',
      },

      parser: tsParser,
    },

    rules: {
      'prettier/prettier': 'error',

      'react-refresh/only-export-components': [
        'warn',
        {
          allowConstantExport: true,
        },
      ],

      'react-hooks/exhaustive-deps': 'off',
    },
  },
  {
    files: ['apps/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
        Bun: 'readonly',
      },
    },
  },
  {
    // node 脚本（同步工具）：flat config 默认 lint .mjs，需声明 node 全局
    // （appshell 的 scripts 归内核仓 eslint 管）
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
]);
