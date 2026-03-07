import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // En Docker la red interna resuelve 'backend', localmente 'localhost'
        destination: process.env.NODE_ENV === 'development'
          ? 'http://localhost:3001/api/:path*'
          : 'http://backend:3001/api/:path*',
      },
    ];
  },
};

export default nextConfig;
