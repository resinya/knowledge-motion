import {spawnSync} from 'node:child_process';
import {readFileSync, writeFileSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {normalizeProject} from '../src/story.mjs';

export function verifyMetadata(metadata, story) {
  const streams = metadata.streams ?? [], videos = streams.filter((s) => s.codec_type === 'video'), audio = streams.filter((s) => s.codec_type === 'audio');
  const errors = [], video = videos[0];
  if (videos.length !== 1) errors.push('必须只有一个视频流');
  if (audio.length) errors.push('视频包含音轨');
  if (video) {
    if (video.codec_name !== 'h264') errors.push('视频编码应为 H.264');
    if (video.pix_fmt !== 'yuv420p') errors.push('像素格式应为 yuv420p');
    if (video.width !== story.width || video.height !== story.height) errors.push('尺寸与分镜不一致');
    const [a, b] = (video.avg_frame_rate ?? '').split('/').map(Number), fps = a / b;
    if (!Number.isFinite(fps) || Math.abs(fps - story.fps) > 0.001) errors.push('帧率与分镜不一致');
    const duration = Number(video.duration ?? metadata.format?.duration);
    if (!Number.isFinite(duration) || Math.abs(duration - story.duration) > 1 / story.fps + 0.005) errors.push('时长与分镜不一致');
    if (Number(video.nb_frames) !== Math.round(story.duration * story.fps)) errors.push('帧数与分镜不一致');
  }
  return {passed: errors.length === 0, errors, expected: {width: story.width, height: story.height, fps: story.fps, duration: story.duration, frames: Math.round(story.duration * story.fps), audioStreams: 0}, actual: {videoStreams: videos.length, audioStreams: audio.length, codec: video?.codec_name, pixelFormat: video?.pix_fmt, width: video?.width, height: video?.height, frameRate: video?.avg_frame_rate, duration: video?.duration ?? metadata.format?.duration, frames: video?.nb_frames}};
}

export function verifyVideo(videoFile, story, reportPath = resolve(dirname(videoFile), 'verification.json')) {
  const result = spawnSync(process.env.FFPROBE_PATH || 'ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', resolve(videoFile)], {encoding: 'utf8', windowsHide: true, maxBuffer: 4 * 1024 * 1024});
  if (result.error) throw new Error(`无法运行 FFprobe；请安装并加入 PATH，或设置 FFPROBE_PATH。${result.error.message}`);
  if (result.status !== 0) throw new Error(`FFprobe 核验失败：${result.stderr.trim()}`);
  const report = verifyMetadata(JSON.parse(result.stdout), story);
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  if (!report.passed) throw new Error(`媒体核验未通过：${report.errors.join('；')}`);
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const videoFile = resolve(process.argv[2] ?? 'video.mp4');
    const {story} = normalizeProject(JSON.parse(readFileSync(resolve(process.argv[4] ?? 'knowledge.json'), 'utf8')), JSON.parse(readFileSync(resolve(process.argv[3] ?? 'story.json'), 'utf8')));
    console.log(JSON.stringify(verifyVideo(videoFile, story), null, 2));
  } catch (error) {console.error(error.message); process.exitCode = 1;}
}
