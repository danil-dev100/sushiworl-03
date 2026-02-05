import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Cache: ISR com revalidação a cada 5 minutos
// Popup promocional é dado público, cache seguro
export const revalidate = 300;

// Tipo do payload do popup
type PopupConfig = {
  title: string;
  message: string;
  imageUrl?: string | null;
  buttonEnabled: boolean;
  buttonText: string;
  buttonLink: string;
  buttonLinkType: 'page' | 'product' | 'external';
  productId?: string | null;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  footerText?: string | null;
};

// GET - Buscar popup ativo para o frontend (público)
export async function GET() {
  try {
    const settings = await prisma.settings.findFirst({
      select: {
        popupEnabled: true,
        popupConfig: true,
      },
    });

    // Se popup não está habilitado ou não tem configuração, retorna vazio
    // Cache curto (1 min) para popup inativo - permite reativar rapidamente
    if (!settings?.popupEnabled || !settings?.popupConfig) {
      return NextResponse.json({
        success: true,
        active: false,
        popup: null,
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      });
    }

    const popupConfig = settings.popupConfig as PopupConfig;

    // Verificar se tem mensagem configurada
    if (!popupConfig.message || popupConfig.message.trim() === '') {
      return NextResponse.json({
        success: true,
        active: false,
        popup: null,
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      });
    }

    // Se é link para produto, buscar informações do produto
    let productInfo = null;
    if (popupConfig.buttonLinkType === 'product' && popupConfig.productId) {
      const product = await prisma.product.findUnique({
        where: { id: popupConfig.productId },
        select: {
          id: true,
          name: true,
          sku: true,
          imageUrl: true,
          price: true,
        },
      });

      if (product) {
        productInfo = product;
        // Atualizar o link para a página do produto (usando SKU ou ID)
        popupConfig.buttonLink = `/cardapio?produto=${product.sku || product.id}`;
      }
    }

    // Cache de 5 minutos para popup ativo
    return NextResponse.json({
      success: true,
      active: true,
      popup: {
        ...popupConfig,
        product: productInfo,
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    // Log de erro apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error('[Popup] erro ao buscar popup:', error);
    }
    // Em caso de erro, não cachear
    return NextResponse.json(
      {
        success: false,
        active: false,
        popup: null,
        error: 'Erro ao buscar popup'
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
