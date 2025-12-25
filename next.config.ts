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
  // Externalizar jsdom, DOMPurify e Prisma para evitar erros de file system no build
  serverExternalPackages: ['jsdom', 'isomorphic-dompurify', '@prisma/client', 'prisma'],

  // ✅ HEADERS DE SEGURANÇA
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), payment=(self)'
          },
          // Content Security Policy (CSP)
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://wmuprrgmczfkihqvqrph.supabase.co wss://wmuprrgmczfkihqvqrph.supabase.co https://www.google-analytics.com https://www.facebook.com",
              "frame-src 'self' https://www.youtube.com https://www.facebook.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; ')
          }
        ],
      },
      // Headers específicos para rotas de API
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0'
          },
        ],
      },
    ];
  },
};

export default nextConfig;
