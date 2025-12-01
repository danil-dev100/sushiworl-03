import type { NextConfig } from "next";

type RemotePattern = {
  protocol: 'https' | 'http';
  hostname: string;
  pathname: string;
};

const remotePatterns: RemotePattern[] = [
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
    const protocol = url.protocol.replace(':', '');
    remotePatterns.push({
      protocol: (protocol === 'http' || protocol === 'https') ? protocol : 'https',
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
  // Externalizar jsdom e DOMPurify para evitar erros de file system no build
  serverExternalPackages: ['jsdom', 'isomorphic-dompurify'],
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
