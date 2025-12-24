# WebP Badge 功能说明

## 概述
为了支持某些不允许使用 SVG 的环境，本项目新增了 WebP 图像格式的支持作为 SVG 的备选方案。

## 新增功能

### 1. WebP 生成脚本 (`src/generate-webp.ts`)
自动生成所有网站的 WebP 格式徽章，包含两种状态（在线/离线）和两种尺寸：
- **尺寸**：
  - `default`: 212×20 (原始尺寸)
  - `2x`: 424×40 (高清版本)
  
- **状态**：
  - `1`: 在线 (绿色)
  - `0`: 离线 (红色)

- **输出位置**：`/public` 目录
- **生成的文件数**：28 个 WebP 文件 + 1 个清单文件

### 2. WebP 数据编码脚本 (`src/upload-webp.ts`)
将生成的 WebP 文件转换为 Base64 编码，嵌入到 TypeScript 代码中：
- **输出**：`src/webp-data.ts`
- **优势**：
  - WebP 数据被打包到 Worker 代码中，无需外部存储
  - 减少网络请求
  - 更快的响应速度

### 3. WebP 端点 (`src/index.ts`)
新增 RESTful 端点，支持返回 WebP 格式的徽章：

```
GET /badge/{siteKey}.webp
```

**示例**：
- `/badge/vcbs.webp` - 返回 VCBS 网站的 WebP 徽章
- `/badge/dmhy.webp` - 返回 DMHY 网站的 WebP 徽章

**响应头**：
- `Content-Type: image/webp`
- 缓存策略与 SVG 端点相同

### 4. 自动化构建流程

#### 包含的任务：
```bash
# 仅生成 WebP 文件
pnpm generate-webp

# 部署（自动包含 WebP 生成）
pnpm deploy

# 开发模式（自动包含 WebP 生成）
pnpm dev

# 启动（自动包含 WebP 生成）
pnpm start
```

#### 构建流程：
1. `generate-webp` 任务会自动：
   - 运行 `src/generate-webp.ts` 生成 WebP 文件到 `/public`
   - 运行 `src/upload-webp.ts` 编码为 `src/webp-data.ts`
   
2. 每次 `deploy`, `dev`, `start` 时都会预先运行 `generate-webp`

### 5. 新增依赖
- **sharp** (^0.34.5): 高性能图像处理库
- **tsx** (^4.21.0): TypeScript 脚本执行器
- **@types/node** (^25.0.3): Node.js 类型定义

## 文件清单

### 新建文件：
- `src/generate-webp.ts` - WebP 生成脚本
- `src/upload-webp.ts` - WebP 编码脚本
- `src/webp-data.ts` - 自动生成的 WebP 数据文件（~92KB）
- `public/` - WebP 文件输出目录
  - `{site}-{status}-{size}.webp` (28 个文件，总计 ~116KB)
  - `webp-manifest.json` - 文件清单

### 修改文件：
- `src/index.ts` - 新增 WebP 端点处理
- `package.json` - 新增 npm 脚本和依赖
- `tsconfig.json` - 添加 Node.js 类型支持
- `wrangler.jsonc` - 配置调整

## 使用示例

### HTML 中使用：
```html
<!-- 优先使用 SVG -->
<img src="https://your-domain.com/badge/vcbs" alt="VCBS Status">

<!-- 备选方案：WebP -->
<img src="https://your-domain.com/badge/vcbs.webp" alt="VCBS Status">

<!-- 最兼容的方案：picture 标签 -->
<picture>
  <source srcset="https://your-domain.com/badge/vcbs.webp" type="image/webp">
  <img src="https://your-domain.com/badge/vcbs" alt="VCBS Status">
</picture>
```

### Markdown 中使用：
```markdown
![VCBS Status](https://your-domain.com/badge/vcbs.webp)
```

## 性能指标

### 文件大小对比：
| 项目 | 大小 | 数量 | 总计 |
|------|------|------|------|
| WebP (default) | ~1.5-1.8 KB | 14 | ~25 KB |
| WebP (2x) | ~3.0-3.7 KB | 14 | ~50 KB |
| WebP 数据文件 | - | 1 | ~92 KB |

### 优势：
- WebP 格式相对于 SVG 更小（某些场景可节省 50-70%）
- 支持不允许 SVG 的环境
- 动态生成，保持状态最新

## 开发工作流

### 首次运行：
```bash
pnpm install          # 安装依赖
pnpm generate-webp    # 生成 WebP 文件
pnpm dev             # 启动开发服务器
```

### 添加新网站：
1. 在 `src/sites.ts` 中添加网站
2. 运行 `pnpm generate-webp` 自动为新网站生成 WebP
3. WebP 文件自动添加到 `src/webp-data.ts`
4. 无需修改其他代码，端点自动支持

### 维护清单：
- `src/webp-data.ts` 由自动化脚本生成，不要手动编辑
- `src/generate-webp.ts` 和 `src/upload-webp.ts` 可根据需要自定义
- WebP 缓存策略与 SVG 相同（5 分钟 CDN 缓存）

## 技术细节

### WebP 编码参数：
- 质量: 90 (高质量，文件较小)
- 格式: WebP (现代浏览器支持)
- 尺寸: 通过 Sharp 的 `resize` 方法精确缩放

### 数据编码：
- 格式: Base64
- 存储方式: 内存中的 TypeScript 导出常数
- 解码方式: `getWebPData()` 函数在运行时解码

## 浏览器兼容性

| 浏览器 | SVG | WebP |
|------|-----|------|
| Chrome | ✅ | ✅ |
| Firefox | ✅ | ✅ |
| Safari | ✅ | ✅ (iOS 14+) |
| Edge | ✅ | ✅ |
| IE 11 | ✅ | ❌ |

使用 `<picture>` 标签可提供最佳兼容性。
