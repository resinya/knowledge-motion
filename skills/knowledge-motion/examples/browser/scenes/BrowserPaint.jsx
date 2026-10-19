import React from 'react';
import {Text,Panel,C,Arrow} from '../visual.jsx';
import {mix,ease,clamp} from '../story.mjs';
export default function BrowserPaint({scene,width,height,actionProgress}) {
  const [layout,background,text,composite]=scene.actions.map(actionProgress);
  const portrait=width<1200,gap=28,leftW=portrait?width:width*.35;
  const leftH=portrait?410:height,rightX=portrait?0:leftW+gap,rightY=portrait?leftH+gap:0;
  const rightW=portrait?width:width-leftW-gap,rightH=portrait?height-leftH-gap:height;
  const stages=[['布局','坐标与尺寸',layout],['背景绘制','背景与边框',background],['文字绘制','Hello 字形像素',text],['合成呈现','组合已绘制内容',composite]];
  const viewportX=rightX+28,viewportY=rightY+90,viewportW=rightW-56,viewportH=Math.min(330,rightH-185);
  const scale=Math.min((viewportW-48)/568,(viewportH-40)/170),boxX=viewportX+24*scale,boxY=viewportY+24*scale;
  const boxW=520*scale,boxH=110*scale;
  return <g>
    <Panel width={leftW} height={leftH}>
      <Text x={28} y={49} width={leftW-56} text="同一个元素，逐步变成像素" size={29} weight={700}/>
      {stages.map(([label,description,p],i)=>{
        const y=90+i*(portrait?76:110),active=p>0&&p<1,color=p>=1?C.green:active?C.cyan:C.muted;
        return <g key={label}>
          <circle cx={45} cy={y+10} r={17} fill={C.bg} stroke={color}/>
          <Text x={45} y={y+18} width={34} text={String(i+1)} size={22} anchor="middle" color={color}/>
          <Text x={78} y={y+5} width={leftW-110} text={label} size={30} color={color} weight={650}/>
          <Text x={78} y={y+43} width={leftW-110} text={description} size={26} color={C.muted}/>
        </g>;
      })}
    </Panel>
    <Panel x={rightX} y={rightY} width={rightW} height={rightH}>
      <Text x={28} y={49} width={rightW-56} text="示例视口 · h1 元素" size={30} weight={700}/>
    </Panel>
    <rect x={viewportX} y={viewportY} width={viewportW} height={viewportH} rx={14} fill="#080f19" stroke={C.line}/>
    <g opacity={clamp(layout*2)}>
      <path d={'M'+boxX+' '+(boxY-13)+'V'+(boxY-25)+'H'+(boxX+boxW)+'V'+(boxY-13)} stroke={C.cyan} fill="none" strokeWidth={2}/>
      <Text x={boxX+boxW/2} y={boxY-32} width={300} text={Math.round(mix(0,520,ease(layout)))+' px'} size={25} color={C.cyan} anchor="middle"/>
      <rect x={boxX} y={boxY} width={boxW} height={boxH} rx={2} fill="none" stroke={C.cyan} strokeWidth={2} strokeDasharray={background<1?'9 7':undefined}/>
      <Text x={boxX+12} y={boxY+boxH+38} width={viewportW-44} text={'x=24 · y=24 · 520×110 CSS px'} size={25} color={C.cyan}/>
    </g>
    <rect x={boxX} y={boxY} width={boxW} height={boxH} fill="#17334e" stroke="#3a6485" opacity={background}/>
    <g transform={'translate(0 '+mix(-7,0,ease(composite))+')'}>
      <Text x={boxX+24*scale} y={boxY+66*scale} width={boxW-48*scale} text={scene.data.title} size={32*scale} color="#ffffff" opacity={text} weight={700}/>
    </g>
    <Text x={rightX+30} y={rightY+rightH-78} width={rightW-60} text={composite>=1?'内容已可见；不等于所有交互就绪':text>=1?'文字与背景已经绘制，准备呈现':background>=1?'已有背景，继续生成文字像素':layout>=1?'已知几何信息，还没有完整画面':'布局计算确定位置和尺寸'} size={28} color={composite>=1?C.green:C.muted}/>
    <Text x={rightX+30} y={rightY+rightH-34} width={rightW-60} text="合成是概念示意，不断言此元素拥有独立 GPU 图层" size={23} color={C.muted}/>
  </g>;
}
