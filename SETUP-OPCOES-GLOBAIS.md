# Setup do Sistema de Opções Globais

## 🚨 IMPORTANTE: Execute ANTES de usar

O sistema de opções globais está **pronto no código**, mas as tabelas precisam ser criadas no banco de dados.

---

## Passo 1: Executar Migration SQL (OBRIGATÓRIO)

### Via Supabase Dashboard (Recomendado)

1. Acesse: https://supabase.com/dashboard
2. Vá em **SQL Editor**
3. Cole e execute o script abaixo:

```sql
-- Criar enum AssignmentType
CREATE TYPE "AssignmentType" AS ENUM ('SITE_WIDE', 'CATEGORY', 'PRODUCT');

-- Criar tabela GlobalOption
CREATE TABLE "GlobalOption" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "type" "OptionType" NOT NULL DEFAULT 'OPTIONAL',
    "description" VARCHAR(150),
    "displayAt" "DisplayAt" NOT NULL DEFAULT 'CART',
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "basePrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalOption_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GlobalOption_isActive_idx" ON "GlobalOption"("isActive");

-- Criar tabela GlobalOptionChoice
CREATE TABLE "GlobalOptionChoice" (
    "id" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalOptionChoice_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GlobalOptionChoice_optionId_idx" ON "GlobalOptionChoice"("optionId");

-- Criar tabela GlobalOptionAssignment
CREATE TABLE "GlobalOptionAssignment" (
    "id" TEXT NOT NULL,
    "globalOptionId" TEXT NOT NULL,
    "assignmentType" "AssignmentType" NOT NULL,
    "targetId" TEXT,
    "minSelection" INTEGER NOT NULL DEFAULT 0,
    "maxSelection" INTEGER NOT NULL DEFAULT 1,
    "allowMultiple" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalOptionAssignment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GlobalOptionAssignment_globalOptionId_idx" ON "GlobalOptionAssignment"("globalOptionId");
CREATE INDEX "GlobalOptionAssignment_assignmentType_idx" ON "GlobalOptionAssignment"("assignmentType");
CREATE INDEX "GlobalOptionAssignment_targetId_idx" ON "GlobalOptionAssignment"("targetId");

CREATE UNIQUE INDEX "GlobalOptionAssignment_globalOptionId_assignmentType_targetId_key"
    ON "GlobalOptionAssignment"("globalOptionId", "assignmentType", "targetId");

-- Adicionar Foreign Keys
ALTER TABLE "GlobalOptionChoice"
    ADD CONSTRAINT "GlobalOptionChoice_optionId_fkey"
    FOREIGN KEY ("optionId") REFERENCES "GlobalOption"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE "GlobalOptionAssignment"
    ADD CONSTRAINT "GlobalOptionAssignment_globalOptionId_fkey"
    FOREIGN KEY ("globalOptionId") REFERENCES "GlobalOption"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;

SELECT 'Tabelas de Opções Globais criadas com sucesso!' AS status;
```

**OU** use o script pronto:
```bash
# Copie o conteúdo de scripts/create-global-options-tables.sql
# e execute no Supabase SQL Editor
```

---

## Passo 2: Criar Opção de Teste

Após executar a migration SQL, execute:

```bash
npx tsx scripts/create-test-option.ts
```

Isso criará uma opção de teste chamada "Braseado" aplicada em todo o site.

---

## Passo 3: Verificar Funcionamento

### 1. Acessar Admin

Acesse: http://localhost:3000/admin

Você deve ver o ícone **"Opções"** no menu lateral (entre "Cardápio" e "Usuários").

### 2. Ver Opções Globais

Clique em **"Opções"** no menu.

Você deve ver:
- 📊 Estatísticas (Total, Ativas, Com Atribuições)
- 📋 Lista da opção "Braseado"

### 3. Testar no Cardápio

1. Acesse: http://localhost:3000/cardapio
2. Clique em "Adicionar" em qualquer produto
3. O popup deve mostrar a opção "Braseado" com duas escolhas:
   - "Sim, brasear"
   - "Não, obrigado" (padrão)

---

## Estrutura do Sistema

### Arquivos Criados/Modificados

