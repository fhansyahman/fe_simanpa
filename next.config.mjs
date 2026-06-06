/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['sikopnas.web.id', '192.168.18.19', 'localhost'],
  
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://sikopnas.web.id/api/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: 'https://sikopnas.web.id/uploads/:path*',
      },
    ];
  },
  
  // ✅ TAMBAHKAN: Increase body size limit untuk proxy
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Naikkan jadi 10MB atau sesuai kebutuhan
    },
    responseLimit: '10mb',
  },
  
  // ✅ TAMBAHKAN: Configure server runtime options
  serverRuntimeConfig: {
    maxBodySize: '10mb',
  },
  
  reactCompiler: true,
};

export default nextConfig;