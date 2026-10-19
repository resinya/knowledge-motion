import React from 'react';
import {useCurrentFrame} from 'remotion';
import {timelineAt,stateAt,actionProgress,clamp,mix,ease,glyphWidth} from './story.mjs';
import {C,FONT,ink,Text,Panel,Pill,Arrow,textLines,labelHeight} from './visual.jsx';
import {customScenes} from './custom-scenes.jsx';

const objectFor=(knowledge,id)=>knowledge.objects.find(object=>object.id===id);
const nodeFor=(knowledge,id)=>knowledge.nodes.find(node=>node.id===id);
const itemObject=(knowledge,item)=>objectFor(knowledge,item.objectId??item.id);
const actionTarget=(action,id)=>action.target===id||action.from===id||action.to===id;
const currentAction=(scene,localFrame,fps)=>scene.actions.find(action=>{
  const p=actionProgress(scene,action,localFrame,fps);
  return p>0&&p<1;
});
const actionActive=(scene,id,localFrame,fps)=>scene.actions.some(action=>actionTarget(action,id)&&actionProgress(scene,action,localFrame,fps)>0&&actionProgress(scene,action,localFrame,fps)<1);

function Navigation({story,knowledge,scene,frame,x,y,width,portrait}) {
  const count=story.chapters.length,capacity=portrait?3:5,gap=10;
  const selected=story.chapters.findIndex(chapter=>chapter.id===scene.chapterId);
  const lastCompleted=[...story.chapters].reverse().find(chapter=>{const related=story.scenes.filter(s=>s.chapterId===chapter.id&&s.type!=='overview');return related.length&&related.every(s=>s.end<=frame);});
  const current=Math.max(0,selected>=0?selected:story.chapters.indexOf(lastCompleted));
  const first=Math.max(0,Math.min(count-capacity,current-Math.floor(capacity/2)));
  const shown=story.chapters.slice(first,first+capacity);
  const counterWidth=count>capacity?110:0;
  const w=(width-counterWidth-gap*(shown.length-1))/Math.max(1,shown.length);
  return <g transform={'translate('+x+' '+y+')'}>
    {shown.map((chapter,i)=>{
      const scenes=story.scenes.filter(s=>s.chapterId===chapter.id&&s.type!=='overview');
      const done=scenes.length>0&&scenes.every(s=>s.end<=frame);
      const active=chapter.id===scene.chapterId;
      const color=active?C.cyan:done?C.green:C.muted;
      return <g key={chapter.id}>
        <rect x={i*(w+gap)} width={w} height={portrait?64:57} rx="12" fill={active?'#102a3b':C.card} stroke={active?C.cyan:C.line}/>
        <circle cx={i*(w+gap)+23} cy={portrait?33:29} r="5" fill={color}/>
        <Text x={i*(w+gap)+42} y={portrait?42:38} width={w-60} text={chapter.title} size={portrait?25:26} color={color} maxLines={1} overflow="ellipsis"/>
      </g>;
    })}
    {count>capacity&&<Text x={width-4} y={portrait?42:38} width={100} text={String(current+1)+' / '+count} size={25} color={C.muted} anchor="end"/>}
  </g>;
}

