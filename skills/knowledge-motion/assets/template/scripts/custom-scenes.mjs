import {existsSync,readFileSync,readdirSync,lstatSync,realpathSync} from 'node:fs';
import {join,resolve,relative,isAbsolute} from 'node:path';
export function readCustomManifest(story,directory) {
  const required=[...new Set(story.scenes.filter(s=>s.type==='custom').map(s=>s.custom))];
  if(!existsSync(directory)){
    if(required.length)throw new Error('自定义场景缺少 scenes/manifest.json 与组件源码：'+required.join(', '));
    return [];
  }
  if(lstatSync(directory).isSymbolicLink())throw new Error('自定义场景源目录不能是符号链接');
  const root=realpathSync(directory), manifest=JSON.parse(readFileSync(join(root,'manifest.json'),'utf8'));
  if(!Array.isArray(manifest))throw new Error('自定义场景 manifest 必须是 {id,file} 数组');
  const ids=new Set();
  for(const entry of manifest){
    if(!entry||!/^[a-z][a-z0-9-]*$/.test(entry.id)||ids.has(entry.id)||typeof entry.file!=='string'||!/^[a-zA-Z0-9_-]+\.jsx$/.test(entry.file))throw new Error('自定义场景 id/file 无效或重复；组件须位于 scenes 目录顶层');
    ids.add(entry.id);
    if(!existsSync(join(root,entry.file)))throw new Error('自定义场景组件缺失：'+entry.file);
  }
  for(const id of required)if(!ids.has(id))throw new Error('自定义场景未注册：'+id);
  const visit=(dir)=>{
    for(const name of readdirSync(dir)){
      const path=join(dir,name),stat=lstatSync(path);
      if(stat.isSymbolicLink())throw new Error('自定义场景源目录不能包含符号链接');
      const rel=relative(root,realpathSync(path));
      if(rel.startsWith('..')||isAbsolute(rel))throw new Error('自定义场景路径越界');
      if(['node_modules','.cache','.git'].includes(name))throw new Error('自定义场景源目录不能包含依赖或缓存');
      if(stat.isDirectory())visit(path);
    }
  };
  visit(root);
  return manifest;
}
export function customRegistry(manifest) {
  return manifest.map((item,i)=>'import Scene'+i+' from '+JSON.stringify('./custom/'+item.file)+';').join('\n')+
    '\nexport const customScenes = {'+manifest.map((item,i)=>JSON.stringify(item.id)+':Scene'+i).join(',')+'};\n';
}
