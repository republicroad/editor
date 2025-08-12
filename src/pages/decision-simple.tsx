// React核心库和必要的hooks
import React, { useEffect, useRef, useState } from 'react';
// Ant Design UI组件库
import { Button, Form, Divider, Dropdown, message, Modal, theme, Typography } from 'antd';
// Ant Design图标组件
import { BulbOutlined, CheckOutlined, PlayCircleOutlined } from '@ant-design/icons';
// 决策模板数据
import { decisionTemplates } from '../assets/decision-templates';
// 错误信息显示工具函数
import { displayError } from '../helpers/error-message.ts';
// 决策图相关的类型定义
import { DecisionContent, DecisionEdge, DecisionNode } from '../helpers/graph.ts';
// React Router的URL参数处理hook
import { useSearchParams } from 'react-router-dom';
// JDM编辑器核心组件和类型
import { DecisionGraph, DecisionGraphRef, DecisionGraphType, GraphSimulator, Simulation } from '@gorules/jdm-editor';
// 页面头部组件
import { PageHeader } from '../components/page-header.tsx';
// 图论库，用于有向图操作
import { DirectedGraph } from 'graphology';
// 检测有向图中是否存在环的工具函数
import { hasCycle } from 'graphology-dag';
// 布局组件
import { Stack } from '../components/stack.tsx';
// 模式匹配库，用于更优雅的条件判断
import { match, P } from 'ts-pattern';

// 页面样式文件
import classes from './decision-simple.module.css';
// HTTP请求库
import axios from 'axios';
// 主题相关的上下文和类型
import { ThemePreference, useTheme } from '../context/theme.provider.tsx';
// 自定义节点配置
import { customNodes } from '../context/customnode.tsx'
import { useLocation } from 'react-router-dom';
// import { useRouter } from '@/router/hooks/use-router';
import counterService from '../api/services/counterService';
import listService from '../api/services/listService';
import noticeService from '../api/services/noticeService';
import ruleService from '../api/services/ruleService';
import workbench from '../api/services/workbench';
// 文档文件类型枚举，定义支持的文件MIME类型
enum DocumentFileTypes {
  Decision = 'application/vnd.gorules.decision',
}
interface GraphDesc {
  rule_name: string;
  rule_desc: string;
}


// 检查浏览器是否支持文件系统访问API（File System Access API）
// 这个API允许Web应用直接读写用户设备上的文件
const supportFSApi = Object.hasOwn(window, 'showSaveFilePicker');

/**
 * 决策编辑器简单页面组件
 * 这是一个功能完整的决策图编辑器，支持：
 * - 创建、编辑、保存决策图
 * - 从模板或文件加载决策图
 * - 模拟执行决策图
 * - 主题切换
 */
