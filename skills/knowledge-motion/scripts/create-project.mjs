#!/usr/bin/env node
import {readFileSync,writeFileSync,mkdirSync,cpSync,existsSync,realpathSync} from 'node:fs';
import {resolve,dirname,relative,isAbsolute,join,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {normalizeProject,knowledgeMarkdown,storyboardMarkdown} from '../assets/template/src/story.mjs';
import {readCustomManifest,customRegistry} from '../assets/template/scripts/custom-scenes.mjs';
const skillRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const usage='node scripts/create-project.mjs --knowledge <knowledge.json> --story <story.json> [--project-root <project>] [--out <relative-output-dir>]';
const isInside=(parent,child)=>{const r=relative(parent,child);return r===''||(!r.startsWith('..')&&!isAbsolute(r));};
export function createProject({knowledgeFile,storyFile,projectRoot=process.cwd(),output}={}) {
  if(!knowledgeFile||!storyFile)throw new Error('必须同时提供 --knowledge 与 --story。'+usage);
  const root=realpathSync(resolve(projectRoot)), inputPath=resolve(storyFile);
  const {knowledge,story}=normalizeProject(JSON.parse(readFileSync(resolve(knowledgeFile),'utf8')),JSON.parse(readFileSync(inputPath,'utf8')));
  const sceneDirectory=join(dirname(inputPath),'scenes'), manifest=readCustomManifest(story,sceneDirectory);
  const slug=basename(dirname(inputPath))==='examples'?basename(inputPath,'.json'):basename(dirname(inputPath));
  const name=slug.replace(/[^\p{L}\p{N}-]/gu,'-').slice(0,60)||'video';
  const target=resolve(root,output??join('out','knowledge-motion',name));
  if(target===root||!isInside(root,target))throw new Error('输出目录必须在调用项目内，且不能是项目根目录');
  if(isInside(skillRoot,target))throw new Error('生成内容不能写入 Skill 目录');
  if(existsSync(target))throw new Error('输出目录已存在，请选择新目录：'+target);
  let ancestor=dirname(target);while(!existsSync(ancestor))ancestor=dirname(ancestor);
  if(!isInside(root,realpathSync(ancestor))||isInside(realpathSync(skillRoot),realpathSync(ancestor)))throw new Error('输出目录的真实路径必须留在调用项目内，且不能通过链接写回 Skill');
  mkdirSync(dirname(target),{recursive:true});
  cpSync(join(skillRoot,'assets/template'),target,{recursive:true,errorOnExist:true,force:false,filter:source=>!['node_modules','.cache'].includes(basename(source))});
  if(manifest.length){cpSync(sceneDirectory,join(target,'src/custom'),{recursive:true,errorOnExist:true,force:false});writeFileSync(join(target,'src/custom-scenes.jsx'),customRegistry(manifest));}
  writeFileSync(join(target,'knowledge.json'),JSON.stringify(knowledge,null,2)+'\n');
  writeFileSync(join(target,'knowledge.md'),knowledgeMarkdown(knowledge));
  writeFileSync(join(target,'story.json'),JSON.stringify(story,null,2)+'\n');
  writeFileSync(join(target,'storyboard.md'),storyboardMarkdown(story,knowledge));
  return target;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const args=process.argv.slice(2),options={};
    if(args.length===1&&args[0]==='--help'){console.log(usage);process.exit(0);}
    for(let i=0;i<args.length;i+=2){
      const key={'--knowledge':'knowledgeFile','--story':'storyFile','--project-root':'projectRoot','--out':'output'}[args[i]];
      if(!key||!args[i+1]||args[i+1].startsWith('--')||options[key])throw new Error(usage);
      options[key]=args[i+1];
    }
    console.log('源项目已创建：'+createProject(options)+'\n进入该目录，运行 npm ci、npm run check、npm run preview、npm run render。');
  } catch(error){console.error(error.message);process.exitCode=1;}
}
