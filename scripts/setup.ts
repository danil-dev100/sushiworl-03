#!/usr/bin/env tsx
/**
 * 🍣 SUSHIWORLD - SCRIPT DE SETUP AUTOMATIZADO
 * 
 * Este script automatiza todo o processo de configuração:
 * 1. Valida schema do Prisma
 * 2. Gera Prisma Client
 * 3. Sincroniza DB com Supabase (db push)
 * 4. Popula dados (produtos do cardápio)
 * 5. Abre Prisma Studio para verificação
 * 6. Inicia servidor de desenvolvimento
 * 
 * USO:
 *   npx tsx scripts/setup.ts
 *   npx tsx scripts/setup.ts --skip-seed    (pula população de dados)
 *   npx tsx scripts/setup.ts --no-dev       (não inicia servidor)
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// ============================================
// CONFIGURAÇÕES
// ============================================

const CONFIG = {
  skipSeed: process.argv.includes('--skip-seed'),
  noDev: process.argv.includes('--no-dev'),
  noStudio: process.argv.includes('--no-studio'),
  port: 3000,
};

// ============================================
// UTILITÁRIOS DE LOG (sem dependências externas)
// ============================================

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step: number, title: string) {
  console.log('\n' + '═'.repeat(60));
  log(`📍 PASSO ${step}: ${title}`, 'cyan');
  console.log('═'.repeat(60));
}

function logSuccess(message: string) {
  log(`✅ ${message}`, 'green');
}

function logError(message: string) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, 'blue');
}

// ============================================
// FUNÇÃO PARA EXECUTAR COMANDOS
// ============================================

function runCommand(
  command: string,
  options: {
    silent?: boolean;
    continueOnError?: boolean;
    description?: string;
  } = {}
): boolean {
  const { silent = false, continueOnError = false, description } = options;

  if (description && !silent) {
    logInfo(description);
  }

  if (!silent) {
    log(`$ ${command}`, 'blue');
  }

  try {
    execSync(command, {
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf-8',
      cwd: process.cwd(),
    });
    return true;
  } catch (error: any) {
    if (!continueOnError) {
      logError(`Comando falhou: ${command}`);
      if (error.stderr) {
        console.error(error.stderr.toString());
      }
      process.exit(1);
    }
    return false;
  }
}

// ============================================
// VERIFICAÇÕES PRELIMINARES
// ============================================

function verificarArquivos() {
  logStep(0, 'Verificações Preliminares');

  const arquivosEssenciais = [
    { path: 'prisma/schema.prisma', desc: 'Schema do Prisma' },
    { path: 'package.json', desc: 'Package.json' },
    { path: '.env.local', desc: 'Variáveis de ambiente' },
  ];

  let allOk = true;

  for (const arquivo of arquivosEssenciais) {
    if (fs.existsSync(arquivo.path)) {
      logSuccess(`${arquivo.desc} encontrado`);
    } else {
      logError(`${arquivo.desc} NÃO encontrado: ${arquivo.path}`);
      allOk = false;
    }
  }

  // Verificar se .env.local tem as variáveis necessárias
  if (fs.existsSync('.env.local')) {
    const envContent = fs.readFileSync('.env.local', 'utf-8');
    const requiredVars = ['DATABASE_URL', 'DIRECT_URL'];
    
    for (const varName of requiredVars) {
      if (envContent.includes(varName)) {
        logSuccess(`${varName} definida`);
      } else {
        logError(`${varName} NÃO encontrada no .env.local`);
        allOk = false;
      }
    }
  }

  if (!allOk) {
    logError('\nArquivos essenciais faltando! Configure o projeto primeiro.');
    process.exit(1);
  }

  logSuccess('\n✨ Todas as verificações passaram!\n');
}

// ============================================
// ETAPA 1: VALIDAR SCHEMA
// ============================================

function validarSchema() {
  logStep(1, 'Validar Schema do Prisma');
  
  const success = runCommand('npx prisma validate', {
    description: 'Verificando se o schema está correto...',
    continueOnError: true,
  });

  if (success) {
    logSuccess('Schema validado com sucesso!');
  } else {
    logError('Schema inválido! Corrija os erros antes de continuar.');
    process.exit(1);
  }
}

// ============================================
// ETAPA 2: GERAR PRISMA CLIENT
// ============================================

function gerarPrismaClient() {
  logStep(2, 'Gerar Prisma Client');
  
  runCommand('npx prisma generate', {
    description: 'Gerando tipos TypeScript do Prisma...',
  });

  logSuccess('Prisma Client gerado com sucesso!');
}

// ============================================
// ETAPA 3: SINCRONIZAR DATABASE
// ============================================

function sincronizarDatabase() {
  logStep(3, 'Sincronizar Database com Supabase');
  
  logInfo('Aplicando schema no banco de dados (usando DIRECT_URL)...');
  logWarning('Isso pode levar alguns segundos na primeira vez...\n');

  try {
    const output = execSync('npx prisma db push --accept-data-loss', {
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    console.log(output);

    if (output.includes('already in sync')) {
      logSuccess('Database já estava sincronizado!');
    } else if (output.includes('now in sync')) {
      logSuccess('Database sincronizado com sucesso!');
    } else {
      logSuccess('Comando executado!');
    }
  } catch (error: any) {
    logError('Falha ao sincronizar database!');
    
    // Dicas de troubleshooting
    if (error.stderr && error.stderr.includes('P1001')) {
      logWarning('\n🔧 SOLUÇÃO POSSÍVEL:');
      console.log('   1. Verifique se seu IP está na whitelist do Supabase');
      console.log('   2. Acesse: https://supabase.com/dashboard → Settings → Database');
      console.log('   3. Em "Connection Pooling", adicione seu IP ou 0.0.0.0/0');
      console.log('   4. Verifique se DATABASE_URL e DIRECT_URL estão corretos no .env.local');
    } else if (error.stderr && error.stderr.includes('authentication')) {
      logWarning('\n🔧 SOLUÇÃO POSSÍVEL:');
      console.log('   1. Verifique se a senha no .env.local está correta');
      console.log('   2. Acesse: https://supabase.com/dashboard → Settings → Database');
      console.log('   3. Se necessário, resete a senha do banco');
    }
    
    console.error(error.stderr);
    process.exit(1);
  }
}

// ============================================
// ETAPA 4: POPULAR DATABASE
// ============================================

function popularDatabase() {
  if (CONFIG.skipSeed) {
    logWarning('Pulando população de dados (--skip-seed)');
    return;
  }

  logStep(4, 'Popular Database com Dados Iniciais');

  // Verificar qual script de seed usar
  const seedScripts = [
    { path: 'scripts/importar-cardapio.ts', desc: 'Importador de Cardápio' },
    { path: 'prisma/seed-complete.ts', desc: 'Seed Completo' },
    { path: 'prisma/seed.ts', desc: 'Seed Padrão' },
  ];

  let seedScript: string | null = null;

  for (const script of seedScripts) {
    if (fs.existsSync(script.path)) {
      logInfo(`Usando: ${script.desc} (${script.path})`);
      seedScript = script.path;
      break;
    }
  }

  if (!seedScript) {
    logWarning('Nenhum script de seed encontrado! Pulando população...');
    return;
  }

  try {
    runCommand(`npx tsx ${seedScript}`, {
      description: 'Inserindo dados no banco...',
    });
    logSuccess('Dados populados com sucesso!');
  } catch (error) {
    logWarning('Erro ao popular dados. Você pode fazer isso manualmente depois.');
    logInfo(`Execute: npx tsx ${seedScript}`);
  }
}

// ============================================
// ETAPA 5: VERIFICAR COM PRISMA STUDIO
// ============================================

function abrirPrismaStudio() {
  if (CONFIG.noStudio) {
    logWarning('Pulando Prisma Studio (--no-studio)');
    return;
  }

  logStep(5, 'Abrir Prisma Studio para Verificação');
  
  logInfo('Abrindo Prisma Studio em http://localhost:5555');
  logInfo('Você pode verificar se as tabelas e dados foram criados corretamente.');
  logWarning('Feche o Prisma Studio (Ctrl+C) quando terminar de verificar.\n');

  const studio = spawn('npx', ['prisma', 'studio'], {
    stdio: 'inherit',
    shell: true,
  });

  // Aguardar 5 segundos para o usuário ver o Studio
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      logInfo('\nPressione Ctrl+C para fechar o Prisma Studio e continuar...');
      
      studio.on('exit', () => {
        resolve();
      });
    }, 2000);
  });
}

// ============================================
// ETAPA 6: INICIAR SERVIDOR DE DESENVOLVIMENTO
// ============================================

function iniciarDevServer() {
  if (CONFIG.noDev) {
    logWarning('Pulando servidor de desenvolvimento (--no-dev)');
    return;
  }

  logStep(6, 'Iniciar Servidor de Desenvolvimento');
  
  logSuccess('✨ Setup concluído com sucesso!\n');
  
  log('🚀 Iniciando Next.js em http://localhost:3000', 'magenta');
  console.log('\n📌 ROTAS DISPONÍVEIS:');
  console.log('   - http://localhost:3000              (Home)');
  console.log('   - http://localhost:3000/cardapio     (Cardápio)');
  console.log('   - http://localhost:3000/carrinho     (Carrinho)');
  console.log('   - http://localhost:3000/api/products (API JSON)');
  console.log('\n👤 LOGIN ADMIN:');
  console.log('   - Email: admin@sushiworld.pt');
  console.log('   - Senha: 123sushi');
  console.log('\n⚠️  Pressione Ctrl+C para parar o servidor.\n');
  console.log('═'.repeat(60) + '\n');

  // Iniciar servidor
  const devServer = spawn('npm', ['run', 'dev', '--', '--port', CONFIG.port.toString()], {
    stdio: 'inherit',
    shell: true,
  });

  devServer.on('exit', (code) => {
    if (code !== 0) {
      logError(`Servidor encerrado com código ${code}`);
      process.exit(code || 1);
    }
  });
}

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================

async function main() {
  console.clear();
  
  log('\n╔═══════════════════════════════════════════════════════════╗', 'magenta');
  log('║                                                           ║', 'magenta');
  log('║        🍣  SUSHIWORLD - SETUP AUTOMATIZADO  🍣            ║', 'magenta');
  log('║                                                           ║', 'magenta');
  log('╚═══════════════════════════════════════════════════════════╝\n', 'magenta');

  const startTime = Date.now();

  try {
    // Etapas do setup
    verificarArquivos();
    validarSchema();
    gerarPrismaClient();
    sincronizarDatabase();
    popularDatabase();
    
    // Etapas interativas
    if (!CONFIG.noStudio) {
      await abrirPrismaStudio();
    }
    
    iniciarDevServer();

  } catch (error: any) {
    logError('\n💥 Erro fatal durante o setup!');
    console.error(error);
    process.exit(1);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  logSuccess(`\n⏱️  Setup concluído em ${duration}s`);
}

// ============================================
// EXECUTAR
// ============================================

main();


