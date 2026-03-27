/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    reactStrictMode: true,
    poweredByHeader: false,

    // Disable image optimization for simpler deployment
    images: {
        unoptimized: true,
    },
};

export default nextConfig;
