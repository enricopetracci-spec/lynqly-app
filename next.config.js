/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'lynqly.app'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
}

module.exports = nextConfig
