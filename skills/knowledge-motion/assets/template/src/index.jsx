import React from 'react';
import {Composition,registerRoot} from 'remotion';
import rawStory from '../story.json';
import rawKnowledge from '../knowledge.json';
import {normalizeProject} from './story.mjs';
import {Scene} from './Scene.jsx';
const project=normalizeProject(rawKnowledge,rawStory);
function Root() {
  return <Composition id="KnowledgeMotion" component={Scene} width={project.story.width} height={project.story.height} fps={project.story.fps} durationInFrames={project.story.totalFrames} defaultProps={project} calculateMetadata={({props})=>{
    const next=normalizeProject(props.knowledge,props.story);
    return {width:next.story.width,height:next.story.height,fps:next.story.fps,durationInFrames:next.story.totalFrames,props:next};
  }}/>;
}
registerRoot(Root);
