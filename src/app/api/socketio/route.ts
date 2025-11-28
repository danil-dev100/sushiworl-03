import { NextResponse } from 'next/server';

// Esta rota serve apenas como placeholder
// O Socket.IO real é inicializado no servidor customizado
export async function GET() {
  return NextResponse.json({
    message: 'Socket.IO endpoint',
    status: 'O Socket.IO requer um servidor customizado. Veja server.ts'
  });
}
