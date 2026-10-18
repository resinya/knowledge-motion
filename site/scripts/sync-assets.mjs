import {copyFileSync, mkdirSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const site = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  ['knowledge-motion-logo.png', 'brand/knowledge-motion-logo.png'],
  ['examples/shopping-flow.png', 'examples/shopping-flow.png'],
  ['examples/ports.png', 'examples/ports.png'],
  ['examples/budget.png', 'examples/budget.png'],
  ...['ports', 'shopping', 'budget'].map((name) => [`examples/${name}.mp4`, `examples/${name}.mp4`]),
];

for (const [source, target] of files) {
  const from = resolve(site, '../assets', source);
  const to = resolve(site, 'public', target);
  mkdirSync(dirname(to), {recursive: true});
  copyFileSync(from, to);
}
console.log(`已从 assets/ 同步 ${files.length} 份网站素材。`);
