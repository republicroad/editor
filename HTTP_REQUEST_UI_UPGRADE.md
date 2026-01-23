# HTTP请求节点UI升级总结

## 概述

本次升级参考Apifox的UI设计，对HTTP请求节点进行了全面改造，主要实现了**表格式参数编辑**和**增强的Body编辑器**两大核心功能。

## 一、实现的功能

### 1. 表格式参数编辑器（EditableTable组件）

**文件位置**: `packages/jdm-editor/src/components/decision-graph/graph/EditableTable.tsx`

**核心特性**:
- ✅ 使用Ant Design Table组件，专业的表格外观
- ✅ 固定表头，支持滚动（最大高度300px）
- ✅ 行内编辑，点击单元格直接编辑
- ✅ 新增Description列（可选字段）
- ✅ 支持Type列（用于Form Data的Text/File类型切换）
- ✅ 启用/禁用复选框
- ✅ 删除按钮
- ✅ 空状态友好提示
- ✅ 可复用于Params、Headers、FormData三种场景

**列结构**:
| 列名 | 宽度 | 说明 |
|------|------|------|
| 启用 | 50px | Checkbox控制是否启用 |
| Key | 25-35% | 参数/Header名称 |
| Value | 30-50% | 参数/Header值 |
| Description | 30% | 描述信息（可选） |
| Type | 100px | Text/File类型（仅FormData） |
| 操作 | 60px | 删除按钮 |

### 2. 增强的Body编辑器（BodyEditor组件）

**文件位置**: `packages/jdm-editor/src/components/decision-graph/graph/BodyEditor.tsx`

**支持的Body类型**:

#### a) JSON编辑器
- ✅ 集成Monaco Editor（VS Code同款编辑器）
- ✅ 语法高亮和自动补全
- ✅ Format按钮（美化JSON）
- ✅ Minify按钮（压缩JSON）
- ✅ 实时语法验证，错误提示
- ✅ 行号显示
- ✅ 高度：300px

#### b) Raw Text编辑器
- ✅ Monaco Editor纯文本模式
- ✅ 自动换行
- ✅ 行号显示

#### c) XML编辑器
- ✅ Monaco Editor XML语法高亮
- ✅ 代码折叠功能

#### d) Form Data / x-www-form-urlencoded
- ✅ 使用EditableTable组件
- ✅ 支持Text/File类型切换（仅Form Data）
- ✅ 支持Description字段
- ✅ 启用/禁用控制

#### e) None
- ✅ 友好的空状态提示

### 3. 数据结构扩展

**文件位置**: `packages/jdm-editor/src/components/decision-graph/nodes/specifications/http-request.specification.tsx`

**扩展的字段**:

```typescript
// Params和Headers添加description字段
params?: Array<{
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;  // 新增
}>;

headers?: Array<{
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;  // 新增
}>;

// Body添加formData字段和xml类型
body?: {
  type: 'none' | 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'xml';  // 新增xml
  content: string;
  formData?: Array<{  // 新增
    id: string;
    key: string;
    value: string;
    enabled: boolean;
    type: 'text' | 'file';
    description?: string;
  }>;
};
```

### 4. buildExpressionsAndAsts逻辑增强

**文件位置**: `packages/jdm-editor/src/components/decision-graph/graph/tab-http-request.tsx`

**支持的Body类型转换**:

```typescript
// 1. JSON类型 - 解析JSON并转换为单引号格式
if (cfg.body?.type === 'json' && cfg.body.content) {
  const bodyObj = JSON.parse(cfg.body.content);
  bodyStr = JSON.stringify(bodyObj).replace(/"/g, "'");
}

// 2. Form Data / URL Encoded - 从formData数组构建对象
if ((cfg.body?.type === 'form-data' || cfg.body?.type === 'x-www-form-urlencoded') && cfg.body.formData) {
  const formObj: Record<string, string> = {};
  cfg.body.formData.forEach(item => {
    if (item.enabled && item.key) {
      formObj[item.key] = item.value;
    }
  });
  bodyStr = JSON.stringify(formObj).replace(/"/g, "'");
}

// 3. Raw / XML - 包装为对象
if ((cfg.body?.type === 'raw' || cfg.body?.type === 'xml') && cfg.body.content) {
  bodyStr = JSON.stringify({ content: cfg.body.content }).replace(/"/g, "'");
}
```

**生成的expressions格式**:
```
http_call_with_headers;;url;;method;;body;;headers
```