function Overview({story,knowledge,scene,localFrame,width,height,frame}) {
  const portrait=width<1200;
  const modules=knowledge.modules.map(id=>nodeFor(knowledge,id)).filter(Boolean);
  const cols=portrait?2:3,rows=portrait?4:2,capacity=cols*rows;
  const pages=Math.max(1,Math.ceil(modules.length/capacity));
  const page=scene.overview==='return'
    ?Math.floor(Math.max(0,modules.findIndex(n=>n.id===story.chapters.find(c=>c.id===scene.chapterId)?.knowledgeNodeId))/capacity)
    :Math.min(pages-1,Math.floor(clamp(localFrame/Math.max(1,scene.frames-1))*pages));
  const visible=modules.slice(page*capacity,(page+1)*capacity);
  const actualRows=Math.ceil(visible.length/cols),gap=portrait?24:26;
  const cardW=(width-(cols-1)*gap)/cols;
  const cardH=Math.min(portrait?270:270,(height-54-(actualRows-1)*gap)/Math.max(1,actualRows));
  return <g>
    <Text x={0} y={27} width={width-180} text={scene.overview==='return'?'回到全貌 · 保留已经完成的结果':'知识全貌 · 每个模块回答一个问题'} size={portrait?27:26} color={C.muted}/>
    {pages>1&&<Text x={width} y={27} width={150} text={String(page+1)+' / '+pages} size={27} color={C.cyan} anchor="end"/>}
    {visible.map((node,i)=>{
      const chapter=story.chapters.find(c=>c.knowledgeNodeId===node.id);
      const related=story.scenes.filter(s=>s.chapterId===chapter?.id&&s.type!=='overview');
      const completed=related.length>0&&related.every(s=>s.end<=frame);
      const active=scene.overview==='return'&&chapter?.id===scene.chapterId;
      const color=completed?C.green:active?C.cyan:C.muted;
      const x=(i%cols)*(cardW+gap),y=54+Math.floor(i/cols)*(cardH+gap);
      return <Panel key={node.id} x={x} y={y} width={cardW} height={cardH} color={active||completed?color:C.line} active={active}>
        <Pill x={24} y={22} text={String(page*capacity+i+1).padStart(2,'0')} size={23} color={color}/>
        <Text x={24} y={106} width={cardW-48} text={node.title} size={portrait?33:34} weight={700} maxLines={2}/>
        <Text x={24} y={cardH-71} width={cardW-48} text={node.displayGoal??node.goal??''} size={portrait?27:26} color={C.muted} maxLines={2}/>
      </Panel>;
    })}
  </g>;
}

function Sequence({scene,knowledge,localFrame,fps,state,width,height}) {
  const actors=(scene.actors?.length?scene.actors:(scene.items??[]).map(item=>item.objectId??item.id)).map(id=>{
    const item=(scene.items??[]).find(item=>item.id===id||item.objectId===id);
    return {...objectFor(knowledge,id),...item,id,label:item?.label??objectFor(knowledge,id)?.label??id};
  });
  const actorW=Math.min(360,width/actors.length-36),top=12,actorH=138;
  const pos=new Map(actors.map((actor,i)=>[actor.id,{x:(i+.5)*width/actors.length,y:top+actorH}]));
  const transfers=scene.actions.filter(action=>action.kind==='transfer');
  const y0=228,last=height-62,rowGap=transfers.length>1?(last-y0)/(transfers.length-1):0;
  return <g>
    {actors.map(actor=>{
      const point=pos.get(actor.id),active=actionActive(scene,actor.id,localFrame,fps),color=ink(actor.color);
      return <g key={actor.id}>
        <path d={'M'+point.x+' '+(top+actorH+12)+'V'+height} stroke={color} strokeWidth="2" strokeOpacity=".3" strokeDasharray="9 10"/>
        <Panel x={point.x-actorW/2} y={top} width={actorW} height={actorH} color={active?color:C.line} active={active}>
          <Text x={actorW/2} y={45} width={actorW-32} text={actor.label} size={31} weight={700} anchor="middle" maxLines={1}/>
          <Text x={actorW/2} y={98} width={actorW-24} text={String(state[actor.id+'-state']??actor.detail??'准备就绪')} size={25} color={color} anchor="middle" maxLines={1}/>
        </Panel>
      </g>;
    })}
    {transfers.map((action,i)=>{
      const from=pos.get(action.from)??pos.get((scene.items??[]).find(item=>item.id===action.from)?.objectId);
      const to=pos.get(action.to)??pos.get((scene.items??[]).find(item=>item.id===action.to)?.objectId);
      if(!from||!to)throw new Error('Sequence '+scene.id+' has no actor for '+action.id);
      const p=actionProgress(scene,action,localFrame,fps),y=y0+i*rowGap,color=p>=1?C.green:C.cyan;
      return <g key={action.id}>
        <circle cx={width/2} cy={y+30} r="17" fill={C.card} stroke={p>.01?color:C.line}/>
        <Text x={width/2} y={y+38} width={34} text={String(i+1)} size={22} color={p>.01?color:C.muted} anchor="middle"/>
        <Arrow x1={from.x} y1={y} x2={to.x} y2={y} progress={p} color={color} label={action.label??action.text??''} size={27}/>
      </g>;
    })}
  </g>;
}

function itemLabel(scene,item,localFrame,fps) {
  const typing=scene.actions.find(action=>action.kind==='type'&&(action.target===item.id||action.target===item.objectId));
  if(!typing)return item.label;
  const p=actionProgress(scene,typing,localFrame,fps);
  const letters=[...typing.text];
  return letters.slice(0,Math.ceil(p*letters.length)).join('')+(p<1?'▌':'');
}

