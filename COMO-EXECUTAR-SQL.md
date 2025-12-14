# 🚀 COMO EXECUTAR O SQL NO SUPABASE

## 📋 PASSO A PASSO (3 minutos)

### 1. Abrir Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Login (se necessário)
3. Selecione seu projeto: **wmuprrgmczfkihqvqrph**

---

### 2. Abrir SQL Editor

1. No menu lateral esquerdo, clique em **SQL Editor**
2. Clique no botão **New Query** (+ Nova Query)

---

### 3. Copiar e Colar o SQL

1. Abra o arquivo: **[supabase-realtime-setup.sql](supabase-realtime-setup.sql)**
2. **Selecione TODO o conteúdo** (Ctrl+A)
3. **Copie** (Ctrl+C)
4. **Cole** no SQL Editor do Supabase (Ctrl+V)

---

### 4. Executar o SQL

1. Clique no botão **Run** (ou pressione Ctrl+Enter)
2. Aguarde 2-3 segundos
3. ✅ Você deve ver mensagem de sucesso

---

### 5. Verificar Resultado

No final da execução, você deve ver 3 tabelas de resultado:

**Tabela 1: Realtime Habilitado**
```
| schemaname | tablename | pubname            |
|------------|-----------|-------------------|
| public     | orders    | supabase_realtime |
```

**Tabela 2: RLS Habilitado**
```
| tablename | rowsecurity |
|-----------|-------------|
| orders    | true        |
```

**Tabela 3: Policies Criadas**
```
| policyname                           | permissive | roles              | cmd    |
|--------------------------------------|------------|--------------------|--------|
| Permitir SELECT público para testes | true       | {anon,authenticated} | SELECT |
| Permitir INSERT público             | true       | {anon,authenticated} | INSERT |
| Permitir UPDATE público para testes | true       | {anon,authenticated} | UPDATE |
```

---

## ✅ PRONTO! Agora teste:

1. Acesse: http://localhost:3000/admin/pedidos?status=pending
2. Abra Console (F12)
3. Procure por:
   ```
   [REALTIME] 🚀 Conectando ao Supabase Realtime...
   [REALTIME] ✅ Conectado com sucesso!
   ```
4. Banner verde deve mostrar: **🟢 CONECTADO**

---

## 🧪 Testar Novo Pedido

1. Crie um novo pedido (site ou API)
2. Pedido deve aparecer **INSTANTANEAMENTE** sem F5
3. Som toca automaticamente

---

## ❌ Se der erro

### Erro: "permission denied for table orders"

**Causa:** RLS bloqueando
**Solução:** Execute o SQL novamente, ele tem DROP POLICY antes de criar

### Erro: "relation orders does not exist"

**Causa:** Tabela orders não existe
**Solução:** Verifique se a tabela existe em Database > Tables

### Erro: "publication supabase_realtime does not exist"

**Causa:** Realtime não habilitado no projeto
**Solução:** Vá em Database > Replication e habilite Realtime

---

## 🔒 IMPORTANTE - SEGURANÇA

⚠️ O SQL atual usa **policies públicas** para facilitar o teste.

**Depois de testar e funcionar:**

1. Abra [supabase-realtime-setup.sql](supabase-realtime-setup.sql)
2. Vá até a seção **"POLICIES DE PRODUÇÃO"** (linha ~65)
3. Descomente o bloco de código
4. Execute novamente no SQL Editor
5. Isso vai restringir acesso apenas para admins autenticados

---

## 📞 Precisa de Ajuda?

Se algo não funcionar:

1. Tire print do erro no Supabase
2. Copie os logs do console (F12)
3. Me envie para eu ajudar

---

**Tempo estimado:** 3 minutos
**Dificuldade:** Fácil 🟢
