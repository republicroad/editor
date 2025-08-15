
import { ApartmentOutlined, ApiOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { createJdmNode } from '@gorules/jdm-editor';


export const customNodes = [
    createJdmNode({
    kind: 'counter',
    displayName: '计数器',
    group: 'counter',
    icon: <ApartmentOutlined />,
    shortDescription: 'Used for counter',
  }),
  createJdmNode({
    kind: 'counter',
    displayName: '共享计数器',
    group: 'counter',
    icon: <ApartmentOutlined />,
    shortDescription: 'Used for counter',
  }),
    createJdmNode({
    kind: 'http_request',
    displayName: 'HTTP请求',
    group: 'http_request',
    icon: <ApiOutlined />,
    shortDescription: 'Used for http_request',
  }),
];