function graphLayout(scene,width,height) {
  const items=scene.items??[],links=[...(scene.links??[]),...items.filter(item=>item.parentId).map(item=>({from:item.parentId,to:item.id}))];
  const horizontal=scene.type!=='tree'&&width>1200;
  const depths=new Map(items.map(item=>[item.id,0]));
  for(let pass=0;pass<items.length;pass++){
    let changed=false;
    for(const link of links){
      const next=Math.min(items.length-1,(depths.get(link.from)??0)+1);
      if(next>(depths.get(link.to)??0)){depths.set(link.to,next);changed=true;}
    }
    if(!changed)break;
  }
  const maxDepth=Math.max(0,...depths.values()),w=Math.min(horizontal?310:width<1200?300:340,horizontal?width/Math.max(2,maxDepth+1)-60:width/2-24),h=116;
  const treeSlots=new Map();let leafCount=0;
  if(scene.type==='tree'){
    const children=new Map(items.map(item=>[item.id,[...new Set(links.filter(link=>link.from===item.id).map(link=>link.to))]]));
    const visit=(id,trail=new Set())=>{
      if(treeSlots.has(id))return treeSlots.get(id);
      if(trail.has(id))throw new Error('Tree '+scene.id+' contains a cycle. Use a branch or state scene for a loop.');
      const nextTrail=new Set([...trail,id]),descendants=children.get(id)??[];
      const childSlots=descendants.map(child=>visit(child,nextTrail));
      const slot=childSlots.length?(Math.min(...childSlots)+Math.max(...childSlots))/2:leafCount++;
      treeSlots.set(id,slot);return slot;
    };
    items.filter(item=>!links.some(link=>link.to===item.id)).forEach(item=>visit(item.id));
    items.forEach(item=>visit(item.id));
  }
  const positioned=items.map(item=>{
    const depth=depths.get(item.id),siblings=items.filter(candidate=>depths.get(candidate.id)===depth),index=siblings.indexOf(item);
    const main=maxDepth?depth/maxDepth:.5,cross=scene.type==='tree'?(treeSlots.get(item.id)+.5)/Math.max(1,leafCount):(index+.5)/siblings.length;
    const cx=item.x!==undefined?item.x*width:horizontal?w/2+12+main*(width-w-24):cross*width;
    const cy=item.y!==undefined?item.y*height:horizontal?cross*height:h/2+12+main*(height-h-24);
    return {...item,cx:Math.max(w/2+4,Math.min(width-w/2-4,cx)),cy:Math.max(h/2+4,Math.min(height-h/2-4,cy)),w,h};
  });
  for(let i=0;i<positioned.length;i++)for(let j=i+1;j<positioned.length;j++){
    const a=positioned[i],b=positioned[j];
    if(Math.abs(a.cx-b.cx)<(a.w+b.w)/2+18&&Math.abs(a.cy-b.cy)<(a.h+b.h)/2+18)
      throw new Error('Graph '+scene.id+' has crowded nodes '+a.id+' / '+b.id+'. Split the mechanism or reflow its items.');
  }
  return {items:positioned,links:links.filter((link,i)=>links.findIndex(candidate=>candidate.from===link.from&&candidate.to===link.to)===i),horizontal};
}

function revealProgress(scene,item,localFrame,fps) {
  const actions=scene.actions.filter(action=>action.kind==='reveal'&&(action.target===item.id||action.target===item.objectId));
  if(actions.length)return Math.max(...actions.map(action=>actionProgress(scene,action,localFrame,fps)));
  const incoming=scene.actions.filter(action=>action.kind==='transfer'&&(action.to===item.id||action.to===item.objectId));
  return incoming.length?Math.min(...incoming.map(action=>actionProgress(scene,action,localFrame,fps))):1;
}

function connector(from,to,horizontal) {
  if(horizontal){
    const sign=to.cx>=from.cx?1:-1,x1=from.cx+sign*from.w/2,x2=to.cx-sign*to.w/2,mid=(x1+x2)/2;
    return {x1,y1:from.cy,x2,y2:to.cy,path:'M'+x1+' '+from.cy+'H'+mid+'V'+to.cy+'H'+x2,points:{x:mid,y:to.cy},route:[{x:x1,y:from.cy},{x:mid,y:from.cy},{x:mid,y:to.cy},{x:x2,y:to.cy}]};
  }
  const sign=to.cy>=from.cy?1:-1,y1=from.cy+sign*from.h/2,y2=to.cy-sign*to.h/2,mid=(y1+y2)/2;
  return {x1:from.cx,y1,x2:to.cx,y2,path:'M'+from.cx+' '+y1+'V'+mid+'H'+to.cx+'V'+y2,points:{x:to.cx,y:mid},route:[{x:from.cx,y:y1},{x:from.cx,y:mid},{x:to.cx,y:mid},{x:to.cx,y:y2}]};
}

