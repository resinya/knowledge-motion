import React from 'react';
import {Composition, registerRoot} from 'remotion';
import rawStory from '../story.json';
import {normalizeStory} from './story.mjs';
import {Scene} from './Scene.jsx';

const story = normalizeStory(rawStory);
function Root() {
  return <Composition id="KnowledgeMotion" component={Scene} width={story.width} height={story.height} fps={story.fps} durationInFrames={Math.round(story.duration * story.fps)} defaultProps={{story}} calculateMetadata={({props}) => {
    const next = normalizeStory(props.story);
    return {width: next.width, height: next.height, fps: next.fps, durationInFrames: Math.round(next.duration * next.fps), props: {story: next}};
  }}/>;
}
registerRoot(Root);
