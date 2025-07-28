
import { ApartmentOutlined, ApiOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { createJdmNode } from '@gorules/jdm-editor';


export const customNodes = [
    createJdmNode({
    kind: 'counter',
    displayName: 'counter',
    group: 'counter',
    icon: <ApartmentOutlined />,
    shortDescription: 'Used for counter',
  }),
    createJdmNode({
    kind: 'http_request',
    displayName: 'http_request',
    group: 'http_request',
    shortDescription: 'Used for http_request',
  }),
  createJdmNode({
    kind: 'inputsNode',
    group: 'inputs',
    displayName: 'Inputs Form',
    shortDescription: 'With inputs map form',
    icon: <ApiOutlined />,
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