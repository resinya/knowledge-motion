export const COLORS = {
  cyan: '#32c5ff', green: '#31dbaf', purple: '#b99cff', orange: '#ffbe67', red: '#ff7e8a',
};
export const ICONS = ['screen', 'server', 'database', 'globe', 'lock', 'document', 'cart', 'card', 'package', 'truck', 'home', 'wallet', 'bank', 'coin', 'person', 'store', 'leaf', 'sun', 'cloud', 'check', 'chart'];
export const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
export const mix = (a, b, progress) => a + (b - a) * clamp(progress);
export const ease = (value) => { const p = clamp(value); return p * p * (3 - 2 * p); };
export const glyphWidth = (text) => [...text].reduce((sum, ch) => sum + (/[^\u0000-\u00ff]/u.test(ch) ? 1 : /[MW@#%]/.test(ch) ? 0.8 : 0.56), 0);
export const tone = (name) => Object.hasOwn(COLORS, name) ? COLORS[name] : name ?? COLORS.cyan;

export function wrapText(text, capacity) {
  const lines = []; let line = '';
  for (const char of [...String(text)]) {
    if (char === '\n' || (line && glyphWidth(line + char) > capacity)) {
      lines.push(line); line = char === '\n' ? '' : char;
    } else line += char;
  }
  if (line) lines.push(line);
  return lines;
}

function requireText(value, name, max) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${name} 必须是非空文字`);
  if (glyphWidth(value) > max) throw new Error(`${name} 太长，请精简到约 ${max} 个汉字宽度`);
}

export function normalizeStory(input) {
  const story = structuredClone(input);
  if (!story || typeof story !== 'object' || Array.isArray(story)) throw new Error('分镜必须为 JSON 对象');
  story.duration ??= 20; story.fps ??= 30; story.width ??= 1080; story.height ??= 1920;
  story.kicker ??= '知识 · 动态图解'; story.subtitle ??= ''; story.summary ??= '';
  requireText(story.title, 'title', 28);
  for (const key of ['kicker', 'subtitle', 'summary']) {
    if (typeof story[key] !== 'string' || glyphWidth(story[key]) > (key === 'kicker' ? 22 : 38)) throw new Error(`${key} 必须为短文字`);
  }
  if (!['list', 'grid', 'state'].includes(story.layout)) throw new Error('layout 必须是 list、grid 或 state');
  if (!Number.isFinite(story.duration) || story.duration < 8 || story.duration > 120) throw new Error('duration 应为 8–120 秒');
  if (!Number.isInteger(story.fps) || story.fps < 24 || story.fps > 60) throw new Error('fps 应为 24–60 的整数');
  if (!Number.isInteger(story.width) || !Number.isInteger(story.height) || story.width < 360 || story.width > 2160 || story.height * 9 !== story.width * 16 || story.width % 2 || story.height % 2) throw new Error('画幅必须是偶数尺寸的 9:16，宽 360–2160');
  const limits = {list: [2, 10], grid: [2, 6], state: [2, 8]}[story.layout];
  if (!Array.isArray(story.steps) || story.steps.length < limits[0] || story.steps.length > limits[1]) throw new Error(`${story.layout} 需要 ${limits[0]}–${limits[1]} 步`);
  if ((story.duration - 3) / story.steps.length < 1) throw new Error('每步动作至少需要 1 秒，请减少步骤或增加时长');
  const ids = new Set();
  const validTone = (value) => value === undefined || (typeof value === 'string' && (Object.hasOwn(COLORS, value) || /^#[a-f0-9]{6}$/i.test(value)));
  story.steps.forEach((step, i) => {
    if (!step || typeof step !== 'object') throw new Error(`steps[${i}] 必须是对象`);
    requireText(step.id, `steps[${i}].id`, 40);
    if (!/^[a-z][a-z0-9-]*$/.test(step.id) || ids.has(step.id)) throw new Error('步骤 id 必须是唯一的小写连字符标识');
    ids.add(step.id);
    requireText(step.label, `${step.id}.label`, {state: 9, list: 10, grid: 12}[story.layout]);
    requireText(step.caption, `${step.id}.caption`, {state: 22, list: 13, grid: 28}[story.layout]);
    requireText(step.result, `${step.id}.result`, story.layout === 'state' ? 22 : 28);
    if (step.input !== undefined) requireText(step.input, `${step.id}.input`, story.layout === 'grid' ? 18 : 22);
    if (step.badge !== undefined) requireText(step.badge, `${step.id}.badge`, 6);
    if (!validTone(step.color)) throw new Error(`${step.id}.color 不是支持的颜色`);
    step.color ??= 'cyan';
    const d = step.diagram;
    if (!d || !Array.isArray(d.nodes) || d.nodes.length < 2 || d.nodes.length > (story.layout === 'list' ? 3 : 4)) throw new Error(`${step.id} 的 diagram 需要 2–${story.layout === 'list' ? 3 : 4} 个节点`);
    if (!Array.isArray(d.edges) || d.edges.length < 1 || d.edges.length > 4) throw new Error(`${step.id} 的 diagram 需要 1–4 条连线`);
    const nodeIds = new Set();
    d.nodes.forEach((node) => {
      requireText(node.id, 'node.id', 40);
      if (nodeIds.has(node.id)) throw new Error(`${step.id} 节点 id 重复`);
      nodeIds.add(node.id);
      requireText(node.label, 'node.label', story.layout === 'list' ? 7 : 9);
      if (!ICONS.includes(node.icon)) throw new Error(`不支持图标 ${node.icon}；可用：${ICONS.join(', ')}`);
      if (!validTone(node.color)) throw new Error('节点颜色无效');
      if ((node.x === undefined) !== (node.y === undefined)) throw new Error('节点 x 和 y 需同时指定');
      for (const key of ['x', 'y']) if (node[key] !== undefined && (!Number.isFinite(node[key]) || node[key] < 0 || node[key] > 1)) throw new Error('节点坐标需在 0–1 内');
    });
    d.edges.forEach((edge) => {
      if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to) || edge.from === edge.to) throw new Error(`${step.id} 连线必须连接两个已定义的不同节点`);
      if (edge.label !== undefined) requireText(edge.label, 'edge.label', 10);
    });
    diagramGeometry(d, 400, 220, story.layout === 'list');
  });
  if (story.layout === 'state') {
    if (!Array.isArray(story.metrics) || story.metrics.length < 1 || story.metrics.length > 3) throw new Error('state 需要 1–3 个 metrics');
    const metricIds = new Set();
    for (const metric of story.metrics) {
      requireText(metric.id, 'metric.id', 30); requireText(metric.label, 'metric.label', 8);
      if (!/^[a-z][a-z0-9-]*$/.test(metric.id) || metricIds.has(metric.id)) throw new Error('metric.id 必须唯一');
      metricIds.add(metric.id);
      if (!Number.isFinite(metric.initial) || Math.abs(metric.initial) > 99999999) throw new Error('metric.initial 必须是绝对值不超过 99999999 的数字');
      metric.prefix ??= ''; metric.suffix ??= '';
      if (typeof metric.prefix !== 'string' || typeof metric.suffix !== 'string' || glyphWidth(metric.prefix + metric.suffix) > 4) throw new Error('指标前后缀过长');
    }
    story.steps.forEach((step) => {
      if (!step.changes || typeof step.changes !== 'object' || Array.isArray(step.changes) || !Object.keys(step.changes).length) throw new Error(`${step.id} 需要 changes`);
      for (const [key, value] of Object.entries(step.changes)) if (!metricIds.has(key) || !Number.isFinite(value) || Math.abs(value) > 99999999) throw new Error(`${step.id}.changes 指标未定义或数字无效`);
    });
  } else if (story.metrics !== undefined) throw new Error('metrics 只用于 state 布局');
  story.sources ??= [];
  if (!Array.isArray(story.sources) || story.sources.some((s) => !s || typeof s.title !== 'string' || !s.title.trim() || typeof s.url !== 'string' || !/^https?:\/\//.test(s.url))) throw new Error('sources 应为含 title 与 http(s) url 的数组');
  return story;
}

export function stepRange(story, index) {
  const body = Math.round(story.duration * story.fps) - 3 * story.fps;
  return {start: story.fps + Math.floor(body * index / story.steps.length), end: story.fps + Math.floor(body * (index + 1) / story.steps.length)};
}

export function timelineAt(story, frame) {
  const total = Math.round(story.duration * story.fps);
  const f = clamp(frame, 0, total - 1);
  if (f < story.fps) return {phase: 'overview', active: -1, progress: 0, completed: 0};
  if (f >= total - 2 * story.fps) return {phase: 'outro', active: -1, progress: 1, completed: story.steps.length};
  const active = story.steps.findIndex((_, i) => f < stepRange(story, i).end);
  const {start, end} = stepRange(story, active);
  return {phase: 'body', active, progress: clamp((f - start) / Math.max(1, end - start - 1)), completed: active};
}

export function stepProgress(timeline, index) {
  return timeline.phase === 'overview' ? 1 : timeline.phase === 'outro' || index < timeline.active ? 1 : index > timeline.active ? 0 : timeline.progress;
}

export function diagramGeometry(diagram, width, height, compact = false) {
  const n = diagram.nodes.length;
  const defaults = n === 2 ? [[0.12, 0.42], [0.88, 0.42]] : n === 3 ? [[0.04, 0.42], [0.5, 0.42], [0.96, 0.42]] : [[0.1, 0.12], [0.9, 0.12], [0.1, 0.82], [0.9, 0.82]];
  const px = compact ? 40 : 58, top = compact ? 22 : 40, bottom = compact ? 40 : 66;
  const nodes = diagram.nodes.map((node, i) => ({...node, cx: px + (node.x ?? defaults[i][0]) * (width - 2 * px), cy: top + (node.y ?? defaults[i][1]) * (height - top - bottom)}));
  const edges = diagram.edges.map((edge) => {
    const from = nodes.find((node) => node.id === edge.from), to = nodes.find((node) => node.id === edge.to);
    const dx = to.cx - from.cx, dy = to.cy - from.cy, length = Math.hypot(dx, dy);
    if (length < 1) throw new Error('连线两端的节点位置不能重叠');
    const inset = Math.min(compact ? 24 : 32, length * 0.3);
    return {...edge, x1: from.cx + dx / length * inset, y1: from.cy + dy / length * inset, x2: to.cx - dx / length * inset, y2: to.cy - dy / length * inset};
  });
  return {nodes, edges};
}

export function metricValue(story, metric, timeline) {
  if (timeline.phase === 'overview') return metric.initial;
  let previous = metric.initial;
  for (let i = 0; i < story.steps.length; i++) {
    const next = Object.hasOwn(story.steps[i].changes, metric.id) ? story.steps[i].changes[metric.id] : previous;
    if (timeline.phase === 'body' && i === timeline.active) return mix(previous, next, ease((timeline.progress - 0.25) / 0.55));
    previous = next;
    if (timeline.phase === 'body' && i >= timeline.active) break;
  }
  return previous;
}

export function previewFrames(story) {
  const result = [{name: '00-overview', frame: 0}];
  story.steps.forEach((step, i) => {
    const {start, end} = stepRange(story, i);
    result.push({name: `${String(i + 1).padStart(2, '0')}-${step.id}-action`, frame: start + Math.floor((end - start) * 0.5)});
    result.push({name: `${String(i + 1).padStart(2, '0')}-${step.id}-result`, frame: end - 1});
  });
  result.push({name: '99-final', frame: Math.round(story.duration * story.fps) - 1});
  return result;
}

export function storyboardMarkdown(story) {
  const cell = (value) => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
  const lines = [`# ${story.title}`, '', story.subtitle, '', `布局：${story.layout} · ${story.width}×${story.height} · ${story.fps} fps · ${story.duration} 秒 · 无音轨`, '', '0–1 秒：全貌；最后 2 秒：完整结果。', '', '| 时间 | 焦点 | 对象与路径（按出现顺序） | 结果 |', '| --- | --- | --- | --- |'];
  story.steps.forEach((step, i) => {
    const range = stepRange(story, i);
    const path = step.diagram.edges.map((edge) => `${step.diagram.nodes.find((n) => n.id === edge.from).label} → ${step.diagram.nodes.find((n) => n.id === edge.to).label}${edge.label ? `（${edge.label}）` : ''}`).join('；');
    lines.push(`| ${(range.start / story.fps).toFixed(2)}–${(range.end / story.fps).toFixed(2)} s | ${cell(step.label)} | ${cell(path)} | ${cell(step.result)} |`);
  });
  lines.push('', `结论：${story.summary || '保留全部步骤与结果。'}`, '', '## 来源与说明', '');
  if (story.sources.length) lines.push(...story.sources.map((s) => `- [${s.title.replaceAll('[', '').replaceAll(']', '')}](${s.url})`));
  else lines.push('本分镜为用户材料或示例演示；涉及事实时由制作者核实。');
  return lines.join('\n') + '\n';
}
