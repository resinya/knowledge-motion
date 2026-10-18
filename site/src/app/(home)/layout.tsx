import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import { gitConfig } from '@/lib/shared';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <HomeLayout {...baseOptions()}>
      {children}
      <footer className="site-footer"><span>用动态过程，讲清楚知识。</span><a href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}>开源仓库 ↗</a></footer>
    </HomeLayout>
  );
}
