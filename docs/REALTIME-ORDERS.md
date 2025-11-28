# Sistema de Pedidos em Tempo Real

## Visão Geral

Este documento descreve a implementação do sistema de notificações em tempo real para pedidos, utilizando WebSocket (Socket.IO) para comunicação instantânea entre o checkout do cliente e o painel admin.

## Arquitetura

### Componentes

1. **Servidor Socket.IO** (`server.ts`, `src/lib/socket.ts`)
   - Servidor HTTP customizado com Next.js
   - Socket.IO integrado para WebSocket
   - Autenticação de clientes admin

2. **Emissão de Eventos** (`src/lib/socket-emitter.ts`)
   - Utilitário global para emitir eventos das API routes
   - Eventos emitidos após persistência no banco

3. **Hook do Cliente** (`src/hooks/useOrderSocket.ts`)
   - Conexão WebSocket no painel admin
   - Gerenciamento de sons por pedido
   - Controle de autoplay bloqueado

4. **Componente de Pedidos** (`src/components/admin/orders/OrdersPageContent.tsx`)
   - Integração com WebSocket
   - Atualização em tempo real da lista
   - Controles de som e status de conexão

## Ficheiros de Áudio

- **Novo pedido**: `public/order-new.mp3` (toca em loop até aceitar)
- **Pedido cancelado**: `public/order-cancelled.mp3` (toca uma vez)

## Eventos WebSocket

### `pedido:novo`
Emitido quando um novo pedido é criado.

```typescript
{
  id: string;
  orderNumber: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: object;
  status: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  vatAmount: number;
  createdAt: Date;
  orderItems: Array<{
    id: string;
    name: string;
    quantity: number;
    priceAtTime: number;
  }>;
}
```

### `pedido:cancelado`
Emitido quando um pedido é cancelado.

### `pedido:atualizado`
Emitido quando o status de um pedido muda.

## Scripts de Execução

### Desenvolvimento com Socket.IO
```bash
npm run dev:socket
```

### Produção com Socket.IO
```bash
npm run start:socket
```

### Desenvolvimento normal (sem WebSocket)
```bash
npm run dev
```

## Variáveis de Ambiente

```env
# URL do Socket.IO (opcional, usa window.location.origin por padrão)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000

# URL da aplicação (para CORS)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Fluxo de Funcionamento

1. **Cliente finaliza pedido** (`/checkout`)
   - API `/api/orders` salva o pedido no banco
   - Após sucesso, emite evento `pedido:novo` via WebSocket

2. **Admin recebe notificação** (`/admin/pedidos`)
   - WebSocket recebe evento
   - Pedido é adicionado ao topo da lista
   - Som de novo pedido toca em loop

3. **Admin aceita pedido**
   - Status muda para CONFIRMED
   - Evento `pedido:atualizado` é emitido
   - Som para automaticamente

4. **Admin cancela pedido**
   - Status muda para CANCELLED
   - Evento `pedido:cancelado` é emitido
   - Som de cancelamento toca uma vez

## Controles de Som

- **Botão de mudo**: Silencia/ativa todas as notificações
- **Indicador de conexão**: Mostra status do WebSocket
- **Banner de autoplay**: Aparece quando o navegador bloqueia autoplay
- **Contador de pendentes**: Mostra quantos pedidos estão com som ativo

## Testes Manuais

### 1. Criar Pedido via Checkout

```bash
# Abrir painel admin
http://localhost:3000/admin/pedidos

# Em outra aba, criar pedido no checkout
http://localhost:3000/checkout

# Preencher dados e finalizar
# O pedido deve aparecer instantaneamente no admin com som
```

### 2. Aceitar Pedido

No painel admin, clique em "Aceitar" no pedido pendente.
- O som deve parar imediatamente
- O status deve mudar para "Confirmado"

### 3. Cancelar Pedido

No painel admin, clique em "Cancelar" no pedido.
- Som de cancelamento deve tocar uma vez
- Status muda para "Cancelado"

### 4. Testar Autoplay Bloqueado

1. Abra o painel admin em uma aba privada
2. Crie um pedido
3. Deve aparecer o banner amarelo "Ativar Som"
4. Clique no botão e os sons devem começar

### 5. Múltiplos Pedidos

1. Crie 3 pedidos em sequência rápida
2. Cada pedido deve aparecer no admin
3. Sons devem tocar para cada um (com sobreposição)
4. Aceitar cada um deve parar seu som específico

## Arquivos Modificados

- `server.ts` - Servidor customizado com Socket.IO
- `src/lib/socket.ts` - Configuração do Socket.IO
- `src/lib/socket-emitter.ts` - Emissão global de eventos
- `src/hooks/useOrderSocket.ts` - Hook de WebSocket para admin
- `src/hooks/useOrdersPolling.ts` - Adicionado setData
- `src/app/api/orders/route.ts` - Emissão de evento no POST
- `src/components/admin/orders/OrdersPageContent.tsx` - UI com WebSocket
- `package.json` - Scripts dev:socket e start:socket

## Segurança

- Eventos só são emitidos para clientes na sala `admin`
- Socket valida autenticação antes de subscrever
- Eventos não contêm dados sensíveis (sem cartão, senhas)

## Limitações Conhecidas

1. **Autoplay**: Navegadores modernos bloqueiam autoplay. O banner permite ativar por gesto.

2. **Reconexão**: Em caso de desconexão, o Socket.IO tenta reconectar automaticamente.

3. **Múltiplas abas**: Cada aba terá sua própria conexão e som. Considere usar SharedWorker para sincronizar.

4. **Next.js API Routes**: Como o Next.js não mantém servidor HTTP persistente no modo normal, é necessário usar o servidor customizado (`npm run dev:socket`).

## Troubleshooting

### Som não toca
- Verifique se o navegador não está silenciado
- Verifique o banner de autoplay
- Verifique os arquivos em `/public/`

### Pedido não aparece em tempo real
- Verifique se está usando `npm run dev:socket`
- Verifique o indicador de conexão (verde = conectado)
- Verifique o console do navegador por erros

### Erro de CORS
- Configure `NEXT_PUBLIC_APP_URL` corretamente
- Em produção, configure os origins permitidos
