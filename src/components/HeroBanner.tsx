import Image from 'next/image';
import { prisma } from '@/lib/db';

type HomeHeroConfig = {
  imageUrl: string;
  overlayColor: string;
  overlayOpacity: number;
  headline: string;
  headlineColor: string;
  headlineSize: number;
  bannerHeight: number;
};

const DEFAULT_HERO: HomeHeroConfig = {
  imageUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBNzMX6lMna6nX8TjJy5jY_Kv-JczpymR3HD2gGTMwfjEinIlR9ziFO_zQV8AKcSbYx7BEsgrBWBOob-nNOaeEvjrEm8TeNmtAA6oPavzl-eLCGbkwcG_4lWfdccNsy0jWWql6Dj1lU-q9Jxwc2RN0B4GkYX93CFfR-YK7uWhLBAASkyFwY5K3FR_0bx5w_AcA95n3eywQvECREh3WvaQEj1-KUh7BC_f8z0zde_LUz5k83DP9ryssaU6GFpGrZLUcnYnhKfENfyDc',
  overlayColor: '#000000',
  overlayOpacity: 0.4,
  headline: 'SushiWorld: O Sabor do Japão na Sua Casa',
  headlineColor: '#FFFFFF',
  headlineSize: 4.5,
  bannerHeight: 60,
};

function hexToRgba(hex: string, alpha: number) {
  let sanitized = hex.replace('#', '');
  if (sanitized.length === 3) {
    sanitized = sanitized
      .split('')
      .map((char) => char + char)
      .join('');
  }
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function parseHeroConfig(settings: any): HomeHeroConfig {
  const bannersRaw = settings?.banners;
  let banners = {};
  if (bannersRaw && typeof bannersRaw === 'object' && !Array.isArray(bannersRaw)) {
    banners = bannersRaw;
  }

  const home = (banners as Record<string, any>)?.home ?? {};

  return {
    imageUrl:
      typeof home.imageUrl === 'string' && home.imageUrl.trim().length > 0
        ? home.imageUrl
        : DEFAULT_HERO.imageUrl,
    overlayColor:
      typeof home.overlayColor === 'string' && home.overlayColor.trim().length > 0
        ? home.overlayColor
        : DEFAULT_HERO.overlayColor,
    overlayOpacity:
      typeof home.overlayOpacity === 'number'
        ? Math.min(Math.max(home.overlayOpacity, 0), 1)
        : DEFAULT_HERO.overlayOpacity,
    headline:
      typeof home.headline === 'string' && home.headline.trim().length > 0
        ? home.headline
        : DEFAULT_HERO.headline,
    headlineColor:
      typeof home.headlineColor === 'string'
        ? home.headlineColor
        : DEFAULT_HERO.headlineColor,
    headlineSize:
      typeof home.headlineSize === 'number' ? home.headlineSize : DEFAULT_HERO.headlineSize,
    bannerHeight:
      typeof home.bannerHeight === 'number' ? home.bannerHeight : DEFAULT_HERO.bannerHeight,
  };
}

export default async function HeroBanner() {
  const settings = await prisma.settings.findFirst();
  const hero = parseHeroConfig(settings);

  return (
    <section
      className="relative flex w-full flex-col items-center justify-center overflow-hidden bg-cover bg-center"
      style={{ minHeight: `${hero.bannerHeight}vh` }}
    >
      {hero.imageUrl && (
        <Image
          src={hero.imageUrl}
          alt={hero.headline}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      )}
      <div
        className="absolute inset-0 transition-colors"
        style={{ background: hexToRgba(hero.overlayColor, hero.overlayOpacity) }}
      />
      <div className="relative z-10 px-6 text-center">
        <h1
          className="font-extrabold tracking-tight"
          style={{
            color: hero.headlineColor,
            fontSize: `${hero.headlineSize}rem`,
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          {hero.headline}
        </h1>
      </div>
    </section>
  );
}
