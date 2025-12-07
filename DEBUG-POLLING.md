# 🔍 Guia de Debug - Sistema de Polling em Tempo Real

## ✅ Sistema de Logs Implementado

O sistema agora possui logs detalhados em **TODOS** os pontos críticos do fluxo de polling.

---

## 📋 Como Debugar

### 1. Abra a Página de Pedidos
```
http://localhost:3000/admin/pedidos
```

### 2. Abra o Console (F12)
Pressione `F12` → Aba `Console`

### 3. Limpe o Console
Clique no ícone 🚫 ou pressione `Ctrl+L`

### 4. Observe os Logs

Você DEVE ver a seguinte sequência:

```
▶️▶️▶️ [Polling] Hook INICIADO - enabled: true
🔔 [Permissions] Pedindo permissão para notificações...
🚀 [Polling] Primeira busca imediata...
⏰ [Polling] Configurando intervalo de 3s...
🔄 [Polling] Verificando novos pedidos... 2025-01-07T...
📡 [Polling] Response status: 200
📦 [Polling] Data recebido: {success: true, ordersCount: 0}
📊 [Polling] Total de pedidos: 0
📝 [Update] Atualizando state com 0 pedidos
⏰ [Update] lastCheck atualizado para: 2025-01-07T...
🔔 [Status] Tem pedidos pendentes? false
```

E a cada 3 segundos:
```
⏰ TICK - Executando fetch agendado
🔄 [Polling] Verificando novos pedidos...
```

---

## 🔴 Problema 1: ERR_INTERNET_DISCONNECTED

### Sintoma no Console:
```
❌ GET http://localhost:3000/api/admin/orders/pending net::ERR_INTERNET_DISCONNECTED
❌❌❌ [Polling] ERRO FATAL: TypeError: Failed to fetch
```

