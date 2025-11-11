// prisma.config.ts
import path from 'node:path';
import dotenv from 'dotenv';

/**
 * Configuração moderna do Prisma com loading de .env
 */
dotenv.config({ path: '.env.local' }); // Carrega envs antes de tudo

const config = {
  schema: path.join('prisma', 'schema.prisma'),
  // Prisma agora vê DATABASE_URL e DIRECT_URL
};

export default config;