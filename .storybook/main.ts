import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/react-vite';

const currentDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(currentDir, '..');

const config: StorybookConfig = {
  stories: ['../src/stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', 'storybook-dark-mode'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  staticDirs: [{ from: join(repoRoot, 'static/monaco-editor@0.52.2'), to: '/monaco-editor@0.52.2' }],
  viteFinal: async (config) => {
    config.resolve = config.resolve ?? {};
    // Vite 8 内置 tsconfig paths：宿主 `@/*` 走根 tsconfig；
    // @republicroad/* 三包为 npm semver 消费（源码直通已退役，docs/19）
    config.resolve.tsconfigPaths = true;
    return config;
  },
};

export default config;
