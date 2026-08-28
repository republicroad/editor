import type { Preview } from '@storybook/react';

import '../src/main.css';
import '../src/components/custom-node/custom-node.module.css';

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    backgrounds: { disable: true },
  },
};

export default preview;
