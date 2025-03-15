/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Configure image domains
  images: { 
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
      },
    ],
    unoptimized: true
  },
  
  // Disable SWC minification to work with Babel
  swcMinify: false,
  
  // Transpile specific modules that need it
  transpilePackages: ['firebase', 'undici'],
  
  // Configure webpack to handle private class fields in undici and other issues
  webpack: (config, { isServer }) => {
    // Add a rule for handling private class fields in undici
    config.module.rules.push({
      test: /node_modules\/undici\/.*\.js$/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
          plugins: [
            '@babel/plugin-transform-private-methods',
            '@babel/plugin-transform-class-properties',
          ],
        },
      },
    });

    // Provide fallbacks for server-only Firebase functionality
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
      };
    }

    return config;
  }
};

module.exports = nextConfig;