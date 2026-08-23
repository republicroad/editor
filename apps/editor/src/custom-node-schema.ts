import { udfManager, type CustomFunctionTool, type CustomNodeNamespace } from 'zen-rule';

export type { CustomFunctionTool, CustomNodeNamespace };

/**
 * 自定义节点与自定义函数 JSON Schema(namespace/tools 格式)。
 *
 * 数据源为 zen-rule 的 UDF 注册表(单一数据源)，格式与
 * https://brdeapi.geetest.com/zen_custom_node_function.json 对齐：
 * - 每个 namespace(CustomNodeNamespace)对应前端侧边栏 group
 * - 每个 tool(CustomFunctionTool)对应 createJdmNode 的 kind
 * - parameters / returns 为完整 JSON Schema
 *
 * 若日后 zen-rule 的输出结构变化，仅需在此模块适配。
 */
export const customNodeFunctionSchema: CustomNodeNamespace[] = udfManager.udfFunctionSchemaNamespaces();
