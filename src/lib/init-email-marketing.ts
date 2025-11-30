import { initializeDefaultTemplates } from '@/app/api/email-marketing/templates/route';

/**
 * Inicializa dados padrão para o módulo de Email Marketing
 */
export async function initEmailMarketing() {
  try {
    console.log('🚀 Inicializando módulo de Email Marketing...');

    // Inicializar templates padrão
    await initializeDefaultTemplates();

    console.log('✅ Módulo de Email Marketing inicializado com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao inicializar módulo de Email Marketing:', error);
  }
}


