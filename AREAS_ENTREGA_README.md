# 🗺️ Sistema de Áreas de Entrega - SushiWorld

## ✅ Funcionalidades Implementadas

### 📍 Painel Administrativo - Áreas de Entrega

**Localização**: `http://localhost:3000/admin/configuracoes/areas-entrega`

#### Recursos Disponíveis:

1. **Mapa Interativo com OpenStreetMap**
   - ✅ Mapa gratuito usando Leaflet.js
   - ✅ Sem custos mensais ou por uso
   - ✅ Visualização de todas as áreas cadastradas com cores diferentes
   - ✅ Zoom e navegação completa

2. **Localização do Restaurante**
   - ✅ Campo para digitar endereço completo
   - ✅ Botão "Localizar" que geocodifica o endereço
   - ✅ Mapa se centraliza automaticamente na localização
   - ✅ Marcador 📍 mostrando posição do restaurante

3. **Criação de Áreas de Entrega**
   - ✅ Desenho livre de polígonos no mapa (clique para criar pontos)
   - ✅ Mínimo de 3 pontos para formar área
   - ✅ Instruções visuais durante o desenho
   - ✅ Pressionar ESC para cancelar, ENTER para finalizar
   - ✅ Cor automática diferente para cada área

4. **Configuração de Taxas**
   - ✅ **Entrega Grátis**:
     - Sem valor mínimo (frete sempre grátis)
     - Com valor mínimo (ex: grátis acima de €20)
   - ✅ **Entrega Paga**:
     - Valor fixo por área (ex: €2.50, €3.00, €4.00)

5. **Gerenciamento de Áreas**
   - ✅ Lista lateral com todas as áreas cadastradas
   - ✅ Cores visuais indicando cada área
   - ✅ Botões de editar e excluir
   - ✅ Popup informativo ao clicar na área no mapa
   - ✅ Confirmação antes de excluir

### 🔍 API de Validação de Endereço

**Endpoint**: `POST /api/delivery/check-area`

```json
// Request
{
  "address": "Rua Principal, 123, Santa Iria, Portugal"
}

// Response (se entrega)
{
  "delivers": true,
  "area": {
    "id": "...",
    "name": "Centro",
    "deliveryType": "FREE",
    "deliveryFee": 0,
    "minOrderValue": 20.00
  },
  "coordinates": [38.8567, -9.0638]
}

// Response (se NÃO entrega)
{
  "delivers": false,
  "message": "Desculpe, não entregamos neste endereço.",
  "coordinates": [38.8567, -9.0638]
}
```

### 💰 API de Cálculo de Frete

**Endpoint**: `GET /api/delivery/check-area?areaId=...&subtotal=25.00`

```json
// Response
{
  "areaId": "...",
  "areaName": "Centro",
  "deliveryFee": 0,
  "isFreeDelivery": true,
  "minOrderValue": 20.00,
  "message": "Parabéns! Você ganhou frete grátis!"
}
```

## 🎨 Interface do Usuário

### Cores e Estilos
- Fundo: `#f5f1e9`
- Primária: `#FF6B00`
- Botões: `#FF6B00` com hover
- Bordas: `#ead9cd`
- Texto principal: `#333333`
- Texto secundário: `#a16b45`

### Badges de Status
- 🟢 **Grátis**: Badge verde
- 🟠 **Pago**: Badge laranja

## 🛠️ Tecnologias Utilizadas

- **Leaflet.js**: Biblioteca de mapas gratuita
- **OpenStreetMap**: Tiles de mapa gratuitos
- **Nominatim**: Geocodificação gratuita (até milhares de consultas/dia)
- **React-Leaflet**: Integração com React
- **Prisma**: ORM para gerenciar dados
- **Next.js 15**: Framework
- **TypeScript**: Tipagem

## 📊 Modelo de Dados

```prisma
model DeliveryArea {
  id              String   @id @default(cuid())
  name            String   // Ex: "Centro da Cidade"
  
  // Polígono (array de coordenadas)
  polygon         Json     // [[lat, lng], [lat, lng], ...]
  color           String   @default("#3B82F6")
  
  // Configuração de entrega
  deliveryType    DeliveryType  // FREE ou PAID
  deliveryFee     Float    @default(0)
  minOrderValue   Float?   // Valor mínimo para frete grátis
  
  isActive        Boolean  @default(true)
  sortOrder       Int      @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  orders          Order[]
}

enum DeliveryType {
  FREE
  PAID
}
```

