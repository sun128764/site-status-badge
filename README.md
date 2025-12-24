# Site Status Badge

一个部署在 Cloudflare Worker 上的网站状态检测服务，返回 SVG 格式的状态徽章。

## 功能

- 检测指定网站是否在线（HTTP 200）
- 返回 SVG 格式的状态徽章
- 使用 Cloudflare KV 进行 30 分钟结果缓存
- 使用锁机制避免冷启动时的重复请求
- CDN 缓存 5 分钟

## 使用方法

访问 `https://your-worker. workers.dev/badge/{site-key}` 获取对应网站的状态徽章。

例如：
- `https://your-worker.workers. dev/badge/dmhy` - 检测 dmhy. org
- `https://your-worker.workers.dev/badge/github` - 检测 github.com

## 使用方法
### 1. 安装依赖
访问 `https://your-worker.workers.dev/badge/{site-key}` 获取对应网站的状态徽章。

### SVG 端点
- `https://your-worker.workers.dev/badge/dmhy` - 检测 dmhy.org
- `https://your-worker.workers.dev/badge/github` - 检测 github.com
```bash
### WebP 端点（某些场景下的备选方案）
- `https://your-worker.workers.dev/badge/dmhy.webp` - WebP 格式
- `https://your-worker.workers.dev/badge/github.webp` - WebP 格式
npm install
```

### 2. 创建 KV Namespace

```bash
wrangler kv:namespace create "SITE_STATUS_KV"
```

将返回的 `id` 填入 `wrangler.toml` 中。

### 3. 部署

```bash
npm run deploy
```
### 3. 部署

```bash
npm run deploy  # 自动生成 WebP 文件后部署
```

**注**：部署时会自动运行 `generate-webp` 生成所有 WebP 文件。本地开发需要手动运行：
```bash
npm run generate-webp  # 生成 WebP 文件
npm run dev            # 启动开发服务器
```
## 添加新网站

编辑 `src/sites.ts` 文件，在 `SITES` 对象中添加新的网站配置：

```typescript
export const SITES:  Record<string, string> = {
  dmhy: "http://dmhy.org/",
  google: "https://www.google.com/",
  github:  "https://github.com/",
  // 添加新网站
  example: "https://example.com/",
};
```

## 缓存策略
## 在 Markdown 中使用

### SVG 格式
```markdown
![Site Status](https://your-worker.workers.dev/badge/dmhy)
```
| 缓存类型 | 过期时间 | 说明 |
### WebP 格式（某些平台支持更好）
```markdown
![Site Status](https://your-worker.workers.dev/badge/dmhy.webp)
```
|---------|---------|-----|
### 最兼容的方案（HTML picture 标签）
```html
<picture>
  <source srcset="https://your-worker.workers.dev/badge/dmhy.webp" type="image/webp">
  <img src="https://your-worker.workers.dev/badge/dmhy" alt="Site Status">
</picture>
```
| CDN 缓存 | 5 分钟 | HTTP Cache-Control 头 |
| KV 结果缓存 | 30 分钟 | 存储检测结果 |
| 请求锁 | 1 分钟 | 防止并发请求 |

## 在 Markdown 中使用

```markdown
![Site Status](https://your-worker.workers.dev/badge/dmhy)
```

## License

MIT