function Graph({scene,knowledge,localFrame,fps,width,height}) {
  const layout=graphLayout(scene,width,height),lookup=new Map(layout.items.map(item=>[item.id,item]));
  return <g>
    {layout.links.map((link,i)=>{
      const from=lookup.get(link.from),to=lookup.get(link.to);
      if(!from||!to)return null;
      const action=scene.actions.find(action=>action.kind==='transfer'&&action.from===link.from&&action.to===link.to);
      const p=action?actionProgress(scene,action,localFrame,fps):scene.type==='branch'&&scene.actions.some(action=>action.kind==='transfer')?0:Math.min(revealProgress(scene,from,localFrame,fps),revealProgress(scene,to,localFrame,fps));
      const points=connector(from,to,layout.horizontal);
      return <Arrow key={i} {...points} label={link.label??action?.label??''} progress={p} color={ink(to.color??itemObject(knowledge,to)?.color)} size={24}/>;
    })}
    {layout.items.map(item=>{
      const p=revealProgress(scene,item,localFrame,fps),active=actionActive(scene,item.id,localFrame,fps)||actionActive(scene,item.objectId,localFrame,fps);
      const color=ink(item.color??itemObject(knowledge,item)?.color);
      const lines=textLines(item.label,item.w-32,29).length;
      return <Panel key={item.id} x={item.cx-item.w/2} y={item.cy-item.h/2} width={item.w} height={item.h} color={active||p>=1?color:C.line} opacity={mix(.17,1,ease(p))} active={active}>
        <Text x={item.w/2} y={item.detail?38:lines>1?44:68} width={item.w-32} text={itemLabel(scene,item,localFrame,fps)} size={29} weight={650} anchor="middle" maxLines={2}/>
        {item.detail&&<Text x={item.w/2} y={89} width={item.w-24} text={item.detail} size={24} color={C.muted} anchor="middle" maxLines={1}/>}
      </Panel>;
    })}
  </g>;
}

function State({story,scene,localFrame,fps,state,width,height,frame}) {
  const metrics=scene.metrics??[],portrait=width<1200,columns=portrait?Math.min(2,metrics.length):Math.min(3,metrics.length);
  const gap=22,rows=Math.ceil(metrics.length/Math.max(1,columns)),cardW=(width-gap*(columns-1))/Math.max(1,columns),cardH=portrait?220:216;
  const historyHeight=Math.max(160,height-rows*(cardH+gap)-12);
  const historyCapacity=Math.max(1,Math.floor((historyHeight-105)/(portrait?110:61)));
  const history=story.scenes.filter(candidate=>candidate.type==='state'&&candidate.start<=frame).slice(-historyCapacity);
  return <g>
    {metrics.map((metric,i)=>{
      const x=(i%columns)*(cardW+gap),y=Math.floor(i/columns)*(cardH+gap),value=state[metric.key]??0,color=ink(metric.color,i===0?C.cyan:C.green);
      const active=scene.actions.some(action=>action.set&&Object.hasOwn(action.set,metric.key)&&actionProgress(scene,action,localFrame,fps)>0&&actionProgress(scene,action,localFrame,fps)<1);
      const formatted=(metric.prefix??'')+(typeof value==='number'?Number(value.toFixed(2)).toLocaleString('en-US'):String(value))+(metric.suffix??'');
      return <Panel key={metric.key} x={x} y={y} width={cardW} height={cardH} active={active} color={active?color:C.line}>
        <Text x={28} y={53} width={cardW-56} text={metric.label} size={28} color={C.muted}/>
        <Text x={28} y={151} width={cardW-56} text={formatted} size={portrait?54:64} color={color} weight={750} maxLines={1}/>
      </Panel>;
    })}
    <Panel y={rows*(cardH+gap)+12} width={width} height={Math.max(160,height-rows*(cardH+gap)-12)}>
      <Text x={32} y={49} width={width-64} text="变化如何累积" size={30} weight={650}/>
      {history.map((candidate,i)=>{
        const complete=candidate.end<=frame;
        const current=candidate.id===scene.id;
        const lineY=107+i*(portrait?110:61);
        const act=currentAction(candidate,current?localFrame:candidate.frames,fps);
        return <g key={candidate.id} opacity={current||complete?1:.45}>
          <circle cx={40} cy={lineY-10} r="6" fill={complete?C.green:current?C.cyan:C.line}/>
          <Text x={64} y={lineY} width={width-110} text={current&&act?.label?act.label:current&&localFrame<candidate.readFrames+candidate.actFrames?candidate.title:candidate.result??candidate.title} size={portrait?29:28} color={complete?C.green:C.text} maxLines={portrait?2:1}/>
        </g>;
      })}
    </Panel>
  </g>;
}

