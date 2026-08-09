# 在用例数据编辑器中显示字段描述

## 需求
在"用例数据"标签页的 JSON 编辑器中，将"类型定义"中每个字段的描述信息显示为注释，方便用户查看字段的释义。

## 技术方案

### 方案选择：Monaco Inlay Hints（内联提示）

**优势：**
- 不修改实际 JSON 数据，仅作为显示层功能
- 视觉效果专业，类似 IDE 的类型提示
- 非侵入式，用户可以随时开关
- Monaco 0.52.2 原生支持

**实现原理：**
- 使用 Monaco 的 `InlayHintsProvider` API
- 解析 JSON 文本，提取字段路径和位置信息
- 将字段路径映射到对应的定义描述
- 在字段名称后显示描述提示

### 实现步骤

#### 1. 创建 JSON 路径提取器
- 解析 JSON 文本，提取每个字段的：
  - 路径（如 `user.name`）
  - 行号、列号
  - 字段名称的位置范围

#### 2. 创建定义描述映射器
- 输入：`definitionDrafts`（包含所有字段定义）
- 输出：路径到描述的映射表
- 过滤：只包含有描述的字段

#### 3. 注册 Inlay Hints Provider
- 使用 `monaco.languages.registerInlayHintsProvider`
- 实现 `provideInlayHints` 方法
- 根据当前可视范围提供提示

#### 4. 更新编辑器配置
- 启用 inlay hints
- 设置提示样式（灰色、斜体等）

### 文件修改清单

1. **新建文件**：`src/helpers/json-path-extractor.ts`
   - 解析 JSON 文本，提取字段路径和位置

2. **修改文件**：`src/components/decision-graph/graph/tab-request.tsx`
   - 在 `useEffect` 中注册 Inlay Hints Provider
   - 创建定义描述映射
   - 更新编辑器配置

3. **修改文件**：`src/components/decision-graph/graph/tab-request.scss`
   - 添加 inlay hints 样式（可选）

### 技术细节

#### JSON 路径提取器实现思路
```typescript
interface JsonFieldInfo {
  path: string;        // 如 "user.name"
  name: string;        // 字段名，如 "name"
  line: number;        // 行号
  column: number;      // 列号
  nameStart: number;   // 字段名起始位置
  nameEnd: number;     // 字段名结束位置
}

function extractJsonFields(jsonText: string): JsonFieldInfo[]
```

#### Inlay Hints Provider 实现
```typescript
monaco.languages.registerInlayHintsProvider('json', {
  provideInlayHints: (model, range) => {
    const fields = extractJsonFields(model.getValue());
    const descriptionMap = buildDescriptionMap(definitionDrafts);
    
    return fields
      .filter(field => descriptionMap.has(field.path))
      .map(field => ({
        kind: monaco.languages.InlayHintKind.Type,
        position: { lineNumber: field.line, column: field.nameEnd + 1 },
        label: `// ${descriptionMap.get(field.path)}`,
        paddingLeft: true,
      }));
  }
});
```

### 边界情况处理

1. **空描述**：不显示提示
2. **长描述**：截断或换行显示
3. **嵌套对象**：正确处理深层路径
4. **数组元素**：不显示提示（只针对对象字段）
5. **JSON 语法错误**：优雅降级，不显示提示

### 测试场景

1. 创建包含多个字段的类型定义，添加描述
2. 在用例数据编辑器中输入对应的 JSON
3. 验证字段名称后是否正确显示描述提示
4. 修改描述，验证提示是否实时更新
5. 测试嵌套对象和数组的处理

## 替代方案

### 方案 A：JSONC 注入注释
- 将语言改为 `jsonc`
- 在 JSON 中注入 `// 描述` 注释
- **缺点**：注释会成为数据的一部分，可能影响下游解析

### 方案 B：Hover 提示
- 使用 Monaco Decorations API
- 鼠标悬停在字段名上时显示描述
- **缺点**：需要悬停才能看到，不够直观

### 方案 C：侧边栏面板
- 在编辑器旁边显示字段描述列表
- **缺点**：占用空间，不够集成

## 推荐方案

**Monaco Inlay Hints** 是最佳选择，因为：
- 不修改数据，纯显示层功能
- 视觉效果专业，类似 IDE 体验
- 实现相对简单，Monaco 原生支持
- 用户可以随时开关

## 下一步

确认方案后，我将：
1. 创建 JSON 路径提取器
2. 实现 Inlay Hints Provider
3. 更新编辑器配置
4. 测试验证效果
