import React from 'react';
import {clamp, mix, ease, tone, wrapText, glyphWidth} from './story.mjs';

export const C = {bg:'#050b15', card:'#0d1929', line:'#263b51', text:'#f1f6fc', muted:'#92a6bd', cyan:'#41cfff', green:'#44ddb0', purple:'#bc9aff', orange:'#ffc077', pink:'#f298c3'};
export const FONT = '"Microsoft YaHei","PingFang SC","Noto Sans CJK SC","Noto Sans SC",sans-serif';
export const ink = (value, fallback = C.cyan) => value ? tone(value) : fallback;
export const textLines = (text, width, size) => wrapText(String(text ?? ''), Math.max(1, width / size));
export const labelHeight = (text, width, size = 28, lineHeight = 1.35) => textLines(text, width, size).length * size * lineHeight;

export function Text({x=0,y=0,width=600,text='',size=28,color=C.text,weight=500,anchor='start',lineHeight=1.35,opacity=1,maxLines,overflow='error',style}) {
  let lines = textLines(text, width, size);
  if (maxLines && lines.length > maxLines) {
    if(overflow!=='ellipsis')throw new Error('Text exceeds '+maxLines+' readable lines: "'+text+'". Split the scene or shorten the on-screen label; do not reduce font size.');
    lines = [...lines.slice(0,maxLines-1), lines[maxLines-1].slice(0,-1)+'…'];
  }
  return <text x={x} y={y} fill={color} fontSize={size} fontWeight={weight} textAnchor={anchor} opacity={opacity} style={style}>
    {lines.map((line,i)=><tspan key={i} x={x} dy={i===0?0:size*lineHeight}>{line}</tspan>)}
  </text>;
}

export function Panel({x=0,y=0,width,height,color=C.line,active=false,opacity=1,fill='url(#km-panel)',radius=20,children}) {
  return <g transform={'translate('+x+' '+y+')'} opacity={opacity}>
    {active && <rect x="-4" y="-4" width={width+8} height={height+8} rx={radius+4} fill="none" stroke={color} strokeWidth="8" opacity=".09"/>}
    <rect width={width} height={height} rx={radius} fill={fill} stroke={color} strokeWidth={active?2.7:1.5}/>
    {children}
  </g>;
}

export function Pill({x=0,y=0,text='',color=C.cyan,size=24,width}) {
  const w=width??Math.max(70,glyphWidth(String(text))*size+28);
  return <g transform={'translate('+x+' '+y+')'}>
    <rect width={w} height={size+22} rx={(size+22)/2} fill={C.bg} stroke={color} strokeOpacity=".45"/>
    <Text x={w/2} y={size+5} width={w-20} text={text} size={size} color={color} anchor="middle" maxLines={1}/>
  </g>;
}

export function Arrow({x1,y1,x2,y2,progress=1,color=C.cyan,label='',size=25,ghost=true,path,points,route,opacity=1}) {
  const p=clamp(progress),d=path??('M'+x1+' '+y1+'L'+x2+' '+y2);
  const angle=Math.atan2(y2-(points?.y??y1),x2-(points?.x??x1))*180/Math.PI;
  const labelX=(x1+x2)/2,labelY=(y1+y2)/2;
  const vertices=route??[{x:x1,y:y1},{x:x2,y:y2}];
  const segments=vertices.slice(1).map((end,i)=>({start:vertices[i],end,length:Math.hypot(end.x-vertices[i].x,end.y-vertices[i].y)}));
  let distance=segments.reduce((sum,segment)=>sum+segment.length,0)*ease(p),packet={x:x1,y:y1};
  for(const segment of segments){
    if(distance<=segment.length){const t=segment.length?distance/segment.length:0;packet={x:mix(segment.start.x,segment.end.x,t),y:mix(segment.start.y,segment.end.y,t)};break;}
    distance-=segment.length;packet=segment.end;
  }
  const w=Math.min(Math.max(90,glyphWidth(label)*size+28),Math.abs(x2-x1)>140?Math.abs(x2-x1)-32:360);
  return <g opacity={opacity}>
    {ghost&&<path d={d} fill="none" stroke={C.line} strokeWidth="2" strokeDasharray="7 9"/>}
    <path d={d} fill="none" stroke={color} strokeWidth="3" pathLength="1" strokeDasharray="1" strokeDashoffset={1-ease(p)} opacity={p>0?1:0}/>
    <path d="M-11-7L0 0L-11 7" transform={'translate('+x2+' '+y2+') rotate('+angle+')'} fill="none" stroke={p>.97?color:C.line} strokeWidth="3"/>
    {label&&<g opacity={p>.01?1:.38}>
      <rect x={labelX-w/2} y={labelY-size-9} width={w} height={size+14} rx="8" fill={C.card}/>
      <Text x={labelX} y={labelY-8} width={Math.max(w-16,40)} text={label} size={size} color={p>.01?color:C.muted} anchor="middle" maxLines={1}/>
    </g>}
    {p>0&&p<1&&<g>
      <circle cx={packet.x} cy={packet.y} r="12" fill={color} opacity=".18"/>
      <circle cx={packet.x} cy={packet.y} r="5" fill="#fff"/>
    </g>}
  </g>;
}

export function EmptyScene({width,height,text}) {
  return <Panel width={width} height={height}><Text x={40} y={80} width={width-80} text={text} size={32}/></Panel>;
}
