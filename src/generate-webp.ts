/**
 * WebP 生成脚本
 * 根据 SVG Badge 生成 WebP 格式的静态资源
 * 支持本地开发和 KV 上传模式
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { join, resolve } from "path";
import { SITES } from "./sites";
import { generateBadge } from "./badge";
import sharp from "sharp";

const OUTPUT_DIR = resolve(join(__dirname, "../public"));
const MANIFEST_FILE = resolve(join(__dirname, "../public/webp-manifest.json"));
const FORMATS = [
    { width: 212, suffix: "default" },
    { width: 424, suffix: "2x" },
];

interface WebPManifest {
    generated: string;
    files: Record<string, string>;
}

async function generateWebPFiles(): Promise<void> {
    // 创建输出目录
    if (!existsSync(OUTPUT_DIR)) {
        mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const manifest: WebPManifest = {
        generated: new Date().toISOString(),
        files: {},
    };

    const results: Record<string, any> = {};

    console.log("开始生成 WebP 文件...\n");

    // 为每个网站生成 WebP 文件
    for (const [siteKey, _] of Object.entries(SITES)) {
        try {
            // 为这个网站生成两种状态的 badge（在线和离线）
            for (const status of [true, false]) {
                // 生成 SVG
                const svg = generateBadge(siteKey, status);

                const statusName = status ? "online" : "offline";
                const statusNum = status ? "1" : "0";

                // 为每种尺寸生成 WebP
                for (const { width, suffix } of FORMATS) {
                    const webpFileName = `${siteKey}-${statusNum}-${suffix}.webp`;
                    const webpFilePath = join(OUTPUT_DIR, webpFileName);

                    // 使用 sharp 将 SVG 等比缩放为指定宽度的 WebP
                    // 仅指定 width，height 由 sharp 按原始 SVG 宽高比自动计算，避免图像被压扁
                    await sharp(Buffer.from(svg))
                        .resize({ width })
                        .webp({ quality: 90 })
                        .toFile(webpFilePath);

                    // 读取文件内容用于 KV 存储
                    const fileContent = readFileSync(webpFilePath);
                    const kvKey = `webp:${siteKey}-${statusNum}-${suffix}`;
                    manifest.files[kvKey] = webpFileName;

                    console.log(`✓ 生成 ${webpFileName} (${statusName}, ${suffix})`);
                }
            }

            results[siteKey] = { status: "success" };
        } catch (error) {
            console.error(`✗ 生成失败 ${siteKey}:`, error);
            results[siteKey] = { status: "error", error: String(error) };
        }
    }

    // 保存 manifest 文件
    writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));

    // 输出总结
    console.log("\n========== WebP 生成完成 ==========");
    console.log(`总数: ${Object.entries(SITES).length} 个网站`);
    console.log(`成功: ${Object.values(results).filter((r) => r.status === "success").length}`);
    console.log(`失败: ${Object.values(results).filter((r) => r.status === "error").length}`);
    console.log(`输出目录: ${OUTPUT_DIR}`);
    console.log(`清单文件: ${MANIFEST_FILE}`);
    console.log("=====================================\n");
}

// 运行脚本
generateWebPFiles().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});

