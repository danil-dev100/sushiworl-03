# 📝 Comandos para Enviar ao GitHub

## ✅ Checklist Pré-Commit

- [x] `.gitignore` configurado
- [x] `.env.example` criado (sem dados sensíveis)
- [x] `.env.local` NÃO será commitado
- [x] Documentação criada
- [x] Código testado localmente

---

## 🚀 Comandos Git

### 1. Verificar Status

```bash
git status
```

### 2. Adicionar Todos os Arquivos

```bash
git add .
```

### 3. Verificar o que será Commitado

```bash
git status
```

**Certifique-se que `.env.local` NÃO aparece na lista!**

### 4. Fazer Commit

```bash
git commit -m "🎉 feat: Implementa painel admin completo com gestão de pedidos e configurações"
```

### 5. Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. Nome: `sushiworld` (ou outro nome)
3. Descrição: `Sistema de delivery de sushi com painel administrativo`
4. Visibilidade: **Private** (recomendado)
5. **NÃO** inicialize com README, .gitignore ou licença
6. Clique em "Create repository"

### 6. Conectar ao Repositório Remoto

```bash
# Substitua SEU_USUARIO pelo seu username do GitHub
git remote add origin https://github.com/SEU_USUARIO/sushiworld.git
```

### 7. Verificar Conexão

```bash
git remote -v
```

Deve mostrar:
```
origin  https://github.com/SEU_USUARIO/sushiworld.git (fetch)
origin  https://github.com/SEU_USUARIO/sushiworld.git (push)
```

### 8. Enviar para o GitHub

```bash
git branch -M main
git push -u origin main
```

---

## 📦 O que Será Enviado

### ✅ Arquivos que SERÃO commitados:

- ✅ Código fonte (`/src`)
- ✅ Componentes (`/components`)
- ✅ Páginas (`/app`)
- ✅ APIs (`/api`)
- ✅ Schema Prisma (`/prisma`)
- ✅ Imagens dos produtos (`/public/produtos.webp/`)
- ✅ Logo (`/public/logo.webp/`)
- ✅ Scripts (`/scripts`)
- ✅ Documentação (`*.md`)
- ✅ Configurações (`package.json`, `tsconfig.json`, etc.)
- ✅ `.env.example` (sem dados sensíveis)
- ✅ `.gitignore`

### ❌ Arquivos que NÃO serão commitados:

- ❌ `.env.local` (dados sensíveis)
- ❌ `.env` (dados sensíveis)
- ❌ `/node_modules/` (dependências)
- ❌ `/.next/` (build)
- ❌ Senhas e tokens
- ❌ Chaves de API

---

## 🔄 Commits Futuros

### Adicionar Novas Alterações

```bash
# Ver o que mudou
git status

# Adicionar arquivos específicos
git add src/components/NovoComponente.tsx

# Ou adicionar tudo
git add .

# Commit
git commit -m "✨ feat: Adiciona novo componente"

# Push
git push origin main
```

### Tipos de Commit (Conventional Commits)

```bash
# Nova funcionalidade
git commit -m "✨ feat: Adiciona gestão de produtos"

# Correção de bug
git commit -m "🐛 fix: Corrige erro no cálculo de IVA"

# Documentação
git commit -m "📝 docs: Atualiza README"

# Estilo/formatação
git commit -m "💄 style: Ajusta cores do tema"

# Refatoração
git commit -m "♻️ refactor: Melhora estrutura de código"

# Performance
git commit -m "⚡️ perf: Otimiza queries do Prisma"

# Testes
git commit -m "✅ test: Adiciona testes unitários"
```

---

## 🌐 Deploy na Vercel

### Após Push para GitHub:

1. Acesse: https://vercel.com/new
2. Clique em "Import Git Repository"
3. Selecione o repositório `sushiworld`
4. Configure as variáveis de ambiente:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (https://seu-dominio.vercel.app)
5. Clique em "Deploy"

### Vercel fará deploy automático a cada push!

---

## 🔍 Verificar Antes do Push

### 1. Verificar .gitignore

```bash
cat .gitignore
```

Deve conter:
```
.env*.local
.env
node_modules/
.next/
```

### 2. Verificar se .env.local está ignorado

```bash
git status
```

**Se `.env.local` aparecer, PARE e adicione ao .gitignore!**

### 3. Verificar arquivos a serem commitados

```bash
git diff --cached --name-only
```

---

## 🆘 Problemas Comuns

### Erro: "fatal: remote origin already exists"

```bash
# Remover origin existente
git remote remove origin

# Adicionar novamente
git remote add origin https://github.com/SEU_USUARIO/sushiworld.git
```

### Erro: "failed to push some refs"

```bash
# Forçar push (cuidado!)
git push -f origin main
```

### Commitou .env.local por engano?

```bash
# Remover do Git (mas manter no disco)
git rm --cached .env.local

# Commit
git commit -m "🔒 security: Remove .env.local do repositório"

# Push
git push origin main
```

---

## ✅ Checklist Final

Antes de fazer push:

- [ ] `.env.local` está no `.gitignore`
- [ ] `git status` não mostra `.env.local`
- [ ] Código testado localmente
- [ ] Build funciona (`npm run build`)
- [ ] Commit message descritivo
- [ ] Repositório criado no GitHub
- [ ] Remote configurado

Após push:

- [ ] Código aparece no GitHub
- [ ] `.env.local` NÃO aparece no GitHub
- [ ] README.md visível
- [ ] Imagens commitadas

---

## 📞 Suporte

Se tiver problemas:

1. Verifique o `.gitignore`
2. Rode `git status`
3. Leia as mensagens de erro
4. Consulte a documentação

---

**Última atualização**: 11/11/2025

