import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { examples } from '@/lib/examples';
import { assetUrl, docsRoute, examplesRoute, siteDescription } from '@/lib/shared';

export const metadata: Metadata = { title: '首页', description: siteDescription };

export default function HomePage() {
  return (
    <div className="site-page home-page">
      <header className="home-hero">
        <p className="eyebrow">知识动态信息图</p>
        <h1>让知识，<span>动起来。</span></h1>
        <p className="hero-description">先组织知识，再用动态过程讲清内部机制。<br className="max-sm:hidden" />输入主题，获得知识结构、静音视频、源码与分镜。</p>
        <div className="hero-actions">
          <Link href={`${docsRoute}/guide`} className="button-primary">开始制作 <ArrowRight size={16} aria-hidden="true" /></Link>
          <Link href={examplesRoute} className="button-secondary">查看效果案例</Link>
        </div>
      </header>

      <section aria-label="三种知识动画效果" className="home-showcase">
        {examples.map((example) => (
          <Link href={`${examplesRoute}#${example.id}`} key={example.id} className="showcase-item">
            <Image src={assetUrl(example.poster)} alt={`${example.title}的实际渲染画面`} width={1080} height={1920} className="showcase-poster" />
            <span className="showcase-caption"><span>{example.category}</span><ArrowRight size={15} aria-hidden="true" /></span>
          </Link>
        ))}
      </section>

      <section className="home-principles" aria-labelledby="principles-title">
        <h2 id="principles-title" className="section-title">全貌始终可见，变化一步看懂。</h2>
        <div className="principles-grid">
          <div><h3>保留全貌</h3><p>总览导航保留知识结构，随时知道当前讲到哪里。</p></div>
          <div><h3>逐步聚焦</h3><p>展开必要内部过程，用合适场景说明动作、原因和结果。</p></div>
          <div><h3>交付完整</h3><p>知识结构、静音成片、分镜与源码一起保留，方便继续修改。</p></div>
        </div>
      </section>

      <section className="home-start" aria-labelledby="start-title">
        <div><h2 id="start-title" className="section-title">从一个主题开始</h2><p>安装后，在对话中调用 <code>$knowledge-motion</code>。</p></div>
        <div className="install-command"><pre><code>npx skills add resinya/knowledge-motion --global --skill knowledge-motion --copy</code></pre><Link href={`${docsRoute}/guide`}>安装与使用 <ArrowRight size={14} aria-hidden="true" /></Link></div>
      </section>
    </div>
  );
}
