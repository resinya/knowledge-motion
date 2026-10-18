'use client';

import { useStaticSearch } from 'fumadocs-core/search/client';
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  type SharedProps,
} from 'fumadocs-ui/components/dialog/search';

/**
 * 静态导出版的搜索弹窗。
 *
 * 与脚手架默认的区别只有一行：useFetchSearch → useStaticSearch。
 * 前者每次输入都去打 /api/search（需要服务端），后者构建期就把索引下载好，
 * 在浏览器里算——这正是 Pages 能跑起来的前提。
 */
export default function StaticSearchDialog({ api, ...props }: SharedProps & { api?: string }) {
  const search = useStaticSearch({ from: api });

  return (
    <SearchDialog {...search} {...props}>
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        {search.error ? <p role="status" className="p-6 text-sm text-fd-muted-foreground">搜索暂时不可用，请稍后重试。</p> : <SearchDialogList />}
      </SearchDialogContent>
    </SearchDialog>
  );
}
