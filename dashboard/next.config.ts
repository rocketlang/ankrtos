import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: '/api/graphql', destination: 'http://localhost:4070/graphql' },
      { source: '/api/health', destination: 'http://localhost:4070/health' },
    ];
  },
};

export default nextConfig;
