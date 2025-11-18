import type { NextConfig } from "next";

const remotePatterns: NextConfig['images']['remotePatterns'] = [
  {
    protocol: 'https',
    hostname: 'lh3.googleusercontent.com',
    pathname: '/aida-public/**',
  },
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (supabaseUrl) {
  try {
    const url = new URL(supabaseUrl);
    remotePatterns.push({
      protocol: url.protocol.replace(':', '') || 'https',
      hostname: url.hostname,
      pathname: '/storage/v1/object/public/**',
    });
  } catch (error) {
    console.warn('[next.config] NEXT_PUBLIC_SUPABASE_URL inválida:', error);
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
  webpack: (config) => {
    if (process.env.NODE_ENV === "development") {
      config.module.rules.push({
        test: /\.(jsx|tsx)$/,
        exclude: /node_modules/,
        enforce: "pre",
        use: "@dyad-sh/nextjs-webpack-component-tagger",
      });
    }
    return config;
  },
};

export default nextConfig;
