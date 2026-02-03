import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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
    if (!settings?.popupEnabled || !settings?.popupConfig) {
      return NextResponse.json({
        success: true,
        active: false,
        popup: null,
      });
    }

    const popupConfig = settings.popupConfig as PopupConfig;

    // Verificar se tem mensagem configurada
    if (!popupConfig.message || popupConfig.message.trim() === '') {
      return NextResponse.json({
        success: true,
        active: false,
        popup: null,
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

    return NextResponse.json({
      success: true,
      active: true,
      popup: {
        ...popupConfig,
        product: productInfo,
      },
    });
  } catch (error) {
    console.error('[Popup] erro ao buscar popup:', error);
    return NextResponse.json(
      {
        success: false,
        active: false,
        popup: null,
        error: 'Erro ao buscar popup'
      },
      { status: 500 }
    );
  }
}
