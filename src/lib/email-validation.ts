/**
 * ✅ VALIDAÇÃO ROBUSTA DE EMAIL
 *
 * Protege contra:
 * - Emails descartáveis/temporários
 * - Typos comuns em domínios populares
 * - Formatos inválidos
 */

// Lista de domínios de email descartável (top 50 mais usados)
// Fonte: https://github.com/disposable/disposable-email-domains
const DISPOSABLE_DOMAINS = [
  '10minutemail.com',
  '10minutemail.net',
  'guerrillamail.com',
  'guerrillamail.net',
  'mailinator.com',
  'temp-mail.org',
  'temp-mail.io',
  'throwaway.email',
  'yopmail.com',
  'yopmail.net',
  'maildrop.cc',
  'getnada.com',
  'emailondeck.com',
  'trashmail.com',
  'dispostable.com',
  'mintemail.com',
  'mytemp.email',
  'tempmail.com',
  'tempmail.net',
  'fakeinbox.com',
  'fake-mail.com',
  'spamgourmet.com',
  'jetable.org',
  'sharklasers.com',
  'guerrillamail.biz',
  'guerrillamail.de',
  'guerrillamail.info',
  'grr.la',
  'mailnesia.com',
  'mohmal.com',
  'tempr.email',
  'tmpmail.org',
  'tmpmail.net',
  'spam4.me',
  'mailcatch.com',
  'mailnator.com',
  'emltmp.com',
  'inboxbear.com',
  'getairmail.com',
  'trash-mail.at',
  'trash2009.com',
  'spambox.us',
  'armyspy.com',
  'cuvox.de',
  'dayrep.com',
  'einrot.com',
  'fleckens.hu',
  'gustr.com',
  'jourrapide.com',
  'rhyta.com',
  'superrito.com',
  'teleworm.us',
];

// Typos comuns em domínios populares
const COMMON_TYPOS: Record<string, string> = {
  // Gmail
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmil.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmal.com': 'gmail.com',

  // Hotmail
  'hotmial.com': 'hotmail.com',
  'hotmil.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com',
  'hotnail.com': 'hotmail.com',

  // Yahoo
  'yahooo.com': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'yahho.com': 'yahoo.com',
  'yahhoo.com': 'yahoo.com',

  // Outlook
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'outlookk.com': 'outlook.com',

  // Sapo (Portugal)
  'sap.pt': 'sapo.pt',
  'sappo.pt': 'sapo.pt',
};

export interface EmailValidation {
  valid: boolean;
  error?: string;
  suggestion?: string;
}

/**
 * Verifica se o email é de um domínio descartável
 */
export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return DISPOSABLE_DOMAINS.includes(domain);
}

/**
 * Verifica se o domínio tem um typo comum
 */
export function hasDomainTypo(email: string): string | null {
  const domain = email.split('@')[1]?.toLowerCase();
  return COMMON_TYPOS[domain] || null;
}

/**
 * Validação completa de email
 */
export function validateEmail(email: string): EmailValidation {
  // 1. Verificar se está vazio
  if (!email || email.trim().length === 0) {
    return {
      valid: false,
      error: 'Email é obrigatório',
    };
  }

  const trimmedEmail = email.trim().toLowerCase();

  // 2. Validação de formato básico (RFC 5322 simplificado)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(trimmedEmail)) {
    return {
      valid: false,
      error: 'Formato de email inválido',
    };
  }

  // 3. Verificar tamanho (RFC 5321)
  if (trimmedEmail.length > 254) {
    return {
      valid: false,
      error: 'Email muito longo (máximo 254 caracteres)',
    };
  }

  // 4. Verificar se tem domínio
  const parts = trimmedEmail.split('@');
  if (parts.length !== 2) {
    return {
      valid: false,
      error: 'Email deve conter exatamente um @',
    };
  }

  const [localPart, domain] = parts;

  // 5. Validar parte local (antes do @)
  if (localPart.length === 0 || localPart.length > 64) {
    return {
      valid: false,
      error: 'Parte local do email inválida',
    };
  }

  // 6. Validar domínio
  if (domain.length === 0 || domain.length > 255) {
    return {
      valid: false,
      error: 'Domínio do email inválido',
    };
  }

  // Verificar se domínio tem pelo menos um ponto
  if (!domain.includes('.')) {
    return {
      valid: false,
      error: 'Domínio deve conter pelo menos um ponto',
    };
  }

  // 7. Verificar typos comuns
  const typoSuggestion = hasDomainTypo(trimmedEmail);
  if (typoSuggestion) {
    return {
      valid: false,
      error: `Você quis dizer @${typoSuggestion}?`,
      suggestion: `${localPart}@${typoSuggestion}`,
    };
  }

  // 8. Verificar se é email descartável
  if (isDisposableEmail(trimmedEmail)) {
    return {
      valid: false,
      error: 'Por favor, use um endereço de email permanente (emails temporários não são permitidos)',
    };
  }

  // 9. Verificações adicionais
  // Domínios que provavelmente são inválidos
  const suspiciousDomains = ['test.com', 'example.com', 'localhost', 'test.test', 'fake.com'];
  if (suspiciousDomains.includes(domain)) {
    return {
      valid: false,
      error: 'Por favor, use um email real',
    };
  }

  // Verificar se não é apenas números
  if (/^\d+@/.test(trimmedEmail)) {
    return {
      valid: false,
      error: 'Email não pode começar apenas com números',
    };
  }

  // 10. Tudo OK!
  return {
    valid: true,
  };
}

/**
 * Sanitiza o email (remove espaços, converte para minúscula)
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Verifica se dois emails são iguais (normalizado)
 */
export function emailsAreEqual(email1: string, email2: string): boolean {
  return sanitizeEmail(email1) === sanitizeEmail(email2);
}
