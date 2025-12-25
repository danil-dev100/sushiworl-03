/**
 * ✅ VALIDAÇÃO ROBUSTA DE SENHAS
 *
 * Protege contra:
 * - Senhas fracas
 * - Senhas comuns/vazadas
 * - Ataques de dicionário
 */

export type PasswordStrength = 'very-weak' | 'weak' | 'medium' | 'strong' | 'very-strong';

export interface PasswordValidation {
  valid: boolean;
  errors: string[];
  strength: PasswordStrength;
  score: number; // 0-100
}

// Lista de senhas mais comuns (top 100)
// Fonte: https://github.com/danielmiessler/SecLists
const COMMON_PASSWORDS = [
  'password', 'password123', '123456', '12345678', 'qwerty', 'abc123',
  'monkey', '1234567', 'letmein', 'trustno1', 'dragon', 'baseball',
  'iloveyou', 'master', 'sunshine', 'ashley', 'bailey', 'passw0rd',
  'shadow', '123123', '654321', 'superman', 'qazwsx', 'michael',
  'football', 'welcome', 'jesus', 'ninja', 'mustang', 'password1',
  'admin', 'admin123', 'administrator', 'root', 'toor', 'pass',
  'test', 'guest', 'info', 'adm', 'mysql', 'user', 'oracle',
  'postgres', 'ftp', 'backup', 'demo', 'default', 'changeme',
  'Welcome1', 'Password1!', 'Qwerty123', 'Admin123!', 'P@ssw0rd',
];

// Sequências comuns
const SEQUENTIAL_PATTERNS = [
  '12345', '23456', '34567', '45678', '56789',
  'abcde', 'bcdef', 'cdefg', 'defgh', 'efghi',
  'qwert', 'werty', 'ertyu', 'rtyui', 'tyuio',
  'asdfg', 'sdfgh', 'dfghj', 'fghjk', 'ghjkl',
];

/**
 * Verifica se a senha contém sequências comuns
 */
function hasSequentialPattern(password: string): boolean {
  const lowerPassword = password.toLowerCase();
  return SEQUENTIAL_PATTERNS.some(pattern => lowerPassword.includes(pattern));
}

/**
 * Verifica se a senha está na lista de senhas comuns
 */
function isCommonPassword(password: string): boolean {
  const lowerPassword = password.toLowerCase();
  return COMMON_PASSWORDS.some(common => {
    // Verificar correspondência exata e parcial
    return lowerPassword === common.toLowerCase() ||
           lowerPassword.includes(common.toLowerCase());
  });
}

/**
 * Calcula entropia da senha (bits)
 */
function calculateEntropy(password: string): number {
  let poolSize = 0;

  // Letras minúsculas
  if (/[a-z]/.test(password)) poolSize += 26;

  // Letras maiúsculas
  if (/[A-Z]/.test(password)) poolSize += 26;

  // Números
  if (/\d/.test(password)) poolSize += 10;

  // Símbolos especiais
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

  // Entropia = log2(poolSize^length)
  return password.length * Math.log2(poolSize || 1);
}

/**
 * Calcula score da senha (0-100)
 */
function calculateScore(password: string): number {
  let score = 0;

  // Comprimento (máximo 30 pontos)
  score += Math.min(30, password.length * 2);

  // Diversidade de caracteres (máximo 40 pontos)
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/\d/.test(password)) score += 10;
  if (/[^a-zA-Z0-9]/.test(password)) score += 10;

  // Ausência de padrões (máximo 30 pontos)
  if (!hasSequentialPattern(password)) score += 15;
  if (!isCommonPassword(password)) score += 15;

  return Math.min(100, score);
}

/**
 * Determina força da senha baseado no score
 */
function determineStrength(score: number): PasswordStrength {
  if (score < 20) return 'very-weak';
  if (score < 40) return 'weak';
  if (score < 60) return 'medium';
  if (score < 80) return 'strong';
  return 'very-strong';
}

/**
 * Valida senha completa
 */
export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];

  // 1. Verificar se está vazia
  if (!password || password.trim().length === 0) {
    return {
      valid: false,
      errors: ['Senha é obrigatória'],
      strength: 'very-weak',
      score: 0,
    };
  }

  // 2. Comprimento mínimo (12 caracteres)
  if (password.length < 12) {
    errors.push('Senha deve ter no mínimo 12 caracteres');
  }

  // 3. Comprimento máximo (segurança e performance)
  if (password.length > 128) {
    errors.push('Senha muito longa (máximo 128 caracteres)');
  }

  // 4. Letra minúscula
  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  }

  // 5. Letra maiúscula
  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  }

  // 6. Número
  if (!/\d/.test(password)) {
    errors.push('Senha deve conter pelo menos um número');
  }

  // 7. Caractere especial
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/;'`~]/.test(password)) {
    errors.push('Senha deve conter pelo menos um caractere especial (!@#$%^&*...)');
  }

  // 8. Verificar senhas comuns
  if (isCommonPassword(password)) {
    errors.push('Senha muito comum. Escolha uma senha mais segura e única.');
  }

  // 9. Verificar sequências
  if (hasSequentialPattern(password)) {
    errors.push('Senha contém sequências previsíveis (ex: 12345, abcde, qwerty)');
  }

  // 10. Verificar caracteres repetidos
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Senha contém muitos caracteres repetidos consecutivos');
  }

  // 11. Calcular score e força
  const score = calculateScore(password);
  const strength = determineStrength(score);

  return {
    valid: errors.length === 0,
    errors,
    strength,
    score,
  };
}

/**
 * Gera sugestão de senha forte
 */
export function generateStrongPassword(length: number = 16): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const allChars = lowercase + uppercase + numbers + special;

  let password = '';

  // Garantir pelo menos um de cada tipo
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Preencher o resto
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Embaralhar
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Verifica se a senha atende aos requisitos mínimos
 */
export function meetsMinimumRequirements(password: string): boolean {
  return (
    password.length >= 12 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/;'`~]/.test(password) &&
    !isCommonPassword(password)
  );
}

/**
 * Obtém mensagem de feedback baseada na força
 */
export function getStrengthFeedback(strength: PasswordStrength): string {
  const messages = {
    'very-weak': 'Senha muito fraca! Por favor, escolha uma senha mais segura.',
    'weak': 'Senha fraca. Adicione mais caracteres e símbolos.',
    'medium': 'Senha razoável, mas pode ser melhorada.',
    'strong': 'Boa senha! Segura o suficiente.',
    'very-strong': 'Excelente! Senha muito forte e segura.',
  };

  return messages[strength];
}

/**
 * Obtém cor para exibir força visualmente
 */
export function getStrengthColor(strength: PasswordStrength): string {
  const colors = {
    'very-weak': '#dc2626', // red-600
    'weak': '#f97316', // orange-500
    'medium': '#eab308', // yellow-500
    'strong': '#22c55e', // green-500
    'very-strong': '#16a34a', // green-600
  };

  return colors[strength];
}
