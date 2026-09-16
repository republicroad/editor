import type { Preview } from '@storybook/react';

import '../src/main.css';
// npm dist 消费：内核两包样式显式导入（custom-node.module.css 已并入 appshell dist/style.css）
import '@republicroad/jdm-editor/dist/style.css';
import '@republicroad/jdm-appshell/dist/style.css';

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    backgrounds: { disable: true },
  },
};

export default preview;
