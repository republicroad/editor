import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

import { KeyValueEditor } from '../components/custom-node/key-value-editor';

const meta: Meta<typeof KeyValueEditor> = {
  title: 'Editor Shell/KeyValueEditor',
  component: KeyValueEditor,
  parameters: {
    layout: 'padded',
  },
};

export default meta;

type Story = StoryObj<typeof KeyValueEditor>;

const Stateful: React.FC<{
  initialValue: string;
  label: string;
  addLabel: string;
  deleteLabel: string;
}> = ({ initialValue, label, addLabel, deleteLabel }) => {
  const [value, setValue] = useState(initialValue);

  return (
    <div style={{ width: 480 }}>
      <KeyValueEditor
        label={label}
        addLabel={addLabel}
        deleteLabel={deleteLabel}
        valuePlaceholder="值(Zen 表达式)"
        rawPlaceholder='{"Authorization": "Bearer " + input.token} 或 input.headers'
        value={value}
        onChange={setValue}
      />
    </div>
  );
};

export const StructuredHeaders: Story = {
  render: () => (
    <Stateful
      initialValue='{ Token: input.token, Accept: "application/json" }'
      label="Headers(键值对)"
      addLabel="添加 Header"
      deleteLabel="删除 Header"
    />
  ),
};

export const RawExpression: Story = {
  render: () => (
    <Stateful
      initialValue='{"Authorization": "Bearer " + input.token}'
      label="Headers(键值对)"
      addLabel="添加 Header"
      deleteLabel="删除 Header"
    />
  ),
};
