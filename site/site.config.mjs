// 本地默认值与 CI 共享；CI 优先采用 Pages 返回的真实地址，兼容仓库改名和自定义域名。
const slug = process.env.GITHUB_REPOSITORY?.trim() || 'resinya/knowledge-motion';
const [owner, name] = slug.split('/');
export const githubRepository = {owner, name};
export const pagesBasePath = process.env.PAGES === '1'
  ? (process.env.PAGES_BASE_PATH ?? `/${name}`).replace(/\/$/, '')
  : '';
export const defaultSiteUrl = `https://${owner}.github.io/${name}`;
