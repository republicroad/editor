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
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@republicroad/jdm-editor': join(repoRoot, 'jdm-editor/packages/jdm-editor/src/index.ts'),
    };
    // Vite 8 内置 tsconfig paths（S008 消费后启用）：宿主 `@/*` 与内核 `#*`
    // 按 importer 就近 tsconfig 各解析各的
    config.resolve.tsconfigPaths = true;
    return config;
  },
};

export default config;
