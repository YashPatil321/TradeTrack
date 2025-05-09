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
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/api/images/**',
      },
      {
        protocol: 'https',
        hostname: '*.vercel.app',
        pathname: '/api/images/**',
      }
    ],
    domains: ['images.unsplash.com'],
  },

  // Internationalization configuration
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
  },

  // Webpack configuration for client-side
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

  // Required packages for transpilation
  transpilePackages: ['google-auth-library'],

  // Enable strict mode for better development experience
  reactStrictMode: true,

  // Configure build output
  output: 'standalone',

  // Configure which routes should be static
  staticPageGenerationTimeout: 120,

  // Skip API routes during build
  skipTrailingSlashRedirect: true,

  skipMiddlewareUrlNormalize: true,
};

export default nextConfig;
