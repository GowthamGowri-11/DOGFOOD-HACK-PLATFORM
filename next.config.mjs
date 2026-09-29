/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  output: 'standalone',
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: ['ws', 'bufferutil', 'utf-8-validate', 'bcryptjs'],
    optimizePackageImports: ['lucide-react', 'clsx', 'tailwind-merge', 'zod', 'lottie-react'],
  },
};

export default nextConfig;
