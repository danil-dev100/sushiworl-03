# 📖 Guia Completo: Sistema de Opções de Produtos

## O que são Opções de Produtos?

As **Opções de Produtos** permitem que você adicione personalizações e complementos aos seus produtos. Por exemplo, um cliente pode escolher molhos, adicionar ingredientes extras, selecionar tamanhos, etc.

---

## 🎯 Conceitos Principais

### 1. **Opção** (A pergunta)
É a personalização que você oferece ao cliente.

**Exemplos:**
- "Escolha o molho"
- "Adicionar braseado?"
- "Tamanho"
- "Extras"

### 2. **Escolhas** (As respostas)
São as opções específicas que o cliente pode selecionar dentro de uma Opção.

**Exemplo para "Escolha o molho":**
- Shoyu (+€0,00)
- Teriyaki (+€1,50)
- Picante (+€1,00)
- Sem molho (+€0,00)

---

## 🛠️ Como Criar uma Opção

### Passo 1: Criar o Produto
1. Vá em `/admin/cardapio`
2. Clique em "Adicionar Produto"
3. Preencha as informações básicas
4. **Salve o produto primeiro**

### Passo 2: Adicionar Opções
1. Clique em "Editar" no produto criado
2. Vá na aba "Opções"
3. Clique em "Adicionar Opção"

---

## 📝 Campos do Formulário de Opções

### **Nome da Opção** *
O que será exibido ao cliente.
- ✅ Bom: "Escolha o molho", "Adicionar braseado", "Tamanho"
- ❌ Ruim: "Opção 1", "Extra"

### **Tipo** *
- **Opcional:** Cliente pode ou não selecionar
- **Obrigatório:** Cliente DEVE selecionar antes de adicionar ao carrinho

### **Exibir em**
- **No site:** Popup aparece ao clicar em "Adicionar ao Carrinho"
- **No carrinho:** Cliente escolhe depois, já no carrinho

### **Descrição**
Texto adicional para explicar a opção (opcional).

### **Esta opção é paga**
Marque se a opção tem um custo base.

**Exemplo:**
- Opção: "Adicionar Braseado"
- Pago: ✅ Sim
- Preço Base: €2,50

Quando o cliente selecionar "Braseado", será adicionado €2,50 ao preço do produto.

### **Mínimo / Máximo**
- **Mínimo:** Quantidade mínima de escolhas (use 0 para opcional)
- **Máximo:** Quantidade máxima de escolhas

**Exemplos:**
- Escolha 1 molho: Min=1, Max=1
- Escolha até 3 extras: Min=0, Max=3
- Obrigatório escolher 2: Min=2, Max=2

### **Múltiplas vezes**
Permite que o cliente adicione a mesma escolha várias vezes.

**Exemplo:**
- Opção: "Molho Extra"
- Múltiplas vezes: ✅ Sim
- Cliente pode adicionar: "2x Molho Shoyu"

---

## 🎨 Escolhas (As Opções Específicas)

Cada opção precisa ter pelo menos uma escolha.

### Campos das Escolhas:

1. **Nome:** O que será exibido (ex: "Shoyu", "Grande", "Com bacon")
2. **Preço:** Valor adicional (pode ser €0,00)
3. **Padrão:** Marque para pré-selecionar esta escolha

---

## 💡 Exemplos Práticos

### Exemplo 1: Escolha de Molho (Obrigatório)

**Opção:**
- Nome: "Escolha o molho"
- Tipo: Obrigatório
- Exibir em: No site
- Pago: ❌ Não
- Mínimo: 1
- Máximo: 1

**Escolhas:**
- Shoyu (+€0,00) [Padrão: ✅]
- Teriyaki (+€1,50)
- Picante (+€1,00)
- Sem molho (+€0,00)

**Resultado:** Cliente DEVE escolher 1 molho antes de adicionar ao carrinho.

---

### Exemplo 2: Adicionar Braseado (Opcional e Pago)

**Opção:**
- Nome: "Adicionar braseado?"
- Tipo: Opcional
- Exibir em: No site
- Pago: ✅ Sim
- Preço Base: €2,50
- Mínimo: 0
- Máximo: 1

