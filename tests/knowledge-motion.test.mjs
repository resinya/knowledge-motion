import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,cpSync,existsSync,rmSync,mkdirSync,symlinkSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {join,resolve,relative,isAbsolute} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {normalizeProject,normalizeStory,normalizeKnowledge,timelineAt,actionProgress,stateAt,previewFrames,knowledgeMarkdown,storyboardMarkdown} from '../skills/knowledge-motion/assets/template/src/story.mjs';
import {verifyMetadata} from '../skills/knowledge-motion/assets/template/scripts/verify-video.mjs';
import {readCustomManifest} from '../skills/knowledge-motion/assets/template/scripts/custom-scenes.mjs';
import {createProject} from '../skills/knowledge-motion/scripts/create-project.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),skill=join(root,'skills/knowledge-motion');
const raw=(name)=>Object.fromEntries(['knowledge','story'].map(n=>[n,JSON.parse(readFileSync(join(skill,'examples',name,n+'.json'),'utf8'))]));
const project=(name)=>{const x=raw(name);return normalizeProject(x.knowledge,x.story);};
for(const name of ['browser','ports','shopping','budget'])test(name+': 节点有依据，时间轴逐帧覆盖所有镜头，关键状态预览在范围内',()=>{
  const input=raw(name),before=JSON.stringify(input),{knowledge,story}=normalizeProject(input.knowledge,input.story);
  assert.equal(JSON.stringify(input),before);
  assert.equal(story.scenes[0].type,'overview');assert.equal(story.scenes.at(-1).type,'overview');
  const covered=new Set(story.scenes.flatMap(s=>s.knowledgeNodeIds));
  assert.ok(knowledge.nodes.filter(n=>n.detail==='core').every(n=>covered.has(n.id)&&n.sourceRefs.length));
  let count=0;
  story.scenes.forEach((scene,index)=>{
    assert.equal(scene.start,count);count=scene.end;
    const first=timelineAt(story,scene.start),last=timelineAt(story,scene.end-1);
    assert.equal(first.index,index);assert.equal(first.localFrame,0);assert.equal(first.phase,'read');assert.equal(last.phase,'hold');
    assert.equal(scene.frames,scene.readFrames+scene.actFrames+scene.holdFrames);
    for(const a of scene.actions){assert.equal(actionProgress(scene,a,scene.readFrames-1),0);assert.equal(actionProgress(scene,a,scene.frames-1),1);}
  });
  const visited=new Set();for(let f=0;f<story.totalFrames;f++){const t=timelineAt(story,f);visited.add(t.scene.id);assert.ok(t.localFrame>=0&&t.localFrame<t.scene.frames);}
  assert.equal(visited.size,story.scenes.length);assert.equal(count,story.totalFrames);assert.equal(story.duration,story.totalFrames/story.fps);
  const frames=previewFrames(story);
  assert.equal(new Set(frames.map(x=>x.frame)).size,frames.length);
  assert.ok(frames.every(x=>x.frame>=0&&x.frame<story.totalFrames));
  for(const scene of story.scenes){assert.ok(frames.some(x=>x.frame===scene.start));assert.ok(frames.some(x=>x.frame===scene.end-1));}
  assert.equal(timelineAt(story,-1).index,0);assert.equal(timelineAt(story,Infinity).index,story.scenes.length-1);
});
test('内容决定时长且自动选择横竖屏，无120秒上限',()=>{
  const browser=project('browser').story;assert.equal(browser.width,1920);assert.equal(browser.height,1080);assert.ok(browser.duration>120);
  assert.equal(project('ports').story.width,1080);
  const r=raw('browser');r.story.canvas={width:1280,height:720};const s=normalizeProject(r.knowledge,r.story).story;assert.equal(s.width,1280);
  r.story.canvas={orientation:'portrait'};assert.equal(normalizeProject(r.knowledge,r.story).story.height,1920);
});
test('TCP三次交互方向、确认号与双方状态时点正确，跨镜头结果保留',()=>{
  const {story}=project('browser'),s=story.scenes.find(s=>s.id==='tcp-three-way'),messages=s.actions.filter(a=>a.kind==='transfer');
  assert.deepEqual(messages.map(a=>[a.from,a.to]),[['browser','server'],['server','browser'],['browser','server']]);
  assert.match(messages[1].label,/ack=x\+1/);assert.match(messages[2].label,/ack=y\+1/);
  const at=(seconds)=>stateAt(story,s.start+s.readFrames+Math.round(seconds*story.fps));
  assert.equal(at(0)['browser-state'],'CLOSED');
  assert.equal(at(.1)['browser-state'],'SYN-SENT');assert.equal(at(2)['server-state'],'LISTEN');
  assert.equal(at(4)['server-state'],'SYN-RECEIVED');assert.equal(at(4)['browser-state'],'SYN-SENT');
  assert.equal(at(8)['browser-state'],'ESTABLISHED');assert.equal(at(8)['server-state'],'SYN-RECEIVED');
  assert.equal(at(12)['server-state'],'ESTABLISHED');
  assert.equal(stateAt(story,s.end)['browser-state'],'ESTABLISHED');assert.equal(stateAt(story,s.end)['server-state'],'ESTABLISHED');
});
test('DOM/CSSOM、并行获取和自定义绘制在知识与分镜中可追溯',()=>{
  const {knowledge:k,story:s}=project('browser');
  assert.ok(k.relations.some(r=>r.type==='parallel'));assert.ok(k.relations.some(r=>r.type==='conditional'));
  for(const id of ['render-dom','render-cssom','render-style','render-layout','render-paint','render-composite'])assert.ok(s.scenes.some(scene=>scene.knowledgeNodeIds.includes(id)));
  assert.ok(k.nodes.find(n=>n.id==='render-dom').sourceRefs.some(r=>/mdn/.test(r.sourceId)));
  const custom=s.scenes.find(scene=>scene.type==='custom');assert.equal(custom.custom,'browser-paint');
  assert.deepEqual(custom.actions.map(a=>a.id),['layout','background','text','composite']);
  assert.ok(s.scenes.find(scene=>scene.id==='grow-dom').items.some(i=>i.parentId));
  const markdown=knowledgeMarkdown(k);assert.ok(markdown.includes('## 本片条件'));assert.ok(markdown.includes('RFC 9293'));assert.ok(markdown.includes('native'));
  assert.ok(storyboardMarkdown(s,k).includes('TCP 三次握手'));
});
test('顺序降级保持相同整理成果；非技术内容展开必要子过程而不滥加层级',()=>{
  const {knowledge:k,story:s}=project('shopping');
  assert.equal(k.workflow.mode,'sequential');assert.ok(k.workflow.reason.length>10);
  assert.deepEqual(k.nodes.filter(n=>n.parentId==='fulfillment').map(n=>n.id),['pick','verify','pack']);
  assert.ok(s.scenes.some(scene=>scene.type==='branch'));assert.ok(s.scenes.some(scene=>scene.type==='parallel'));
  assert.equal(project('budget').knowledge.nodes.length,1);
});
test('收支逐笔连续，插值与最终值满足守恒，不重置初值',()=>{
  const {story:s}=project('budget');const final=stateAt(s,s.totalFrames-1);
  assert.deepEqual(final,{balance:6900,income:8600,expense:4700});assert.equal(final.balance,3000+final.income-final.expense);
  for(const scene of s.scenes){if(scene.end<s.totalFrames)assert.deepEqual(stateAt(s,scene.end-1),stateAt(s,scene.end));}
  const salary=s.scenes.find(scene=>scene.id==='salary'),f=salary.start+salary.readFrames+Math.round(1.25*s.fps),half=stateAt(s,f);
  assert.ok(half.balance>3000&&half.balance<11000);assert.equal(half.balance,3000+half.income-half.expense);
  const r=raw('budget');r.story.initialState.constructor=7;
  const story=normalizeProject(r.knowledge,r.story).story;assert.equal(stateAt(story,story.totalFrames-1).constructor,7);
});
test('知识缺证、引用错误、包含循环与依赖循环会在写入前拒绝',()=>{
  const invalid=(modify,pattern)=>{const r=raw('shopping');modify(r.knowledge);assert.throws(()=>normalizeKnowledge(r.knowledge),pattern);};
  invalid(k=>k.nodes[0].sourceRefs=[],/sourceRefs/);
  invalid(k=>k.nodes[0].sourceRefs[0].sourceId='missing',/来源未定义/);
  invalid(k=>k.nodes[1].id=k.nodes[0].id,/唯一/);
  invalid(k=>k.nodes[2].parentId='missing',/parentId/);
  invalid(k=>{k.nodes[1].parentId='pick';},/循环/);
  invalid(k=>k.relations.push({type:'precedes',from:'receipt',to:'payment'}),/循环/);
  invalid(k=>k.relations.push({type:'contains',from:'payment',to:'pick'}),/不一致/);
  invalid(k=>k.relations.push({type:'parallel',from:'payment',to:'missing'}),/知识节点/);
});
test('旧格式明确提示重建；镜头引用、动作窗口、状态冲突及不连续被拒绝',()=>{
  const k=raw('shopping').knowledge;
  assert.throws(()=>normalizeStory({title:'旧版',steps:[]},k),/重建.*不能仅修改版本号/);
  assert.throws(()=>normalizeStory(raw('shopping').story),/knowledge.json/);
  const bad=(modify,pattern)=>{const r=raw('shopping');modify(r.story);assert.throws(()=>normalizeProject(r.knowledge,r.story),pattern);};
  bad(s=>s.scenes[1].knowledgeNodeIds=['missing'],/未定义引用/);
  bad(s=>s.scenes[1].chapterId='missing',/未定义章节/);
  bad(s=>s.scenes[1].actions[0].duration=100,/超出/);
  bad(s=>s.scenes[1].actions[0].from='unknown',/transfer/);
  bad(s=>s.scenes[1].actions[1].expect['order-state']='wrong',/衔接不连续/);
  bad(s=>s.scenes[1].actions[0].set={'new-key':1},/未定义状态/);
  bad(s=>s.scenes[1].actions[0].set={'order-state':'race'},/写入时间重叠|衔接不连续/);
  bad(s=>s.scenes[0].timing.read=.1,/至少/);
  bad(s=>s.canvas={width:1001,height:1920},/偶数/);
  bad(s=>s.scenes=s.scenes.filter(scene=>!scene.knowledgeNodeIds.includes('verify')),/核心知识节点/);
});
test('同状态同时写入被拒绝，按同一帧先提交再检验下一动作',()=>{
  const r=raw('budget'),scene=r.story.scenes[1];
  scene.actions.push({...structuredClone(scene.actions[0]),id:'race',at:1,duration:1});
  assert.throws(()=>normalizeProject(r.knowledge,r.story),/写入时间重叠/);
  const r2=raw('budget'),a=r2.story.scenes[1].actions[0];a.duration=1;
  r2.story.scenes[1].actions.push({id:'next',kind:'count',at:1,duration:1.5,expect:{balance:11000},set:{balance:11000}});
  assert.doesNotThrow(()=>normalizeProject(r2.knowledge,r2.story));
});
test('媒体核验拒绝音轨、丢帧、错误尺寸、时长与编码',()=>{
  const {story:s}=project('browser'),valid={streams:[{codec_type:'video',codec_name:'h264',pix_fmt:'yuv420p',width:s.width,height:s.height,avg_frame_rate:'30/1',duration:String(s.duration),nb_frames:String(s.totalFrames)}]};
  assert.ok(verifyMetadata(valid,s).passed);
  for(const fn of [m=>m.streams.push({codec_type:'audio'}),m=>m.streams[0].nb_frames='1',m=>m.streams[0].width=1080,m=>m.streams[0].duration='20',m=>m.streams[0].avg_frame_rate='25/1',m=>m.streams[0].codec_name='hevc']){const copy=structuredClone(valid);fn(copy);assert.equal(verifyMetadata(copy,s).passed,false);}
});
test('完整复制 Skill 后可在另一项目创建自定义源项目，并拒绝覆盖和路径逃逸',async()=>{
  const temp=mkdtempSync(join(tmpdir(),'knowledge-motion-v2-'));
  try{
    const installed=join(temp,'installed');cpSync(skill,installed,{recursive:true});
    const {createProject:copyCreate}=await import(pathToFileURL(join(installed,'scripts/create-project.mjs')));
    const workspace=join(temp,'project');mkdirSync(workspace);
    const args={projectRoot:workspace,knowledgeFile:join(installed,'examples/browser/knowledge.json'),storyFile:join(installed,'examples/browser/story.json'),output:'out/video'};
    const out=copyCreate(args);
    for(const file of ['knowledge.json','knowledge.md','story.json','storyboard.md','package-lock.json','src/index.jsx','src/visual.jsx','src/custom-scenes.jsx','src/custom/BrowserPaint.jsx','src/custom/manifest.json','scripts/custom-scenes.mjs','scripts/render.mjs','scripts/verify-video.mjs'])assert.ok(existsSync(join(out,file)),file);
    assert.equal(JSON.parse(readFileSync(join(out,'knowledge.json'))).workflow.mode,'native');
    assert.match(readFileSync(join(out,'src/custom-scenes.jsx'),'utf8'),/browser-paint/);
    assert.throws(()=>copyCreate(args),/已存在/);
    assert.throws(()=>copyCreate({...args,output:'../escape'}),/项目内/);
    assert.throws(()=>copyCreate({...args,projectRoot:temp,output:'installed/output'}),/Skill/);
    assert.throws(()=>createProject({storyFile:args.storyFile}),/--knowledge/);
    const external=join(temp,'external');mkdirSync(external);
    symlinkSync(external,join(workspace,'linked'),process.platform==='win32'?'junction':'dir');
    assert.throws(()=>copyCreate({...args,output:'linked/video'}),/真实路径/);
    const registry=join(out,'src/custom');
    assert.equal(readCustomManifest(project('browser').story,registry).length,1);
    const linkedSource=join(temp,'linked-scenes');symlinkSync(registry,linkedSource,process.platform==='win32'?'junction':'dir');
    assert.throws(()=>readCustomManifest(project('browser').story,linkedSource),/符号链接/);
    writeFileSync(join(registry,'manifest.json'),'[{"id":"renamed-paint","file":"BrowserPaint.jsx"}]');
    const changed=JSON.parse(readFileSync(join(out,'story.json')));changed.scenes.find(s=>s.type==='custom').custom='renamed-paint';writeFileSync(join(out,'story.json'),JSON.stringify(changed));
    const checked=spawnSync(process.execPath,['scripts/render.mjs','--check'],{cwd:out,encoding:'utf8'});assert.equal(checked.status,0,checked.stderr);
    assert.match(readFileSync(join(out,'src/custom-scenes.jsx'),'utf8'),/renamed-paint/);
    writeFileSync(join(registry,'manifest.json'),'[]');
    assert.throws(()=>readCustomManifest(project('browser').story,registry),/未注册/);
    assert.throws(()=>readCustomManifest(project('browser').story,join(out,'missing')),/缺少/);
    writeFileSync(join(registry,'manifest.json'),'[{"id":"browser-paint","file":"../escape.jsx"}]');
    assert.throws(()=>readCustomManifest(project('browser').story,registry),/无效/);
  }finally{
    const rel=relative(resolve(tmpdir()),resolve(temp));assert.ok(rel&&!rel.startsWith('..')&&!isAbsolute(rel));
    rmSync(temp,{recursive:true,force:true});
  }
});