function List({scene,knowledge,localFrame,fps,width,height}) {
  const items=scene.items??[],portrait=width<1200,columns=portrait?1:items.length>5?2:1;
  const maxRows=portrait?10:5,capacity=maxRows*columns,gap=portrait?16:22;
  const focused=scene.actions.find(action=>['highlight','reveal','state','transfer'].includes(action.kind)&&actionProgress(scene,action,localFrame,fps)>0&&actionProgress(scene,action,localFrame,fps)<1);
  const focusIndex=items.findIndex(item=>actionTarget(focused??{},item.id));
  const page=focusIndex>=0?Math.floor(focusIndex/capacity):Math.min(Math.ceil(items.length/capacity)-1,Math.floor(clamp(localFrame/Math.max(1,scene.frames-1))*Math.ceil(items.length/capacity)));
  const shown=items.slice(page*capacity,(page+1)*capacity);
  const rows=Math.ceil(shown.length/columns),rowH=Math.min(portrait?134:116,(height-(rows-1)*gap)/Math.max(1,rows)),cardW=(width-(columns-1)*gap)/columns;
  return <g>
    {shown.map((item,i)=>{
      const active=actionActive(scene,item.id,localFrame,fps),color=ink(item.color??itemObject(knowledge,item)?.color);
      const x=Math.floor(i/rows)*(cardW+gap),y=(i%rows)*(rowH+gap);
      const p=revealProgress(scene,item,localFrame,fps);
      return <Panel key={item.id} x={x} y={y} width={cardW} height={rowH} color={active?color:C.line} active={active} opacity={mix(.35,1,p)}>
        <rect x="0" y="18" width="4" height={rowH-36} rx="2" fill={color}/>
        <Text x={27} y={rowH/2+11} width={115} text={item.badge??String(page*capacity+i+1).padStart(2,'0')} size={33} color={color} weight={700} maxLines={1}/>
        <Text x={160} y={item.detail?rowH/2-7:rowH/2+11} width={cardW-188} text={itemLabel(scene,item,localFrame,fps)} size={30} weight={650} maxLines={1}/>
        {item.detail&&<Text x={160} y={rowH/2+32} width={cardW-188} text={item.detail} size={26} color={active?color:C.muted} maxLines={1}/>}
      </Panel>;
    })}
    {items.length>capacity&&<Text x={width} y={height+34} width={200} text={String(page+1)+' / '+Math.ceil(items.length/capacity)} size={26} color={C.muted} anchor="end"/>}
  </g>;
}