## 🚀 Como Usar

### 1. Adicionar Localização do Restaurante
1. Acesse `/admin/configuracoes/areas-entrega`
2. Digite o endereço completo do restaurante
3. Clique em "Localizar"
4. O mapa se centralizará na localização

### 2. Criar Nova Área
1. Clique em "Adicionar Nova Área"
2. Clique em "✏️ Desenhar Área" no mapa
3. Clique no mapa para criar pontos do polígono
4. Preencha o formulário:
   - Nome da área
   - Tipo (Grátis/Pago)
   - Valor da taxa (se pago)
   - Valor mínimo (se grátis condicional)
5. Clique em "Salvar Área"

### 3. Editar Área Existente
1. Clique no botão "Editar" da área desejada
2. Modifique os dados necessários
3. Para redesenhar, clique em "✏️ Desenhar Área"
4. Salve as alterações

### 4. Excluir Área
1. Clique no botão "Excluir" (ícone de lixeira)
2. Confirme a exclusão no diálogo

## 🔐 Credenciais de Acesso

- **URL**: http://localhost:3000/admin
- **Email**: admin@sushiworld.pt
- **Senha**: Admin@123

## 📝 Exemplos de Configuração

### Exemplo 1: Frete Grátis Sem Limite
- Nome: "Centro Histórico"
- Tipo: Grátis
- Valor Mínimo: (deixar vazio)
- Resultado: Frete sempre grátis para esta área

### Exemplo 2: Frete Grátis Acima de €20
- Nome: "Parque das Nações"
- Tipo: Grátis
- Valor Mínimo: €20.00
- Resultado: Frete grátis se pedido ≥ €20, senão paga taxa

### Exemplo 3: Frete Pago Fixo
- Nome: "Zona Norte"
- Tipo: Pago
- Valor da Taxa: €3.50
- Resultado: Sempre paga €3.50 de frete

## 🎯 Algoritmo de Verificação

```typescript
// 1. Cliente digita endereço
// 2. Sistema geocodifica (converte para lat/lng)
// 3. Verifica se coordenada está dentro de algum polígono
// 4. Se SIM: retorna área e calcula frete
// 5. Se NÃO: retorna mensagem "não entregamos"
```

## ✨ Recursos Adicionais

- ✅ Múltiplas áreas simultâneas
- ✅ Cores diferentes para cada área
- ✅ Popups informativos
- ✅ Ordenação por prioridade (sortOrder)
- ✅ Ativar/desativar áreas
- ✅ Validação de polígonos (mín. 3 pontos)
- ✅ Geocodificação automática
- ✅ Cálculo dinâmico de frete

## 🌍 Sem Custos Externos

Todo o sistema foi desenvolvido usando tecnologias **100% gratuitas**:
- ❌ Sem Google Maps API (evita custos)
- ❌ Sem serviços pagos de geocodificação
- ✅ OpenStreetMap (gratuito e open source)
- ✅ Nominatim (geocodificação gratuita)
- ✅ Leaflet (biblioteca gratuita)

## 📱 Responsivo

- ✅ Desktop: Mapa lado a lado com lista
- ✅ Tablet: Layout adaptativo
- ✅ Mobile: Lista acima, mapa abaixo

## 🔄 Integração com Checkout

Para integrar no checkout do cliente:

```typescript
// No checkout, ao digitar endereço:
const response = await fetch('/api/delivery/check-area', {
  method: 'POST',
  body: JSON.stringify({ address: enderecoCompleto }),
});

const data = await response.json();

if (data.delivers) {
  // Calcular frete
  const frete = await fetch(
    `/api/delivery/check-area?areaId=${data.area.id}&subtotal=${subtotal}`
  );
  // Aplicar taxa de entrega
} else {
  // Mostrar: "Não entregamos neste endereço"
}
```

---

**Desenvolvido com ❤️ para SushiWorld**

