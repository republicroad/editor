import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/react-vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const currentDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(currentDir, '..');

const config: StorybookConfig = {
  stories: ['../src/stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-interactions', 'storybook-dark-mode'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  staticDirs: [{ from: join(repoRoot, 'static/monaco-editor@0.52.2'), to: '/monaco-editor@0.52.2' }],
  viteFinal: async (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@republicroad/jdm-editor': join(repoRoot, 'jdm-editor/packages/jdm-editor/src/index.ts'),
    };
    // 宿主 `@/*` 与内核 `@/*` 各解析各的（按 importer 目录匹配所属 project）
    config.plugins = [
      ...(config.plugins ?? []),
      tsconfigPaths({
        projects: [join(repoRoot, 'tsconfig.json'), join(repoRoot, 'jdm-editor/packages/jdm-editor/tsconfig.json')],
      }),
    ];
    return config;
  },
};

export default config;
