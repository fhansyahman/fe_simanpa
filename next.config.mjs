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
  
  api: {
    bodyParser: {
      sizeLimit: '10mb', 
    },
    responseLimit: '10mb',
  },
  

  serverRuntimeConfig: {
    maxBodySize: '10mb',
  },
  
  reactCompiler: true,
};

export default nextConfig;