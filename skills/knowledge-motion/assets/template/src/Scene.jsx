import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Glyph} from './Glyph.jsx';
import {clamp, mix, ease, tone, timelineAt, stepProgress, metricValue, wrapText, glyphWidth, diagramGeometry} from './story.mjs';

const C = {bg: '#040914', card: '#0b1625', line: '#20354b', text: '#edf5ff', muted: '#8ca1b8', cyan: '#32c5ff', green: '#31dbaf'};
const FONT = '"Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", "Noto Sans SC", sans-serif';

function Text({x, y, width, text, size = 28, color = C.text, weight = 500, anchor = 'start', lineHeight = 1.4, opacity = 1}) {
  const lines = wrapText(text, width / size);
  return <text x={x} y={y} fill={color} fontSize={size} fontWeight={weight} textAnchor={anchor} opacity={opacity}>
    {lines.map((line, i) => <tspan key={i} x={x} dy={i === 0 ? 0 : size * lineHeight}>{line}</tspan>)}
  </text>;
}

function Panel({x, y, width, height, color = C.line, active = false, children}) {
  return <g transform={`translate(${x} ${y})`}>
    {active && <rect x="-3" y="-3" width={width + 6} height={height + 6} rx="20" fill="none" stroke={color} strokeWidth="7" opacity="0.1"/>}
    <rect width={width} height={height} rx="17" fill="url(#panel)" stroke={color} strokeWidth={active ? 2.8 : 1.5}/>
    {children}
  </g>;
}

function Diagram({diagram, width, height, progress, color, compact = false}) {
  const small = compact || diagram.nodes.length === 4;
  const {nodes, edges} = diagramGeometry(diagram, width, height, small);
  const overall = clamp((progress - 0.14) / 0.62);
  return <g>
    {edges.map((edge, i) => {
      const p = clamp(overall * edges.length - i);
      const dx = edge.x2 - edge.x1, dy = edge.y2 - edge.y1;
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      const midpoint = {x: (edge.x1 + edge.x2) / 2, y: (edge.y1 + edge.y2) / 2};
      const path = `M${edge.x1} ${edge.y1}L${edge.x2} ${edge.y2}`;
      const t = ease(p);
      return <g key={i}>
        <path d={path} fill="none" stroke={C.line} strokeWidth="2" strokeDasharray="5 8"/>
        <path d={path} fill="none" stroke={color} strokeWidth={compact ? 2 : 2.8} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - p} opacity={0.35 + p * 0.65}/>
        <path d="M-8-5L0 0L-8 5" transform={`translate(${edge.x2} ${edge.y2}) rotate(${angle})`} fill="none" stroke={p > 0.95 ? color : C.line} strokeWidth="2"/>
        {edge.label && <g opacity={mix(0.22, 1, p)}>
          <rect x={midpoint.x - glyphWidth(edge.label) * (compact ? 10 : 11) - 8} y={midpoint.y - (compact ? 27 : 33)} width={glyphWidth(edge.label) * (compact ? 20 : 22) + 16} height={compact ? 23 : 28} rx="7" fill={C.card}/>
          <Text x={midpoint.x} y={midpoint.y - (compact ? 10 : 12)} width={200} text={edge.label} size={compact ? 20 : 22} anchor="middle" color={color}/>
        </g>}
        {p > 0 && p < 1 && <g>
          <circle cx={mix(edge.x1, edge.x2, t)} cy={mix(edge.y1, edge.y2, t)} r="11" fill={color} opacity="0.15"/>
          <circle cx={mix(edge.x1, edge.x2, t)} cy={mix(edge.y1, edge.y2, t)} r="4.5" fill="#ffffff"/>
        </g>}
      </g>;
    })}
    {nodes.map((node) => {
      const incoming = edges.map((e, i) => e.to === node.id ? i : -1).filter((i) => i >= 0);
      const reached = incoming.length ? incoming.some((i) => overall * edges.length - i >= 1) : progress > 0.12;
      const c = reached ? tone(node.color ?? color) : C.muted;
      const labelWidth = Math.min(small ? 209 : 230, width / (nodes.length === 4 ? 2 : nodes.length) - 12);
      return <g key={node.id}>
        <rect x={node.cx - (small ? 25 : 34)} y={node.cy - (small ? 25 : 34)} width={small ? 50 : 68} height={small ? 50 : 68} rx="12" fill={reached ? `${c}12` : '#0d1b2b'} stroke={reached ? c : C.line} opacity={reached ? 1 : 0.65}/>
        <Glyph name={node.icon} x={node.cx} y={node.cy} size={small ? 32 : 43} color={c}/>
        <Text x={node.cx} y={node.cy + (small ? 49 : 67)} width={labelWidth} text={node.label} size={small ? 20 : 25} color={c} anchor="middle"/>
      </g>;
    })}
  </g>;
}

