import { SITES } from "./sites";
import { generateBadge } from "./badge";

export interface Env {
	SITE_STATUS_KV: KVNamespace;
}

const CACHE_TTL = 30 * 60; // 30 分钟结果缓存
const LOCK_TTL = 60; // 1 分钟锁
const CDN_CACHE_TTL = 5 * 60; // 5 分钟 CDN 缓存

async function checkSiteStatus(url: string): Promise<boolean> {
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 秒超时

		const response = await fetch(url, {
			method: "HEAD",
			signal: controller.signal,
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
			},
		});

		clearTimeout(timeoutId);
		if (response.status === 200 || response.status === 403) {
			return true;
		}
		else {
			console.log(`Site check failed for ${url}: ${response.status} ${response.body}`);
			return false;
		}
	} catch (error) {
		if (error instanceof DOMException && error.name === 'AbortError') {
			console.log(`Site check timed out for ${url}`);
		} else {
			console.log(`Site check error for ${url}: ${error}`);
		}
		return false;
	}
}

async function getStatusWithCache(
	siteKey: string,
	siteUrl: string,
	kv: KVNamespace,
	ctx?: ExecutionContext
): Promise<boolean> {
	const cacheKey = `status:${siteKey}`;
	const lockKey = `lock:${siteKey}`;

	// 检查缓存
	const cachedStatus = await kv.get(cacheKey);
	if (cachedStatus !== null) {
		// 缓存存在，立即返回缓存值，不阻塞用户请求
		// 同时在后台异步刷新缓存（通过 ctx.waitUntil）
		if (ctx) {
			ctx.waitUntil(refreshStatusInBackground(siteKey, siteUrl, kv));
		}
		return cachedStatus === "true";
	}

	// 缓存不存在，检查是否已有锁（表示正在刷新）
	const lock = await kv.get(lockKey);
	if (lock !== null) {
		// 有锁说明正在请求中，返回上次保存的状态或默认 false
		const lastStatus = await kv.get(`last:${siteKey}`);
		return lastStatus === "true";
	}

	// 没有缓存，设置锁并在后台刷新
	if (ctx) {
		ctx.waitUntil(refreshStatusInBackground(siteKey, siteUrl, kv));
	} else {
		// 如果没有 ctx，同步执行（作为回退）
		await refreshStatusInBackground(siteKey, siteUrl, kv);
	}

	// 返回上次保存的状态或默认 true（更乐观的假设）
	const lastStatus = await kv.get(`last:${siteKey}`);
	return lastStatus === "true";
}

/**
 * 后台刷新缓存（不阻塞用户请求）
 */
async function refreshStatusInBackground(
	siteKey: string,
	siteUrl: string,
	kv: KVNamespace
): Promise<void> {
	const lockKey = `lock:${siteKey}`;
	const cacheKey = `status:${siteKey}`;

	try {
		// 设置锁，防止多个并发请求
		await kv.put(lockKey, "1", { expirationTtl: LOCK_TTL });

		// 检测网站状态
		const isOnline = await checkSiteStatus(siteUrl);

		// 存储结果到缓存
		await kv.put(cacheKey, String(isOnline), { expirationTtl: CACHE_TTL });
		// 同时保存一份最后状态（用于锁期间或缓存缺失时返回）
		await kv.put(`last:${siteKey}`, String(isOnline));
	} finally {
		// 删除锁
		await kv.delete(lockKey);
	}
}

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		// 解析路径：/badge/{siteKey}
		const match = path.match(/^\/badge\/([a-zA-Z0-9_-]+)$/);

		if (!match) {
			return new Response("Not Found.  Usage: /badge/{site-key}", {
				status: 404,
				headers: { "Content-Type": "text/plain" },
			});
		}

		const siteKey = match[1].toLowerCase();
		const siteUrl = SITES[siteKey];

		if (!siteUrl) {
			const availableSites = Object.keys(SITES).join(", ");
			return new Response(
				`Unknown site: ${siteKey}. Available sites: ${availableSites}`,
				{
					status: 404,
					headers: { "Content-Type": "text/plain" },
				}
			);
		}

		// 获取状态（带缓存）
		const isOnline = await getStatusWithCache(siteKey, siteUrl, env.SITE_STATUS_KV, ctx);

		// 生成 SVG badge
		const svg = generateBadge(siteKey, isOnline);

		return new Response(svg, {
			status: 200,
			headers: {
				"Content-Type": "image/svg+xml",
				"Cache-Control": `public, max-age=${CDN_CACHE_TTL}`,
				"CDN-Cache-Control": `max-age=${CDN_CACHE_TTL}`,
				"Cloudflare-CDN-Cache-Control": `max-age=${CDN_CACHE_TTL}`,
			},
		});
	},
};