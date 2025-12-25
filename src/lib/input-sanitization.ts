/**
 * ✅ SANITIZAÇÃO DE INPUTS
 *
 * Protege contra:
 * - XSS (Cross-Site Scripting)
 * - SQL Injection
 * - Command Injection
 * - Path Traversal
 * - HTML/Script injection
 */

/**
 * Remove caracteres perigosos para prevenir XSS
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitiza input de texto geral (nomes, observações, etc)
 */
export function sanitizeText(input: string, maxLength: number = 500): string {
  if (!input) return '';

  return input
    .trim()
    .slice(0, maxLength) // Limitar tamanho
    .replace(/[<>]/g, '') // Remover < e >
    .replace(/\0/g, ''); // Remover null bytes
}

/**
 * Sanitiza endereço (permite apenas caracteres válidos)
 */
export function sanitizeAddress(address: string): string {
  if (!address) return '';

  // Permitir: letras, números, espaços, vírgulas, pontos, hífen, ª, º
  return address
    .trim()
    .slice(0, 500)
    .replace(/[^\w\sÀ-ÿ,.\-ªº]/g, '') // Remove caracteres especiais perigosos
    .replace(/\s+/g, ' '); // Múltiplos espaços -> um espaço
}

/**
 * Sanitiza telefone (apenas números, espaços, +, -, (, ))
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';

  return phone
    .trim()
    .slice(0, 20)
    .replace(/[^\d\s\+\-\(\)]/g, '');
}

/**
 * Sanitiza NIF (apenas números)
 */
export function sanitizeNif(nif: string): string {
  if (!nif) return '';

  return nif
    .trim()
    .replace(/\D/g, '') // Apenas dígitos
    .slice(0, 9); // NIF português tem 9 dígitos
}

/**
 * Sanitiza código postal (formato português: 1234-567)
 */
export function sanitizePostalCode(code: string): string {
  if (!code) return '';

  return code
    .trim()
    .replace(/[^\d\-]/g, '')
    .slice(0, 8); // Máximo 8 caracteres (1234-567)
}

/**
 * Sanitiza nome (sem números, sem caracteres especiais perigosos)
 */
export function sanitizeName(name: string): string {
  if (!name) return '';

  return name
    .trim()
    .slice(0, 100)
    .replace(/\d/g, '') // Remove números
    .replace(/[<>'"]/g, '') // Remove caracteres perigosos
    .replace(/\s+/g, ' '); // Múltiplos espaços -> um espaço
}

/**
 * Valida e sanitiza observações do pedido
 */
export function sanitizeObservations(observations: string): string {
  if (!observations) return '';

  return observations
    .trim()
    .slice(0, 1000) // Limitar a 1000 caracteres
    .replace(/[<>]/g, '') // Remover < e >
    .replace(/\0/g, ''); // Remover null bytes
}

/**
 * Remove path traversal attempts (../, ..\, etc)
 */
export function sanitizeFilePath(path: string): string {
  if (!path) return '';

  return path
    .replace(/\.\./g, '') // Remove ../
    .replace(/[<>:"|?*]/g, '') // Remove caracteres inválidos em paths
    .replace(/\0/g, ''); // Remove null bytes
}

/**
 * Valida se um valor é numérico seguro
 */
export function isSafeNumber(value: any): boolean {
  if (value === null || value === undefined || value === '') {
    return false;
  }

  const num = Number(value);
  return !isNaN(num) && isFinite(num);
}

/**
 * Sanitiza valor monetário (preço, total, etc)
 */
export function sanitizeMonetaryValue(value: any): number {
  if (!isSafeNumber(value)) {
    return 0;
  }

  const num = Number(value);

  // Garantir que é positivo e com máximo 2 casas decimais
  return Math.max(0, Math.round(num * 100) / 100);
}

/**
 * Valida formato de UUID (para IDs)
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Valida se uma string contém apenas caracteres alfanuméricos
 */
export function isAlphanumeric(str: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(str);
}

/**
 * Remove SQL injection attempts básicos
 */
export function sanitizeSqlInput(input: string): string {
  if (!input) return '';

  // Lista de palavras-chave SQL perigosas
  const sqlKeywords = [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
    'EXEC', 'EXECUTE', 'UNION', 'DECLARE', '--', '/*', '*/',
    'xp_', 'sp_', 'SCRIPT', 'JAVASCRIPT', 'VBSCRIPT',
  ];

  let sanitized = input.trim();

  // Remover tentativas óbvias de SQL injection
  sqlKeywords.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    sanitized = sanitized.replace(regex, '');
  });

  // Remover múltiplos espaços
  sanitized = sanitized.replace(/\s+/g, ' ');

  return sanitized;
}

/**
 * Objeto com todas as funções de sanitização
 */
export const sanitize = {
  html: sanitizeHtml,
  text: sanitizeText,
  address: sanitizeAddress,
  phone: sanitizePhone,
  nif: sanitizeNif,
  postalCode: sanitizePostalCode,
  name: sanitizeName,
  observations: sanitizeObservations,
  filePath: sanitizeFilePath,
  monetaryValue: sanitizeMonetaryValue,
  sqlInput: sanitizeSqlInput,
};

/**
 * Objeto com todas as funções de validação
 */
export const validate = {
  isSafeNumber,
  isValidUUID,
  isAlphanumeric,
};
