import type { Metadata } from 'next';
import './global.css';
import { Provider } from '@/components/provider';
import { assetUrl, siteDescription, siteTitle, siteUrl } from '@/lib/shared';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: `%s | ${siteTitle}`,
  },
  description: siteDescription,
  icons: {
    icon: assetUrl('/brand/knowledge-motion-logo.png'),
    apple: assetUrl('/brand/knowledge-motion-logo.png'),
  },
};

/**
 * 这里刻意没用 next/font/google —— 它会在**构建期**去 Google Fonts 下载字体，
 * CI 或国内网络访问不到时会直接让构建失败。中文文档站用系统字体栈完全够，
 * 省掉一个不稳定的外部依赖。
 */
export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Provider searchIndexUrl={assetUrl('/api/search')}>{children}</Provider>
      </body>
    </html>
  );
}
