#!/bin/bash

# ============================================
# SCRIPT PARA REMOVER CREDENCIAIS DO GIT
# ============================================
# ATENÇÃO: Este script reescreve o histórico do Git!
# Execute em um backup do repositório primeiro

echo "=================================================="
echo "REMOVENDO CREDENCIAIS DO HISTÓRICO DO GIT"
echo "=================================================="
echo ""
echo "⚠️  ATENÇÃO: Este processo é IRREVERSÍVEL!"
echo "⚠️  Certifique-se de ter um backup do repositório"
echo ""
read -p "Deseja continuar? (digite 'SIM' para confirmar): " confirmacao

if [ "$confirmacao" != "SIM" ]; then
    echo "Operação cancelada."
    exit 1
fi

echo ""
echo "1. Fazendo backup do repositório atual..."
cd ..
cp -r sushiworld_3 sushiworld_3_backup_$(date +%Y%m%d_%H%M%S)
cd sushiworld_3

echo ""
echo "2. Removendo arquivos sensíveis do histórico Git..."

# Método 1: git filter-repo (RECOMENDADO - mais rápido)
# Instalar: pip install git-filter-repo
if command -v git-filter-repo &> /dev/null; then
    echo "   Usando git-filter-repo..."
    git filter-repo --invert-paths --path .env --path .env.local --force
else
    echo "   git-filter-repo não encontrado, usando filter-branch..."
    # Método 2: git filter-branch (mais lento)
    git filter-branch --force --index-filter \
        'git rm --cached --ignore-unmatch .env .env.local' \
        --prune-empty --tag-name-filter cat -- --all
fi

echo ""
echo "3. Limpando referências órfãs..."
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "4. Verificando se os arquivos foram removidos..."
if git log --all --full-history -- .env | grep -q "commit"; then
    echo "   ⚠️  AVISO: Ainda existem referências a .env no histórico"
else
    echo "   ✅ Arquivos .env removidos do histórico"
fi

echo ""
echo "5. Atualizando .gitignore..."
cat >> .gitignore << 'EOF'

# ============================================
# ARQUIVOS SENSÍVEIS (NÃO COMMITAR!)
# ============================================
.env
.env.local
.env*.local
.env.development
.env.development.local
.env.test
.env.test.local
.env.production
.env.production.local
*.env
*.local

# Chaves e certificados
*.pem
*.key
*.cert
*.p12
secrets/
credentials/

# Backup de banco de dados
*.sql
*.dump
*.backup
EOF

git add .gitignore
git commit -m "security: atualiza .gitignore para prevenir commit de credenciais"

echo ""
echo "=================================================="
echo "✅ PROCESSO CONCLUÍDO!"
echo "=================================================="
echo ""
echo "PRÓXIMOS PASSOS IMPORTANTES:"
echo ""
echo "1. ROTACIONAR TODAS AS CREDENCIAIS:"
echo "   - Supabase: Regenerar DATABASE_URL"
echo "   - NextAuth: Gerar novo NEXTAUTH_SECRET"
echo "   - Supabase: Regenerar ANON_KEY (se possível)"
echo ""
echo "2. Criar novo .env com credenciais NOVAS:"
echo "   cp .env.example .env"
echo "   # Editar .env com as novas credenciais"
echo ""
echo "3. Force push para o remote (AVISE A EQUIPE!):"
echo "   git push origin --force --all"
echo "   git push origin --force --tags"
echo ""
echo "4. Todos os desenvolvedores devem fazer:"
echo "   git pull --rebase"
echo "   # E atualizar seu .env local"
echo ""
echo "=================================================="
