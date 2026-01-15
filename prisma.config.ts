// prisma.config.ts
import path from 'node:path';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente do .env
dotenv.config();

/**
 * Configuração do Prisma
 * Nota: Prisma carrega .env e .env.local automaticamente
 */
const config = {
  schema: path.join('prisma', 'schema.prisma'),
};

export default config;