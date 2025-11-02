import { NextResponse } from "next/server";
import { sendOrderConfirmationEmail, Order } from "@/lib/email";

export async function GET() {
  return NextResponse.json({ message: "Get orders" });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Aqui você implementaria a lógica real de criação do pedido
    // Por enquanto, simulamos um pedido criado com sucesso
    const mockOrder: Order = {
      id: `ORDER-${Date.now()}`,
      customerName: body.customerName || "Cliente",
      customerEmail: body.customerEmail || "cliente@email.com",
      items: body.items || [],
      total: body.total || 0,
      createdAt: new Date(),
    };

    // Enviar e-mail de confirmação
    const emailSent = await sendOrderConfirmationEmail(mockOrder);

    if (!emailSent) {
      console.warn("Pedido criado, mas falha no envio do e-mail");
    }

    return NextResponse.json({
      message: "Pedido criado com sucesso",
      orderId: mockOrder.id,
      emailSent,
    });
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}