export const DecisionSimplePage: React.FC = () => {
  // 获取Ant Design的主题token，用于样式定制
  const { token } = theme.useToken();

  // 文件输入元素的引用，用于文件上传功能
  const fileInput = useRef<HTMLInputElement>(null);

  // 决策图组件的引用，用于调用组件内部方法
  const graphRef = React.useRef<DecisionGraphRef>(null);

  // 主题相关的状态和设置函数
  const { themePreference, setThemePreference } = useTheme();

  // 获取URL搜索参数，用于处理模板参数
  const [searchParams] = useSearchParams();

  // 文件系统句柄，用于保存文件时的引用
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle>();

  // 决策图数据状态，包含节点和边
  const [graph, setGraph] = useState<any>(undefined);

  // 当前文件名状态
  const [fileName, setFileName] = useState('Untitled Decision');

  // 图执行追踪状态，用于模拟器功能
  const [graphTrace, setGraphTrace] = useState<Simulation>();

  // 极验开发参数
  const [menu, setMenu] = useState([]); // 获取名单列表
  const [customfunctions, setCustomFunctions] = useState([]);
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
  const user_id = queryParams.get('user_id'); // 获取user_id参数
  // const router = useRouter();
  const [form] = Form.useForm();
  const [mdoleList, setMdoleList] = useState([]);
  const [modelID, setModelID] = useState('');
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  /**
   * 组件挂载时的副作用
   * 检查URL参数中是否有template参数，如果有则加载对应的模板
   */
  useEffect(() => {
    const templateParam = searchParams.get('template');
    if (templateParam) {
      loadTemplateGraph(templateParam);
    }
  }, []);

  // 获取规则图数据
  useEffect(() => {
    if (id) {
      getGraphData(projectId, id);
      // functionCustom('')
    }
  }, [id, projectId]);

  useEffect(() => {
    form.setFieldsValue({ ...formValue });
  }, [formValue, form]);

  // 获取模版list
  useEffect(() => {
    // projectId
    if (projectId) {
      getModlehDataList(projectId);
    }
  }, [projectId]);

  //  获取自定义函数
  const functionCustom = (kind) => {
    // 获取自定义函数数据
    workbench.getCustomFunction(user_id, kind).then((res) => {
      if (res.length > 0) {
        setCustomFunctions(res);
      }
    });
  };

  // 获取名单列表
  const getMenuList = () => {
    listService.getListData({ user_id: user_id }).then((res) => {
      if (res.metadata.length > 0) {
        setMenu(res.metadata);
      }
    });
  };

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
      user_id: user_id,
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
      .getCounterList({ counter_func: data, user_id: user_id })
      .then((res: any) => {
        if (res.metadata.length > 0) {
          setMenu(res.metadata);
        }
      });
  };

  const getGraphData = (projectId, id) => {
    ruleService.getRule(user_id, projectId, '', 1, 10, id).then((res) => {
      if (res.metadata.length > 0) {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { rule_name, rule_desc, rule_graph } = res.metadata[0];
        setFormValue({ rule_name, rule_desc });
        setGraph(rule_graph.content);
      }
    });
  };

  // 处理确定按钮点击事件
  const handleConfirm = async () => {
    try {
      // 触发表单校验
      await form.validateFields();
      // 如果校验成功，则提交表单数据
      const values = form.getFieldsValue();

      // 校验规则图是否为空
      if (JSON.stringify(graph) === undefined || JSON.stringify(graph) === '{}') {
        message.warning('请配置规则图！');
        return;
      }
      if (id) {
        ruleService
          .putRule(user_id, id, projectId, {
            ...values,
            rule_graph: JSON.stringify({ content: graph }),
          })
          .then((res) => {
            // res && router.push(`/rules/rulelist`);
          });
      } else {
        ruleService
          .postRule({
            user_id: user_id,
            proj_id: projectId,
            ...values,
            rule_graph: JSON.stringify({ content: graph }),
          })
          .then((res) => {
            // res && router.push(`/rules/rulelist`);
          });
      }
    } catch (error) {
      // 处理校验失败的情况
      console.error('表单校验失败', error);
      message.warning('表单校验失败,请检查规则名称或者描述是否填写');
    }
  };

  const getModlehDataList = (projectId) => {
    ruleService.getRule(user_id, projectId, '', null, null, null).then((res) => {
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

  const handleModleChange = (value: string) => {
    if (graph) {
      setOpen(true);
      setModelID(value);
    } else {
      setModelID(value);
      handleOk(value);
    }
  };

  const handleCancelModel = () => {
    setModelID('');
    setOpen(false);
  };

  const handleOk = (value) => {
    setConfirmLoading(true);
    ruleService.getRule(user_id, projectId, '', 1, 10, value || modelID).then((res) => {
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
    console.log('点击事件', type, data);
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

  /**
   * 加载模板图函数
   * @param template - 模板名称
   */
  const loadTemplateGraph = (template: string) => {
    // 使用ts-pattern进行模式匹配，查找对应的模板
    const templateGraph = match(template)
      .with(P.string, (template) => decisionTemplates?.[template])
      .otherwise(() => undefined);

    // 如果找到模板，则设置到图状态中
    if (templateGraph) {
      setGraph(templateGraph);
    }
  };

  /**
   * 打开文件函数
   * 支持两种方式：
   * 1. 如果浏览器支持文件系统API，使用原生文件选择器
   * 2. 否则使用传统的input file元素
   */
  const openFile = async () => {
    // 如果不支持文件系统API，则使用传统的文件输入方式
    if (!supportFSApi) {
      fileInput.current?.click?.();
      return;
    }

    try {
      // 使用文件系统API打开文件选择器
      const [handle] = await window.showOpenFilePicker({
        types: [{ accept: { 'application/json': ['.json'] } }],
      });

      // 保存文件句柄，用于后续保存操作
      setFileHandle(handle);

      // 读取文件内容
      const file = await handle.getFile();
      const content = await file.text();
      setFileName(file?.name);

      // 解析JSON内容并设置到图状态中
      const parsed = JSON.parse(content);
      setGraph({
        nodes: parsed?.nodes || [],
        edges: parsed?.edges || [],
      });
    } catch (err) {
      // 显示错误信息
      displayError(err);
    }
  };

  /**
   * 另存为文件函数
   * 支持两种保存方式：
   * 1. 如果浏览器支持文件系统API，使用原生保存对话框
   * 2. 否则使用下载方式保存
   */
  const saveFileAs = async () => {
    // 如果不支持文件系统API，则使用下载方式
    if (!supportFSApi) {
      return await handleDownload();
    }

    let writable: FileSystemWritableFileStream | undefined = undefined;
    try {
      // 检查图是否存在循环依赖
      checkCyclic();

      // 序列化图数据为JSON格式
      const json = JSON.stringify({ contentType: DocumentFileTypes.Decision, ...graph }, null, 2);
      const newFileName = `${fileName.replaceAll('.json', '')}.json`;

      // 显示保存文件对话框
      const handle = await window.showSaveFilePicker({
        types: [{ description: newFileName, accept: { 'application/json': ['.json'] } }],
      });

      // 创建可写流并写入数据
      writable = await handle.createWritable();
      await writable.write(json);

      // 更新文件句柄和文件名
      setFileHandle(handle);
      const file = await handle.getFile();
      setFileName(file.name);
      message.success('File saved');
    } catch (e) {
      displayError(e);
    } finally {
      // 确保关闭可写流
      writable?.close?.();
    }
  };

  /**
   * 保存文件函数
   * 使用已有的文件句柄保存文件，如果没有句柄则无法保存
   */
  const saveFile = async () => {
    // 检查是否支持文件系统API
    if (!supportFSApi) {
      message.error('Unsupported file system API');
      return;
    }

    // 只有在已有文件句柄的情况下才能保存
    if (fileHandle) {
      let writable: FileSystemWritableFileStream | undefined = undefined;
      try {
        // 创建可写流
        writable = await fileHandle.createWritable();

        // 检查循环依赖
        checkCyclic();

        // 序列化并写入数据
        const json = JSON.stringify({ contentType: DocumentFileTypes.Decision, ...graph }, null, 2);
        await writable.write(json);
        message.success('File saved');
      } catch (e) {
        displayError(e);
      } finally {
        // 确保关闭可写流
        writable?.close?.();
      }
    }
  };

  /**
   * 创建新决策图的处理函数
   * 会弹出确认对话框，避免用户意外丢失当前工作
   */
  const handleNew = async () => {
    Modal.confirm({
      title: 'New decision',
      icon: false,
      content: <div>Are you sure you want to create new blank decision, your current work might be lost?</div>,
      onOk: async () => {
        // 重置图状态为空
        setGraph({
          nodes: [],
          edges: [],
        });
      },
    });
  };

  /**
   * 处理打开菜单选项的函数
   * @param e - 菜单项事件，包含选中的key
   */
  const handleOpenMenu = async (e: { key: string }) => {
    switch (e.key) {
      // 从文件系统打开文件
      case 'file-system':
        openFile();
        break;
      default: {
        // 检查是否为预定义模板
        if (Object.hasOwn(decisionTemplates, e.key)) {
          Modal.confirm({
            title: 'Open example',
            icon: false,
            content: <div>Are you sure you want to open example decision, your current work might be lost?</div>,
            onOk: async () => loadTemplateGraph(e.key),
          });
        }
        break;
      }
    }
  };

  /**
   * 检查决策图是否存在循环依赖的函数
   * @param dc - 可选的决策内容，如果不提供则使用当前图状态
   * @throws {Error} 如果检测到循环依赖则抛出错误
   */
  const checkCyclic = (dc: DecisionContent | undefined = undefined) => {
    // 使用模式匹配确定要检查的决策内容
    const decisionContent = match(dc)
      .with(P.nullish, () => graph)  // 如果没有提供参数，使用当前图
      .otherwise((data) => data);    // 否则使用提供的数据

    // 创建有向图用于循环检测
    const diGraph = new DirectedGraph();

    // 将所有边添加到有向图中
    (decisionContent?.edges || []).forEach((edge) => {
      diGraph.mergeEdge(edge.sourceId, edge.targetId);
    });

    // 检查是否存在循环，如果存在则抛出错误
    if (hasCycle(diGraph)) {
      throw new Error('Circular dependencies detected');
    }
  };

  /**
   * 处理文件下载的函数
   * 用于不支持文件系统API的浏览器，通过创建下载链接的方式保存文件
   */
  const handleDownload = async () => {
    try {
      // 检查循环依赖
      checkCyclic();

      // 在浏览器中创建文件
      const newFileName = `${fileName.replaceAll('.json', '')}.json`;
      const json = JSON.stringify({ contentType: DocumentFileTypes.Decision, ...graph }, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const href = URL.createObjectURL(blob);

      // 创建带有文件链接的HTML元素
      const link = window.document.createElement('a');
      link.href = href;
      link.download = newFileName;
      window.document.body.appendChild(link);
      link.click();

      // 清理：移除HTML元素并释放ObjectURL
      window.document.body.removeChild(link);
      URL.revokeObjectURL(href);
    } catch (e) {
      displayError(e);
    }
  };

  /**
   * 处理文件上传输入的函数
   * 用于传统的input file元素上传文件
   * @param event - 文件输入变化事件
   */
  const handleUploadInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event?.target?.files as FileList;
    const reader = new FileReader();

    // 设置文件读取完成后的回调函数
    reader.onload = (e) => {
      try {
        // 解析JSON文件内容
        const parsed = JSON.parse(e?.target?.result as string);

        // 验证文件类型
        if (parsed?.contentType !== DocumentFileTypes.Decision) {
          throw new Error('Invalid content type');
        }

        // 提取节点和边数据
        const nodes: DecisionNode[] = parsed.nodes || [];
        const nodeIds = nodes.map((node) => node.id);

        // 过滤掉无效的边（源节点或目标节点不存在）
        const edges: DecisionEdge[] = ((parsed.edges || []) as DecisionEdge[]).filter(
          (edge) => nodeIds.includes(edge?.targetId) && nodeIds.includes(edge?.sourceId),
        );

        // 检查循环依赖并设置图数据
        checkCyclic({ edges, nodes });
        setGraph({ edges, nodes });
        setFileName(fileList?.[0]?.name);
      } catch (e) {
        displayError(e);
      }
    };

    // 以UTF-8编码读取文件
    reader.readAsText(Array.from(fileList)?.[0], 'UTF-8');
  };

  // 渲染组件UI
  return (
    <>
      {/* 隐藏的文件输入元素，用于不支持文件系统API的浏览器 */}
      <input
        hidden
        accept="application/json"
        type="file"
        ref={fileInput}
        onChange={handleUploadInput}
        onClick={(event) => {
          // 清除input的value，确保相同文件可以重复选择
          if ('value' in event.target) {
            event.target.value = null;
          }
        }}
      />
      {/* 主页面容器 */}
      <div className={classes.page}>
        {/* 页面头部组件 */}
        <PageHeader
          style={{
            padding: '8px',
            background: token.colorBgLayout,
            boxSizing: 'border-box',
            borderBottom: `1px solid ${token.colorBorder}`,
          }}
          title={
            <div className={classes.heading}>
              {/* 品牌Logo按钮 */}
              <Button
                type="text"
                target="_blank"
                href="https://gorules.io"
                icon={<img height={24} width={24} src={'/favicon.svg'} />}
              />
              <Divider type="vertical" style={{ margin: 0 }} />
              <div className={classes.headingContent}>
                {/* 可编辑的文件名标题 */}
                <Typography.Title
                  level={4}
                  style={{ margin: 0, fontWeight: 400 }}
                  className={classes.headingTitle}
                  editable={{
                    text: fileName,
                    maxLength: 24,
                    autoSize: { maxRows: 1 },
                    onChange: (value) => setFileName(value.trim()),
                    triggerType: ['text'],
                  }}
                >
                  {fileName}
                </Typography.Title>
                {/* 工具栏按钮组 */}
                <Stack horizontal verticalAlign="center" gap={8}>
                  {/* 新建按钮 */}

                  {/* 打开文件下拉菜单 */}
                  <Dropdown
                    menu={{
                      onClick: handleOpenMenu,
                      items: [
                        {
                          label: 'File system',
                          key: 'file-system',
                        },
                        {
                          type: 'divider',
                        },
                        // 预定义模板选项
                        {
                          label: 'Fintech: Company analysis',
                          key: 'company-analysis',
                        },
                        {
                          label: 'Fintech: AML',
                          key: 'aml',
                        },
                        {
                          label: 'Retail: Shipping fees',
                          key: 'shipping-fees',
                        },
                      ],
                    }}
                  >
                    <Button type={'text'} size={'small'}>
                      打开模版
                    </Button>
                  </Dropdown>
                  {/* 保存按钮（仅在支持文件系统API时显示） */}
                  {supportFSApi && (
                    <Button onClick={saveFile} type={'text'} size={'small'}>
                      保存
                    </Button>
                  )}
                  {/* 另存为按钮 */}
                  <Button onClick={saveFileAs} type={'text'} size={'small'}>
                    另存为
                  </Button>
                  <Button onClick={handleNew} type={'text'} size={'small'}>
                    清空
                  </Button>
                </Stack>
              </div>
            </div>
          }
          ghost={false}
          extra={[
            // 主题切换下拉菜单
            <Dropdown
              overlayStyle={{ minWidth: 150 }}
              menu={{
                onClick: ({ key }) => setThemePreference(key as ThemePreference),
                items: [
                  {
                    label: 'Automatic',
                    key: ThemePreference.Automatic,
                    icon: (
                      <CheckOutlined
                        style={{ visibility: themePreference === ThemePreference.Automatic ? 'visible' : 'hidden' }}
                      />
                    ),
                  },
                  {
                    label: 'Dark',
                    key: ThemePreference.Dark,
                    icon: (
                      <CheckOutlined
                        style={{ visibility: themePreference === ThemePreference.Dark ? 'visible' : 'hidden' }}
                      />
                    ),
                  },
                  {
                    label: 'Light',
                    key: ThemePreference.Light,
                    icon: (
                      <CheckOutlined
                        style={{ visibility: themePreference === ThemePreference.Light ? 'visible' : 'hidden' }}
                      />
                    ),
                  },
                ],
              }}
            >
              <Button type="text" icon={<BulbOutlined />} />
            </Dropdown>,
          ]}
        />
        {/* 主内容区域 */}
        <div className={classes.contentWrapper}>
          <div className={classes.content}>
            {/* 决策图编辑器组件 */}
            <DecisionGraph
              customNodes={customNodes}  // 自定义节点配置
              ref={graphRef}             // 组件引用
              value={graph}              // 图数据
              onChange={(value) => setGraph(value)}  // 图数据变化回调
              reactFlowProOptions={{ hideAttribution: true }}  // React Flow配置
              simulate={graphTrace}      // 模拟执行结果
              panels={[
                {
                  id: 'simulator',
                  title: 'Simulator',
                  icon: <PlayCircleOutlined />,
                  renderPanel: () => (
                    // 图模拟器组件
                    <GraphSimulator
                      onClear={() => setGraphTrace(undefined)}  // 清除模拟结果
                      onRun={async ({ graph, context }) => {
                        try {
                          // 向后端发送模拟请求
                          if (!user_id) {
                            message.error('用户ID不能为空');
                            return;
                          }
                          
                          const result = await workbench.runRule({
                            context,
                            content: graph,
                            user_id,
                          });
                          // 设置模拟成功的结果
                          setGraphTrace(result);
                        } catch (e) {
                          // 使用模式匹配处理不同类型的错误
                          const errorMessage = match(e)
                            .with(
                              {
                                response: {
                                  data: {
                                    type: P.string,
                                    source: P.string,
                                  },
                                },
                              },
                              ({ response: { data: d } }) => `${d.type}: ${d.source}`,
                            )
                            .with({ response: { data: { source: P.string } } }, (d) => d.response.data.source)
                            .with({ response: { data: { message: P.string } } }, (d) => d.response.data.message)
                            .with({ message: P.string }, (d) => d.message)
                            .otherwise(() => 'Unknown error occurred');

                          // 显示错误消息
                          message.error(errorMessage);

                          // 如果是axios错误，设置错误追踪信息
                          if (axios.isAxiosError(e)) {
                            console.log(e);
                            setGraphTrace({
                              result: {
                                result: null,
                                trace: e.response?.data?.trace,
                                snapshot: graph,
                                performance: '',
                              },
                              error: {
                                message: e.response?.data?.source,
                                data: e.response?.data,
                              },
                            });
                          }
                        }
                      }}
                    />
                  ),
                },
              ]}
            />
          </div>
          <Modal
            title={'提示'}
            open={open}
            onOk={() => handleOk(null)}
            confirmLoading={confirmLoading}
            onCancel={handleCancelModel}
          >
            <p>{('当前规则图表中已存在数据，是否覆盖已有数据')}</p>
          </Modal>
        </div>
      </div>
    </>
  );
};

/**
 * 文件总结：
 * 
 * 这个文件实现了一个完整的决策图编辑器页面，主要功能包括：
 * 
 * 1. **文件操作**：
 *    - 支持新建、打开、保存决策图文件
 *    - 兼容现代文件系统API和传统文件操作方式
 *    - 支持从预定义模板加载决策图
 * 
 * 2. **图编辑**：
 *    - 使用DecisionGraph组件进行可视化编辑
 *    - 支持自定义节点类型
 *    - 实时验证循环依赖
 * 
 * 3. **模拟执行**：
 *    - 集成GraphSimulator组件
 *    - 支持向后端发送模拟请求
 *    - 提供详细的错误处理和追踪
 * 
 * 4. **用户体验**：
 *    - 支持主题切换（自动/深色/浅色）
 *    - 可编辑的文件名
 *    - 友好的错误提示和确认对话框
 * 
 * 5. **技术特点**：
 *    - 使用TypeScript提供类型安全
 *    - 采用函数式编程模式（ts-pattern）
 *    - 响应式设计和现代Web API支持
 */