function Linked({scene,knowledge,localFrame,fps,width,height}) {
  const portrait=width<1200,gap=portrait?32:30,panelW=portrait?width:(width-2*gap)/3,panelH=portrait?(height-2*gap)/3:height;
  const columns=[0,1,2],positions=new Map();
  for(const column of columns){
    const items=(scene.items??[]).filter(item=>(item.column??0)===column);
    const originX=portrait?0:column*(panelW+gap),originY=portrait?column*(panelH+gap):0;
    const cardH=Math.min(112,(panelH-112-20*Math.max(0,items.length-1))/Math.max(1,items.length));
    items.forEach((item,i)=>positions.set(item.id,{...item,cx:originX+panelW/2,cy:originY+104+cardH/2+i*(cardH+20),w:panelW-48,h:cardH}));
  }
  if(scene.data?.code&&!scene.items?.some(item=>(item.column??0)===0)&&112+scene.data.code.length*38>panelH-12)throw new Error('Linked code in '+scene.id+' exceeds the readable panel. Split this source into more shots.');
  const headings=scene.data?.headings??['输入','结构','结果'];
  return <g>
    {columns.map(column=><Panel key={column} x={portrait?0:column*(panelW+gap)} y={portrait?column*(panelH+gap):0} width={panelW} height={panelH}>
      <Text x={26} y={52} width={panelW-52} text={headings[column]} size={31} color={[C.cyan,C.purple,C.green][column]} weight={700}/>
      {column===0&&scene.data?.code&&!scene.items?.some(item=>(item.column??0)===0)&&scene.data.code.map((line,i)=><Text key={i} x={24} y={112+i*38} width={panelW-48} text={line} size={26} color={C.cyan} style={{fontFamily:'Consolas,monospace'}}/>)}
    </Panel>)}
    {(scene.links??[]).map((link,i)=>{
      const from=positions.get(link.from),to=positions.get(link.to);if(!from||!to)return null;
      const action=scene.actions.find(action=>action.kind==='transfer'&&action.from===link.from&&action.to===link.to);
      let geometry=connector(from,to,!portrait);
      if(Math.abs((from.column??0)-(to.column??0))>1){
        if(portrait){
          const x=width-12,y1=from.cy+from.h/2,y2=to.cy-to.h/2;
          geometry={x1:from.cx,y1,x2:to.cx,y2,path:'M'+from.cx+' '+y1+'H'+x+'V'+y2+'H'+to.cx,points:{x,y:y2},route:[{x:from.cx,y:y1},{x,y:y1},{x,y:y2},{x:to.cx,y:y2}]};
        }else{
          const sign=to.cx>from.cx?1:-1,x1=from.cx+sign*from.w/2,x2=to.cx-sign*to.w/2;
          const low=Math.max(...[...positions.values()].map(item=>item.cy+item.h/2));
          const lane=height-low>70?height-38:84,near=x1+sign*14,far=x2-sign*14;
          geometry={x1,y1:from.cy,x2,y2:to.cy,path:'M'+x1+' '+from.cy+'H'+near+'V'+lane+'H'+far+'V'+to.cy+'H'+x2,points:{x:far,y:to.cy},route:[{x:x1,y:from.cy},{x:near,y:from.cy},{x:near,y:lane},{x:far,y:lane},{x:far,y:to.cy},{x:x2,y:to.cy}]};
        }
      }
      return <Arrow key={i} {...geometry} progress={action?actionProgress(scene,action,localFrame,fps):Math.min(revealProgress(scene,from,localFrame,fps),revealProgress(scene,to,localFrame,fps))} color={C.cyan} label={link.label??''} size={24}/>;
    })}
    {[...positions.values()].map(item=>{
      const p=revealProgress(scene,item,localFrame,fps),active=actionActive(scene,item.id,localFrame,fps),color=ink(item.color??itemObject(knowledge,item)?.color,[C.cyan,C.purple,C.green][item.column??0]);
      return <Panel key={item.id} x={item.cx-item.w/2} y={item.cy-item.h/2} width={item.w} height={item.h} color={active?color:C.line} active={active} opacity={mix(.12,1,p)} fill={C.bg} radius={12}>
        <Text x={20} y={item.h/2+(item.detail?-6:10)} width={item.w-40} text={itemLabel(scene,item,localFrame,fps)} size={29} color={color} weight={650} maxLines={2}/>
        {item.detail&&<Text x={20} y={item.h/2+33} width={item.w-40} text={item.detail} size={24} color={C.muted} maxLines={1}/>}
      </Panel>;
    })}
  </g>;
}

function Content(props) {
  const {scene}=props;
  if(scene.type==='overview')return <Overview {...props}/>;
  if(scene.type==='sequence')return <Sequence {...props}/>;
  if(['tree','parallel','branch'].includes(scene.type))return <Graph {...props}/>;
  if(scene.type==='state')return <State {...props}/>;
  if(scene.type==='list')return <List {...props}/>;
  if(scene.type==='linked')return <Linked {...props}/>;
  if(scene.type==='custom'){
    const Component=customScenes[scene.custom];
    if(typeof Component!=='function')throw new Error('Custom scene "'+scene.custom+'" in '+scene.id+' is not registered in src/custom-scenes.jsx');
    return <Component {...props} actionProgress={action=>actionProgress(scene,action,props.localFrame,props.fps)}/>;
  }
  throw new Error('Unsupported scene type: '+scene.type);
}

