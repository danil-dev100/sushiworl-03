# 🔍 Instruções para Debug do Popup de Opções

## ✅ Status da Configuração

Executei um diagnóstico completo e confirmei que:

- ✅ **8 opções** estão configuradas no banco de dados
- ✅ Todas com `displayAt = 'SITE'` (correto!)
- ✅ Todas com `isActive = true` (correto!)
- ✅ Todas têm escolhas válidas (correto!)
- ✅ Produtos estão visíveis (correto!)
- ✅ Campos `isPaid` e `basePrice` existem no banco (migração aplicada!)

**Produtos com opções disponíveis para teste:**
1. Sashimi de Salmão 5 Peças → Opção "braseado teste"
2. Gunkan Mix 10 Peças → Opção "Braseado"
3. Special Salmon 20 Peças → Opção "Finalização"
4. Gunkan Salmão Queijo Brie Braseado → Opção "Finalização"
5. Gunkan Salmão Phila Maracujá → Opção "Finalização"
6. Nigiri Atum 4 Peças → Opção "Finalização"
7. Nigiri Salmão 4 Peças → Opção "Finalização"
8. Salmão Neta Phila 6 Peças → Opção "Finalização"

## 📝 Como Executar o Teste

### Passo 1: Limpar logs antigos
1. Abra o site no navegador
2. Pressione **F12** para abrir DevTools
3. Vá na aba **Console**
4. Clique com botão direito → **Clear console** (ou Ctrl+L)

### Passo 2: Testar um produto
1. Na página do cardápio, localize um dos produtos acima (ex: "Sashimi de Salmão 5 Peças")
2. Clique no botão **"Adicionar"**
3. **AGUARDE** 2-3 segundos

### Passo 3: Observar o que acontece

**O QUE DEVERIA ACONTECER:**
- ✅ Um popup deve aparecer perguntando se quer adicionar a opção
- ✅ Exemplo: "Turbine seu pedido! braseado teste por +€1,00"
- ✅ Botões: "Sim, quero!" e "Não, obrigado"

**SE O POPUP NÃO APARECER:**
- ❌ Produto foi adicionado direto ao carrinho
- ❌ Toast apareceu: "X adicionado ao carrinho!"

### Passo 4: Copiar TODOS os logs

No console do navegador, você verá uma série de logs. Copie **TUDO** que aparecer, especialmente:

```
═══════════════════════════════════════
🎯 BOTÃO ADICIONAR CLICADO
📦 Produto: { ... }
═══════════════════════════════════════
🔍 Iniciando busca de opções...
📡 URL: /api/products/XXX/options
📊 Status da resposta: 200 OK
📦 Dados recebidos: { ... }
✅ API retornou success=true
📊 Total de opções: X

🔎 ANALISANDO CADA OPÇÃO:
  Opção 1:
    Nome: ...
    Tipo: ...
    Ativa: ...
    Exibir em: ...
    Escolhas: ...
    É paga: ...
    Preço base: ...

  ✓ Nome da opção: VÁLIDA ✅ ou INVÁLIDA ❌
    ↳ Motivo: ...

📱 OPÇÕES VÁLIDAS PARA SITE: X
🎨 TENTANDO ABRIR POPUP...
✅ Estados atualizados
```

### Passo 5: Verificar logs do Dialog

Também procure por logs do Dialog:

```
[SimpleDialog] 🎨 Dialog renderizado
[SimpleDialog] Produto: ...
[SimpleDialog] Opções disponíveis: ...
```

**OU**

```
[SimpleDialog] ⚠️ Dialog aberto mas sem opções!
```

## 🎯 O Que Fazer Depois

Copie **TODOS** os logs do console e me envie aqui. Com base nos logs, conseguirei identificar EXATAMENTE onde o popup está falhando:

### Possíveis Cenários:

1. **API não está sendo chamada**
   - Logs param antes de "🔍 Iniciando busca de opções..."
   - **Causa:** Problema no evento onClick

2. **API retorna erro**
   - Status diferente de 200
   - success = false
   - **Causa:** Problema na rota da API

3. **Opções não passam no filtro**
   - "📱 OPÇÕES VÁLIDAS PARA SITE: 0"
   - **Causa:** displayAt incorreto ou outros campos

4. **Estados não atualizam**
   - Vemos "✅ Estados atualizados" mas popup não abre
   - **Causa:** Problema no React state ou Dialog component

5. **Dialog não renderiza**
   - Não aparece "[SimpleDialog]" nos logs
   - **Causa:** Componente não está montado ou props incorretas

## ⚡ Teste Rápido Alternativo

Se preferir, pode também:

1. Abrir DevTools (F12)
2. Ir na aba **Network**
3. Filtrar por "options"
4. Clicar em "Adicionar" no produto
5. Ver se aparece uma requisição para `/api/products/[id]/options`
6. Clicar nela e verificar o **Response**

Isso mostra se a API está sendo chamada e o que ela está retornando.

---

**Aguardo os logs para continuar o debug! 🔍**
