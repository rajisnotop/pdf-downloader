/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    optimizeCss: true,
  },
}

// Handle GitHub Pages deployment
const isGithubActions = process.env.GITHUB_ACTIONS || false

if (isGithubActions) {
  const repo = process.env.GITHUB_REPOSITORY.replace(/.*?\//, '')
  nextConfig.basePath = `/${repo}`
  nextConfig.assetPrefix = `/${repo}/`
}

module.exports = nextConfig
