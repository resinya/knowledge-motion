import {existsSync, readFileSync, readdirSync, statSync} from 'node:fs';
import {dirname, relative, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';

const {values} = parseArgs({
  options: {'base-path': {type: 'string'}, directory: {type: 'string'}},
});
if (values['base-path'] === undefined) throw new Error('请通过 --base-path 指定 Pages 实际发布路径。');
const basePath = values['base-path'].replace(/\/$/, '');
const site = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(values.directory ?? resolve(site, 'out'));
const pages = readdirSync(root, {recursive: true}).filter((file) => file.endsWith('.html'));
if (!pages.length) throw new Error('找不到导出的 HTML 页面。');

const failures = [];
let checked = 0;
for (const page of pages) {
  const html = readFileSync(resolve(root, page), 'utf8');
  const pagePath = page.split(sep).join('/').replace(/index\.html$/, '').replace(/\.html$/, '');
  const pageUrl = new URL(`https://export.invalid${basePath}/${pagePath}`);
  for (const match of html.matchAll(/<(?:script|link|img|source|a)\b[^>]*?\b(?:src|href)="([^"]+)"/g)) {
    const ref = match[1].replaceAll('&amp;', '&');
    if (!ref || ref.startsWith('#') || /^(?:[a-z]+:|\/\/)/i.test(ref)) continue;
    const url = new URL(ref, pageUrl);
    const pathname = decodeURIComponent(url.pathname);
    checked++;
    if (basePath && pathname !== basePath && !pathname.startsWith(basePath + '/')) {
      failures.push(`${page}: 路径前缀错误 ${pathname}`);
      continue;
    }
    const local = pathname.slice(basePath.length) || '/';
    const target = resolve(root, '.' + local);
    const within = relative(root, target);
    if (within.startsWith('..') || within.includes(':' )) {
      failures.push(`${page}: 路径超出导出目录 ${pathname}`);
      continue;
    }
    const candidates = [target, target + '.html', resolve(target, 'index.html')];
    if (!candidates.some((file) => existsSync(file) && statSync(file).isFile())) {
      failures.push(`${page}: 缺少资源 ${pathname}`);
    }
  }
}
if (failures.length) {
  console.error(`静态导出检查失败：${failures.length} 处错误。\n${failures.slice(0, 8).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`静态导出检查通过：${pages.length} 个页面、${checked} 个本地引用，发布路径 ${basePath || '/'}。`);
}
