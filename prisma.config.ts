// prisma.config.ts
import path from 'node:path';
import { config as dotenvConfig } from 'dotenv';

// Carregar variáveis de ambiente do .env.local (que tem DATABASE_URL)
dotenvConfig({ path: '.env.local' });

/**
 * Configuração do Prisma
 */
const config = {
  schema: path.join('prisma', 'schema.prisma'),
};

export default config;