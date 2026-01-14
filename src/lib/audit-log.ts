import { prisma } from '@/lib/db';
import { NextRequest } from 'next/server';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'ACCESS' | 'EXPORT';

interface AuditLogParams {
  userId?: string;
  userEmail: string;
  userRole?: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  changes?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Extrai IP do request
 */
function getIpAddress(request: NextRequest): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return undefined;
}

/**
 * Cria um registro de auditoria genérico
 */
export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        userId: params.userId,
        userEmail: params.userEmail,
        userRole: params.userRole,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        changes: params.changes || {},
        metadata: params.metadata || {},
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        createdAt: new Date(),
      },
    });

    console.log(`[AuditLog] ✅ Registrado: ${params.action} em ${params.entity} por ${params.userEmail}`);
  } catch (error) {
    console.error('[AuditLog] ❌ Erro ao criar registro de auditoria:', error);
    // Não lançar erro para não interromper operação principal
  }
}

/**
 * Registra criação de entidade
 */
export async function logCreate(
  entity: string,
  entityId: string,
  data: any,
  user: { id?: string; email: string; role?: string },
  request: NextRequest
): Promise<void> {
  await createAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: 'CREATE',
    entity,
    entityId,
    changes: {
      after: data,
    },
    ipAddress: getIpAddress(request),
    userAgent: request.headers.get('user-agent') || undefined,
  });
}

/**
 * Registra atualização de entidade
 */
export async function logUpdate(
  entity: string,
  entityId: string,
  oldData: any,
  newData: any,
  user: { id?: string; email: string; role?: string },
  request: NextRequest
): Promise<void> {
  // Identificar campos alterados
  const changes: any = {
    before: {},
    after: {},
  };

  Object.keys(newData).forEach(key => {
    if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
      changes.before[key] = oldData[key];
      changes.after[key] = newData[key];
    }
  });

  await createAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: 'UPDATE',
    entity,
    entityId,
    changes,
    ipAddress: getIpAddress(request),
    userAgent: request.headers.get('user-agent') || undefined,
  });
}

/**
 * Registra exclusão de entidade
 */
export async function logDelete(
  entity: string,
  entityId: string,
  data: any,
  user: { id?: string; email: string; role?: string },
  request: NextRequest
): Promise<void> {
  await createAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: 'DELETE',
    entity,
    entityId,
    changes: {
      before: data,
    },
    ipAddress: getIpAddress(request),
    userAgent: request.headers.get('user-agent') || undefined,
  });
}

/**
 * Registra acesso a entidade sensível
 */
export async function logAccess(
  entity: string,
  entityId: string,
  user: { id?: string; email: string; role?: string },
  request: NextRequest,
  metadata?: any
): Promise<void> {
  await createAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: 'ACCESS',
    entity,
    entityId,
    metadata,
    ipAddress: getIpAddress(request),
    userAgent: request.headers.get('user-agent') || undefined,
  });
}

/**
 * Registra login de usuário
 */
export async function logLogin(
  user: { id?: string; email: string; role?: string },
  request: NextRequest,
  metadata?: any
): Promise<void> {
  await createAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: 'LOGIN',
    entity: 'User',
    entityId: user.id,
    metadata,
    ipAddress: getIpAddress(request),
    userAgent: request.headers.get('user-agent') || undefined,
  });
}

/**
 * Registra logout de usuário
 */
export async function logLogout(
  user: { id?: string; email: string; role?: string },
  request: NextRequest
): Promise<void> {
  await createAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: 'LOGOUT',
    entity: 'User',
    entityId: user.id,
    ipAddress: getIpAddress(request),
    userAgent: request.headers.get('user-agent') || undefined,
  });
}

/**
 * Registra exportação de dados
 */
export async function logExport(
  entity: string,
  user: { id?: string; email: string; role?: string },
  request: NextRequest,
  metadata?: any
): Promise<void> {
  await createAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: 'EXPORT',
    entity,
    metadata,
    ipAddress: getIpAddress(request),
    userAgent: request.headers.get('user-agent') || undefined,
  });
}
