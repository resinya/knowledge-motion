import {readFileSync, writeFileSync, mkdirSync, renameSync, existsSync, rmSync} from 'node:fs';
import {resolve, dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {normalizeStory, previewFrames, storyboardMarkdown} from '../src/story.mjs';
import {verifyVideo} from './verify-video.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
if ([...args].some((arg) => !['--check', '--preview'].includes(arg)) || args.size > 1) {
  console.error('用法：node scripts/render.mjs [--check | --preview]'); process.exit(1);
}

let browser;
try {
  const story = normalizeStory(JSON.parse(readFileSync(join(root, 'story.json'), 'utf8')));
  writeFileSync(join(root, 'storyboard.md'), storyboardMarkdown(story));
  console.log(`分镜通过：${story.title} · ${story.layout} · ${story.steps.length} 步 · ${story.duration} 秒`);
  if (!args.has('--check')) {
    const {bundle} = await import('@remotion/bundler');
    const {openBrowser, selectComposition, renderStill, renderMedia} = await import('@remotion/renderer');
    const bundlePath = await bundle({entryPoint: join(root, 'src/index.jsx'), outDir: join(root, '.cache/bundle'), publicDir: null});
    browser = await openBrowser('chrome', {browserExecutable: process.env.REMOTION_BROWSER_EXECUTABLE || null});
    const inputProps = {story};
    const options = {serveUrl: bundlePath, inputProps, puppeteerInstance: browser};
    const composition = await selectComposition({...options, id: 'KnowledgeMotion'});
    if (args.has('--preview')) {
      mkdirSync(join(root, 'previews'), {recursive: true});
      const frames = previewFrames(story);
      for (const item of frames) {
        await renderStill({...options, composition, frame: item.frame, output: join(root, 'previews', item.name + '.png'), imageFormat: 'png'});
        console.log(`预览：${item.name} · frame ${item.frame}`);
      }
      writeFileSync(join(root, 'previews/manifest.json'), JSON.stringify(frames, null, 2) + '\n');
    } else {
      const output = join(root, 'video.mp4'), partial = join(root, 'video.partial.mp4'), report = join(root, 'verification.json');
      if (existsSync(report)) rmSync(report);
      let bucket = -1;
      await renderMedia({...options, composition, outputLocation: partial, codec: 'h264', pixelFormat: 'yuv420p', colorSpace: 'bt709', imageFormat: 'png', crf: 18, muted: true, enforceAudioTrack: false, concurrency: Math.max(1, Math.min(8, Number(process.env.REMOTION_CONCURRENCY) || 3)), onProgress: ({progress}) => {
        const next = Math.floor(progress * 10);
        if (next !== bucket) {bucket = next; console.log(`渲染 ${Math.min(100, next * 10)}%`);}
      }});
      verifyVideo(partial, story, report);
      renameSync(partial, output);
      console.log(`完成并通过媒体核验：${output}`);
    }
  }
} catch (error) {
  console.error(error.stack ?? error.message); process.exitCode = 1;
} finally {
  if (browser) await browser.close({silent: true});
}
