/*
 * @Date: 2024-04-12 14:38:58
 * @LastEditors: xxx
 * @LastEditTime: 2025-01-08 09:45:13
 * @FilePath: /custom-rules/src/pages/rules/flowchart/index.tsx
 */

import { InfoCircleOutlined } from '@ant-design/icons';
import { Affix, Button, Card, Form, Input, message, Select, Modal } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import counterService from '@/api/services/counterService';
import listService from '@/api/services/listService';
import noticeService from '@/api/services/noticeService';
import ruleService from '@/api/services/ruleService';
import workbench from '@/api/services/workbench';
import { useRouter } from '@/router/hooks/use-router';
import { useUserInfo } from '@/store/userStore';
import { DecisionGraphType } from '@jdm/src/components/decision-graph/context/dg-store.context';
import { DecisionGraph, JdmConfigProvider } from '@jdm/src/index';

interface GraphDesc {
  rule_name: string;
  rule_desc: string;
}

// 测试函数
const testFn = async (data: { decisionGraph: DecisionGraphType; context: unknown }, user_id) => {
  const { decisionGraph, context } = data;
  return workbench.runRule({ context, content: { ...decisionGraph }, user_id });
};
interface BottomFixedBarProps {
  onCancel: () => void;
  onConfirm: () => void;
}
// 底部固定栏
function BottomFixedBar({ onCancel, onConfirm }: BottomFixedBarProps) {
  const { t } = useTranslation();
  return (
    <Affix offsetBottom={0}>
      <div
        className=" mb-4 flex items-center justify-center p-3"
        style={{ backgroundColor: '#fff' }}
      >
        <Button className="mr-2" onClick={onCancel}>
          {t('Rule_Cancel_10')}
        </Button>
        <Button type="primary" onClick={onConfirm}>
          {t('Rule_Confir_16')}
        </Button>
      </div>
    </Affix>
  );
}

