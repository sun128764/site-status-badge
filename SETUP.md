# WebP 功能快速开始指南

## 快速命令

### 生成 WebP 文件
```bash
pnpm generate-webp
```
这会：
1. 为所有网站生成 28 个 WebP 文件（2 个状态 × 7 个网站 × 2 个尺寸）
2. 将它们编码到 TypeScript 文件中
3. 生成清单文件

### 部署（包含 WebP 生成）
```bash
pnpm deploy
```

### 开发模式（包含 WebP 生成）
```bash
pnpm dev
```

## API 端点

### SVG 徽章（原有）
```
GET /badge/{siteKey}
```

### WebP 徽章（新增）
```
GET /badge/{siteKey}.webp
```

## 支持的网站

目前支持的 siteKey：
- `vcbs` - VCB-Studio
- `dmhy` - Dymy
- `bangumi` - Bangumi Moe
- `nyaa` - Nyaa.si
- `acgrip` - ACG.RIP
- `acgnxa` - ACG-NX (acgnx.se)
- `acgnxg` - ACG-NX (acgnx.se)

## 文件结构

```
src/
├── index.ts              # 主程序，包含 SVG 和 WebP 端点
├── sites.ts              # 网站配置
├── badge.ts              # SVG 生成
├── generate-webp.ts      # WebP 生成脚本
├── upload-webp.ts        # WebP 编码脚本
└── webp-data.ts          # 自动生成（不要编辑）

public/
├── vcbs-0-default.webp   # 离线状态（原始尺寸）
├── vcbs-0-2x.webp        # 离线状态（2倍尺寸）
├── vcbs-1-default.webp   # 在线状态（原始尺寸）
├── vcbs-1-2x.webp        # 在线状态（2倍尺寸）
└── ... (其他网站)
```

## 工作原理

1. **生成阶段** (`generate-webp.ts`)
   - 从网站列表读取所有网站
   - 为每个网站的两个状态生成 SVG
   - 使用 Sharp 库将 SVG 转换为 WebP
   - 保存到 `/public` 目录

2. **编码阶段** (`upload-webp.ts`)
   - 读取 `/public` 中的所有 WebP 文件
   - 转换为 Base64 编码
   - 生成 TypeScript 导出文件 (`webp-data.ts`)

3. **服务阶段** (`index.ts`)
   - 接收请求到 `/badge/{siteKey}.webp`
   - 检查网站状态（在线/离线）
   - 从 `webp-data.ts` 获取对应的 Base64 数据
   - 解码为 ArrayBuffer
   - 返回给客户端

## 何时重新生成 WebP

需要重新生成的情况：
- ✅ 自动：部署前（`pnpm deploy` 自动运行）
- ✅ 自动：开发前（`pnpm dev` 自动运行）
- ✅ 手动：修改网站配置后（`pnpm generate-webp`）
- ✅ 手动：修改徽章样式后（`pnpm generate-webp`）

## 常见问题

### Q: WebP 文件会占用很多空间吗？
A: 不会。28 个 WebP 文件总共仅 ~116KB，编码后的 `webp-data.ts` 约 92KB。

### Q: 能否使用 2x 尺寸的 WebP？
A: 可以，但目前端点只返回 default 尺寸。修改 `index.ts` 的 `webpKey` 构建逻辑即可支持。

### Q: WebP 相对 SVG 有什么优势？
A: 
- 某些不支持 SVG 的环境（如某些 Markdown 渲染器）可以使用
- 文件更小（约 50% 的 SVG 大小）
- 加载更快

### Q: 如何添加新网站？
A: 
1. 在 `src/sites.ts` 的 `SITES` 对象中添加网站
2. 运行 `pnpm generate-webp`
3. 完成！新网站的 WebP 端点自动可用

## 故障排查

### 生成失败：找不到 Sharp
```bash
pnpm add sharp --save-dev
```

### 生成失败：找不到 tsx
```bash
pnpm add tsx --save-dev
```

### webp-data.ts 文件过大
这是正常的，所有 WebP Base64 数据都存储在该文件中。

### 端点返回 404
确保已运行 `pnpm generate-webp` 来生成必要的文件。

## 性能提示

- WebP 端点使用相同的缓存策略（5 分钟 CDN 缓存）
- Base64 编码增加了约 33% 的大小，但节省了网络请求
- 总体大小仍小于 SVG，特别是在高清屏幕上
