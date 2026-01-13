# Site Status Badge

一个部署在 Cloudflare Worker 上的网站状态检测服务，返回 SVG/WebP 格式的状态徽章。

## 功能

- 检测指定网站是否在线（HTTP 200）
- 支持 SVG 和 WebP 两种格式的状态徽章
- 使用 Cloudflare KV 进行 30 分钟结果缓存
- 使用锁机制避免冷启动时的重复请求
- CDN 缓存 5 分钟

## 示例

以下是所有可用的站点徽章示例：

| 站点 | SVG | WebP |
|------|-----|------|
| VCBS | ![VCBS](https://site-status-badge.sun128764.workers.dev/badge/vcbs) | ![VCBS](https://site-status-badge.sun128764.workers.dev/badge/vcbs.webp) |
| DMHY | ![DMHY](https://site-status-badge.sun128764.workers.dev/badge/dmhy) | ![DMHY](https://site-status-badge.sun128764.workers.dev/badge/dmhy.webp) |
| Bangumi | ![Bangumi](https://site-status-badge.sun128764.workers.dev/badge/bangumi) | ![Bangumi](https://site-status-badge.sun128764.workers.dev/badge/bangumi.webp) |
| Nyaa | ![Nyaa](https://site-status-badge.sun128764.workers.dev/badge/nyaa) | ![Nyaa](https://site-status-badge.sun128764.workers.dev/badge/nyaa.webp) |
| ACG.RIP | ![ACG.RIP](https://site-status-badge.sun128764.workers.dev/badge/acgrip) | ![ACG.RIP](https://site-status-badge.sun128764.workers.dev/badge/acgrip.webp) |
| ACGNX.SE | ![ACGNX.SE](https://site-status-badge.sun128764.workers.dev/badge/acgnxa) | ![ACGNX.SE](https://site-status-badge.sun128764.workers.dev/badge/acgnxa.webp) |
| ACGNX.SE (Global) | ![ACGNX.SE Global](https://site-status-badge.sun128764.workers.dev/badge/acgnxg) | ![ACGNX.SE Global](https://site-status-badge.sun128764.workers.dev/badge/acgnxg.webp) |
| Mikan | ![Mikan](https://site-status-badge.sun128764.workers.dev/badge/mikan) | ![Mikan](https://site-status-badge.sun128764.workers.dev/badge/mikan.webp) |

## 使用方法

### Markdown

**SVG 格式：**
```markdown
![Site Status](https://site-status-badge.sun128764.workers.dev/badge/dmhy)
```

**WebP 格式：**
```markdown
![Site Status](https://site-status-badge.sun128764.workers.dev/badge/dmhy.webp)
```

### BBCode

**SVG 格式：**
```bbcode
[img]https://site-status-badge.sun128764.workers.dev/badge/dmhy[/img]
```

**WebP 格式：**
```bbcode
[img]https://site-status-badge.sun128764.workers.dev/badge/dmhy.webp[/img]
```

**带链接：**
```bbcode
[url=https://dmhy.org][img]https://site-status-badge.sun128764.workers.dev/badge/dmhy[/img][/url]
```

### HTML

**SVG 格式：**
```html
<img src="https://site-status-badge.sun128764.workers.dev/badge/dmhy" alt="Site Status">
```

**WebP 格式：**
```html
<img src="https://site-status-badge.sun128764.workers.dev/badge/dmhy.webp" alt="Site Status">
```

**Picture 标签（推荐，带回退）：**
```html
<picture>
  <source srcset="https://site-status-badge.sun128764.workers.dev/badge/dmhy.webp" type="image/webp">
  <img src="https://site-status-badge.sun128764.workers.dev/badge/dmhy" alt="Site Status">
</picture>
```

**带链接：**
```html
<a href="https://dmhy.org">
  <img src="https://site-status-badge.sun128764.workers.dev/badge/dmhy" alt="Site Status">
</a>
```

## 部署

### 1. 安装依赖

```bash
pnpm install
```

### 2. 创建 KV Namespace

```bash
wrangler kv:namespace create "SITE_STATUS_KV"
```

将返回的 `id` 填入 `wrangler.jsonc` 中。

### 3. 部署

```bash
pnpm run deploy  # 自动生成 WebP 文件后部署
```

**注**：部署时会自动运行 `generate-webp` 生成所有 WebP 文件。本地开发需要手动运行：
```bash
pnpm run generate-webp  # 生成 WebP 文件
pnpm run dev            # 启动开发服务器
```

## 添加新网站

编辑 `src/sites.ts` 文件，在 `SITES` 对象中添加新的网站配置：

```typescript
export const SITES: Record<string, string> = {
  dmhy: "https://dmhy.org/topics/rss/rss.xml",
  // 添加新网站
  example: "https://example.com/",
};
```

## 缓存策略

| 缓存类型 | 过期时间 | 说明 |
|---------|---------|-----|
| CDN 缓存 | 5 分钟 | HTTP Cache-Control 头 |
| KV 结果缓存 | 30 分钟 | 存储检测结果 |
| 请求锁 | 1 分钟 | 防止并发请求 |

## License

MIT