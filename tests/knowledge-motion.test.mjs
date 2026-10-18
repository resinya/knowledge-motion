import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, mkdtempSync, cpSync, existsSync, rmSync, mkdirSync, symlinkSync} from 'node:fs';
import {resolve, join, relative, isAbsolute} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {normalizeStory, timelineAt, stepRange, metricValue, previewFrames, diagramGeometry, storyboardMarkdown} from '../skills/knowledge-motion/assets/template/src/story.mjs';
import {verifyMetadata} from '../skills/knowledge-motion/assets/template/scripts/verify-video.mjs';
import {createProject} from '../skills/knowledge-motion/scripts/create-project.mjs';

const repo = fileURLToPath(new URL('../', import.meta.url));
const skill = join(repo, 'skills/knowledge-motion');
const example = (name) => JSON.parse(readFileSync(join(skill, 'examples', `${name}.json`), 'utf8'));

for (const name of ['ports', 'shopping', 'budget']) {
  test(`${name}: 时间轴覆盖全部步骤，首尾全貌，预览不超出帧数`, () => {
    const story = normalizeStory(example(name)), total = story.duration * story.fps;
    assert.equal(timelineAt(story, 0).phase, 'overview');
    assert.equal(timelineAt(story, story.fps - 1).phase, 'overview');
    const visited = new Set();
    for (let f = 0; f < total; f++) {
      const t = timelineAt(story, f);
      if (t.phase === 'body') {visited.add(t.active); assert.ok(t.progress >= 0 && t.progress <= 1);}
    }
    assert.equal(visited.size, story.steps.length);
    story.steps.forEach((_, i) => {
      const {start, end} = stepRange(story, i);
      assert.equal(timelineAt(story, start).active, i);
      assert.equal(timelineAt(story, start).progress, 0);
      assert.equal(timelineAt(story, end - 1).progress, 1);
      assert.equal(timelineAt(story, end - 1).completed, i);
      if (i + 1 < story.steps.length) assert.equal(end, stepRange(story, i + 1).start);
    });
    assert.equal(timelineAt(story, total - 2 * story.fps).completed, story.steps.length);
    assert.equal(timelineAt(story, total - 1).phase, 'outro');
    assert.ok(previewFrames(story).every(({frame}) => frame >= 0 && frame < total));
  });
}

test('状态值按账目累计，步骤交接连续，最终余额满足收支守恒', () => {
  const story = normalizeStory(example('budget'));
  const final = timelineAt(story, 599);
  const values = Object.fromEntries(story.metrics.map((m) => [m.id, metricValue(story, m, final)]));
  assert.deepEqual(values, {balance: 6900, income: 8600, expense: 4700});
  assert.equal(values.balance, 3000 + values.income - values.expense);
  for (const m of story.metrics) {
    assert.equal(metricValue(story, m, timelineAt(story, 0)), m.initial);
    story.steps.forEach((_, i) => {
      const end = stepRange(story, i).end;
      assert.equal(metricValue(story, m, timelineAt(story, end - 1)), metricValue(story, m, timelineAt(story, end)));
    });
  }
});

test('源分镜不被归一化修改；数据错误在生成前报告', () => {
  const raw = example('shopping'), before = JSON.stringify(raw);
  normalizeStory(raw); assert.equal(JSON.stringify(raw), before);
  const check = (modify, match) => {const story = example('shopping'); modify(story); assert.throws(() => normalizeStory(story), match);};
  check((s) => s.steps[1].id = s.steps[0].id, /唯一/);
  check((s) => s.steps[0].diagram.edges[0].to = 'missing', /已定义/);
  check((s) => s.steps[0].diagram.nodes[0].icon = 'unknown', /图标/);
  check((s) => s.steps[0].color = 'toString', /颜色/);
  check((s) => s.width = 1000, /9:16/);
  check((s) => s.steps[0].caption = '字'.repeat(100), /太长/);
  check((s) => s.duration = 8, /至少/);
  check((s) => s.steps[0].diagram.nodes.forEach((n) => {n.x = 0.5; n.y = 0.5;}), /重叠/);
  const budget = example('budget'); budget.steps[0].changes.notDefined = 1;
  assert.throws(() => normalizeStory(budget), /指标未定义/);
});

