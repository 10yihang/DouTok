/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    // 配置在容器中运行时的主机名
    experimental: {
        outputFileTracingRoot: process.cwd(),
    },
    // 允许从任何主机名访问
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