#### Backend (APIs)
- ✅ `/src/app/api/global-options/route.ts` - GET, POST
- ✅ `/src/app/api/global-options/[id]/route.ts` - GET, PUT, DELETE
- ✅ `/src/app/api/global-options/[id]/assignments/route.ts` - POST, DELETE
- ✅ `/src/app/api/products/[id]/options/route.ts` - Atualizado para incluir opções globais

#### Frontend (Admin)
- ✅ `/src/app/(admin)/opcoes/page.tsx` - Página de gestão
- ✅ `/src/components/admin/AdminSidebar.tsx` - Menu lateral atualizado

#### Database
- ✅ `prisma/schema.prisma` - Models adicionados
- ✅ `scripts/create-global-options-tables.sql` - Migration SQL
- ✅ `scripts/create-test-option.ts` - Script de teste

---

## Como Funciona

### 1. Criar Opção Global (Biblioteca)

Crie opções reutilizáveis como:
- "Braseado" (Sim/Não)
- "Wasabi" (Sem/Pouco/Muito)
- "Shoyu" (Com/Sem)

### 2. Atribuir onde Aplicar

Aplique a opção em:
- **SITE_WIDE**: Todos os produtos
- **CATEGORY**: Produtos de uma categoria (ex: "Sushi")
- **PRODUCT**: Produto específico

### 3. Opção Aparece Automaticamente

A opção aparece:
- **displayAt = 'SITE'**: No popup de adicionar ao carrinho
- **displayAt = 'CART'**: Na descrição do produto no carrinho

---

## APIs Disponíveis

### Listar Opções
```bash
GET /api/global-options
```

### Criar Opção
```bash
POST /api/global-options
{
  "name": "Braseado",
  "type": "OPTIONAL",
  "description": "Quer brasear?",
  "displayAt": "SITE",
  "isPaid": false,
  "basePrice": 0,
  "choices": [
    { "name": "Sim", "price": 0, "isDefault": false },
    { "name": "Não", "price": 0, "isDefault": true }
  ]
}
```

### Criar Atribuição
```bash
POST /api/global-options/{id}/assignments
{
  "assignmentType": "SITE_WIDE",
  "minSelection": 0,
  "maxSelection": 1,
  "allowMultiple": false
}
```

### Buscar Opções de um Produto
```bash
GET /api/products/{productId}/options?displayAt=SITE
```

Retorna opções específicas do produto + opções globais aplicadas.

---

## Solução de Problemas

### Erro: "Table GlobalOption does not exist"

**Causa**: Migration SQL não foi executada.

**Solução**: Execute o script SQL no Supabase (Passo 1 acima).

---

### Menu "Opções" não aparece

**Causa**: Servidor dev não foi reiniciado.

**Solução**:
```bash
# Ctrl+C para parar o servidor
npm run dev
```

---

### Opções não aparecem no popup

**Verificar**:
1. A opção tem `displayAt = 'SITE'`
2. Existe uma atribuição (SITE_WIDE, CATEGORY ou PRODUCT)
3. A opção está ativa (`isActive = true`)

**Debug**:
```bash
# Console do navegador (F12)
# Deve mostrar logs:
# [Public Options API] 🔍 Buscando opções para produto: xxx
# [Public Options API] 🌍 Opções globais: 1
```

---

## Status Atual

### ✅ Completo (Backend)
- Schema Prisma com 3 tabelas
- APIs REST completas
- Lógica de atribuições
- Integração com opções de produtos

### ✅ Completo (Admin UI Básico)
- Menu lateral com ícone "Opções"
- Página de listagem de opções
- Visualização de estatísticas
- Ação de deletar opção

### ⏳ Pendente (Admin UI Avançado)
- Dialog para criar opção
- Dialog para editar opção
- Interface para gerenciar atribuições
- Filtros e busca

### ⏳ Pendente (Frontend Cliente)
- Popup atualizado para múltiplas opções *(já funciona com API)*
- Exibição no carrinho (`displayAt = 'CART'`)

---

## Próximos Passos

1. **Executar migration SQL** (Passo 1)
2. **Criar opção de teste** (Passo 2)
3. **Testar sistema** (Passo 3)
4. **Criar opções reais** (via API ou futura UI)
5. **Implementar UI de criação/edição** (próxima fase)

---

## Documentação Completa

Para detalhes completos sobre arquitetura, exemplos e casos de uso, consulte:
- `SISTEMA-OPCOES-GLOBAIS.md` - Documentação técnica completa
