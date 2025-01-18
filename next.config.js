/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/pdf-downloader',
  assetPrefix: '/pdf-downloader',
}

module.exports = nextConfig
