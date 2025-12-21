# Debug: Por que os horários não estão salvando

## Opção 1: SQL Direto no Supabase (RECOMENDADO)

**Mais rápido e garantido!**

1. Acesse o Supabase Dashboard
2. Vá em SQL Editor
3. Cole o script: `scripts/update_opening_hours.sql`
4. Clique em "Run"
5. Verifique o resultado

## Opção 2: Debug via Console do Navegador

Se quiser descobrir por que não está salvando pela interface:

1. Abra `/admin/configuracoes/empresa`
2. Pressione F12 (DevTools)
3. Vá na aba "Console"
4. Configure os horários na interface
5. Clique em "Salvar"
6. Veja se aparece algum erro no console

### Script de teste manual (Cole no Console):

```javascript
// Testar se os dados estão sendo enviados corretamente
const testData = {
  companyName: "SushiWorld",
  openingHours: {
    monday: {
      lunchOpen: '12:00',
      lunchClose: '15:00',
      dinnerOpen: '19:00',
      dinnerClose: '23:00',
      closed: false
    }
  }
};

fetch('/api/admin/settings', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
.then(r => r.json())
.then(data => {
  console.log('✅ Resposta da API:', data);
  console.log('📋 openingHours salvo:', data.openingHours);
})
.catch(err => {
  console.error('❌ Erro:', err);
});
```

## Opção 3: Verificar dados atuais no banco

Execute este script no Supabase SQL Editor:

```sql
-- Ver o que está salvo atualmente
SELECT
  id,
  "companyName",
  "openingHours"
FROM "Settings"
LIMIT 1;
```

## Possíveis Problemas

### 1. Estado inicial vazio
O `formData` pode não ter `openingHours` preenchido inicialmente.

**Verificação**: Veja no console do navegador se `formData.openingHours` existe.

### 2. OpeningHoursEditor não está atualizando o estado
O componente pode não estar chamando `onChange` corretamente.

**Verificação**: Adicione um `console.log` no `handleDayChange`:

```typescript
const handleDayChange = (day: string, field: string, newValue: any) => {
  console.log('🔄 Mudança detectada:', { day, field, newValue });
  onChange({
    ...value,
    [day]: {
      ...value[day],
      [field]: newValue,
    },
  });
};
```

### 3. Dados não estão chegando na API
A requisição pode estar falhando silenciosamente.

**Verificação**: Veja na aba Network do DevTools se a requisição PUT está sendo feita.

## SOLUÇÃO RÁPIDA (Enquanto debugamos)

Execute o SQL direto no Supabase (Opção 1) para desbloquear agora.

Depois podemos investigar por que a interface não está salvando.
