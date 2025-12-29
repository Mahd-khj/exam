import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // External packages for server-side (prevents bundling)
  serverExternalPackages: ['sequelize', 'mysql2', 'pg', 'pg-hstore'],
  
  // Turbopack configuration (Next.js 16 uses Turbopack by default)
  turbopack: {},
  
  // Keep webpack config for backward compatibility (will be ignored if using Turbopack)
  webpack: (config, { isServer }) => {
    // Ignore pg-hstore and pg since we're using MySQL, not PostgreSQL
    config.resolve.alias = {
      ...config.resolve.alias,
      'pg-hstore': false,
      'pg': false,
    };
    
    if (isServer) {
      // For server-side, ignore PostgreSQL dependencies
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('pg-hstore');
        config.externals.push('pg');
      } else if (typeof config.externals === 'function') {
        const originalExternals = config.externals;
        config.externals = [
          originalExternals,
          ({ request }: any) => {
            if (request === 'pg-hstore' || request === 'pg') {
              return true;
            }
          },
        ];
      }
    }
    
    return config;
  },
};

export default nextConfig;