test('回归：count 在动作起点检查当前值，允许先转成数字且拒绝字符串插值',()=>{
  const make=(initial,next)=>{const r=raw('budget');r.story.initialState.marker=initial;r.story.scenes[1].actions.push({id:'prepare',kind:'state',at:0,duration:.5,set:{marker:next}},{id:'count-marker',kind:'count',at:.5,duration:1,set:{marker:10}});return r;};
  const bad=make(0,'bad');assert.throws(()=>normalizeProject(bad.knowledge,bad.story),/动作起点.*数值/);
  const good=make('old',0),{story}=normalizeProject(good.knowledge,good.story),scene=story.scenes[1];
  assert.equal(stateAt(story,scene.start+scene.readFrames+30).marker,5);
});
test('回归：小数秒动作共用帧换算，校验与播放在同一帧提交',()=>{
  const r=raw('budget');r.story.initialState.marker=0;
  r.story.scenes[1].actions.push({id:'fraction',kind:'state',at:.014,duration:.047,set:{marker:1}},{id:'expect-next',kind:'state',at:1/30,duration:1/30,expect:{marker:0},set:{marker:2}});
  assert.throws(()=>normalizeProject(r.knowledge,r.story),/衔接不连续/);
  r.story.scenes[1].actions.at(-1).expect.marker=1;
  const {story}=normalizeProject(r.knowledge,r.story),s=story.scenes[1];
  assert.equal(stateAt(story,s.start+s.readFrames).marker,0);
  assert.equal(stateAt(story,s.start+s.readFrames+1).marker,1);
  assert.equal(stateAt(story,s.start+s.readFrames+2).marker,2);
});
