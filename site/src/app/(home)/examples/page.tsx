import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Download } from 'lucide-react';
import { examples } from '@/lib/examples';
import { assetUrl, docsRoute } from '@/lib/shared';

export const metadata: Metadata = {
  title: '效果案例',
  description: '播放网络端口、网购订单与家庭收支三个真实渲染案例，查看分类、流程与状态变化的动态效果。',
};

export default function ExamplesPage() {
  return (
    <div className="site-page examples-page">
      <header className="page-heading">
        <h1>效果案例</h1>
        <p>三种知识结构，三种动画表达。点击播放，看看变化如何发生。</p>
      </header>
      <div className="examples-info">每条 20 秒<span aria-hidden="true">·</span>竖屏高清<span aria-hidden="true">·</span>无音轨</div>
      <div className="examples-grid">
        {examples.map((example) => (
          <article id={example.id} key={example.id} className="example" aria-labelledby={`${example.id}-title`}>
            <video controls muted playsInline preload="metadata" poster={assetUrl(example.poster)} width={1080} height={1920} aria-label={`播放${example.title}，20 秒静音视频`}>
              <source src={assetUrl(example.video)} type="video/mp4" />
              你的浏览器不支持在线播放，请使用下方链接下载视频。
            </video>
            <div className="example-label">{example.category}</div>
            <h2 id={`${example.id}-title`}>{example.title}</h2>
            <p>{example.description}</p>
            <a className="text-link example-download" href={assetUrl(example.video)} download={`${example.title}.mp4`}><Download size={14} aria-hidden="true" />下载视频</a>
          </article>
        ))}
      </div>
      <div className="examples-next"><p>把你的主题，也做成这样的动态过程。</p><Link href={`${docsRoute}/guide`} className="text-link">制作第一条视频 <ArrowRight size={16} aria-hidden="true" /></Link></div>
    </div>
  );
}