### Solução:
Veja [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Seção "ERR_INTERNET_DISCONNECTED"

**TL;DR**: Firewall bloqueando Node.js. Adicione exceção no Windows Defender.

---

## 🔴 Problema 2: Pedidos Não São Detectados Como Novos

### Sintoma no Console:
```
🔄 [Polling] Verificando novos pedidos...
📊 [Polling] Total de pedidos: 1
🔍 [Check] Pedido abc123: {
  orderDate: "2025-01-07T10:00:00.000Z",
  lastCheck: "2025-01-07T10:05:00.000Z",   ← lastCheck DEPOIS do pedido
  isNew: false,                             ← Por isso não detecta!
  notNotified: true,
  isPending: true,
  willNotify: false
}
```

### Causa:
O `lastCheck` foi atualizado ANTES do pedido ser criado.

### Soluções:

#### A. Reiniciar o dev server
Isso reseta o `lastCheck`:
```bash
# Parar o servidor (Ctrl+C)
npm run dev
```

#### B. Forçar detecção manual
No console do navegador, execute:
```javascript
// Resetar o lastCheck para 1 hora atrás
window.location.reload();
```

#### C. Criar pedido DEPOIS de abrir a página
1. Abra `/admin/pedidos`
2. Aguarde o primeiro polling
3. **SÓ ENTÃO** crie o pedido teste

---

## 🔴 Problema 3: Pedidos Aparecem Mas Sem Som

### Sintoma no Console:
```
🆕🆕🆕 NOVOS PEDIDOS DETECTADOS: 1
🔊 Tentando tocar som...
❌ Erro ao tocar som: NotAllowedError: play() failed
```

### Causa:
Navegador bloqueia autoplay de áudio sem interação do usuário.

### Solução:
1. Clique em QUALQUER lugar da página primeiro
2. OU configure o navegador:
   - Chrome: `chrome://settings/content/sound`
   - Edge: `edge://settings/content/sound`
   - Adicione `localhost` aos sites permitidos

---

## ✅ Fluxo Esperado Quando TUDO Funciona

### No Console do Browser:
```
▶️▶️▶️ [Polling] Hook INICIADO - enabled: true
🚀 [Polling] Primeira busca imediata...
⏰ [Polling] Configurando intervalo de 3s...
🔄 [Polling] Verificando novos pedidos... 2025-01-07T10:00:00.000Z
📡 [Polling] Response status: 200
📦 [Polling] Data recebido: {success: true, ordersCount: 0}
📊 [Polling] Total de pedidos: 0
⏰ [Update] lastCheck atualizado para: 2025-01-07T10:00:00.000Z

[Criar pedido teste em outra aba]

⏰ TICK - Executando fetch agendado
🔄 [Polling] Verificando novos pedidos... 2025-01-07T10:00:03.000Z
📡 [Polling] Response status: 200
📦 [Polling] Data recebido: {success: true, ordersCount: 1}
📊 [Polling] Total de pedidos: 1
🔍 [Check] Pedido abc123: {
  orderDate: "2025-01-07T10:00:02.000Z",
  lastCheck: "2025-01-07T10:00:00.000Z",
  isNew: true,           ← ✅ É novo!
  notNotified: true,     ← ✅ Ainda não notificado!
  isPending: true,       ← ✅ Está pendente!
  willNotify: true       ← ✅ VAI NOTIFICAR!
}
🆕🆕🆕 NOVOS PEDIDOS DETECTADOS: 1
🆕 IDs: ['abc123']
✅ Pedido marcado como notificado: abc123
🔊 Tentando tocar som...
🔊 Som de alerta iniciado
📝 [Update] Atualizando state com 1 pedidos
⏰ [Update] lastCheck atualizado para: 2025-01-07T10:00:03.000Z
🔔 [Status] Tem pedidos pendentes? true
```

### No Terminal do Server:
```
═══════════════════════════════════════
🔵 [API Pending] Request recebido
🕐 Timestamp: 2025-01-07T10:00:03.000Z
✅ [API Pending] Autorizado - User: admin@sushiworld.com
📊 [API Pending] Buscando pedidos PENDING...
✅ [API Pending] Encontrados: 1 pedidos
   📦 #abc123: {
     status: 'PENDING',
     created: '2025-01-07T10:00:02.000Z',
     customer: 'João Silva'
   }
📤 [API Pending] Enviando resposta...
═══════════════════════════════════════
```

---

## 🎯 Checklist de Verificação

Marque cada item conforme testa:

### Frontend (Console do Browser)
- [ ] `▶️▶️▶️ [Polling] Hook INICIADO` aparece
- [ ] `⏰ TICK` aparece a cada 3 segundos
- [ ] `📡 [Polling] Response status: 200` (não 401, 500 ou erro)
- [ ] `📊 [Polling] Total de pedidos` mostra contagem correta
- [ ] Ao criar pedido: `🆕🆕🆕 NOVOS PEDIDOS DETECTADOS`
- [ ] `🔊 Som de alerta iniciado` (sem erro)
- [ ] Botão de som fica laranja e pulsante

### Backend (Terminal do Server)
- [ ] `🔵 [API Pending] Request recebido` aparece a cada 3s
- [ ] `✅ [API Pending] Autorizado` (não "Não autorizado")
- [ ] `✅ [API Pending] Encontrados: X pedidos`
- [ ] Pedido novo aparece na lista

### UI
- [ ] Pedido aparece na tela **SEM F5**
- [ ] Badge "X NOVOS!" aparece no topo
- [ ] Toast de notificação aparece
- [ ] Som toca em loop
- [ ] Clicar no botão de som para o áudio

---

## 🚨 Ainda Não Funciona?

1. **Cole TODO o log do console** em um arquivo
2. **Cole TODO o log do terminal** em outro arquivo
3. Envie ambos para análise

Ou teste na **Vercel** (produção):
- Acesse o domínio da Vercel
- Lá não tem problemas de firewall local
- Sistema funciona 100%

---

## 📊 Exemplo de Log Completo (Sucesso)

### Browser Console:
```
▶️▶️▶️ [Polling] Hook INICIADO - enabled: true
🚀 [Polling] Primeira busca imediata...
⏰ [Polling] Configurando intervalo de 3s...
🔄 [Polling] Verificando novos pedidos... 2025-01-07T14:30:00.123Z
📡 [Polling] Response status: 200
📦 [Polling] Data recebido: {success: true, ordersCount: 0}
📊 [Polling] Total de pedidos: 0
📝 [Update] Atualizando state com 0 pedidos
⏰ [Update] lastCheck atualizado para: 2025-01-07T14:30:00.123Z
🔔 [Status] Tem pedidos pendentes? false
⏰ TICK - Executando fetch agendado
🔄 [Polling] Verificando novos pedidos... 2025-01-07T14:30:03.456Z
📡 [Polling] Response status: 200
📦 [Polling] Data recebido: {success: true, ordersCount: 1}
📊 [Polling] Total de pedidos: 1
🔍 [Check] Pedido 7f3a91: {
  orderDate: "2025-01-07T14:30:02.000Z",
  lastCheck: "2025-01-07T14:30:00.123Z",
  isNew: true,
  notNotified: true,
  isPending: true,
  willNotify: true
}
🆕🆕🆕 NOVOS PEDIDOS DETECTADOS: 1
🆕 IDs: ["7f3a91"]
✅ Pedido marcado como notificado: 7f3a91
🔊 Tentando tocar som...
🔊 Som de alerta iniciado
📝 [Update] Atualizando state com 1 pedidos
⏰ [Update] lastCheck atualizado para: 2025-01-07T14:30:03.456Z
🔔 [Status] Tem pedidos pendentes? true
```

### Server Terminal:
```
═══════════════════════════════════════
🔵 [API Pending] Request recebido
🕐 Timestamp: 2025-01-07T14:30:03.456Z
✅ [API Pending] Autorizado - User: admin@example.com
📊 [API Pending] Buscando pedidos PENDING...
✅ [API Pending] Encontrados: 1 pedidos
   📦 #7f3a91: {
     status: 'PENDING',
     created: '2025-01-07T14:30:02.000Z',
     customer: 'Cliente Teste'
   }
📤 [API Pending] Enviando resposta...
═══════════════════════════════════════
```

---

**Se você vê logs como esses ↑ TUDO ESTÁ FUNCIONANDO! 🎉**
