# 🗄️ Configuração do Supabase Storage para Upload de Imagens

## 🎯 Objetivo

Configurar um bucket no Supabase Storage para armazenar imagens de produtos, pois a Vercel não permite salvar arquivos localmente em produção.

---

## 📋 Pré-requisitos

- Conta Supabase ativa
- Projeto Supabase já criado
- Variáveis de ambiente já configuradas:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 🔧 Passo a Passo

### 1️⃣ Acessar o Supabase Dashboard

1. Acesse: https://app.supabase.com/
2. Faça login
3. Selecione seu projeto

### 2️⃣ Criar o Bucket "produtos"

1. No menu lateral, clique em **Storage**
2. Clique em **"New bucket"** ou **"Create bucket"**
3. Configure o bucket:

```
Nome: produtos
```

4. **IMPORTANTE:** Marque como **"Public bucket"** ✅
   - Isso permite que as URLs das imagens sejam acessíveis publicamente
   - Necessário para exibir as imagens no site

5. Clique em **"Create bucket"**

### 3️⃣ Configurar Políticas de Acesso (RLS)

Agora você precisa configurar as políticas de acesso para permitir:
- ✅ Qualquer pessoa pode VER as imagens (read)
- ✅ Apenas ADMINS podem fazer UPLOAD (insert)
- ✅ Apenas ADMINS podem DELETAR (delete)

#### Opção A: Via Interface (Recomendado)

1. Clique no bucket **"produtos"** que você criou
2. Vá para a aba **"Policies"**
3. Clique em **"New policy"**

**Política 1: Permitir leitura pública**
```
Policy name: Public Access
Allowed operation: SELECT
Target roles: public
Policy definition: true
```

SQL gerado:
```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'produtos');
```

**Política 2: Permitir upload para autenticados**
```
Policy name: Authenticated Upload
Allowed operation: INSERT
Target roles: authenticated
Policy definition: true
```

SQL gerado:
```sql
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'produtos');
```

**Política 3: Permitir deleção para autenticados**
```
Policy name: Authenticated Delete
Allowed operation: DELETE
Target roles: authenticated
Policy definition: true
```

SQL gerado:
```sql
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'produtos');
```

#### Opção B: Via SQL Editor (Alternativa)

1. No menu lateral, clique em **SQL Editor**
2. Clique em **"New query"**
3. Cole o seguinte SQL:

```sql
-- Permitir leitura pública de imagens
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'produtos');

-- Permitir upload para usuários autenticados
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'produtos');

-- Permitir deleção para usuários autenticados
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'produtos');
```

4. Clique em **"Run"**

### 4️⃣ Verificar Variáveis de Ambiente

Certifique-se de que as variáveis estão configuradas:

**Arquivo `.env.local` (desenvolvimento):**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_publica_anon
```

**Vercel (produção):**
1. Acesse: https://vercel.com/seu-usuario/seu-projeto
2. Vá em **Settings** → **Environment Variables**
3. Verifique se existem:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Se não existirem, adicione-as com os mesmos valores do `.env.local`

---

## ✅ Testar a Configuração

### Teste 1: Upload Manual no Supabase

1. Vá em **Storage** → **produtos**
2. Clique em **"Upload file"**
3. Faça upload de uma imagem qualquer
4. Clique na imagem → **"Get URL"**
5. Copie a URL e abra em uma nova aba
6. **Resultado esperado:** A imagem deve carregar ✅

### Teste 2: Upload via Site

1. Acesse: `/admin/cardapio`
2. Clique em **"Adicionar Produto"**
3. Clique em **"Fazer Upload da Imagem"**
4. Selecione uma imagem
5. **Resultado esperado:**
   - Upload bem-sucedido ✅
   - Preview da imagem aparece ✅
   - Toast de sucesso ✅

### Teste 3: Salvar Produto

1. Preencha todos os campos obrigatórios
2. Clique em **"Salvar"**
3. **Resultado esperado:**
   - Produto criado com sucesso ✅
   - Imagem aparece no card do produto ✅

---

## 🐛 Troubleshooting

### Erro: "Bucket não encontrado"

**Sintoma:** `Error: Bucket produtos does not exist`

**Solução:**
1. Verifique se criou o bucket com o nome exato: `produtos` (minúsculo)
2. Verifique se está no projeto correto do Supabase

### Erro: "Não autorizado para fazer upload"

**Sintoma:** `Error: new row violates row-level security policy`

**Solução:**
1. Verifique se criou as políticas de acesso (Passo 3)
2. Certifique-se de que está logado no sistema
3. Verifique se o JWT token está sendo enviado corretamente

### Erro: "Imagem não carrega (404)"

**Sintoma:** URL da imagem retorna 404

**Solução:**
1. Verifique se o bucket está marcado como **"Public"**
2. Verifique se a política de leitura pública existe
3. Verifique se a URL está correta:
   ```
   https://SEU_PROJETO.supabase.co/storage/v1/object/public/produtos/arquivo.jpg
   ```

### Erro: "Variáveis de ambiente não encontradas"

**Sintoma:** `Missing Supabase environment variables`

**Solução:**
1. Verifique `.env.local` em desenvolvimento
2. Verifique **Environment Variables** na Vercel
3. Faça redeploy na Vercel após adicionar variáveis

---

## 📊 Estrutura de URLs

### URL Pública da Imagem
```
https://SEU_PROJETO.supabase.co/storage/v1/object/public/produtos/produto-1234567890.webp
```

### Estrutura
- `SEU_PROJETO.supabase.co` - Seu projeto Supabase
- `/storage/v1/object/public/` - Endpoint público
- `produtos/` - Nome do bucket
- `produto-1234567890.webp` - Nome do arquivo

---

## 🔒 Segurança

### ✅ Configuração Segura

- [x] Bucket público (apenas leitura)
- [x] Upload apenas para autenticados
- [x] Deleção apenas para autenticados
- [x] URLs não expõem credenciais
- [x] ANON_KEY é segura para uso público

### ⚠️ Não Fazer

- ❌ **NÃO** usar `SERVICE_ROLE_KEY` no frontend
- ❌ **NÃO** permitir upload anônimo
- ❌ **NÃO** permitir deleção pública
- ❌ **NÃO** armazenar informações sensíveis nas imagens

---

## 📝 Checklist Final

Antes de fazer deploy:

- [ ] Bucket "produtos" criado
- [ ] Bucket marcado como "Public"
- [ ] Políticas de acesso configuradas
- [ ] Variáveis de ambiente no `.env.local`
- [ ] Variáveis de ambiente na Vercel
- [ ] Teste de upload manual no Supabase - OK
- [ ] Teste de upload via site (local) - OK
- [ ] Deploy na Vercel realizado
- [ ] Teste de upload via site (produção) - OK

---

## 🎉 Após Configuração

Depois de seguir todos os passos, o sistema funcionará assim:

1. **Desenvolvimento (localhost):**
   - Upload via `@supabase/supabase-js`
   - Imagens salvas no Supabase Storage
   - URLs públicas acessíveis

2. **Produção (Vercel):**
   - Upload via `@supabase/supabase-js`
   - Imagens salvas no Supabase Storage
   - URLs públicas acessíveis
   - **SEM erros de file system read-only** ✅

---

**Data:** 02 de janeiro de 2025
**Status:** Aguardando configuração do bucket
