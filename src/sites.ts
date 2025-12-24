/**
 * 网站配置列表
 * key: URL 路径中使用的标识符
 * value: 需要检测的网站 URL
 */
export const SITES: Record<string, string> = {
  vcbs: "https://vcb-s.com/",
  dmhy: "https://dmhy.org/topics/rss/rss.xml",
  bangumi: "https://bangumi.moe/rss/latest",
  nyaa: "https://nyaa.si/?page=rss",
  acgrip: "https://acg.rip/.xml",
  acgnx: "https://share.acgnx.se/rss.xml",
  sacgnx: "https://www.acgnx.se/rss.xml"
};