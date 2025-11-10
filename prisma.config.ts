// prisma.config.ts
import path from 'node:path';

/**
 * Configuração moderna do Prisma (substitui a config depreciada do package.json)
 * 
 * POR QUÊ ESTE ARQUIVO?
 * - O Prisma está migrando de package.json para prisma.config.ts
 * - Permite configurações mais avançadas (paths customizados, etc)
 * - Evita warnings de deprecação
 */
const config = {
  // Caminho para o schema (relativo à raiz do projeto)
  schema: path.join('prisma', 'schema.prisma'),
  
  // Datasource: pega do .env (DATABASE_URL para runtime)
  // O schema.prisma tem o "directUrl" para migrações
  
  // Engine binary (deixa o Prisma escolher automaticamente)
  // Não precisa especificar manualmente em projetos normais
};

export default config;

