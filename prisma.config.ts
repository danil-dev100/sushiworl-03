// prisma.config.ts
import path from 'node:path';

/**
 * Configuração do Prisma
 * Nota: Prisma carrega .env nativamente, não precisa de dotenv
 */
const config = {
  schema: path.join('prisma', 'schema.prisma'),
};

export default config;