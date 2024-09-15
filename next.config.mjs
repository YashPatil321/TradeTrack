/** @type {import('next').NextConfig} */
const nextConfig = {
  // Example of setting a base path (if your app is hosted in a subpath)
  // basePath: '/your-subpath',

  // Example of adding environment variables
  env: {
    CUSTOM_API_ENDPOINT: process.env.CUSTOM_API_ENDPOINT || 'https://default-api.example.com',
  },

  // Example of setting up redirects
  async redirects() {
    return [
      {
        source: '/old-path',
        destination: '/new-path',
        permanent: true,
      },
    ];
  },

  // Example of setting up rewrites
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `https://external-api.example.com/:path*`,
      },
    ];
  },

  // Example of configuring image domains
  images: {
    domains: ['example.com'], // Replace with domains you want to allow
  },

  // Example of configuring internationalization (i18n)
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
  },

  // Add any other Next.js specific configurations here
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        net: false,
        tls: false,
        dns: false,
        fs: false,
        child_process: false,
      };
    }
    return config;
  },

  // Transpile specific packages
  transpilePackages: ['google-auth-library'],
};

export default nextConfig;
