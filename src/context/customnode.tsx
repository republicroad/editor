import { ChevronLeft, ChevronRight, Network, Plug } from 'lucide-react';
import { createJdmNode } from '@gorules/jdm-editor';

export const customNodes = [
  createJdmNode({
    kind: 'counter',
    displayName: 'counter',
    group: 'counter',
    icon: <Network />,
    shortDescription: 'Used for counter',
  }),
  createJdmNode({
    kind: 'sharded_counter',
    displayName: 'sharded_counter',
    group: 'sharded_counter',
    shortDescription: 'Used for sharded_counter',
  }),
  createJdmNode({
    kind: 'pingNode',
    displayName: 'Ping',
    group: 'ping',
    shortDescription: 'Used for ping',
  }),
  createJdmNode({
    kind: 'pongNode',
    displayName: 'Pong',
    group: 'ping',
    shortDescription: 'Used for pong',
  }),
  createJdmNode({
    kind: 'rightHandleNode',
    group: 'integrations',
    displayName: 'Right Handle',
    icon: <ChevronRight />,
    handleLeft: false,
  }),
  createJdmNode({
    kind: 'leftHandleNode',
    group: 'integrations',
    displayName: 'Left Handle',
    icon: <ChevronLeft />,
    handleRight: false,
  }),
  createJdmNode({
    kind: 'inputsNode',
    group: 'inputs',
    displayName: 'Inputs Form',
    shortDescription: 'With inputs map form',
    icon: <Plug />,
    inputs: [
      {
        control: 'text',
        name: 'hello.nested.something',
        label: 'First',
      },
      {
        control: 'text',
        name: 'second',
        label: 'Second',
      },
      {
        control: 'bool',
        name: 'checkbox',
        label: 'Checkbox',
      },
    ],
  }),
];