**Escolhas:**
- Sim (+€0,00)
- Não (+€0,00) [Padrão: ✅]

**Resultado:** Se o cliente escolher "Sim", será adicionado €2,50 ao preço do produto.

---

### Exemplo 3: Extras (Múltiplos)

**Opção:**
- Nome: "Extras"
- Tipo: Opcional
- Exibir em: No carrinho
- Pago: ❌ Não
- Mínimo: 0
- Máximo: 5
- Múltiplas vezes: ✅ Sim

**Escolhas:**
- Cream cheese (+€1,00)
- Abacate (+€1,50)
- Salmão extra (+€3,00)
- Gergelim (+€0,50)

**Resultado:** Cliente pode escolher até 5 extras, e pode adicionar o mesmo extra várias vezes (ex: "2x Cream cheese").

---

### Exemplo 4: Tamanho (Obrigatório com Preços)

**Opção:**
- Nome: "Tamanho"
- Tipo: Obrigatório
- Exibir em: No site
- Pago: ❌ Não
- Mínimo: 1
- Máximo: 1

**Escolhas:**
- Pequeno (+€0,00) [Padrão: ✅]
- Médio (+€3,00)
- Grande (+€5,00)

**Resultado:** Cliente DEVE escolher um tamanho, e o preço será ajustado automaticamente.

---

## 🔍 Diferença: Opção Paga vs Escolha com Preço

### Opção Paga (Preço Base)
Usado quando a **opção em si** tem um custo.

**Exemplo:**
- Opção: "Adicionar Braseado" (Pago: ✅ Sim, Preço: €2,50)
- Escolhas: "Sim" ou "Não"
- Se escolher "Sim" → +€2,50

### Escolha com Preço
Usado quando cada **escolha específica** tem um preço diferente.

**Exemplo:**
- Opção: "Escolha o molho" (Pago: ❌ Não)
- Escolhas:
  - Shoyu (+€0,00)
  - Teriyaki (+€1,50)
  - Picante (+€1,00)
- Se escolher "Teriyaki" → +€1,50

---

## ✅ Boas Práticas

1. **Seja claro nos nomes:** Use nomes descritivos que o cliente entenda facilmente
2. **Use "Padrão" com sabedoria:** Pré-selecione a opção mais comum
3. **Organize por tipo:** Agrupe opções relacionadas (molhos, extras, tamanhos)
4. **Teste antes de publicar:** Faça um pedido de teste para ver como fica
5. **Preços claros:** Sempre mostre o valor adicional (ex: "+€1,50")

---

## 🎯 Quando Usar Cada Configuração

### **Exibir no Site**
✅ Use para opções essenciais (molhos, tamanhos, ingredientes principais)
❌ Não use para muitas opções (pode sobrecarregar o cliente)

### **Exibir no Carrinho**
✅ Use para extras opcionais (adicionais, complementos)
✅ Use quando há muitas opções

### **Tipo Obrigatório**
✅ Use para escolhas essenciais (tamanho, ponto da carne, base do prato)
❌ Não abuse - deixe o cliente escolher quando possível

### **Tipo Opcional**
✅ Use para extras, complementos, personalizações
✅ Melhor experiência para o cliente

---

## 🚀 Próximos Passos

1. Crie seu primeiro produto
2. Adicione opções simples (ex: escolha de molho)
3. Teste fazendo um pedido
4. Expanda com opções mais complexas
5. Monitore quais opções os clientes mais escolhem

---

## ❓ Dúvidas Frequentes

**P: Posso ter várias opções no mesmo produto?**
R: Sim! Você pode adicionar quantas opções quiser.

**P: O cliente pode pular uma opção opcional?**
R: Sim, se for "Opcional" e o mínimo for 0.

**P: Posso mudar as opções depois?**
R: Sim, clique em "Editar" na opção para modificá-la.

**P: As opções aparecem no pedido?**
R: Sim, todas as escolhas do cliente aparecem no pedido impresso.

**P: Posso desativar uma opção temporariamente?**
R: Sim, desmarque "Ativa" na edição da opção.

---

**Criado por:** Sistema SushiWorld  
**Última atualização:** 2025-01-16

