/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // We will use standard img tags or dynamic proxying
  },
};

export default nextConfig;
