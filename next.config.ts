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
  experimental: {
    // Ativar esbuild para melhor performance
    esbuild: {
      // Configurações adicionais do esbuild podem ser adicionadas aqui
    },
  },
  // Configurações adicionais do esbuild para desenvolvimento
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Configurações específicas do esbuild para desenvolvimento
      config.optimization = {
        ...config.optimization,
        minimize: false, // Desabilitar minificação em dev para melhor debugging
      };
    }
    return config;
  },
};

export default nextConfig;
