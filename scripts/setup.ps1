# ============================================
# 🍣 SUSHIWORLD - SCRIPT DE SETUP AUTOMATIZADO (PowerShell)
# ============================================
# 
# Este script automatiza todo o processo de configuração no Windows
# 
# USO:
#   .\scripts\setup.ps1
#   .\scripts\setup.ps1 -SkipSeed
#   .\scripts\setup.ps1 -NoDev

param(
    [switch]$SkipSeed,
    [switch]$NoDev,
    [switch]$NoStudio
)

# ============================================
# CONFIGURAÇÕES
# ============================================

$ErrorActionPreference = "Stop"
$Port = 3000

# ============================================
# FUNÇÕES DE LOG
# ============================================

function Write-Step {
    param([int]$Step, [string]$Title)
    Write-Host ""
    Write-Host ("=" * 60) -ForegroundColor Cyan
    Write-Host "📍 PASSO $Step`: $Title" -ForegroundColor Cyan
    Write-Host ("=" * 60) -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

# ============================================
# FUNÇÃO PARA EXECUTAR COMANDOS
# ============================================

function Invoke-Command-Safe {
    param(
        [string]$Command,
        [string]$Description,
        [switch]$ContinueOnError
    )

    if ($Description) {
        Write-Info $Description
    }

    Write-Host "$ $Command" -ForegroundColor Blue

    try {
        Invoke-Expression $Command
        if ($LASTEXITCODE -ne 0 -and -not $ContinueOnError) {
            throw "Comando falhou com código $LASTEXITCODE"
        }
        return $true
    } catch {
        if (-not $ContinueOnError) {
            Write-Error-Custom "Comando falhou: $Command"
            Write-Host $_.Exception.Message -ForegroundColor Red
            exit 1
        }
        return $false
    }
}

# ============================================
# BANNER
# ============================================

Clear-Host
Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║                                                           ║" -ForegroundColor Magenta
Write-Host "║        🍣  SUSHIWORLD - SETUP AUTOMATIZADO  🍣            ║" -ForegroundColor Magenta
Write-Host "║                                                           ║" -ForegroundColor Magenta
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

$StartTime = Get-Date

# ============================================
# ETAPA 0: VERIFICAÇÕES
# ============================================

Write-Step 0 "Verificações Preliminares"

$RequiredFiles = @(
    @{ Path = "prisma\schema.prisma"; Desc = "Schema do Prisma" },
    @{ Path = "package.json"; Desc = "Package.json" },
    @{ Path = ".env.local"; Desc = "Variáveis de ambiente" }
)

$AllOk = $true

foreach ($File in $RequiredFiles) {
    if (Test-Path $File.Path) {
        Write-Success "$($File.Desc) encontrado"
    } else {
        Write-Error-Custom "$($File.Desc) NÃO encontrado: $($File.Path)"
        $AllOk = $false
    }
}

# Verificar variáveis de ambiente
if (Test-Path ".env.local") {
    $EnvContent = Get-Content ".env.local" -Raw
    $RequiredVars = @("DATABASE_URL", "DIRECT_URL")
    
    foreach ($Var in $RequiredVars) {
        if ($EnvContent -match $Var) {
            Write-Success "$Var definida"
        } else {
            Write-Error-Custom "$Var NÃO encontrada no .env.local"
            $AllOk = $false
        }
    }
}

if (-not $AllOk) {
    Write-Error-Custom "`nArquivos essenciais faltando! Configure o projeto primeiro."
    exit 1
}

Write-Success "`n✨ Todas as verificações passaram!`n"

# ============================================
# ETAPA 1: VALIDAR SCHEMA
# ============================================

Write-Step 1 "Validar Schema do Prisma"

$Success = Invoke-Command-Safe -Command "npx prisma validate" -Description "Verificando se o schema está correto..." -ContinueOnError

if ($Success) {
    Write-Success "Schema validado com sucesso!"
} else {
    Write-Error-Custom "Schema inválido! Corrija os erros antes de continuar."
    exit 1
}

# ============================================
# ETAPA 2: GERAR PRISMA CLIENT
# ============================================

Write-Step 2 "Gerar Prisma Client"

Invoke-Command-Safe -Command "npx prisma generate" -Description "Gerando tipos TypeScript do Prisma..."
Write-Success "Prisma Client gerado com sucesso!"

# ============================================
# ETAPA 3: SINCRONIZAR DATABASE
# ============================================

Write-Step 3 "Sincronizar Database com Supabase"

Write-Info "Aplicando schema no banco de dados (usando DIRECT_URL)..."
Write-Warning-Custom "Isso pode levar alguns segundos na primeira vez...`n"

try {
    $Output = npx prisma db push --accept-data-loss 2>&1 | Out-String
    Write-Host $Output

    if ($Output -match "already in sync") {
        Write-Success "Database já estava sincronizado!"
    } elseif ($Output -match "now in sync") {
        Write-Success "Database sincronizado com sucesso!"
    } else {
        Write-Success "Comando executado!"
    }
} catch {
    Write-Error-Custom "Falha ao sincronizar database!"
    
    if ($_.Exception.Message -match "P1001") {
        Write-Warning-Custom "`n🔧 SOLUÇÃO POSSÍVEL:"
        Write-Host "   1. Verifique se seu IP está na whitelist do Supabase"
        Write-Host "   2. Acesse: https://supabase.com/dashboard → Settings → Database"
        Write-Host "   3. Em 'Connection Pooling', adicione seu IP ou 0.0.0.0/0"
    }
    
    exit 1
}

# ============================================
# ETAPA 4: POPULAR DATABASE
# ============================================

if (-not $SkipSeed) {
    Write-Step 4 "Popular Database com Dados Iniciais"

    $SeedScripts = @(
        @{ Path = "scripts\importar-cardapio.ts"; Desc = "Importador de Cardápio" },
        @{ Path = "prisma\seed-complete.ts"; Desc = "Seed Completo" },
        @{ Path = "prisma\seed.ts"; Desc = "Seed Padrão" }
    )

    $SeedScript = $null

    foreach ($Script in $SeedScripts) {
        if (Test-Path $Script.Path) {
            Write-Info "Usando: $($Script.Desc) ($($Script.Path))"
            $SeedScript = $Script.Path
            break
        }
    }

    if ($SeedScript) {
        try {
            Invoke-Command-Safe -Command "npx tsx $SeedScript" -Description "Inserindo dados no banco..."
            Write-Success "Dados populados com sucesso!"
        } catch {
            Write-Warning-Custom "Erro ao popular dados. Você pode fazer isso manualmente depois."
            Write-Info "Execute: npx tsx $SeedScript"
        }
    } else {
        Write-Warning-Custom "Nenhum script de seed encontrado! Pulando população..."
    }
} else {
    Write-Warning-Custom "Pulando população de dados (--SkipSeed)"
}

# ============================================
# ETAPA 5: PRISMA STUDIO
# ============================================

if (-not $NoStudio) {
    Write-Step 5 "Abrir Prisma Studio para Verificação"
    
    Write-Info "Abrindo Prisma Studio em http://localhost:5555"
    Write-Info "Você pode verificar se as tabelas e dados foram criados."
    Write-Warning-Custom "Pressione Ctrl+C no Prisma Studio quando terminar de verificar.`n"

    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npx prisma studio"
    
    Write-Info "Aguardando você verificar o Prisma Studio..."
    Write-Host "Pressione qualquer tecla para continuar..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# ============================================
# ETAPA 6: SERVIDOR DE DESENVOLVIMENTO
# ============================================

if (-not $NoDev) {
    Write-Step 6 "Iniciar Servidor de Desenvolvimento"
    
    Write-Success "✨ Setup concluído com sucesso!`n"
    
    Write-Host "🚀 Iniciando Next.js em http://localhost:$Port" -ForegroundColor Magenta
    Write-Host "`n📌 ROTAS DISPONÍVEIS:"
    Write-Host "   - http://localhost:$Port              (Home)"
    Write-Host "   - http://localhost:$Port/cardapio     (Cardápio)"
    Write-Host "   - http://localhost:$Port/carrinho     (Carrinho)"
    Write-Host "   - http://localhost:$Port/api/products (API JSON)"
    Write-Host "`n👤 LOGIN ADMIN:"
    Write-Host "   - Email: admin@sushiworld.pt"
    Write-Host "   - Senha: 123sushi"
    Write-Host "`n⚠️  Pressione Ctrl+C para parar o servidor.`n"
    Write-Host ("=" * 60)
    Write-Host ""

    npm run dev -- --port $Port
}

# ============================================
# FINALIZAÇÃO
# ============================================

$Duration = ((Get-Date) - $StartTime).TotalSeconds
Write-Success "`n⏱️  Setup concluído em $([Math]::Round($Duration, 2))s"


