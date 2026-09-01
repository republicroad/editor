import { udfManager, type CustomFunctionTool, type CustomNodeNamespace } from 'zen-rule';

export type { CustomFunctionTool, CustomNodeNamespace };

/**
 * 自定义节点与自定义函数 JSON Schema(namespace/tools 格式)。
 *
 * 数据源为 udfManager 合并注册表(单一数据源)：zen-rule 内置 contrib/ 扩展 + 宿主 app 层 contrib/ 注册的客户函数融合。
 * 每请求实时聚合，宿主运行期注册不丢；schema 每个命名空间生成一个集合容器节点(kind = 命名空间名，
 * 函数限定集合内)；专属 UI 由宿主按函数名以专用 spec 接管。
 */
export const getCustomNodeFunctionSchema = (): CustomNodeNamespace[] => udfManager.udfFunctionSchemaNamespaces();
