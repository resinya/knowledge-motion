import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';
import { appName, assetUrl, changelogRoute, docsRoute, examplesRoute, gitConfig } from './shared';

export function baseOptions(options: { docs?: boolean } = {}): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="site-brand">
          <Image
            src={assetUrl('/brand/knowledge-motion-logo.png')}
            alt=""
            width={1254}
            height={1254}
            className="size-9 shrink-0 object-contain"
          />
          <span>{appName}</span>
        </span>
      ),
    },
    links: [
      { text: '使用指南', url: docsRoute, active: 'nested-url' },
      { text: '效果案例', url: examplesRoute, active: 'nested-url' },
      { text: '版本更新', url: changelogRoute, active: 'nested-url' },
    ],
    searchToggle: { enabled: options.docs === true },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
