/**
 * Logger utilitário para controlar logs em produção
 *
 * Em produção: apenas erros são logados (para monitoramento)
 * Em desenvolvimento: todos os logs são exibidos
 *
 * Uso:
 * import { logger } from '@/lib/logger';
 * logger.info('[API] Buscando dados...');
 * logger.error('[API] Erro:', error);
 */

const isDev = process.env.NODE_ENV === 'development';

type LogArgs = unknown[];

export const logger = {
  /**
   * Log informativo - apenas em desenvolvimento
   */
  info: (...args: LogArgs): void => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Log de debug - apenas em desenvolvimento
   */
  debug: (...args: LogArgs): void => {
    if (isDev) {
      console.debug(...args);
    }
  },

  /**
   * Log de aviso - apenas em desenvolvimento
   */
  warn: (...args: LogArgs): void => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Log de erro - SEMPRE logado (produção e desenvolvimento)
   * Erros precisam ser rastreados para debugging
   */
  error: (...args: LogArgs): void => {
    console.error(...args);
  },
};

// Alias para compatibilidade
export const log = logger;

export default logger;
