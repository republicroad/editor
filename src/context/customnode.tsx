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
    icon: <RightOutlined />,
    handleLeft: false,
  }),
  createJdmNode({
    kind: 'leftHandleNode',
    group: 'integrations',
    displayName: 'Left Handle',
    icon: <LeftOutlined />,
    handleRight: false,
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
  createJdmNode({
    kind: 'apiFetchNode', // Unique identifier used in the JDM JSON
    displayName: 'External API Call', // Label shown in the UI editor
    group: 'Integrations', // Sidebar category group
    icon: <ApiOutlined />, // Visual anchor node icon
    shortDescription: 'Fetch data from external API',
    inputs: [
      {
        label: 'Endpoint URL',
        name: 'url',
        control: 'text', // Creates a standard text input field
      },
      {
        label: 'Method',
        name: 'method',
        control: 'text', // Creates a dropdown selection field
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' }
        ]
      }
    ]
  }),
  createJdmNode({
    kind: 'apiFetchNode2', // Unique identifier used in the JDM JSON
    displayName: 'External API Call2', // Label shown in the UI editor
    group: 'Integrations', // Sidebar category group
    icon: <ApiOutlined />, // Visual anchor node icon
    shortDescription: 'Fetch data from external API',
    inputs: [
      {
        label: 'Endpoint URL',
        name: 'url',
        control: 'text', // Creates a standard text input field
      },
      {
        label: 'Method',
        name: 'method',
        control: 'text', // Creates a dropdown selection field
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' }
        ]
      },
    ],
  }),
];