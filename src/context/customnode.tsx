
import { ApartmentOutlined, ApiOutlined, DatabaseOutlined, SearchOutlined,HourglassOutlined,NotificationOutlined,FunctionOutlined } from '@ant-design/icons';
import { createJdmNode } from '@gorules/jdm-editor';


export const customNodes = [
  createJdmNode({
    kind: 'name_list',
    displayName: '名单',
    group: 'name_list',
    icon: <DatabaseOutlined />,
    shortDescription: 'Used for name_list',
  }),
  createJdmNode({
    kind: 'ip',
    displayName: 'IP画像',
    group: 'ip',
    icon: <SearchOutlined />,
    shortDescription: 'Used for ip',
  }),
  createJdmNode({
    kind: 'phone',
    displayName: '手机号画像',
    group: 'phone',
    icon: <SearchOutlined />,
    shortDescription: 'Used for phone',
  }),
    createJdmNode({
    kind: 'counter',
    displayName: '计数器',
    group: 'counter',
    icon: <HourglassOutlined />,
    shortDescription: 'Used for counter',
  }),
  createJdmNode({
    kind: 'shared_counter',
    displayName: '共享计数器',
    group: 'shared_counter',
    icon: <ApartmentOutlined />,
    shortDescription: 'Used for shared_counter',
  }),
    createJdmNode({
    kind: 'http',
    displayName: 'HTTP请求',
    group: 'http',
    icon: <ApiOutlined />,
    shortDescription: 'Used for http_request',
  }),
  createJdmNode({
    kind: 'notification',
    displayName: '通知',
    group: 'notification',
    icon: <NotificationOutlined />,
    shortDescription: 'Used for notification',
  }),
  createJdmNode({
    kind: 'default',
    displayName: '默认算子',
    group: 'default',
    icon: <FunctionOutlined />,
    shortDescription: 'Used for default',
  }),
];