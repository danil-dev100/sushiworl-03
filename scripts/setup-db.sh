#!/bin/bash

echo "🚀 Configurando banco de dados SushiWorld..."
echo ""

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "Por favor, crie um arquivo .env baseado no .env.example"
    exit 1
fi

# Gerar Prisma Client
echo "📦 Gerando Prisma Client..."
npx prisma generate

# Criar migration
echo "🔄 Criando migration..."
npx prisma migrate dev --name init

# Executar seed
echo "🌱 Populando banco de dados..."
npx prisma db seed

echo ""
echo "✅ Banco de dados configurado com sucesso!"
echo ""
echo "📝 Credenciais de acesso:"
echo "   Email: admin@sushiworld.pt"
echo "   Senha: 123sushi"
echo ""
echo "⚠️  IMPORTANTE: Altere a senha no primeiro login!"

