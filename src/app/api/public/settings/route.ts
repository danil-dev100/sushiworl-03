import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * ✅ ROTA PÚBLICA - Retorna APENAS dados não-sensíveis
 *
 * Esta rota é acessível publicamente e retorna apenas configurações
 * que são seguras para expor ao front-end (checkout, carrinho, etc)
 */
export async function GET() {
  try {
    const settings = await prisma.settings.findFirst();

    if (!settings) {
      return NextResponse.json(
        {
          checkoutAdditionalItems: [],
          additionalItems: [],
          vatRate: 13,
          websiteUrl: null,
        },
        { status: 200 }
      );
    }

    // ✅ RETORNAR APENAS CAMPOS PÚBLICOS (não sensíveis)
    const publicSettings = {
      // Itens adicionais do checkout
      checkoutAdditionalItems: settings.checkoutAdditionalItems || [],

      // Itens adicionais gerais
      additionalItems: settings.additionalItems || [],

      // Taxa de IVA (necessária para cálculos)
      vatRate: settings.vatRate || 13,

      // URL do site (para links)
      websiteUrl: settings.websiteUrl,

      // ❌ NÃO RETORNAR:
      // - companyName
      // - billingName
      // - nif
      // - address
      // - phone
      // - email
      // - printerType
      // - printerName
      // - paperSize
      // - printSettings
      // - openingHours (pode ser público, mas melhor criar rota específica)
    };

    return NextResponse.json(publicSettings, {
      headers: {
        // Cache por 5 minutos
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    });

  } catch (error) {
    console.error('[Public Settings API] Erro ao buscar configurações:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    );
  }
}
