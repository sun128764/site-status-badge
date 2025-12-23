/**
 * 生成 SVG Badge
 */
export function generateBadge(name: string, isOnline: boolean): string {
  const status = isOnline ?  "online" : "offline";
  const color = isOnline ?  "#4c1" : "#e05d44";
  const statusWidth = isOnline ? 46 : 42;
  const totalWidth = 50 + statusWidth;
  const statusX = 50 + statusWidth / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${name}:  ${status}">
  <title>${name}: ${status}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="50" height="20" fill="#555"/>
    <rect x="50" width="${statusWidth}" height="20" fill="${color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
    <text aria-hidden="true" x="260" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)">${name}</text>
    <text x="260" y="140" transform="scale(.1)" fill="#fff">${name}</text>
    <text aria-hidden="true" x="${statusX * 10}" y="150" fill="#010101" fill-opacity=". 3" transform="scale(.1)">${status}</text>
    <text x="${statusX * 10}" y="140" transform="scale(.1)" fill="#fff">${status}</text>
  </g>
</svg>`;
}