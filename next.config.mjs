/** @type {import('next').NextConfig} */
const nextConfig = {
  // Base path if needed
  // basePath: '/your-subpath',

  // Expose environment variables (make sure these are set in your .env.local)
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL, // e.g., "http://localhost:3000" for local dev
    CUSTOM_API_ENDPOINT: process.env.CUSTOM_API_ENDPOINT || 'https://default-api.example.com',
  },

  // Setting up redirects
  async redirects() {
    return [
      {
        source: '/old-path',
        destination: '/new-path',
        permanent: true,
      },
    ];
  },

  // Remove or adjust rewrites to avoid proxying local API routes
  async rewrites() {
    // If you don't need to proxy any routes, simply return an empty array.
    // Otherwise, ensure that your API routes (like /api/auth) are not rewritten.
    return [];
  },

  // Configuring image domains
  images: {
    domains: ['example.com'], // Update with the domains you plan to use
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/api/images/**',
      },
    ],
  },

  // Internationalization configuration
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
  },

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

  transpilePackages: ['google-auth-library'],
};

export default nextConfig;
