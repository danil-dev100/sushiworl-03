# Próximos Passos - Configuração dos Produtos

## ✅ O que foi feito

1. **Seed Completo Criado**: Arquivo `prisma/seed.ts` atualizado com todos os 78 produtos do cardápio
2. **Imagens Mapeadas**: Cada produto está vinculado à sua imagem correspondente em `/produtos.webp/[numero].webp`
3. **Opções Extras**: Configurado opção "Braseado" para os produtos:
   - SKU 17: Salmão Neta Phila (+€2,50)
   - SKU 42: Nigiri Salmão (+€2,50)
   - SKU 43: Nigiri Atum (+€2,50)
   - SKU 75: Gunkan Salmão Phila Maracujá (+€2,50)
   - SKU 76: Gunkan Salmão Queijo Brie (+€2,50)
   - SKU 8: Special Salmon (+€1,00)
4. **API Route**: Criada rota `/api/products` para buscar produtos do banco
5. **Prisma Client**: Configurado em `src/lib/prisma.ts`

## 🔧 O que você precisa fazer agora

### 1. Configurar o Banco de Dados

Certifique-se de que o PostgreSQL está rodando e configure o arquivo `.env`:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/sushiworld"
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
NEXTAUTH_URL="http://localhost:3000"

# Supabase (para upload de imagens)
NEXT_PUBLIC_SUPABASE_URL="sua-url-do-supabase"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sua-chave-anonima"
SUPABASE_SERVICE_ROLE_KEY="sua-chave-de-servico"
```

### 2. Executar Migrações e Seed

```bash
# Gerar o Prisma Client
npx prisma generate

# Executar migrações
npm run db:migrate

# Popular o banco com os produtos
npm run db:seed
```

### 3. Verificar os Produtos

Após executar o seed, você pode verificar os produtos de duas formas:

**Opção 1: Prisma Studio**
```bash
npm run db:studio
```

**Opção 2: API Route**
- Inicie o servidor: `npm run dev`
- Acesse: `http://localhost:3000/api/products`
- Para produtos em destaque: `http://localhost:3000/api/products?featured=true`
- Para mais vendidos: `http://localhost:3000/api/products?topSeller=true`
- Por categoria: `http://localhost:3000/api/products?category=Combinados`

## 📦 Estrutura dos Produtos

### Categorias (em ordem):
1. **Entradas** (7 produtos: SKU 16-22)
2. **Temaki** (6 produtos: SKU 23-28)
3. **Hossomaki** (6 produtos: SKU 49-54)
4. **Sashimi** (4 produtos: SKU 45-48)
5. **Poke** (6 produtos: SKU 36-41)
6. **Gunkan** (3 produtos: SKU 75-77)
7. **Uramaki** (não listado no cardápio fornecido)
8. **Nigiri** (3 produtos: SKU 42-44)
9. **Futomaki** (5 produtos: SKU 55-59)
10. **Hot Roll** (7 produtos: SKU 29-35)
11. **Combinados** (11 produtos: SKU 1-4, 8-15)

### Total: 58 produtos únicos

### Produtos em Destaque (isFeatured: true):
- SKU 1: Gunkan Mix 10 Peças
- SKU 2: Hot Mix 22 Peças
- SKU 4: Veggie 20 Peças
- SKU 42: Nigiri Salmão 4 Peças

### Mais Vendidos (isTopSeller: true):
- SKU 1: Gunkan Mix 10 Peças
- SKU 2: Hot Mix 22 Peças
- SKU 3: Mini World 15 Peças

## 🖼️ Imagens dos Produtos

As imagens estão em `public/produtos.webp/` e seguem o padrão:
- `1.webp` = Produto SKU "1"
- `2.webp` = Produto SKU "2"
- etc.

## 🔐 Credenciais de Acesso Admin

Após executar o seed:
- **Email**: admin@sushiworld.pt
- **Senha**: 123sushi

⚠️ **IMPORTANTE**: Altere a senha no primeiro login!

## 📝 Notas Importantes

1. **Alérgenos**: Todos os produtos têm seus alérgenos configurados
2. **Preços**: Todos em euros (€) com IVA incluído (13%)
3. **Opção Braseado**: Aparece automaticamente no popup ao adicionar produtos que têm essa opção
4. **Imagens**: Certifique-se de que todas as imagens estão na pasta `public/produtos.webp/`

## 🚀 Próxima Fase

Após configurar o banco e verificar que os produtos estão corretos:
1. Atualizar as páginas do front-end para buscar produtos da API
2. Implementar o popup de opções extras
3. Testar o fluxo completo de compra
4. Configurar o Supabase para upload de imagens do admin

## ❓ Problemas Comuns

### Erro: "Can't reach database server"
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no arquivo `.env`
- Teste a conexão: `psql -U usuario -d sushiworld`

### Erro: "Invalid `prisma.xxx.deleteMany()`"
- Execute: `npx prisma generate`
- Reinicie o terminal

### Imagens não aparecem
- Verifique se as imagens estão em `public/produtos.webp/`
- Confirme que os nomes dos arquivos correspondem aos SKUs
- Reinicie o servidor Next.js

