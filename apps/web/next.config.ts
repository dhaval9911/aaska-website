import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@aaska/ui', '@aaska/config'],
};

export default nextConfig;
