import {createMDX} from 'fumadocs-mdx/next';
import {pagesBasePath} from './site.config.mjs';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: 'export',
  images: {unoptimized: true},
  ...(pagesBasePath ? {basePath: pagesBasePath, assetPrefix: pagesBasePath} : {}),
};

export default withMDX(config);