## 二、技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| @monaco-editor/react | 最新 | 代码编辑器 |
| Ant Design Table | 内置 | 表格组件 |
| React | 内置 | UI框架 |
| TypeScript | 内置 | 类型系统 |

## 三、UI对比

### 改进前（旧版）
- Params/Headers使用Space + Input布局
- 没有Description字段
- Body使用简单的TextArea
- 没有代码高亮和格式化功能
- 视觉效果简陋

### 改进后（新版）
- ✅ Params/Headers使用专业的Table组件
- ✅ 添加Description列，支持参数说明
- ✅ Body使用Monaco Editor，支持语法高亮
- ✅ JSON支持Format/Minify功能
- ✅ Form Data支持Text/File类型切换
- ✅ 整体视觉更专业，类似Apifox

## 四、数据兼容性

### 向后兼容
- ✅ 所有新增字段都是可选的（`description?`, `formData?`）
- ✅ 旧数据可以正常加载和使用
- ✅ 不影响现有的expressions和expr_asts生成逻辑

### 服务端支持
- ⚠️ 服务端当前只读取`expressions`和`expr_asts`字段
- ✅ 所有HTTP特有字段（method, url, headers, params, body, auth等）都会完整保存在节点配置中
- ✅ 当服务端升级支持HTTP特有字段时，无需修改前端代码

## 五、文件清单

### 新增文件
1. `packages/jdm-editor/src/components/decision-graph/graph/EditableTable.tsx` - 通用表格组件
2. `packages/jdm-editor/src/components/decision-graph/graph/BodyEditor.tsx` - Body编辑器组件

### 修改文件
1. `packages/jdm-editor/src/components/decision-graph/nodes/specifications/http-request.specification.tsx`
   - 扩展类型定义（description, formData, xml）

2. `packages/jdm-editor/src/components/decision-graph/graph/tab-http-request.tsx`
   - 集成EditableTable和BodyEditor组件
   - 增强buildExpressionsAndAsts函数
   - 移除旧的Space布局代码

### 依赖更新
- `package.json`: 添加 `@monaco-editor/react`

## 六、测试建议

### 功能测试
1. **Params表格**
   - [ ] 添加/删除参数
   - [ ] 编辑Key/Value/Description
   - [ ] 启用/禁用参数
   - [ ] 空状态显示

2. **Headers表格**
   - [ ] 添加/删除Header
   - [ ] 编辑Key/Value/Description
   - [ ] 启用/禁用Header
   - [ ] 常用Header快速填充

3. **Body编辑器 - JSON**
   - [ ] 输入JSON内容
   - [ ] Format按钮格式化
   - [ ] Minify按钮压缩
   - [ ] 语法错误提示
   - [ ] 语法高亮显示

4. **Body编辑器 - Form Data**
   - [ ] 添加/删除表单项
   - [ ] Text/File类型切换
   - [ ] Description字段编辑
   - [ ] 启用/禁用控制

5. **Body编辑器 - Raw/XML**
   - [ ] 输入文本内容
   - [ ] XML语法高亮
   - [ ] 自动换行

6. **Expressions生成**
   - [ ] 验证JSON body转换正确
   - [ ] 验证Form Data转换正确
   - [ ] 验证Raw/XML转换正确
   - [ ] 验证只包含enabled=true的项

### 兼容性测试
1. **旧数据加载**
   - [ ] 加载没有description字段的旧节点
   - [ ] 加载没有formData字段的旧节点
   - [ ] 验证数据正常显示和编辑

2. **数据保存**
   - [ ] 保存后重新加载，数据完整
   - [ ] expressions和expr_asts格式正确
   - [ ] HTTP特有字段完整保存

## 七、后续优化建议

### 短期优化
1. 添加常用Header模板（Content-Type, Authorization等）
2. 添加环境变量支持（{{variable}}语法）
3. 添加请求历史记录
4. 添加响应预览面板

### 长期优化
1. 支持GraphQL类型的Body
2. 支持批量导入Params/Headers（从CSV/JSON）
3. 支持请求前置脚本和后置脚本
4. 支持Mock数据生成

## 八、总结

本次升级成功实现了：
- ✅ 表格式参数编辑器，提升专业度
- ✅ Monaco Editor集成，提供代码级编辑体验
- ✅ 完整的Body类型支持（JSON/Raw/XML/Form Data/URL Encoded）
- ✅ 数据结构扩展，支持Description和FormData
- ✅ 向后兼容，不影响现有功能
- ✅ 构建成功，无编译错误

UI体验已接近Apifox水平，为用户提供了更专业、更高效的HTTP请求配置界面。