test('未修改指标保持原值，包括与对象内置属性同名的合法指标', () => {
  const raw = example('budget');
  raw.metrics = [{id: 'constructor', label: '保留值', initial: 7}, {id: 'balance', label: '余额', initial: 3000}];
  raw.steps.forEach((s) => {s.changes = {balance: s.changes.balance};});
  const story = normalizeStory(raw);
  assert.equal(metricValue(story, story.metrics[0], timelineAt(story, 599)), 7);
});

test('节点路径有方向，端点位于图形边缘内侧而非节点中心', () => {
  const diagram = example('shopping').steps[0].diagram;
  const {nodes, edges: [edge]} = diagramGeometry(diagram, 442, 230);
  assert.ok(edge.x1 > nodes[0].cx && edge.x2 < nodes[1].cx);
  assert.ok(edge.x1 < edge.x2);
  const reverse = diagramGeometry({...diagram, edges: [{from: 'store', to: 'buyer'}]}, 442, 230).edges[0];
  assert.equal(reverse.x1, edge.x2); assert.equal(reverse.x2, edge.x1);
  assert.ok([edge.x1, edge.y1, edge.x2, edge.y2].every(Number.isFinite));
});

test('分镜记录传递双方、动作顺序与完成结果', () => {
  const markdown = storyboardMarkdown(normalizeStory(example('shopping')));
  assert.ok(markdown.includes('买家 → 商家（付款订单）'));
  assert.ok(markdown.indexOf('转运点 → 配送员') < markdown.indexOf('配送员 → 收货地'));
  assert.ok(markdown.includes('订单留下已签收记录'));
});

test('媒体核验拒绝音轨、丢帧、错误尺寸、时长和编码', () => {
  const story = normalizeStory(example('shopping'));
  const valid = {streams: [{codec_type: 'video', codec_name: 'h264', pix_fmt: 'yuv420p', width: 1080, height: 1920, avg_frame_rate: '30/1', duration: '20.000000', nb_frames: '600'}]};
  assert.equal(verifyMetadata(valid, story).passed, true);
  for (const modify of [
    (m) => m.streams.push({codec_type: 'audio'}),
    (m) => m.streams[0].nb_frames = '599',
    (m) => m.streams[0].width = 720,
    (m) => m.streams[0].duration = '19',
    (m) => m.streams[0].avg_frame_rate = '25/1',
    (m) => m.streams[0].codec_name = 'hevc',
  ]) {const metadata = structuredClone(valid); modify(metadata); assert.equal(verifyMetadata(metadata, story).passed, false);}
  assert.equal(verifyMetadata({streams: []}, story).passed, false);
});

test('完整 Skill 复制到另一项目后可创建独立源项目，拒绝覆盖与路径逃逸', async () => {
  const temp = mkdtempSync(join(tmpdir(), 'knowledge-motion-'));
  try {
    const installed = join(temp, 'installed'); cpSync(skill, installed, {recursive: true});
    const {createProject: copiedCreate} = await import(pathToFileURL(join(installed, 'scripts/create-project.mjs')));
    const workspace = join(temp, 'project'); mkdirSync(workspace);
    const storyFile = join(installed, 'examples/shopping.json');
    const output = copiedCreate({projectRoot: workspace, storyFile, output: 'out/video'});
    for (const path of ['story.json', 'storyboard.md', 'package.json', 'package-lock.json', 'src/index.jsx', 'src/Scene.jsx', 'src/Glyph.jsx', 'src/story.mjs', 'scripts/render.mjs', 'scripts/verify-video.mjs']) assert.equal(existsSync(join(output, path)), true, path);
    assert.throws(() => copiedCreate({projectRoot: workspace, storyFile, output: 'out/video'}), /已存在/);
    assert.throws(() => copiedCreate({projectRoot: workspace, storyFile, output: '../escape'}), /项目内/);
    assert.throws(() => copiedCreate({projectRoot: temp, storyFile, output: 'installed/output'}), /Skill/);
    const external = join(temp, 'external'); mkdirSync(external);
    symlinkSync(external, join(workspace, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
    assert.throws(() => copiedCreate({projectRoot: workspace, storyFile, output: 'linked/video'}), /真实路径/);
  } finally {
    const local = relative(resolve(tmpdir()), resolve(temp));
    assert.ok(local && !local.startsWith('..') && !isAbsolute(local), 'cleanup must remain in the allocated temp directory');
    rmSync(temp, {recursive: true, force: true});
  }
});
