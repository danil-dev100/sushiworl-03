import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/db-test
 * Endpoint de diagnóstico para testar conexão com banco de dados
 */
export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    tests: {},
  };

  // Teste 1: Conexão básica
  try {
    await prisma.$queryRaw`SELECT 1 as test`;
    results.tests = { ...results.tests as object, connection: 'OK' };
  } catch (error) {
    results.tests = {
      ...results.tests as object,
      connection: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }

  // Teste 2: Tabela User
  try {
    const count = await prisma.user.count();
    results.tests = { ...results.tests as object, users: { status: 'OK', count } };
  } catch (error) {
    results.tests = {
      ...results.tests as object,
      users: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }

  // Teste 3: Tabela Order
  try {
    const count = await prisma.order.count();
    results.tests = { ...results.tests as object, orders: { status: 'OK', count } };
  } catch (error) {
    results.tests = {
      ...results.tests as object,
      orders: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }

  // Teste 4: Tabela Integration
  try {
    const count = await prisma.integration.count();
    results.tests = { ...results.tests as object, integration: { status: 'OK', count } };
  } catch (error) {
    results.tests = {
      ...results.tests as object,
      integration: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }

  // Teste 5: Tabela SmsSettings
  try {
    const count = await prisma.smsSettings.count();
    results.tests = { ...results.tests as object, smsSettings: { status: 'OK', count } };
  } catch (error) {
    results.tests = {
      ...results.tests as object,
      smsSettings: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }

  // Teste 6: Tabela Settings
  try {
    const count = await prisma.settings.count();
    results.tests = { ...results.tests as object, settings: { status: 'OK', count } };
  } catch (error) {
    results.tests = {
      ...results.tests as object,
      settings: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }

  // Teste 7: Tabela Product
  try {
    const count = await prisma.product.count();
    results.tests = { ...results.tests as object, products: { status: 'OK', count } };
  } catch (error) {
    results.tests = {
      ...results.tests as object,
      products: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }

  // Verificar se há algum teste que falhou
  const tests = results.tests as Record<string, unknown>;
  const hasFailure = Object.values(tests).some(
    (test) => typeof test === 'object' && test !== null && 'status' in test && test.status === 'FAILED'
  );

  return NextResponse.json(results, {
    status: hasFailure ? 500 : 200,
  });
}
