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
		const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 秒超时

		const response = await fetch(url, {
			method: "HEAD",
			signal: controller.signal,
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
			},
		});

		clearTimeout(timeoutId);
		return response.status === 200;
	} catch {
		return false;
	}
}

async function getStatusWithCache(
	siteKey: string,
	siteUrl: string,
	kv: KVNamespace
): Promise<boolean> {
	const cacheKey = `status:${siteKey}`;
	const lockKey = `lock:${siteKey}`;

	// 检查缓存
	const cachedStatus = await kv.get(cacheKey);
	if (cachedStatus !== null) {
		return cachedStatus === "true";
	}

	// 检查锁，避免冷启动时多次请求
	const lock = await kv.get(lockKey);
	if (lock !== null) {
		// 有锁说明正在请求中，返回上次的缓存值或默认 false
		const lastStatus = await kv.get(`last:${siteKey}`);
		return lastStatus === "true";
	}

	// 设置锁
	await kv.put(lockKey, "1", { expirationTtl: LOCK_TTL });

	// 检测网站状态
	const isOnline = await checkSiteStatus(siteUrl);

	// 存储结果到缓存
	await kv.put(cacheKey, String(isOnline), { expirationTtl: CACHE_TTL });
	// 同时保存一份持久的最后状态（用于锁期间返回）
	await kv.put(`last:${siteKey}`, String(isOnline));

	// 删除锁
	await kv.delete(lockKey);

	return isOnline;
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
		const isOnline = await getStatusWithCache(siteKey, siteUrl, env.SITE_STATUS_KV);

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