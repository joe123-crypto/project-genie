/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        loader: 'custom',
        loaderFile: './loader.js',
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'pub-834238b2621b47418e041ed28b117c2f.r2.dev',
                port: '',
                pathname: '/**',
            },
        ],
    },
};

export default nextConfig;
