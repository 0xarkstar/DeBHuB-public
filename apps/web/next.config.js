/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Fix for WalletConnect and other browser-only dependencies
    if (isServer) {
      // Mock indexedDB and other browser globals on server
      config.resolve.alias = {
        ...config.resolve.alias,
        'idb-keyval': false,
        '@react-native-async-storage/async-storage': false,
        'pino-pretty': false,
      };
    }

    // Ignore optional dependencies warnings
    config.ignoreWarnings = [
      { module: /node_modules\/@metamask\/sdk/ },
      { module: /node_modules\/pino/ },
      { module: /node_modules\/@walletconnect/ },
      /Can't resolve 'pino-pretty'/,
      /Can't resolve '@react-native-async-storage\/async-storage'/,
    ];

    return config;
  },
}

module.exports = nextConfig