// 规则编辑页面
function Flowchart() {
  const { t } = useTranslation();
  const [graph, setGraph] = useState<any>(undefined);
  const [menu, setMenu] = useState([]); // 获取名单列表
  const [customfunctions, setCustomFunctions] = useState([]);
  // const [customNotify, setCustomNotify] = useState([]);
  // const [notifyList, setNotifyList] = useState([]);
  const [showBottomBar, setShowBottomBar] = useState(true); // 控制底部栏显示与隐藏
  // const [showMessage, setShowMessage] = useState(false); // 控制提示信息显示与隐藏
  const [formValue, setFormValue] = useState<GraphDesc>({
    rule_name: '',
    rule_desc: '',
  });
  // 获取url参数
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const id = queryParams.get('id') as any; // 获取id参数
  const type = queryParams.get('type'); // 获取type参数
  const projectId = queryParams.get('projId'); // 获取projectId参数
  const router = useRouter();
  const user = useUserInfo();
  //  获取自定义函数
  const functionCustom = (kind) => {
    // 获取自定义函数数据
    workbench.getCustomFunction(user.user_id, kind).then((res) => {
      if (res.length > 0) {
        setCustomFunctions(res);
      }
    });
  };
  // 获取名单列表
  const getMenuList = () => {
    listService.getListData({ user_id: user.user_id }).then((res) => {
      if (res.metadata.length > 0) {
        setMenu(res.metadata);
      }
    });
  };
  // 获取通知列表

  // 通用方法：获取通知详情
  const getNoticeDetail = (type) => {
    const serviceMap = {
      email: noticeService.getEmailData,
      feishu: noticeService.getFeishuData,
      dingtalk: noticeService.getDingtalkData,
      webhook: noticeService.getWebhookData,
    };

    // 判断 type 是否有效
    if (!serviceMap[type]) {
      console.error(`Invalid type: ${type}`);
      return;
    }

    // 调用对应的接口
    serviceMap[type]({
      user_id: user.user_id,
    }).then((res) => {
      if (res.metadata.length > 0) {
        setMenu(res.metadata);
      }
    });
  };

  const getCounterDetail = (type, data) => {
    console.log(type);
    // getCounterList
    counterService
      .getCounterList({ counter_func: data, user_id: user.user_id })
      .then((res: any) => {
        if (res.metadata.length > 0) {
          setMenu(res.metadata);
        }
      });
  };

  const getGraphData = (projectId, id) => {
    ruleService.getRule(user.user_id, projectId, '', 1, 10, id).then((res) => {
      if (res.metadata.length > 0) {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { rule_name, rule_desc, rule_graph } = res.metadata[0];
        setFormValue({ rule_name, rule_desc });
        setGraph(rule_graph.content);
      }
    });
  };

  // 控制底部栏显示与隐藏
  useEffect(() => {
    type === 'running' && setShowBottomBar(false); // 运行页面隐藏底部栏
  }, [type]);

  // 获取规则图数据
  useEffect(() => {
    if (id) {
      getGraphData(projectId, id);
      // functionCustom('')
    }
  }, [id, projectId]);

  // 处理取消按钮点击事件
  const handleCancel = () => {
    router.push(`/rules/rulelist`);
  };
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({ ...formValue });
  }, [formValue, form]);

  // // 控制提示信息显示与隐藏
  // useEffect(() => {
  //   if (showMessage) {
  //     message.warning('请配置规则图！');
  //   }
  // }, [showMessage]);

  // 处理确定按钮点击事件
  const handleConfirm = async () => {
    try {
      // 触发表单校验
      await form.validateFields();
      // 如果校验成功，则提交表单数据
      const values = form.getFieldsValue();

      // 校验规则图是否为空
      if (JSON.stringify(graph) === undefined || JSON.stringify(graph) === '{}') {
        message.warning(t('other_Please_28'));
        return;
      }
      if (id) {
        ruleService
          .putRule(user.user_id, id, projectId, {
            ...values,
            rule_graph: JSON.stringify({ content: graph }),
          })
          .then((res) => {
            res && router.push(`/rules/rulelist`);
          });
      } else {
        ruleService
          .postRule({
            user_id: user.user_id,
            proj_id: projectId,
            ...values,
            rule_graph: JSON.stringify({ content: graph }),
          })
          .then((res) => {
            res && router.push(`/rules/rulelist`);
          });
      }
    } catch (error) {
      // 处理校验失败的情况
      console.error(t('other_Form_2'), error);
      message.warning(t('other_Form_3'));
    }
  };

  // const checkSwi = (checked) => {
  //   const values = form.getFieldsValue();
  //   setFormValue({ ...values, rule_switch: checked });
  // };
  const [mdoleList, setMdoleList] = useState([]);

  const [modelID, setModelID] = useState('');

  const getModlehDataList = (projectId) => {
    ruleService.getRule(user.user_id, projectId, '', null, null, null).then((res) => {
      if (res.metadata.length > 0) {
        const { metadata } = res;
        const modelList: any = [];
        metadata.forEach((m: any) => {
          modelList.push({
            value: m.rule_id,
            label: m.rule_name,
          });
        });
        setMdoleList(modelList);
      }
    });
  };
  // 获取模版list
  useEffect(() => {
    // projectId
    if (projectId) {
      getModlehDataList(projectId);
    }
  }, [projectId]);

  const handleModleChange = (value: string) => {
    if (graph) {
      setOpen(true);
      setModelID(value);
    } else {
      setModelID(value);
      handleOk(value);
    }
  };

  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleCancelModel = () => {
    setModelID('');
    setOpen(false);
  };

  const handleOk = (value) => {
    setConfirmLoading(true);
    ruleService.getRule(user.user_id, projectId, '', 1, 10, value || modelID).then((res) => {
      setConfirmLoading(false);
      setOpen(false);
      if (res.metadata.length > 0) {
        const ruleGraph = res.metadata[0].rule_graph;
        setGraph(ruleGraph.content);
      }
    });
  };
  // 处理组件中事件点击事件 通过type 来区分点击事件类型
  const handleCompClick = (type: string, data: any) => {
    console.log(t('other_Click_1'), type, data);
    switch (type) {
      case 'link':
        //  跳转链接 新开页面直接用window.open
        window.open(`/menu/detail?id=${data}`, '_blank');
        break;
      case 'function':
        functionCustom('udf');
        break;
      case 'menu':
        functionCustom('list');
        break;
      case 'list':
        getMenuList();
        break;
      case 'notify':
        functionCustom('notify');
        break;
      case 'email':
        getNoticeDetail(type);
        break;
      case 'feishu':
        getNoticeDetail(type);
        break;
      case 'dingtalk':
        getNoticeDetail(type);
        break;
      case 'webhook':
        getNoticeDetail(type);
        break;
      case 'counter':
        getCounterDetail(type, data);
        break;
      default:
        functionCustom('');
        break;
    }
  };

  return (
    <div className="h-full w-full">
      <Card type="inner" title={t('Rule_Rule_2')} style={{ marginBottom: '20px' }}>
        <Form layout="inline" form={form} name="myForm" initialValues={formValue}>
          <Form.Item
            label={t('Rule_Versio_6')}
            name="rule_name"
            required
            rules={[{ required: true, message: t('other_Please_29') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={t('Rule_Versio_7')}
            name="rule_desc"
            required
            rules={[{ required: true, message: t('other_Please_30') }]}
          >
            <Input style={{ width: '400px' }} />
          </Form.Item>
          {!id ? (
            <Form.Item
              label={t('other_Templa_1')}
              tooltip={{
                title: t('other_Defaul_2'),
                icon: <InfoCircleOutlined />,
              }}
            >
              <Select
                value={modelID}
                options={mdoleList}
                placeholder={t('other_Click_2')}
                onChange={handleModleChange}
                style={{ width: '200px' }}
              />
            </Form.Item>
          ) : (
            ''
          )}
        </Form>
      </Card>
      <Card
        type="inner"
        title={t('Rule_Rule_1')}
        styles={{
          body: { padding: '10px 0', height: '588px' },
        }}
      >
        {/*   <Button type={'text'} size='small'
                  icon={<FullscreenOutlined />} onClick={() => setMenu(false)}></Button> */}
        <JdmConfigProvider>
          <DecisionGraph
            showSimulator={type === 'running'}
            value={graph}
            onChange={(val) => {
              setGraph(val as any);
            }}
            onSimulationRun={(data) => testFn(data, user.user_id)}
            t={t}
            userId={user.user_id}
            projectId={projectId}
            menuList={menu}
            customFunctions={customfunctions}
            onEventClickHandle={(type, data) => handleCompClick(type, data)}
          />
        </JdmConfigProvider>
      </Card>
      {showBottomBar && <BottomFixedBar onCancel={handleCancel} onConfirm={handleConfirm} />}
      <Modal
        title={t('other_Notice_1')}
        open={open}
        onOk={() => handleOk(null)}
        confirmLoading={confirmLoading}
        onCancel={handleCancelModel}
      >
        <p>{t('Rule_There_1')}</p>
      </Modal>
    </div>
  );
}

export default Flowchart;
