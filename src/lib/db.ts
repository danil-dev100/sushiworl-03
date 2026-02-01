import { PrismaClient } from '@prisma/client'

// Singleton pattern para evitar múltiplas instâncias em serverless
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configuração otimizada para Vercel + Supabase
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  // Log queries apenas em desenvolvimento
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // Configurações de datasource
  datasourceUrl: process.env.DATABASE_URL,
})

// Manter singleton em desenvolvimento para evitar hot-reload criar novas conexões
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Handler para graceful shutdown (importante para Vercel)
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

export default prisma