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
  globalIgnores(['**/dist', '**/static', '**/.eslintrc.cjs', '**/target', 'jdm-editor/**', 'storybook-static/**']),
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
    // vendored from @reui registry: shadcn CLI 落盘文件，不做源码级 lint 约束
    files: ['src/components/reui/cascader/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    // jdm 自定义节点 spec/hook 文件：导出节点规格(createJdmNode 产物)与配套常量——非纯 React 组件文件
    files: [
      'src/components/custom-node/**/*.{ts,tsx}',
      'src/components/ui/**/*.{ts,tsx}',
      'src/components/reui/**/*.{ts,tsx}',
      'src/context/theme.provider.tsx',
      'src/hooks/useCustomNodes.ts',
      'src/lib/custom-node-registry.tsx',
      'src/shell/editor-shell.context.tsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
]);
