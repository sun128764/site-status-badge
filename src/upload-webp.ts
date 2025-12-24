/**
 * WebP 内容生成脚本
 * 将生成的 WebP 文件转换为 base64，供 worker 在内存中使用
 */
import { writeFileSync, readdirSync, readFileSync } from "fs";
import { join, resolve } from "path";

const PUBLIC_DIR = resolve(join(__dirname, "../public"));
const OUTPUT_FILE = resolve(join(__dirname, "./webp-data.ts"));

interface WebPDataMap {
    [key: string]: string;
}

function generateWebPData(): void {
    try {
        const files = readdirSync(PUBLIC_DIR).filter((f) => f.endsWith(".webp"));

        if (files.length === 0) {
            console.log("没有找到 WebP 文件，请先运行 'pnpm generate-webp'");
            process.exit(1);
        }

        console.log(`找到 ${files.length} 个 WebP 文件，开始生成数据...\n`);

        const webpDataMap: WebPDataMap = {};

        for (const file of files) {
            const filePath = join(PUBLIC_DIR, file);
            const kvKey = `webp:${file.replace(".webp", "")}`;

            try {
                const content = readFileSync(filePath);
                // 转换为 base64
                const base64 = content.toString("base64");
                webpDataMap[kvKey] = base64;

                console.log(`✓ 处理 ${file} (${content.length} bytes)`);
            } catch (error) {
                console.error(`✗ 处理失败 ${file}:`, error);
            }
        }

        // 生成 TypeScript 文件
        const tsContent = `/**
 * 自动生成的 WebP 数据文件
 * 由 upload-webp.ts 生成
 * 不要手动修改此文件！
 */

export const WEB_P_DATA: Record<string, string> = ${JSON.stringify(webpDataMap, null, 2)};

/**
 * 从 base64 字符串获取 WebP 数据
 */
export function getWebPData(key: string): ArrayBuffer | null {
  const base64 = WEB_P_DATA[key];
  if (!base64) return null;

  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
`;

        writeFileSync(OUTPUT_FILE, tsContent);
        console.log(`\n✓ 生成数据文件: ${OUTPUT_FILE}`);
        console.log("\n========== WebP 数据生成完成 ==========\n");
    } catch (error) {
        console.error("Fatal error:", error);
        process.exit(1);
    }
}

generateWebPData();

