# 🕐 Instruções: Corrigir Horários de Funcionamento

## 📋 Situação Atual

O banco de dados tem horários no **formato antigo**:
```json
{
  "sunday": {
    "open": "10:00",
    "close": "23:00",
    "closed": false
  }
}
```

Por isso o sistema aceita pedidos às 10h, mesmo você querendo abrir às 12h.

---

## ✅ SOLUÇÃO 1: SQL Direto no Supabase (RECOMENDADO)

### Passo a Passo:

1. **Acesse o Supabase Dashboard**
   - Vá em: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - Menu lateral → SQL Editor
   - Clique em "New Query"

3. **Cole o código SQL abaixo**:

```sql
-- Atualizar horários de funcionamento para o novo formato
-- Almoço: 12:00-15:00 | Jantar: 19:00-23:00

UPDATE "Settings"
SET "openingHours" = jsonb_build_object(
    'monday', jsonb_build_object(
        'lunchOpen', '12:00',
        'lunchClose', '15:00',
        'dinnerOpen', '19:00',
        'dinnerClose', '23:00',
        'closed', false
    ),
    'tuesday', jsonb_build_object(
        'lunchOpen', '12:00',
        'lunchClose', '15:00',
        'dinnerOpen', '19:00',
        'dinnerClose', '23:00',
        'closed', false
    ),
    'wednesday', jsonb_build_object(
        'lunchOpen', '12:00',
        'lunchClose', '15:00',
        'dinnerOpen', '19:00',
        'dinnerClose', '23:00',
        'closed', false
    ),
    'thursday', jsonb_build_object(
        'lunchOpen', '12:00',
        'lunchClose', '15:00',
        'dinnerOpen', '19:00',
        'dinnerClose', '23:00',
        'closed', false
    ),
    'friday', jsonb_build_object(
        'lunchOpen', '12:00',
        'lunchClose', '15:00',
        'dinnerOpen', '19:00',
        'dinnerClose', '23:00',
        'closed', false
    ),
    'saturday', jsonb_build_object(
        'lunchOpen', '12:00',
        'lunchClose', '15:00',
        'dinnerOpen', '19:00',
        'dinnerClose', '23:00',
        'closed', false
    ),
    'sunday', jsonb_build_object(
        'lunchOpen', '12:00',
        'lunchClose', '15:00',
        'dinnerOpen', '19:00',
        'dinnerClose', '23:00',
        'closed', false
    )
)
WHERE id IS NOT NULL;
```

4. **Clique em "RUN"** (Ctrl + Enter)

5. **Verifique se funcionou**:

```sql
-- Verificar horários salvos
SELECT
    id,
    "companyName",
    "openingHours"
FROM "Settings"
LIMIT 1;
```

Deve mostrar algo assim:
```json
{
  "monday": {
    "lunchOpen": "12:00",
    "lunchClose": "15:00",
    "dinnerOpen": "19:00",
    "dinnerClose": "23:00",
    "closed": false
  },
  ...
}
```

✅ **PRONTO!** Agora o sistema só aceita pedidos:
- **Almoço**: 12:00 às 15:00
- **Jantar**: 19:00 às 23:00

---

## 🔧 SOLUÇÃO 2: Pela Interface (Se quiser personalizar)

Depois de executar o SQL acima, você pode ajustar pela interface:

1. Acesse: `/admin/configuracoes/empresa`
2. Role até "Horário de Funcionamento"
3. Ajuste os horários de almoço e jantar de cada dia
4. Clique em "Salvar Configurações"

---

## 🧪 Como Testar se Está Funcionando

### Teste 1: Verificar horários salvos no banco

Execute no Supabase:
```sql
SELECT "openingHours" FROM "Settings" LIMIT 1;
```

### Teste 2: Testar pedido fora do horário

1. Configure horários: 12:00-15:00 e 19:00-23:00
2. Tente fazer um pedido às 11:00 (antes do almoço)
3. Deve aparecer erro: "Restaurante fechado no momento"

### Teste 3: Testar pedido dentro do horário

1. Tente fazer pedido às 13:00 (durante almoço)
2. Deve funcionar normalmente ✅

---

## 📝 Personalizando Horários

Para mudar os horários, edite os valores no SQL:

```sql
-- Exemplo: Abrir mais cedo no almoço
'lunchOpen', '11:30',   -- Ao invés de 12:00
'lunchClose', '15:00',

-- Exemplo: Fechar mais tarde no jantar
'dinnerOpen', '19:00',
'dinnerClose', '00:00',  -- Ao invés de 23:00

-- Exemplo: Fechar aos domingos
'sunday', jsonb_build_object(
    'lunchOpen', '12:00',
    'lunchClose', '15:00',
    'dinnerOpen', '19:00',
    'dinnerClose', '23:00',
    'closed', true  -- ← Marca como fechado
)
```

---

## ❓ Dúvidas Frequentes

### "Por que não salvou pela interface?"

Pode haver 3 motivos:
1. Você não clicou em "Salvar Configurações"
2. Houve erro na requisição (veja console F12)
3. O componente não está enviando os dados

**Solução**: Use o SQL direto por enquanto. É mais rápido e garante que funcione.

### "Posso ter mais de 2 períodos por dia?"

Atualmente não. O sistema suporta apenas 2 períodos (almoço e jantar). Se precisar de mais, seria necessário modificar o código.

### "Como fechar em um dia específico?"

No SQL, mude `'closed', false` para `'closed', true` no dia desejado.

Ou pela interface: marque o checkbox "Fechado" no dia.

### "Está aceitando pedidos mesmo fechado!"

Verifique:
1. Os horários estão salvos corretamente? (Teste 1 acima)
2. O servidor foi reiniciado após a atualização?
3. O cache do navegador foi limpo? (Ctrl + Shift + R)

---

## 📞 Suporte

Se ainda tiver problemas:
1. Execute o SQL de verificação e me envie o resultado
2. Tente fazer um pedido e me diga que erro aparece
3. Veja o console do navegador (F12) e me envie os erros
