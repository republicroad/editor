
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
    kind: 'sharedcounter',
    displayName: '共享计数器',
    group: 'sharedcounter',
    icon: <ApartmentOutlined />,
    shortDescription: 'Used for counter',
  }),
    createJdmNode({
    kind: 'http',
    displayName: 'HTTP请求',
    group: 'http',
    icon: <ApiOutlined />,
    shortDescription: 'Used for http_request',
  }),
];