function Header({story}) {
  const titleSize = glyphWidth(story.title) > 17 ? 56 : 64;
  return <g>
    <rect x="64" y="115" width="38" height="5" rx="2" fill={C.cyan}/>
    <Text x={118} y={126} width={800} text={story.kicker} size={24} color={C.muted}/>
    <Text x={64} y={215} width={952} text={story.title} size={titleSize} weight={750} lineHeight={1.3}/>
    <Text x={66} y={glyphWidth(story.title) > 952 / titleSize ? 320 : 280} width={946} text={story.subtitle} size={26} color={C.muted}/>
  </g>;
}

function Footer({story, timeline}) {
  const n = story.steps.length, gap = 9, width = (952 - gap * (n - 1)) / n;
  const focus = timeline.phase === 'body' ? story.steps[timeline.active] : null;
  return <g>
    {story.steps.map((step, i) => <rect key={step.id} x={64 + i * (width + gap)} y="1690" width={width} height="5" rx="2.5" fill={timeline.phase === 'overview' ? C.line : i < timeline.completed ? C.green : i === timeline.active ? C.cyan : C.line}/>)}
    <Text x={64} y={1754} width={952} text={focus ? focus.label : timeline.phase === 'outro' ? '全貌 · 完整结果' : '先看全貌，再看每一步'} size={29} color={focus ? C.cyan : C.green} weight={650}/>
    <Text x={64} y={1803} width={952} text={focus ? (timeline.progress > 0.8 ? focus.result : focus.caption) : story.summary} size={26} color={C.muted}/>
  </g>;
}

function ListLayout({story, timeline}) {
  const gap = 14, h = Math.min(174, (1260 - gap * (story.steps.length - 1)) / story.steps.length);
  const y0 = 367 + Math.max(0, (1260 - (h + gap) * story.steps.length + gap) / 2);
  return <g>{story.steps.map((step, i) => {
    const active = timeline.active === i;
    const p = stepProgress(timeline, i), color = tone(step.color);
    const opacity = timeline.phase !== 'body' || active || i < timeline.active ? 1 : 0.42;
    return <g key={step.id} opacity={opacity}>
      <Panel x={64} y={y0 + i * (h + gap)} width={952} height={h} active={active} color={active ? color : `${color}55`}>
        <rect x="0" y="16" width="4" height={h - 32} rx="2" fill={color}/>
        <Text x={28} y={h / 2 + 11} width={146} text={step.badge ?? String(i + 1).padStart(2, '0')} size={step.badge?.length > 4 ? 35 : 42} color={color} weight={750}/>
        <Text x={192} y={h / 2 - 9} width={310} text={step.label} size={31} weight={700}/>
        <Text x={192} y={h / 2 + 31} width={320} text={step.caption} size={23} color={C.muted}/>
        <g transform={`translate(526 ${Math.max(8, (h - 108) / 2)})`}><Diagram diagram={step.diagram} width={408} height={108} progress={p} color={color} compact/></g>
      </Panel>
    </g>;
  })}</g>;
}

function GridLayout({story, timeline}) {
  const columns = 2, gap = 20, width = 466, rows = Math.ceil(story.steps.length / columns), height = (1260 - (rows - 1) * gap) / rows;
  return <g>{story.steps.map((step, i) => {
    const active = timeline.active === i, p = stepProgress(timeline, i);
    const color = timeline.phase !== 'overview' && (timeline.phase === 'outro' || i < timeline.active) ? C.green : tone(step.color);
    const opacity = timeline.phase !== 'body' || active || i < timeline.active ? 1 : 0.28;
    const hasInput = Boolean(step.input);
    return <g key={step.id} opacity={opacity}>
      <Panel x={64 + i % columns * (width + gap)} y={367 + Math.floor(i / columns) * (height + gap)} width={width} height={height} color={active ? C.cyan : C.line} active={active}>
        <circle cx="33" cy="35" r="13" fill={color}/><text x="33" y="41" textAnchor="middle" fill={C.bg} fontSize="18" fontWeight="750">{i + 1}</text>
        <Text x={57} y={45} width={width - 78} text={step.label} size={30} weight={700}/>
        {hasInput && <g>
          <rect x="22" y="67" width={width - 44} height="44" rx="8" fill="#030b14"/>
          <Text x={35} y={96} width={width - 70} text={[...step.input].slice(0, Math.ceil(clamp(p / 0.22) * [...step.input].length)).join('')} size={21} color={color}/>
        </g>}
        <g transform={`translate(12 ${hasInput ? 116 : 75})`}><Diagram diagram={step.diagram} width={width - 24} height={height - (hasInput ? 215 : 174)} progress={p} color={color}/></g>
        <path d={`M24 ${height - 101}h${width - 48}`} stroke={C.line}/>
        <Text x={24} y={height - 62} width={width - 48} text={p > 0.8 ? step.result : step.caption} size={25} color={p > 0.8 ? color : C.muted}/>
      </Panel>
    </g>;
  })}</g>;
}

