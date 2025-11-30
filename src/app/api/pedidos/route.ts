import { NextResponse } from "next/server";
import { sendOrderConfirmationEmail, Order } from "@/lib/email";
import { prisma } from "@/lib/db";
import { z } from "zod";

const orderSchema = z.object({
  customerName: z.string().min(1, "Nome é obrigatório"),
  customerEmail: z.string().email("E-mail inválido"),
  customerPhone: z.string().optional(),
  items: z.array(z.object({
    id: z.number(),
    name: z.string(),
    price: z.string(),
    quantity: z.number().min(1)
  })).min(1, "Carrinho vazio"),
  total: z.number().min(0, "Total deve ser positivo")
});

export async function GET() {
  return NextResponse.json({ message: "Get orders" });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validar dados de entrada
    const validatedData = orderSchema.parse(body);

    // Identificação transparente do usuário
    const user = await prisma.user.upsert({
      where: {
        email: validatedData.customerEmail
      },
      update: {
        name: validatedData.customerName,
        phone: validatedData.customerPhone
      },
      create: {
        name: validatedData.customerName,
        email: validatedData.customerEmail,
        phone: validatedData.customerPhone
      }
    });

    // Calcular subtotal
    const subtotal = validatedData.items.reduce((sum, item) => {
      const price = parseFloat(item.price.replace('€', '').replace(',', '.'));
      return sum + (price * item.quantity);
    }, 0);

    const vatAmount = subtotal * 0.13; // 13% IVA
    const total = subtotal + vatAmount;

    // Criar o pedido
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        customerName: validatedData.customerName,
        customerEmail: validatedData.customerEmail,
        customerPhone: validatedData.customerPhone || '',
        deliveryAddress: {
          street: 'A definir',
          city: 'Lisboa',
          postalCode: '1000-000'
        },
        subtotal,
        vatAmount,
        total,
        orderItems: {
          create: validatedData.items.map(item => ({
            product: {
              connect: { id: String(item.id) }
            },
            name: item.name,
            priceAtTime: parseFloat(item.price.replace('€', '').replace(',', '.')),
            quantity: item.quantity
          }))
        }
      },
      include: {
        orderItems: true
      }
    });

    // Preparar dados para o e-mail
    const orderForEmail: Order = {
      id: order.id,
      customerName: user.name,
      customerEmail: user.email,
      items: order.orderItems.map((item: any) => ({
        name: item.name,
        price: item.priceAtTime,
        quantity: item.quantity
      })),
      total: order.total,
      createdAt: order.createdAt
    };

    // Enviar e-mail de confirmação
    const emailSent = await sendOrderConfirmationEmail(orderForEmail);

    if (!emailSent) {
      console.warn("Pedido criado, mas falha no envio do e-mail");
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      emailSent
    });
  } catch (error) {
    console.error("Erro ao criar pedido:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}