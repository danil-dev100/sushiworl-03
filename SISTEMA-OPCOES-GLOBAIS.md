# 🌍 Sistema de Opções Globais - Documentação Completa

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [O Que Foi Implementado](#o-que-foi-implementado)
4. [Como Usar](#como-usar)
5. [Próximos Passos](#próximos-passos)
6. [API Reference](#api-reference)

---

## 🎯 Visão Geral

Este sistema permite criar opções de produtos **reutilizáveis** que podem ser aplicadas globalmente em:
- ✅ **Todo o site** (todos os produtos)
- ✅ **Categoria específica** (todos produtos da categoria)
- ✅ **Produto específico**

### Benefícios
- 🔄 **Reutilização**: Crie uma opção uma vez, use em múltiplos produtos
- 🎯 **Flexibilidade**: Escolha onde aplicar cada opção
- 📊 **Gestão Centralizada**: Altere uma opção e ela atualiza em todos os lugares
- 💰 **Upsell Inteligente**: Aumente receita com opções pagas estratégicas

---

## 🏗️ Arquitetura do Sistema

### Modelos do Banco de Dados

#### 1. GlobalOption (Opção Global)
Biblioteca central de opções reutilizáveis.

```prisma
model GlobalOption {
  id            String                    @id @default(cuid())
  name          String                    // "Braseado", "Molho Extra"
  type          OptionType                // REQUIRED ou OPTIONAL
  description   String?
  displayAt     DisplayAt                 // SITE ou CART
  isPaid        Boolean                   // Se tem custo adicional
  basePrice     Float                     // Preço base da opção
  isActive      Boolean
  sortOrder     Int

  choices       GlobalOptionChoice[]      // Escolhas da opção
  assignments   GlobalOptionAssignment[]  // Onde está aplicada
}
```

**Exemplo:**
- Nome: "Braseado"
- Tipo: OPTIONAL
- DisplayAt: SITE (aparece no popup de adicionar)
- IsPaid: true
- BasePrice: 1.00€

#### 2. GlobalOptionChoice (Escolha da Opção)
Opções específicas dentro de uma opção global.

```prisma
model GlobalOptionChoice {
  id          String       @id @default(cuid())
  optionId    String
  name        String       // "Sim", "Não", "Quente", "Frio"
  price       Float        // Valor adicional desta escolha
  isDefault   Boolean      // Se é a escolha pré-selecionada
  isActive    Boolean
  sortOrder   Int
}
```

**Exemplo para "Braseado":**
- Escolha 1: "Sim" (price: 0.00€, isDefault: false)
- Escolha 2: "Não" (price: 0.00€, isDefault: true)

#### 3. GlobalOptionAssignment (Atribuição)
Define onde uma opção global está aplicada.

```prisma
model GlobalOptionAssignment {
  id              String         @id @default(cuid())
  globalOptionId  String
  assignmentType  AssignmentType  // SITE_WIDE, CATEGORY, PRODUCT
  targetId        String?         // null se SITE_WIDE
  minSelection    Int
  maxSelection    Int
  allowMultiple   Boolean
  sortOrder       Int
}
```

**Tipos de Atribuição:**
- **SITE_WIDE**: Aplica em todos os produtos (targetId = null)
- **CATEGORY**: Aplica em todos produtos de uma categoria (targetId = categoryId)
- **PRODUCT**: Aplica apenas em um produto (targetId = productId)

---

## ✅ O Que Foi Implementado

### 1. Schema Prisma ✅
- ✅ Modelo `GlobalOption` criado
- ✅ Modelo `GlobalOptionChoice` criado
- ✅ Modelo `GlobalOptionAssignment` criado
- ✅ Enum `AssignmentType` adicionado
- ✅ Relações e índices configurados
- ✅ Cascade deletes implementados

### 2. APIs Backend ✅

#### `/api/global-options` (GET, POST)
```typescript
// GET - Listar todas as opções globais
GET /api/global-options
Response: {
  success: true,
  options: [
    {
      id: "...",
      name: "Braseado",
      type: "OPTIONAL",
      displayAt: "SITE",
      isPaid: true,
      basePrice: 1.00,
      choices: [...],
      assignments: [...]
    }
  ]
}

// POST - Criar nova opção global
POST /api/global-options
Body: {
  name: "Braseado",
  type: "OPTIONAL",
  displayAt: "SITE",
  isPaid: true,
  basePrice: 1.00,
  choices: [
    { name: "Sim", price: 0, isDefault: false },
    { name: "Não", price: 0, isDefault: true }
  ]
}
```

#### `/api/global-options/[id]` (GET, PUT, DELETE)
```typescript
// GET - Buscar opção específica
GET /api/global-options/[id]

// PUT - Atualizar opção
PUT /api/global-options/[id]
Body: { name, type, displayAt, isPaid, basePrice, choices }

// DELETE - Deletar opção (cascade)
DELETE /api/global-options/[id]
```

### 3. Scripts e Ferramentas ✅

#### Script SQL de Migração
**Arquivo:** `scripts/create-global-options-tables.sql`

Este script cria todas as tabelas necessárias no Supabase.

**Como usar:**
1. Abra Supabase SQL Editor
2. Cole o conteúdo do arquivo
3. Execute
4. Verifique: "Tabelas de Opções Globais criadas com sucesso!"

---

## 🚀 Como Usar

### Passo 1: Executar Migração do Banco
```bash
# Opção 1: Execute o SQL manualmente no Supabase
# Arquivo: scripts/create-global-options-tables.sql

# Opção 2 (Não recomendado - problemas com pooler):
npx prisma db push
```

### Passo 2: Criar Opção Global via API

```bash
curl -X POST http://localhost:3000/api/global-options \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Braseado",
    "type": "OPTIONAL",
    "displayAt": "SITE",
    "isPaid": true,
    "basePrice": 1.00,
    "choices": [
      { "name": "Sim", "price": 0, "isDefault": false },
      { "name": "Não", "price": 0, "isDefault": true }
    ]
  }'
```

### Passo 3: Aplicar Opção em Todo o Site

```typescript
// Via API (a ser implementada)
POST /api/global-options/[id]/assignments
{
  "assignmentType": "SITE_WIDE",
  "targetId": null,
  "minSelection": 0,
  "maxSelection": 1,
  "allowMultiple": false
}
```

### Passo 4: Testar no Frontend

A opção aparecerá automaticamente em todos os produtos ao clicar em "Adicionar".

---

## 📝 Próximos Passos (A Implementar)

### APIs Pendentes

#### 1. API de Atribuições
```typescript
// Criar em: src/app/api/global-options/[id]/assignments/route.ts

POST /api/global-options/[id]/assignments
DELETE /api/global-options/[id]/assignments
```

#### 2. API de Busca de Opções (com globais)
```typescript
// Atualizar: src/app/api/products/[id]/options/route.ts
// Deve combinar opções do produto + opções globais aplicadas
```

### Frontend Pendentes

#### 1. Página Admin - Gestão de Opções
```typescript
// Criar em: src/app/admin/opcoes/page.tsx
// Listar, criar, editar, deletar opções globais
// Gerenciar atribuições
```

#### 2. Menu Lateral Admin
```typescript
// Adicionar link no menu de navegação:
{
  name: 'Opções Globais',
  href: '/admin/opcoes',
  icon: ListChecksIcon
}
```

#### 3. Popup Avançado de Opções
```typescript
// Atualizar: src/components/cliente/SimpleProductOptionsDialog.tsx
// Suportar múltiplas opções
// Validar opções obrigatórias
// Calcular preço dinâmico
```

#### 4. Exibição no Carrinho
```typescript
// Mostrar opções selecionadas na descrição dos itens do carrinho
// Incluir no nome do produto se displayAt='CART'
```

---

## 🧪 Teste Completo do Sistema

### Script de Teste
**Criar:** `scripts/test-global-options-system.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testCompleteSystem() {
  console.log('🧪 Testando Sistema de Opções Globais\n');

  try {
    // 1. Criar opção global
    console.log('1️⃣ Criando opção "Braseado"...');
    const option = await prisma.globalOption.create({
      data: {
        name: 'Braseado',
        type: 'OPTIONAL',
        displayAt: 'SITE',
        isPaid: true,
        basePrice: 1.00,
        choices: {
          create: [
            { name: 'Sim', price: 0, isDefault: false },
            { name: 'Não', price: 0, isDefault: true }
          ]
        }
      },
      include: { choices: true }
    });
    console.log('   ✅ Criada:', option.id);

    // 2. Aplicar em todo o site
    console.log('\n2️⃣ Aplicando em todo o site...');
    const assignment = await prisma.globalOptionAssignment.create({
      data: {
        globalOptionId: option.id,
        assignmentType: 'SITE_WIDE',
        minSelection: 0,
        maxSelection: 1
      }
    });
    console.log('   ✅ Aplicada');

    // 3. Buscar produto e verificar opções
    const product = await prisma.product.findFirst();
    if (product) {
      console.log('\n3️⃣ Testando busca para:', product.name);

      // Buscar opções do produto
      const productOptions = await prisma.productOption.findMany({
        where: { productId: product.id, isActive: true },
        include: { choices: true }
      });

      // Buscar opções globais (SITE_WIDE)
      const globalAssignments = await prisma.globalOptionAssignment.findMany({
        where: { assignmentType: 'SITE_WIDE' },
        include: {
          globalOption: {
            include: { choices: true }
          }
        }
      });

      console.log('   📊 Opções do produto:', productOptions.length);
      console.log('   🌍 Opções globais:', globalAssignments.length);
      console.log('   ✅ Total:', productOptions.length + globalAssignments.length);
    }

    console.log('\n✅ Teste concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCompleteSystem();
```

**Executar:**
```bash
npx tsx scripts/test-global-options-system.ts
```

---

## 📚 API Reference

### Endpoints Implementados

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/api/global-options` | Listar todas as opções globais | Não |
| POST | `/api/global-options` | Criar nova opção global | Sim (Admin/Manager) |
| GET | `/api/global-options/[id]` | Buscar opção específica | Não |
| PUT | `/api/global-options/[id]` | Atualizar opção | Sim (Admin/Manager) |
| DELETE | `/api/global-options/[id]` | Deletar opção | Sim (Admin/Manager) |

### Endpoints A Implementar

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/global-options/[id]/assignments` | Criar atribuição | Sim |
| DELETE | `/api/global-options/[id]/assignments` | Remover atribuição | Sim |
| GET | `/api/products/[id]/options?includeGlobal=true` | Buscar opções + globais | Não |

---

## 🔧 Troubleshooting

### Erro: "Cannot find module '@prisma/client'"
```bash
npx prisma generate
```

### Erro: "Table GlobalOption does not exist"
Execute o script SQL no Supabase:
```bash
scripts/create-global-options-tables.sql
```

### Erro: "AssignmentType enum not found"
O enum precisa existir no banco. Execute o SQL de migração.

---

## 💡 Casos de Uso

### Caso 1: Braseado em Todo o Site
```typescript
// Opção: Braseado (+€1.00)
// Atribuição: SITE_WIDE
// Resultado: Aparece em TODOS os produtos no popup
```

### Caso 2: Molho Extra Apenas em Sushi
```typescript
// Opção: Molho Extra (+€0.50)
// Atribuição: CATEGORY (targetId = "sushi-category-id")
// Resultado: Aparece apenas em produtos de sushi
```

### Caso 3: Opção Exclusiva para Um Produto
```typescript
// Opção: Personalização Especial (+€2.00)
// Atribuição: PRODUCT (targetId = "product-xyz")
// Resultado: Aparece apenas no produto específico
```

---

## 📊 Status do Projeto

### ✅ Concluído (30%)
- [x] Schema Prisma com 3 modelos
- [x] Enum AssignmentType
- [x] API GET /global-options
- [x] API POST /global-options
- [x] API GET /global-options/[id]
- [x] API PUT /global-options/[id]
- [x] API DELETE /global-options/[id]
- [x] Script SQL de migração
- [x] Documentação completa

### 🚧 Pendente (70%)
- [ ] API de atribuições
- [ ] API de busca combinada (produto + globais)
- [ ] Página admin de gestão
- [ ] Menu lateral admin
- [ ] Popup avançado com múltiplas opções
- [ ] Exibição no carrinho
- [ ] Testes automatizados
- [ ] UI para gerenciar atribuições

---

## 🎯 Próxima Fase

1. **Executar SQL no Supabase** para criar as tabelas
2. **Implementar API de atribuições**
3. **Criar página admin de gestão visual**
4. **Atualizar API de busca de opções** para combinar produto + globais
5. **Atualizar popup** para suportar múltiplas opções
6. **Implementar exibição no carrinho**

---

**Documentação criada em:** 02/12/2025
**Versão:** 1.0
**Status:** Fundação implementada, funcionalidades avançadas pendentes
