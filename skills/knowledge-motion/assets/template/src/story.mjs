export const COLORS = {cyan:'#32c5ff', green:'#31dbaf', purple:'#b99cff', orange:'#ffbe67', red:'#ff7e8a'};
export const clamp = (v, a=0, b=1) => Math.max(a, Math.min(b, v));
export const mix = (a,b,p) => a+(b-a)*clamp(p);
export const ease = (v) => {const p=clamp(v); return p*p*(3-2*p);};
export const tone = (name) => Object.hasOwn(COLORS,name) ? COLORS[name] : name ?? COLORS.cyan;
export const glyphWidth = (text) => [...String(text)].reduce((s,c)=>s+(/[^\u0000-\u00ff]/u.test(c)?1:/[MW@#%]/.test(c)?0.8:0.56),0);
export function wrapText(text, capacity) {
  const lines=[]; let line='';
  for(const ch of String(text)) {
    if(ch==='\n'||(line && glyphWidth(line+ch)>capacity)){lines.push(line);line=ch==='\n'?'':ch;}else line+=ch;
  }
  if(line)lines.push(line);
  return lines;
}
const fail = (message) => {throw new Error(message);};
const object = (v,n) => {if(!v||typeof v!=='object'||Array.isArray(v))fail(n+' 必须是对象');};
const text = (v,n,max=4000) => {if(typeof v!=='string'||!v.trim()||v.length>max)fail(n+' 必须是非空文字（最多 '+max+' 字符）');};
const array = (v,n,min=0) => {if(!Array.isArray(v)||v.length<min)fail(n+' 必须是数组，至少 '+min+' 项');};
const id = (v,n) => {text(v,n,100);if(!/^[a-z][a-z0-9-]*$/.test(v))fail(n+' 必须为小写字母、数字及连字符标识');};
const unique = (items,n) => {
  const ids=new Set(); for(const item of items){object(item,n);id(item.id,n+'.id');if(ids.has(item.id))fail(n+' id 必须唯一：'+item.id);ids.add(item.id);}return ids;
};
const refs = (values, ids, n, min=0) => {array(values,n,min);if(new Set(values).size!==values.length||values.some(v=>!ids.has(v)))fail(n+' 有重复或未定义引用');};
const texts = (v,n,min=0) => {array(v,n,min);v.forEach(x=>text(x,n));};
const color = (v,n) => {if(v!==undefined&&(typeof v!=='string'||(!Object.hasOwn(COLORS,v)&&!/^#[\da-f]{6}$/i.test(v))))fail(n+' 颜色无效');};
const scalar = (v) => (typeof v==='number'&&Number.isFinite(v))||typeof v==='string'||typeof v==='boolean';
function acyclic(ids, edges, label) {
  const visiting=new Set(), done=new Set(), outgoing=new Map([...ids].map(x=>[x,[]]));
  for(const [a,b] of edges)outgoing.get(a).push(b);
  const visit=(n)=>{if(visiting.has(n))fail(label+' 出现循环：'+n);if(done.has(n))return;visiting.add(n);for(const next of outgoing.get(n))visit(next);visiting.delete(n);done.add(n);};
  for(const n of ids)visit(n);
}
export function normalizeKnowledge(input) {
  object(input,'knowledge');
  if(input.schemaVersion!==2)fail('knowledge 仅支持 schemaVersion: 2，请依据资料重建知识结构。');
  const k=structuredClone(input);
  text(k.title,'knowledge.title',160);text(k.audience,'audience');
  texts(k.questions,'questions',1);texts(k.conditions,'conditions');
  array(k.sources,'sources',1);const sourceIds=unique(k.sources,'sources');
  for(const s of k.sources){text(s.title,'source.title');if(!['official','user','simulation'].includes(s.kind))fail('source.kind 必须是 official、user 或 simulation');if(s.kind==='official'||s.url!==undefined){let url;try{url=new URL(s.url);}catch{fail('source.url 必须为 http(s) URL');}if(!['http:','https:'].includes(url.protocol))fail('source.url 必须为 http(s) URL');}}
  array(k.objects,'objects',1);const objectIds=unique(k.objects,'objects');
  for(const o of k.objects){text(o.label,'object.label',120);color(o.color,'object.color');o.color??='cyan';}
  array(k.nodes,'nodes',1);const nodeIds=unique(k.nodes,'nodes'), byId=new Map(k.nodes.map(n=>[n.id,n]));
  for(const n of k.nodes) {
    text(n.title,n.id+'.title',160);text(n.goal,n.id+'.goal');
    refs(n.objects,objectIds,n.id+'.objects');texts(n.inputs,n.id+'.inputs');texts(n.outputs,n.id+'.outputs',1);
    n.detail??='core';if(!['core','extension'].includes(n.detail))fail('node.detail 必须是 core 或 extension');
    if(n.parentId!==undefined&&(!nodeIds.has(n.parentId)||n.parentId===n.id))fail('parentId 必须引用不同的已定义节点');
    array(n.sourceRefs,n.id+'.sourceRefs',1);
    for(const r of n.sourceRefs){object(r,'sourceRef');if(!sourceIds.has(r.sourceId))fail(n.id+' 的来源未定义：'+r.sourceId);text(r.claim,n.id+'.sourceRef.claim');}
  }
  acyclic(nodeIds,k.nodes.filter(n=>n.parentId).map(n=>[n.parentId,n.id]),'包含关系');
  array(k.modules,'modules',1);refs(k.modules,nodeIds,'modules',1);
  if(k.modules.some(x=>byId.get(x).parentId||byId.get(x).detail!=='core')||k.nodes.some(n=>!n.parentId&&n.detail==='core'&&!k.modules.includes(n.id)))fail('modules 必须恰好包含所有核心根节点');
  k.relations??=[];array(k.relations,'relations');
  const pairs=new Set();
  for(const r of k.relations) {
    object(r,'relation');
    if(!['contains','precedes','depends-on','parallel','conditional'].includes(r.type))fail('关系类型无效');
    if(!nodeIds.has(r.from)||!nodeIds.has(r.to)||r.from===r.to)fail('关系必须引用两个不同知识节点');
    const key=r.type+':'+r.from+':'+r.to;if(pairs.has(key))fail('关系重复：'+key);pairs.add(key);
    if(r.type==='contains'&&byId.get(r.to).parentId!==r.from)fail('contains 与 parentId 不一致');
    if(r.type==='conditional')text(r.label,'conditional.label');
  }
  for(const n of k.nodes)if(n.parentId&&!pairs.has('contains:'+n.parentId+':'+n.id))k.relations.push({type:'contains',from:n.parentId,to:n.id});
  acyclic(nodeIds,k.relations.filter(r=>['precedes','depends-on'].includes(r.type)).map(r=>[r.from,r.to]),'先后/依赖关系');
  object(k.workflow,'workflow');text(k.workflow.host,'workflow.host');text(k.workflow.reason,'workflow.reason');
  if(!['native','sequential'].includes(k.workflow.mode))fail('workflow.mode 必须如实记录 native 或 sequential');
  return k;
}
const sceneTypes=['overview','sequence','tree','parallel','branch','state','linked','list','custom'];
const actionTypes=['reveal','transfer','state','count','highlight','type'];
export function normalizeStory(input, knowledgeInput) {
  object(input,'story');
  if(input.schemaVersion!==2||input.steps!==undefined)fail('旧分镜已停止接收。请根据资料重建 knowledge.json 与 schemaVersion: 2 的 story.json；不能仅修改版本号。');
  if(!knowledgeInput)fail('必须同时提供 knowledge.json 以校验知识引用');
  const k=normalizeKnowledge(knowledgeInput), s=structuredClone(input), nodes=new Map(k.nodes.map(n=>[n.id,n])), nodeIds=new Set(nodes.keys()), objects=new Map(k.objects.map(o=>[o.id,o]));
  text(s.title,'story.title',160);s.subtitle??='';if(typeof s.subtitle!=='string')fail('subtitle 必须是文字');
  s.fps??=30;if(s.fps!==30)fail('本模板使用 30 fps');
  array(s.chapters,'chapters',1);const chapterIds=unique(s.chapters,'chapters');
  for(const c of s.chapters){text(c.title,'chapter.title',100);if(!k.modules.includes(c.knowledgeNodeId))fail('章节必须关联核心模块');}
  if(new Set(s.chapters.map(c=>c.knowledgeNodeId)).size!==s.chapters.length||s.chapters.length!==k.modules.length)fail('章节与核心模块必须一一对应');
  array(s.scenes,'scenes',1);unique(s.scenes,'scenes');
  s.canvas??={orientation:'auto'};object(s.canvas,'canvas');
  if((s.canvas.width===undefined)!==(s.canvas.height===undefined))fail('canvas.width 与 height 必须同时指定');
  if(s.canvas.width===undefined) {
    const requested=s.canvas.orientation??'auto';if(!['auto','portrait','landscape'].includes(requested))fail('canvas.orientation 无效');
    const wide=requested==='landscape'||(requested==='auto'&&s.scenes.some(scene=>['sequence','tree','linked'].includes(scene.type)));
    s.canvas.width=wide?1920:1080;s.canvas.height=wide?1080:1920;
    s.canvas.reason??=requested==='auto'?(wide?'双端时序、树或并排联动优先保证关系可读':'连续过程或分类优先手机阅读'):'用户指定画幅';
  }
  for(const key of ['width','height'])if(!Number.isInteger(s.canvas[key])||s.canvas[key]<640||s.canvas[key]>7680||s.canvas[key]%2)fail('画幅尺寸必须为 640–7680 内的偶数');
  s.width=s.canvas.width;s.height=s.canvas.height;s.canvas.orientation=s.width>=s.height?'landscape':'portrait';
  s.initialState??={};object(s.initialState,'initialState');
  for(const [key,value] of Object.entries(s.initialState)){id(key,'state key');if(!scalar(value))fail('状态初值必须是有限数字、文字或布尔值');}
  const persistent=structuredClone(s.initialState), covered=new Set();let cursor=0;
  for(const scene of s.scenes) {
    if(!sceneTypes.includes(scene.type))fail('未知场景类型：'+scene.type);
    if(scene.type!=='overview'&&!chapterIds.has(scene.chapterId))fail(scene.id+' 引用了未定义章节');
    if(scene.chapterId!==undefined&&!chapterIds.has(scene.chapterId))fail(scene.id+' 引用了未定义章节');
    text(scene.title,scene.id+'.title',160);text(scene.explanation,scene.id+'.explanation');text(scene.result,scene.id+'.result');
    refs(scene.knowledgeNodeIds,nodeIds,scene.id+'.knowledgeNodeIds',1);scene.knowledgeNodeIds.forEach(n=>covered.add(n));
    object(scene.timing,scene.id+'.timing');
    for(const phase of ['read','act','hold']){
      const seconds=scene.timing[phase];if(!Number.isFinite(seconds)||seconds<0.5)fail(scene.id+' 每段 read/act/hold 至少 0.5 秒');
      scene[phase+'Frames']=Math.round(seconds*s.fps);if(!Number.isSafeInteger(scene[phase+'Frames']))fail('时长超出可表示的帧数');
    }
    scene.frames=scene.readFrames+scene.actFrames+scene.holdFrames;scene.start=cursor;cursor+=scene.frames;if(!Number.isSafeInteger(cursor))fail('总时长超出可表示的帧数');scene.end=cursor;
    scene.actors??=[];refs(scene.actors,new Set(objects.keys()),scene.id+'.actors');
    scene.items??=[];array(scene.items,'items');const itemIds=unique(scene.items,'items');
    if(scene.type==='sequence'&&scene.actors.length<2)fail('sequence 至少需要两个参与对象');
    if(['tree','parallel','branch','linked','list'].includes(scene.type)&&!scene.items.length)fail(scene.type+' 需要 items');
    for(const item of scene.items){
      text(item.label,'item.label',240);color(item.color,'item.color');
      if(item.objectId!==undefined&&!objects.has(item.objectId))fail('item.objectId 未定义');
      if(item.parentId!==undefined&&(!itemIds.has(item.parentId)||item.parentId===item.id))fail('item.parentId 无效');
      if((item.x===undefined)!==(item.y===undefined))fail('item.x 和 y 需同时提供');
      for(const key of ['x','y'])if(item[key]!==undefined&&(!Number.isFinite(item[key])||item[key]<0||item[key]>1))fail('item 坐标必须在 0–1 内');
      if(item.column!==undefined&&![0,1,2].includes(item.column))fail('linked column 必须是 0、1、2');
    }
    acyclic(itemIds,scene.items.filter(i=>i.parentId).map(i=>[i.parentId,i.id]),'场景树');
    scene.links??=[];array(scene.links,'links');
    for(const l of scene.links)if(!itemIds.has(l.from)||!itemIds.has(l.to)||l.from===l.to)fail('场景连线引用无效');
    scene.actions??=[];array(scene.actions,'actions');unique(scene.actions,'actions');
    const targets=new Set([...itemIds,...scene.actors]);
    for(const a of scene.actions){
      if(!actionTypes.includes(a.kind))fail('动作类型无效：'+a.kind);
      if(!Number.isFinite(a.at)||a.at<0||!Number.isFinite(a.duration)||a.duration<1/s.fps||actionRange(a,s.fps).end>scene.actFrames)fail(scene.id+'/'+a.id+' 动作超出 act 时间');
      if(a.target!==undefined&&!targets.has(a.target))fail('动作 target 未定义：'+a.target);
      if(['reveal','highlight','type'].includes(a.kind)&&!a.target)fail(a.kind+' 动作需要 target');
      if(a.kind==='type')text(a.text,'type.text');
      if(a.kind==='transfer'&&(!targets.has(a.from)||!targets.has(a.to)||a.from===a.to))fail('transfer 必须连接不同的已定义对象');
      for(const field of ['expect','set'])if(a[field]!==undefined){
        object(a[field],field);
        for(const [key,value]of Object.entries(a[field]))if(!Object.hasOwn(persistent,key)||!scalar(value))fail('动作 '+field+' 引用了未定义状态或无效值：'+key);
      }
      if(['state','count'].includes(a.kind)&&(!a.set||!Object.keys(a.set).length))fail(a.kind+' 动作需要 set');
      if(a.kind==='count'&&Object.entries(a.set).some(([key,value])=>typeof value!=='number'))fail('count 只能更新数值状态');
    }
    // Writes to the same state cannot overlap. Conditions are checked at action start, commits at arrival.
    const events=scene.actions.flatMap((a,i)=>[{at:actionRange(a,s.fps).start,end:false,a,i},{at:actionRange(a,s.fps).end,end:true,a,i}])
      .sort((a,b)=>a.at-b.at||Number(b.end)-Number(a.end)||a.i-b.i);
    const writers=new Map();
    for(const event of events){
      const {a}=event;
      if(event.end){for(const [key,value]of Object.entries(a.set??{})){persistent[key]=value;writers.delete(key);}}
      else {
        if(a.kind==='count'&&Object.keys(a.set).some(key=>typeof persistent[key]!=='number'))fail('count 动作起点只能使用数值状态');
        for(const [key,value]of Object.entries(a.expect??{}))if(persistent[key]!==value)fail(scene.id+'/'+a.id+' 状态衔接不连续：'+key);
        for(const key of Object.keys(a.set??{})){if(writers.has(key))fail('同一状态的写入时间重叠：'+key);writers.set(key,a.id);}
      }
    }
    scene.metrics??=[];array(scene.metrics,'metrics');
    for(const m of scene.metrics){text(m.key,'metric.key',100);text(m.label,'metric.label',100);if(!Object.hasOwn(persistent,m.key)||typeof persistent[m.key]!=='number')fail('metric 必须引用已定义数值状态');color(m.color,'metric.color');}
    if(scene.type==='state'&&!scene.metrics.length)fail('state 场景需要 metrics');
    if(scene.type==='custom'){id(scene.custom,'custom');object(scene.data??{},'custom.data');}
  }
  for(const n of k.nodes)if(n.detail==='core'&&!covered.has(n.id))fail('核心知识节点没有镜头关联：'+n.id);
  if(s.scenes[0].type!=='overview'||s.scenes.at(-1).type!=='overview')fail('视频应以总览开始并回到总览结束');
  for(const c of s.chapters)if(!s.scenes.some(scene=>scene.chapterId===c.id&&scene.type!=='overview'))fail('章节缺少机制镜头：'+c.id);
  s.totalFrames=cursor;s.duration=cursor/s.fps;
  return s;
}
export function normalizeProject(knowledge,story){const k=normalizeKnowledge(knowledge);return {knowledge:k,story:normalizeStory(story,k)};}
export function timelineAt(story,frame){
  const f=clamp(Math.floor(frame),0,story.totalFrames-1), index=story.scenes.findIndex(scene=>f<scene.end), scene=story.scenes[index], localFrame=f-scene.start;
  return {scene,index,localFrame,start:scene.start,end:scene.end,totalFrames:story.totalFrames,progress:localFrame/Math.max(1,scene.frames-1),phase:localFrame<scene.readFrames?'read':localFrame<scene.readFrames+scene.actFrames?'act':'hold'};
}
export function actionRange(action,fps=30){const start=Math.round(action.at*fps),duration=Math.round(action.duration*fps);return {start,duration,end:start+duration};}
export function actionProgress(scene,action,localFrame,fps=30){
  const range=actionRange(action,fps);
  return clamp((localFrame-scene.readFrames-range.start)/Math.max(1,range.duration));
}
export function stateAt(story,frame){
  const state=structuredClone(story.initialState), f=clamp(frame,0,story.totalFrames-1);
  for(const scene of story.scenes){
    if(f<scene.start)break;
    const local=f-scene.start;
    const actions=[...scene.actions].sort((a,b)=>actionRange(a,story.fps).end-actionRange(b,story.fps).end);
    for(const a of actions) {
      const p=actionProgress(scene,a,local,story.fps);
      if(p>=1)Object.assign(state,a.set??{});
    }
    for(const a of actions)if(a.kind==='count'){
      const p=actionProgress(scene,a,local,story.fps);
      if(p>0&&p<1)for(const [key,value]of Object.entries(a.set))state[key]=mix(state[key],value,ease(p));
    }
    if(f<scene.end)break;
  }
  return state;
}
export function previewFrames(story){
  const frames=new Map(), add=(name,frame)=>{const f=clamp(Math.round(frame),0,story.totalFrames-1);if(!frames.has(f))frames.set(f,{name,frame:f});};
  story.scenes.forEach((scene,i)=>{
    const prefix=String(i+1).padStart(2,'0')+'-'+scene.id;
    if(i>0)add(prefix+'-before',scene.start-1);
    add(prefix+'-entry',scene.start);
    for(const a of scene.actions){
      const range=actionRange(a,story.fps);
      add(prefix+'-'+a.id+'-motion',scene.start+scene.readFrames+range.start+Math.floor(range.duration/2));
      add(prefix+'-'+a.id+'-result',scene.start+scene.readFrames+range.end);
    }
    if(!scene.actions.length)add(prefix+'-focus',scene.start+scene.readFrames+Math.floor(scene.actFrames/2));
    add(prefix+'-result',scene.end-1);
  });
  return [...frames.values()].sort((a,b)=>a.frame-b.frame);
}
const cell=(v)=>String(v??'').replaceAll('|','\\|').replaceAll('\n',' ');
export function knowledgeMarkdown(k){
  const lines=['# '+k.title,'','受众：'+k.audience,'','## 学习问题','',...k.questions.map(x=>'- '+x),'','## 本片条件','',...k.conditions.map(x=>'- '+x),'','## 知识结构',''];
  const visit=(n,depth=0)=>{
    lines.push('### '+Array(depth+1).fill('·').join('')+' '+n.title+' ['+n.id+']'+(n.detail==='extension'?'（扩展）':''),'',n.goal,'','- 输入：'+n.inputs.join('；'),'- 参与对象：'+n.objects.map(x=>k.objects.find(o=>o.id===x).label).join('、'),'- 输出：'+n.outputs.join('；'));
    for(const ref of n.sourceRefs){const source=k.sources.find(x=>x.id===ref.sourceId);lines.push('- 依据：'+ref.claim+' — '+(source.url?'['+source.title+']('+source.url+')':source.title)+' '+(ref.locator??''));}
    lines.push('');k.nodes.filter(x=>x.parentId===n.id).forEach(x=>visit(x,depth+1));
  };
  k.nodes.filter(n=>!n.parentId).forEach(n=>visit(n));
  lines.push('## 关系','',...k.relations.map(r=>'- '+r.from+' — '+r.type+' → '+r.to+(r.label?'：'+r.label:'')),'','## 执行记录','','宿主：'+k.workflow.host+'；整理方式：'+k.workflow.mode+'；'+k.workflow.reason,'');
  if(k.workflow.review)lines.push('审查：'+k.workflow.review,'');
  return lines.join('\n');
}
export function storyboardMarkdown(story,knowledge){
  const lines=['# '+story.title,'',story.subtitle,'','画幅：'+story.width+'×'+story.height+'；'+story.fps+' fps；'+story.duration+' 秒；无音轨。',story.canvas.reason??'','', '## 章节','',...story.chapters.map(c=>'- '+c.title+' → '+c.knowledgeNodeId),'','## 镜头','', '| 时间（秒） | 镜头与类型 | 知识节点 | 阅读/动作/停留 | 解释与结果 |','| --- | --- | --- | --- | --- |'];
  for(const scene of story.scenes){
    lines.push('| '+(scene.start/story.fps).toFixed(2)+'–'+(scene.end/story.fps).toFixed(2)+' | '+cell(scene.title)+' / '+scene.type+' | '+scene.knowledgeNodeIds.join(', ')+' | '+[scene.timing.read,scene.timing.act,scene.timing.hold].join(' / ')+' | '+cell(scene.explanation)+' → '+cell(scene.result)+' |');
  }
  lines.push('','## 动作与状态','');
  for(const scene of story.scenes){
    lines.push('### '+scene.title,'');
    for(const a of scene.actions)lines.push('- '+((scene.start+scene.readFrames+actionRange(a,story.fps).start)/story.fps).toFixed(2)+' 秒：'+a.kind+' '+(a.from?a.from+' → '+a.to:a.target??'')+' '+(a.label??a.text??'')+'；'+(a.set?JSON.stringify(a.set):'保持已完成状态'));
    lines.push('');
  }
  if(knowledge)lines.push('完整机制与逐节点来源见 [knowledge.md](knowledge.md)。','');
  return lines.join('\n');
}
