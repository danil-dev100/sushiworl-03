# Configurações de Impressão - Guia Completo

## Visão Geral

O sistema de configurações de impressão permite personalizar completamente o layout e conteúdo dos recibos de pedidos, com suporte para:

- **Reorganização de seções** via drag-and-drop
- **Toggles para mostrar/ocultar** campos específicos
- **Preview em tempo real** das alterações
- **QR Code** para rastreamento de pedidos
- **Informações customizáveis** da empresa

## Acesso

Navegue para: **Admin > Impressora** ou acesse diretamente `/admin/configuracoes/impressora`

## Funcionalidades

### 1. Ordem das Seções (Drag-and-Drop)

As seções do recibo podem ser reorganizadas simplesmente arrastando e soltando:

**Seções disponíveis:**

1. **Método de Pagamento** - Exibe como o cliente irá pagar
2. **Tempo ASAP** - Tempo estimado para entrega
3. **Tempo de Condução** - Estimativa de tempo no trânsito
4. **Informações de Entrega** - Endereço, distância e QR Code
5. **Detalhes da Encomenda** - Número do pedido e datas
6. **Info do Cliente** - Nome, email, telefone
7. **Instruções Especiais** - Observações do cliente
8. **Itens do Pedido** - Produtos, quantidades, preços
9. **Totais** - Subtotal, taxas e total
10. **Rodapé** - Informações da empresa e website

**Como usar:**
- Clique e segure o ícone de três barras (☰)
- Arraste para a posição desejada
- Solte para fixar na nova ordem

**Ativar/Desativar seção:**
- Clique no ícone de olho (👁️) para ativar/desativar a seção inteira
- Verde = ativa, Cinza = desativada

### 2. Campos Detalhados

Controle preciso sobre quais informações aparecem em cada seção:

#### **Pagamento & Tempo**
- ✓ Método de Pagamento
- ✓ Tempo ASAP
- ✓ Tempo de Condução
- ✓ Info de Tráfego (detalhes em tempo real)

#### **Entrega**
- ✓ Distância de Entrega
- ✓ QR Code (para rastreamento digital)

#### **Detalhes da Encomenda**
- ✓ Número da Encomenda
- ✓ Datas (Colocado/Aceite/Realizado)

#### **Informações do Cliente**
- ✓ Nome e Apelido
- ✓ Email
- ✓ Telefone
- ✓ Instruções Especiais

#### **Itens do Pedido**
- ✓ Variantes/Opções (ex: "Cola 1/1")
- ✓ Observações (ex: "SEM CHEDDAR")

#### **Totais**
- ✓ Subtotal
- ✓ Taxa de Entrega
- ✓ Taxa de Saco
- ✓ Total

#### **Rodapé**
- ✓ URL do Website
- ✓ Informações da Empresa

### 3. Preview em Tempo Real

O lado direito da tela mostra um **preview ao vivo** do recibo:
- Todas as alterações são refletidas instantaneamente
- Visualize exatamente como ficará o recibo impresso
- Dados de exemplo realistas para melhor avaliação

### 4. Restaurar Padrão

Botão **"Restaurar Padrão"**:
- Retorna todas as configurações ao estado inicial
- Útil se você quiser começar do zero
- Requer confirmação antes de executar

### 5. Salvar Configurações

Botão **"Salvar"**:
- Persiste as configurações no banco de dados
- Aplica imediatamente a todos os novos recibos
- Feedback visual de sucesso/erro

## Estrutura de Dados

As configurações são salvas como JSON no banco de dados:

```json
{
  "sections": [
    {
      "id": "payment",
      "name": "Método de Pagamento",
      "enabled": true,
      "order": 1
    },
    // ... outras seções
  ],
  "fields": {
    "showPaymentMethod": true,
    "showAsapTime": true,
    "showQRCode": true,
    // ... outros campos
  }
}
```

## Exemplo de Uso

### Cenário: Simplificar recibo para impressora térmica pequena

1. **Desativar seções desnecessárias:**
   - Desative "Tempo de Condução"
   - Desative "QR Code"

2. **Reordenar:**
   - Coloque "Itens do Pedido" logo após "Info do Cliente"
   - Mova "Totais" para o topo

3. **Desativar campos:**
   - Desative "Info de Tráfego"
   - Desative "Email" do cliente
   - Desative "Variantes/Opções" dos itens

4. **Salvar** e visualizar o resultado no preview

## Integração com Pedidos

Quando um pedido for criado/impresso, o sistema:

1. Busca as configurações salvas
2. Renderiza o recibo conforme personalizado
3. Gera QR Code com link do pedido (se ativo)
4. Formata valores monetários em EUR (€)
5. Formata datas em PT-PT

## Tecnologias Utilizadas

- **React** - Componentes interativos
- **Tailwind CSS** - Estilização
- **qrcode.react** - Geração de QR Codes
- **Lucide React** - Ícones
- **Prisma** - Persistência no banco de dados
- **Next.js 14** - Framework e API routes

## API Endpoints

### GET `/api/admin/settings/printer`
Retorna as configurações atuais de impressão

**Response:**
```json
{
  "sections": [...],
  "fields": {...}
}
```

### POST `/api/admin/settings/printer`
Salva novas configurações

**Request Body:**
```json
{
  "sections": [...],
  "fields": {...}
}
```

**Response:**
```json
{
  "success": true,
  "printerSettings": {...}
}
```

## Componentes

### `OrderReceiptPreview`
Componente de visualização do recibo
- Renderiza todas as seções conforme configuração
- Suporta formatação de datas e valores
- Gera QR Code dinamicamente

### `PrinterSettingsEditor`
Editor completo de configurações
- Gerencia estado local
- Drag-and-drop de seções
- Toggles para campos
- Preview em tempo real
- Persistência no banco

## Troubleshooting

**Problema:** Alterações não estão sendo salvas
- Verifique console do navegador para erros
- Confirme que o banco de dados está acessível
- Tente "Restaurar Padrão" e salvar novamente

**Problema:** QR Code não aparece
- Verifique se o campo "showQRCode" está ativo
- Confirme que a seção "delivery-info" está habilitada
- Verifique URL da empresa nas configurações

**Problema:** Preview não atualiza em tempo real
- Atualize a página
- Verifique se há erros no console
- Tente desativar/ativar um toggle

## Próximas Melhorias

- [ ] Suporte para múltiplos modelos de impressão
- [ ] Personalização de cores e fontes
- [ ] Templates pré-configurados (minimalista, completo, etc.)
- [ ] Exportar/Importar configurações
- [ ] Visualização de impressão real (print preview)
- [ ] Suporte para diferentes tamanhos de papel (58mm, 80mm)

## Contribuindo

Para adicionar novos campos ou seções:

1. Adicione o campo em `OrderReceiptConfig` interface
2. Implemente renderização em `OrderReceiptPreview`
3. Adicione toggle/configuração em `PrinterSettingsEditor`
4. Atualize esta documentação

---

**Versão:** 1.0
**Última atualização:** 27/11/2024
**Autor:** Sistema SushiWorld