export function Scene({story,knowledge}) {
  const frame=useCurrentFrame(),timeline=timelineAt(story,frame),{scene,localFrame}=timeline;
  const portrait=story.width<story.height,canvasHeight=portrait?1920:1080,canvasWidth=Math.round(canvasHeight*story.width/story.height);
  const margin=portrait?54:82,width=canvasWidth-margin*2;
  const titleSize=portrait?45:49,titleY=portrait?166:122;
  const titleLines=textLines(scene.title,width,titleSize).length;
  const explanationY=titleY+(titleLines-1)*titleSize*1.3+52;
  const explanationLines=Math.max(1,textLines(scene.explanation??'',width,portrait?29:27).length);
  const navY=explanationY+explanationLines*(portrait?38:36)+20;
  const contentY=navY+(portrait?105:94),footerY=canvasHeight-(portrait?150:126),height=footerY-contentY-28;
  if(height<(portrait?650:350))throw new Error('Scene '+scene.id+' has insufficient readable content space. Shorten the heading or split this scene.');
  const state=stateAt(story,frame),active=currentAction(scene,localFrame,story.fps);
  const footerText=timeline.phase==='read'?(scene.explanation??'先看对象与关系'):timeline.phase==='hold'?(scene.result??'结果保留，继续下一步'):(active?.label??active?.text??'观察当前变化');
  return <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox={'0 0 '+canvasWidth+' '+canvasHeight} style={{fontFamily:FONT,background:C.bg}}>
    <defs>
      <linearGradient id="km-panel" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#102033"/><stop offset="1" stopColor="#09121f"/></linearGradient>
      <radialGradient id="km-halo"><stop stopColor="#14475e" stopOpacity=".27"/><stop offset="1" stopColor={C.bg} stopOpacity="0"/></radialGradient>
      <pattern id="km-grid" width="54" height="54" patternUnits="userSpaceOnUse"><path d="M54 0H0V54" fill="none" stroke="#29425e" strokeWidth=".7" opacity=".15"/></pattern>
      <clipPath id="km-content"><rect width={width} height={Math.max(1,height)} rx="4"/></clipPath>
    </defs>
    <rect width={canvasWidth} height={canvasHeight} fill={C.bg}/>
    <rect width={canvasWidth} height={canvasHeight} fill="url(#km-grid)"/>
    <ellipse cx={canvasWidth*.76} cy={canvasHeight*.25} rx={canvasWidth*.65} ry={canvasHeight*.62} fill="url(#km-halo)"/>
    <g transform={'translate('+margin+' 0)'}>
      <rect x="0" y={portrait?66:49} width="38" height="5" rx="2" fill={C.cyan}/>
      <Text x={54} y={portrait?79:62} width={width-210} text={story.title} size={portrait?27:25} color={C.muted} maxLines={1}/>
      <Text x={width} y={portrait?79:62} width={160} text={String(timeline.index+1).padStart(2,'0')+' / '+String(story.scenes.length).padStart(2,'0')} size={23} color={C.muted} anchor="end"/>
      <Text x={0} y={titleY} width={width} text={scene.title} size={titleSize} weight={750}/>
      <Text x={0} y={explanationY} width={width} text={scene.explanation??''} size={portrait?29:27} color={C.muted}/>
    </g>
    <Navigation story={story} knowledge={knowledge} scene={scene} frame={frame} x={margin} y={navY} width={width} portrait={portrait}/>
    <g transform={'translate('+margin+' '+(contentY+mix(9,0,ease(clamp(localFrame/9))))+')'} opacity={mix(.65,1,clamp(localFrame/7))} clipPath="url(#km-content)">
      <Content story={story} knowledge={knowledge} scene={scene} localFrame={localFrame} fps={story.fps} state={state} width={width} height={height} frame={frame}/>
    </g>
    <g transform={'translate('+margin+' '+footerY+')'}>
      <rect width={width} height="3" rx="1.5" fill={C.line}/>
      <rect width={width*clamp((frame+1)/story.totalFrames)} height="3" rx="1.5" fill={C.cyan}/>
      <Text x={0} y={portrait?56:48} width={width} text={timeline.phase==='hold'?'结果':'当前动作'} size={portrait?26:24} color={timeline.phase==='hold'?C.green:C.cyan} weight={650}/>
      <Text x={0} y={portrait?103:90} width={width} text={footerText} size={portrait?29:27} color={C.text} maxLines={2}/>
    </g>
  </svg>;
}