function StateLayout({story, timeline}) {
  const active = timeline.phase === 'outro' ? story.steps.length - 1 : Math.max(0, timeline.active);
  const step = story.steps[active];
  const p = timeline.phase === 'overview' ? 0 : stepProgress(timeline, active), color = tone(step.color);
  const itemHeight = Math.min(146, 1260 / story.steps.length - 14);
  return <g>
    {story.steps.map((s, i) => <g key={s.id} opacity={timeline.phase !== 'body' || i <= active ? 1 : 0.38}>
      <Panel x={64} y={367 + i * (itemHeight + 14)} width={278} height={itemHeight} color={timeline.active === i ? C.cyan : C.line} active={timeline.active === i}>
        <Text x={22} y={32} width={210} text={`${String(i + 1).padStart(2, '0')}  ${i < timeline.completed ? '已完成' : timeline.active === i ? '进行中' : '步骤'}`} size={21} color={i < timeline.completed ? C.green : C.muted}/>
        <Text x={22} y={77} width={234} text={s.label} size={29} weight={700}/>
      </Panel>
    </g>)}
    <Panel x={364} y={367} width={652} height={226}>
      <Text x={26} y={42} width={600} text={timeline.phase === 'overview' ? '初始状态' : timeline.phase === 'outro' ? '最终状态' : '当前状态'} size={24} color={C.muted}/>
      {story.metrics.map((metric, i) => {
        const width = 600 / story.metrics.length, value = metricValue(story, metric, timeline);
        const text = metric.prefix + Math.round(value).toLocaleString('en-US') + metric.suffix;
        const size = Math.min(story.metrics.length === 3 ? 39 : 57, (width - 28) / (glyphWidth(text) * 1.3));
        return <g key={metric.id} transform={`translate(${26 + width * i} 0)`}>
          <Text x={0} y={99} width={width - 10} text={metric.label} size={25} color={C.muted}/>
          <Text x={0} y={169} width={width - 10} text={text} size={size} color={i === 0 ? C.cyan : C.text} weight={750}/>
        </g>;
      })}
    </Panel>
    <Panel x={364} y={613} width={652} height={505} color={timeline.phase === 'body' ? color : C.line} active={timeline.phase === 'body'}>
      <Text x={28} y={51} width={590} text={step.label} size={36} weight={700}/>
      <rect x="26" y="78" width="600" height="56" rx="9" fill="#030b14"/>
      <Text x={42} y={114} width={565} text={[...(step.input ?? step.caption)].slice(0, Math.ceil(clamp(p / 0.24) * [...(step.input ?? step.caption)].length)).join('')} size={25} color={color}/>
      <g transform="translate(22 142)"><Diagram diagram={step.diagram} width={608} height={245} progress={p} color={color}/></g>
      <Text x={28} y={444} width={590} text={p > 0.8 ? step.result : step.caption} size={27} color={p > 0.8 ? C.green : C.muted}/>
    </Panel>
    <Panel x={364} y={1138} width={652} height={489}>
      <Text x={28} y={46} width={590} text="变化记录" size={26} weight={650}/>
      {story.steps.map((s, i) => {
        const visible = timeline.phase === 'outro' || i < timeline.completed || (i === timeline.active && p > 0.78);
        const rowHeight = Math.min(65, 392 / story.steps.length);
        return <g key={s.id} opacity={visible ? 1 : 0.15}>
          <circle cx="34" cy={87 + i * rowHeight} r="4" fill={visible ? tone(s.color) : C.line}/>
          <Text x={54} y={96 + i * rowHeight} width={563} text={s.result} size={24} color={visible ? C.text : C.muted}/>
        </g>;
      })}
    </Panel>
  </g>;
}

export function Scene({story}) {
  const frame = useCurrentFrame();
  const timeline = timelineAt(story, frame);
  return <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1080 1920" style={{fontFamily: FONT, background: C.bg}}>
    <defs>
      <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#101f31"/><stop offset="1" stopColor="#080f1b"/></linearGradient>
      <radialGradient id="halo"><stop stopColor="#123954" stopOpacity="0.24"/><stop offset="1" stopColor="#040914" stopOpacity="0"/></radialGradient>
      <pattern id="grid" width="52" height="52" patternUnits="userSpaceOnUse"><path d="M52 0H0V52" fill="none" stroke="#1c334d" strokeWidth="0.6" opacity="0.18"/></pattern>
    </defs>
    <rect width="1080" height="1920" fill={C.bg}/>
    <rect width="1080" height="1920" fill="url(#grid)"/>
    <ellipse cx="850" cy="400" rx="780" ry="640" fill="url(#halo)"/>
    <Header story={story}/>
    {story.layout === 'list' ? <ListLayout story={story} timeline={timeline}/> : story.layout === 'grid' ? <GridLayout story={story} timeline={timeline}/> : <StateLayout story={story} timeline={timeline}/>}
    <Footer story={story} timeline={timeline}/>
  </svg>;
}
