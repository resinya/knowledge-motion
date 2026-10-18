import { createGetUrl } from 'fumadocs-core/source';

export const appName = 'Knowledge Motion';

// GitHub Pages 项目站地址：https://<user>.github.io/<repo>/
// 绑定自定义域名后，在部署环境配 NEXT_PUBLIC_SITE_URL 覆盖即可
const DEFAULT_SITE_URL = 'https://resinya.github.io/RepoPilot';

/**
 * 归一化 NEXT_PUBLIC_SITE_URL。
 *
 * 这个值会在构建期被 layout.tsx 拿去做 metadataBase，只要它不是合法的绝对 URL
 * 就会抛 ERR_INVALID_URL，直接让构建失败。两种最容易踩的填法：
 *   - 留空：环境变量是空字符串 ''，`??` 兜底拦不住，new URL('') 直接挂
 *   - 漏协议头：填 example.com 而不是 https://example.com
 *
 * 所以这里做三步兜底：补协议 → 去尾斜杠 → 解析失败回退默认值。
 * 只在构建日志里警告，绝不中断构建。
 */
function resolveSiteUrl(value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) return DEFAULT_SITE_URL;

  const hasScheme = /^https?:\/\//i.test(trimmed);
  try {
    const url = new URL(hasScheme ? trimmed : `https://${trimmed}`);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new Error('仅支持 http/https');
    }
    return url.pathname === '/' ? url.origin : url.origin + url.pathname;
  } catch {
    console.warn(
      `[Knowledge Motion] NEXT_PUBLIC_SITE_URL 不是合法地址（收到 "${trimmed}"），已回退到 ${DEFAULT_SITE_URL}。`,
    );
    return DEFAULT_SITE_URL;
  }
}

export const siteUrl = resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

export const siteTitle = 'Knowledge Motion · 知识动态信息图 Skill';

export const siteDescription =
  '把任意领域的知识、分类与过程制作成深色动态信息图。' +
  '固定分区、逐步聚焦、对象传递、结果保留，输出静音 MP4、可修改的 Remotion 与 SVG 源项目和分镜。';

export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';
export const changelogRoute = '/changelog';
export const examplesRoute = '/examples';

// Next.js 的 public 图片不会自动加 basePath；与 Pages 构建配置保持一致。
export function assetUrl(path: string) {
  const basePath = process.env.PAGES === '1' ? '/RepoPilot' : '';
  return `${basePath}/${path.replace(/^\/+/, '')}`;
}

export const gitConfig = {
  user: 'resinya',
  repo: 'RepoPilot',
  branch: 'main',
};

/**
 * 导航栏与侧边栏的分类入口。
 * slug 必须与 content/docs/ 下的目录名一致，否则链接 404。
 */
export const categories = [
  {
    slug: 'guide',
    title: '指南',
    description: '安装 Skill，制作第一条静音知识视频。',
  },
  {
    slug: 'how-it-works',
    title: '原理',
    description: '从内容到分镜，再到按帧动画和视频导出。',
  },
  {
    slug: 'reference',
    title: '参考',
    description: '分镜字段、布局、运行命令与媒体验收。',
  },
];

const getContentUrl = createGetUrl(docsContentRoute);

export function getPageMarkdownUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'content.md'];

  return { segments, url: getContentUrl(segments, page.locale) };
}

const getImageUrl = createGetUrl(docsImageRoute);

export function getPageImageUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'image.png'];

  return { segments, url: getImageUrl(segments, page.locale) };
}
