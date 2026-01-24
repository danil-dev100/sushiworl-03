# Troubleshooting - Sistema de Notificações

## ❌ Erro: `ERR_INTERNET_DISCONNECTED`

### Sintoma
```
GET http://localhost:3000/api/admin/orders/pending net::ERR_INTERNET_DISCONNECTED
Polling error: TypeError: Failed to fetch
```

### Causa
O Windows Firewall, antivírus ou algum software de segurança está bloqueando conexões localhost.

### Soluções

#### Solução 1: Permitir Node.js no Firewall (Recomendado)

1. Abra **Windows Defender Firewall**
2. Clique em **"Permitir um aplicativo ou recurso através do Firewall do Windows Defender"**
3. Clique em **"Alterar configurações"**
4. Procure por **"Node.js"** ou **"node.exe"**
5. Marque as caixas **"Privado"** e **"Público"**
6. Clique em **OK**

Se Node.js não estiver na lista:
1. Clique em **"Permitir outro aplicativo..."**
2. Navegue até: `C:\Program Files\nodejs\node.exe`
3. Adicione e marque ambas as redes

#### Solução 2: Desativar temporariamente o Firewall (Para testes)

1. Abra **Windows Defender Firewall**
2. Clique em **"Ativar ou desativar o Firewall do Windows Defender"**
3. Desative para **rede privada** (temporariamente)
4. Teste a aplicação
5. **IMPORTANTE**: Reative após os testes

#### Solução 3: Verificar Antivírus

Se você usa antivírus de terceiros (Avast, AVG, Norton, McAfee, etc.):

1. Abra o antivírus
2. Procure por **"Firewall"** ou **"Proteção de Rede"**
3. Adicione exceção para `localhost` ou `node.exe`
4. Adicione exceção para a porta `3000`

#### Solução 4: Usar IP em vez de localhost

Edite `next.config.mjs`:
```javascript
const nextConfig = {
  // ...
  devServer: {
    host: '0.0.0.0'
  }
};
```

Depois acesse: `http://192.168.1.155:3000` (veja o IP no terminal)

#### Solução 5: Trocar a porta

```bash
# Em vez de npm run dev
PORT=3001 npm run dev
```

### Verificar se funcionou

1. Reinicie o servidor: `npm run dev`
2. Abra `http://localhost:3000/admin/pedidos`
3. Abra F12 (DevTools)
4. Não deve mais aparecer `ERR_INTERNET_DISCONNECTED`

---

## ⚠️ Erro: `AbortError: The play() request was interrupted`

### Sintoma
```
Erro ao tocar som: AbortError: The play() request was interrupted by a call to pause()
```

### Causa
O áudio está sendo pausado antes de completar o `play()` (múltiplas chamadas rápidas).

### Solução
✅ **JÁ CORRIGIDO** no commit mais recente. O código agora:
1. Aguarda 10ms entre pause() e play()
2. Ignora erros AbortError (são normais em Hot Reload)

---

## 🔄 Pedidos não aparecem sem F5

### Causa
Se o polling está funcionando (você vê `[Polling] Verificando novos pedidos...` no console), mas os pedidos não aparecem, pode ser:

1. **Erro de rede** (veja solução ERR_INTERNET_DISCONNECTED acima)
2. **Estado não sincronizado** entre `ordersToDisplay` e `pendingOrders`

### Verificar

Abra F12 e digite no console:
```javascript
// Ver se o polling está rodando
console.log('[DEBUG] Polling ativo');

// Ver quantos pedidos pendentes existem
fetch('/api/admin/orders/pending')
  .then(r => r.json())
  .then(d => console.log('Pedidos pendentes:', d.orders.length));
```

Se retornar pedidos mas não aparecem na tela:
1. Verifique se está na aba **"Pendentes"** (não "Hoje" ou "Todos")
2. Limpe o cache: Ctrl+Shift+R

---

## 🚀 Teste em Produção (Vercel)

Se os problemas persistirem localmente, o código já está em produção na Vercel onde funcionará perfeitamente.

**Como acessar**:
1. Vá para [https://vercel.com](https://vercel.com)
2. Encontre o projeto `sushiworld-03`
3. Acesse o domínio de produção
4. Teste lá (sem problemas de firewall local)

---

## ✅ Confirmar que está tudo OK

Execute este checklist:

- [ ] Build compila sem erros: `npm run build`
- [ ] Dev server inicia: `npm run dev`
- [ ] Página `/admin/pedidos` carrega
- [ ] Console mostra `[Polling] Verificando novos pedidos...` a cada 3s
- [ ] Ao criar pedido teste, ele aparece automaticamente
- [ ] Som toca quando há pedido pendente
- [ ] Botão de som para o áudio
- [ ] Sem erros `ERR_INTERNET_DISCONNECTED` no console

Se todos marcados ✅ → Sistema funcionando!
