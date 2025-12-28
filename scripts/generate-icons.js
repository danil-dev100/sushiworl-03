/**
 * Script para gerar ícones do PWA a partir da logo
 * Requer: sharp (npm install sharp --save-dev)
 *
 * Uso: node scripts/generate-icons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const LOGO_PATH = path.join(__dirname, '../public/logo.webp/logo-nova-sushiworl-santa-iria-sem-fundo.webp');
const OUTPUT_DIR = path.join(__dirname, '../public');

const ICON_SIZES = [
  { size: 192, name: 'icon-192.png', background: '#FF6B00' },
  { size: 512, name: 'icon-512.png', background: '#FF6B00' },
  { size: 180, name: 'apple-touch-icon.png', background: '#FF6B00' },
  { size: 32, name: 'favicon-32x32.png', background: '#FF6B00' },
  { size: 16, name: 'favicon-16x16.png', background: '#FF6B00' },
];

async function generateIcons() {
  try {
    console.log('📱 Gerando ícones do PWA...\n');

    // Verificar se a logo existe
    if (!fs.existsSync(LOGO_PATH)) {
      console.error(`❌ Logo não encontrada em: ${LOGO_PATH}`);
      process.exit(1);
    }

    for (const icon of ICON_SIZES) {
      const outputPath = path.join(OUTPUT_DIR, icon.name);

      await sharp(LOGO_PATH)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: icon.background
        })
        .png()
        .toFile(outputPath);

      console.log(`✅ ${icon.name} (${icon.size}x${icon.size}) gerado`);
    }

    console.log('\n🎉 Todos os ícones foram gerados com sucesso!');
    console.log(`📂 Localização: ${OUTPUT_DIR}`);

  } catch (error) {
    console.error('❌ Erro ao gerar ícones:', error);
    process.exit(1);
  }
}

generateIcons();
