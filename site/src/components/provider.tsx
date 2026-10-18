'use client';

import { RootProvider } from 'fumadocs-ui/provider/next';
import type { ReactNode } from 'react';
import SearchDialog from './search';

// Fumadocs 的翻译键包含使用场景，避免同一词在不同控件中产生歧义。
const translations = {
  'Search(search trigger)': '搜索文档',
  'Search(search dialog)': '搜索文档',
  'Open Search(search trigger)(aria-label)': '搜索文档',
  'Close Search(search dialog)(aria-label)': '关闭搜索',
  'No results found(search dialog)': '未找到相关内容',
  'On this page(table of contents)': '本页目录',
  'No Headings(table of contents)': '暂无目录',
  'Previous Page(pagination)': '上一页',
  'Next Page(pagination)': '下一页',
  'Toggle Menu(home layout header)(aria-label)': '展开导航',
  'Open Sidebar(aria-label)': '展开目录',
  'Open Sidebar(sidebar)(aria-label)': '展开目录',
  'Close Sidebar(aria-label)': '关闭目录',
  'Close Sidebar(sidebar)(aria-label)': '关闭目录',
  'Collapse Sidebar(sidebar)(aria-label)': '收起目录',
  'Toggle Theme(theme switcher)(aria-label)': '切换主题',
  'Light(theme switcher)(aria-label)': '浅色',
  'Dark(theme switcher)(aria-label)': '深色',
  'System(theme switcher)(aria-label)': '跟随系统',
  'Copy Text(code block)(aria-label)': '复制代码',
  'Copied Text(code block)(aria-label)': '已复制',
  'Copy Anchor Link(heading anchor)(aria-label)': '复制标题链接',
  'Copied Anchor Link(heading anchor)(aria-label)': '已复制链接',
};

/**
 * RootProvider 要接一个函数组件（SearchDialog），而 app/layout.tsx 是服务端组件，
 * 不能直接传函数进客户端边界，所以单独拆一层客户端 Provider 出来。
 */
export function Provider({ children, searchIndexUrl }: { children: ReactNode; searchIndexUrl: string }) {
  return (
    <RootProvider
      search={{ SearchDialog, options: { api: searchIndexUrl } }}
      theme={{ defaultTheme: 'light' }}
      i18n={{ translations }}
    >{children}</RootProvider>
  );
}
