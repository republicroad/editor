# Monaco编辑器本地化配置

本项目已将Monaco编辑器配置为使用本地文件，而不是从CDN加载。这样可以提供更好的性能、版本控制和离线支持。

## 配置概览

### 1. 文件结构
```
editor/
├── public/
│   └── monaco/
│       └── min/
│           └── vs/          # Monaco编辑器核心文件
├── static/rules/newflowchart/  # 构建输出目录
│   ├── monaco/              # 构建时从public复制的Monaco文件
│   └── plugins/             # 其他构建资源
├── scripts/
│   └── copy-monaco.js       # 自动复制脚本
└── jdm-editor/packages/jdm-editor/src/helpers/
    └── monaco.ts            # Monaco配置文件
```

### 2. 配置文件

**monaco.ts** - 配置Monaco使用本地文件：
```typescript
import { loader } from '@monaco-editor/react';

// 配置Monaco环境，处理worker加载
self.MonacoEnvironment = {
  getWorkerUrl: function (workerId: string, label: string) {
    const baseUrl = './monaco/min/vs';
    // Monaco min版本使用统一的workerMain.js
    return `${baseUrl}/base/worker/workerMain.js`;
  }
};

// 配置Monaco使用本地静态文件（相对路径）
loader.config({
  paths: {
    vs: './monaco/min/vs'
  }
});
```

> **路径说明**: 
> - 使用相对路径 `'./monaco/min/vs'` 而不是绝对路径 `'/monaco/min/vs'`，这样可以支持在任意子目录下部署应用
> - 配置 `MonacoEnvironment.getWorkerUrl` 来处理worker文件的加载，Monaco min版本使用统一的 `workerMain.js`
> - 这解决了 "Failed to execute 'importScripts'" 的worker加载错误

**vite.config.ts** - Vite配置支持静态文件：
```typescript
export default defineConfig({
  // ...
  publicDir: 'public', // 指定静态资源目录
  build: {
    outDir: path.join(__dirname, 'static/rules/newflowchart'), // 输出到static目录
    rollupOptions: {
      // 让Vite正常处理所有依赖，包括Monaco编辑器
    }
  }
});
```

## 使用方法

### 更新Monaco编辑器

当需要更新Monaco编辑器版本时：

1. 更新package.json中的monaco-editor版本
2. 运行 `npm install` 安装新版本
3. 运行 `npm run copy-monaco` 复制新的文件到静态目录
4. 重新构建项目

```bash
npm install
npm run copy-monaco
npm run build
```

### 手动复制文件

如果需要手动复制Monaco文件：

```bash
# 复制Monaco文件到public目录
cp -r node_modules/monaco-editor/min public/monaco/

# 或者使用我们的脚本
npm run copy-monaco
```

## 优势

1. **性能提升** - 本地加载，无需等待CDN响应
2. **版本控制** - 锁定Monaco版本，避免CDN更新导致的问题
3. **离线支持** - 应用可以完全离线运行
4. **自定义控制** - 可以自定义Monaco的加载和配置
5. **减少外部依赖** - 不依赖第三方CDN服务

## 支持的功能

- ✅ JavaScript/TypeScript语法高亮和智能提示
- ✅ JSON语法验证和格式化
- ✅ CSS/SCSS语法支持
- ✅ HTML语法支持
- ✅ 代码补全和错误检查
- ✅ 主题切换（亮色/暗色）
- ✅ 差异对比视图
- ✅ 多语言支持

## 故障排除

### Monaco编辑器无法加载

1. 检查静态文件是否存在：`ls -la public/monaco/min/vs/`
2. 确保Vite配置正确设置了publicDir为'public'
3. 检查构建输出中是否包含Monaco文件：`ls -la static/rules/newflowchart/monaco/`
4. 检查浏览器控制台是否有404错误

### 语法高亮不工作

1. 确保所有Monaco语言包都已复制
2. 检查basic-languages目录是否完整
3. 验证loader.js文件是否存在

### 构建失败

1. 确保outDir和publicDir不冲突
2. 检查是否有循环依赖
3. 清理构建缓存后重试

## 文件大小

Monaco编辑器本地化会增加约15-20MB的静态文件，但这带来了更好的用户体验和可靠性。