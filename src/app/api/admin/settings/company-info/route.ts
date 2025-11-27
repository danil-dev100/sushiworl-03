import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Buscar configurações da empresa
    const settings = await prisma.companySettings.findFirst().catch(() => null);

    if (settings) {
      return NextResponse.json({
        companyName: settings.companyName || 'Seu Restaurante',
        companyAddress: settings.companyAddress || 'Endereço da sua empresa',
        companyPhone: settings.companyPhone || '+351 000 000 000',
        companyEmail: settings.companyEmail || 'contato@empresa.com',
        websiteUrl: settings.websiteUrl || 'seusite.com',
      });
    }

    // Retornar dados padrão se não encontrar
    return NextResponse.json({
      companyName: 'Seu Restaurante',
      companyAddress: 'Rua Exemplo, 123, Lisboa',
      companyPhone: '+351 000 000 000',
      companyEmail: 'contato@empresa.com',
      websiteUrl: 'seusite.com',
    });
  } catch (error) {
    console.error('Erro ao buscar informações da empresa:', error);

    // Em caso de erro, retornar dados padrão
    return NextResponse.json({
      companyName: 'Seu Restaurante',
      companyAddress: 'Rua Exemplo, 123, Lisboa',
      companyPhone: '+351 000 000 000',
      companyEmail: 'contato@empresa.com',
      websiteUrl: 'seusite.com',
    });
  }
}
