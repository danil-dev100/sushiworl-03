# 📱 Teste do PWA - Instalação do App

## ✅ Como Testar se o Ícone da Logo Aparece

### Teste 1: Verificar Manifest
1. Acesse: `https://seudominio.com/manifest.json`
2. Verifique se retorna JSON válido
3. Confirme que os ícones estão listados:
   ```json
   "icons": [
     {
       "src": "/icon-192.png",
       "sizes": "192x192",
       "type": "image/png"
     },
     {
       "src": "/icon-512.png",
       "sizes": "512x512",
       "type": "image/png"
     }
   ]
   ```

### Teste 2: Verificar se os Ícones Carregam
Acesse diretamente:
- `https://seudominio.com/icon-192.png` → deve mostrar a logo
- `https://seudominio.com/icon-512.png` → deve mostrar a logo
- `https://seudominio.com/apple-touch-icon.png` → deve mostrar a logo (iOS)

### Teste 3: Testar Instalação no Android

#### Passo 1: Acessar pelo Chrome Mobile
1. Abra o Chrome no Android
2. Acesse: `https://seudominio.com`
3. Aguarde alguns segundos

#### Passo 2: Verificar Prompt de Instalação
- **Deve aparecer** um banner/popup sugerindo "Adicionar à tela inicial"
- OU um ícone de "+" na barra de endereço

#### Passo 3: Instalar
1. Toque em "Adicionar à tela inicial" ou no menu ⋮ → "Adicionar à tela inicial"
2. **VERIFICAR:** O ícone que aparece deve ser a LOGO do Sushi World
3. Toque em "Adicionar" para confirmar

#### Passo 4: Testar o App Instalado
1. Volte à tela inicial do Android
2. **VERIFICAR:** Deve ter um ícone com a LOGO do Sushi World
3. Toque no ícone
4. **VERIFICAR:** O app abre em tela cheia (sem barra de navegação do navegador)

### Teste 4: Testar Instalação no iOS (iPhone/iPad)

#### Passo 1: Acessar pelo Safari (IMPORTANTE!)
⚠️ **No iOS, só funciona no Safari, NÃO no Chrome!**

1. Abra o **Safari** no iPhone
2. Acesse: `https://seudominio.com`

#### Passo 2: Adicionar à Tela de Início
1. Toque no botão **Compartilhar** (ícone de seta para cima)
2. Role para baixo e toque em **"Adicionar à Tela de Início"**
3. **VERIFICAR:** O ícone de preview deve mostrar a LOGO do Sushi World
4. Edite o nome se quiser (ou deixe "Sushi World")
5. Toque em **"Adicionar"**

#### Passo 3: Testar o App Instalado
1. Volte à tela inicial do iPhone
2. **VERIFICAR:** Deve ter um ícone com a LOGO do Sushi World
3. Toque no ícone
4. **VERIFICAR:** O app abre em tela cheia

---

## 🔍 O que Verificar em Cada Teste

### ✅ Ícone Correto
- [ ] O ícone mostra a LOGO do Sushi World
- [ ] O ícone NÃO está genérico (tipo globo terrestre ou ícone padrão)
- [ ] O ícone tem boa qualidade (não pixelado)

### ✅ Nome do App
- [ ] Nome exibido é "Sushi World" ou "Sushi World Santa Iria"
- [ ] Nome NÃO é "localhost" ou URL genérica

### ✅ Comportamento
- [ ] App abre em tela cheia (standalone)
- [ ] NÃO mostra barra de navegação do navegador
- [ ] Splash screen usa a cor laranja (#FF6B00)

---

## 🐛 Problemas Comuns e Soluções

### Problema 1: Ícone Genérico Aparece

**Causas possíveis:**
- Cache do navegador
- Manifest não foi atualizado
- Ícones não estão acessíveis

**Solução:**
```bash
1. Limpe o cache do navegador
2. Desinstale o PWA antigo
3. Acesse o site novamente
4. Aguarde 5-10 segundos
5. Instale novamente
```

### Problema 2: Não Aparece Opção de Instalar

**Android:**
- Certifique-se de estar usando HTTPS (não HTTP)
- O manifest.json deve estar acessível
- Service Worker deve estar registrado

**iOS:**
- Use Safari (não Chrome/Firefox)
- iOS não mostra popup automático, precisa usar "Compartilhar"

### Problema 3: Ícone Aparece Cortado

**Causa:** Ícones têm fundo transparente e sistema corta

**Solução:**
- Os ícones foram gerados com fundo laranja (#FF6B00)
- Se ainda estiver cortado, pode ser cache
- Limpe cache e reinstale

---

## 🧪 Teste de Analytics

Após instalar o app, verifique se o tracking está funcionando:

1. Acesse: `https://seudominio.com/admin/marketing/apps`
2. Clique na aba **"Analytics"**
3. **Verificar:**
   - [ ] Total de Cliques aumentou
   - [ ] Instalações aumentou (após instalar)
   - [ ] Device Type mostra "android" ou "ios"
   - [ ] UTM Source mostra origem (ex: "qr")

---

## 📊 Métricas Esperadas

### Após 1 instalação via QR Code Android:
```
Total de Cliques: 1
Instalações: 1
Taxa de Conversão: 100.00%

Por Dispositivo:
- android: 1

Por Origem (UTM Source):
- qr: 1
```

---

## 🔗 Links Úteis para Debug

### Chrome DevTools (Desktop)
1. Abra: `chrome://inspect/#devices`
2. Conecte o celular Android via USB
3. Inspecione o site aberto no celular
4. Aba **Application** → **Manifest**
5. Verifique ícones e configurações

### Lighthouse Audit
1. Abra o site no Chrome Desktop
2. F12 → Aba **Lighthouse**
3. Selecione **Progressive Web App**
4. Clique em **Analyze page load**
5. **Verificar:** Score deve ser 90+ para PWA

### Safari Web Inspector (iOS)
1. iPhone: Settings → Safari → Advanced → Web Inspector (ativar)
2. Mac: Safari → Develop → [seu iPhone] → [página]
3. Verifique console e manifest

---

## 📝 Checklist de Validação PWA

### Antes de Testar
- [ ] Deploy feito na Vercel
- [ ] HTTPS ativo (obrigatório para PWA)
- [ ] `/manifest.json` acessível
- [ ] `/icon-192.png` carrega
- [ ] `/icon-512.png` carrega
- [ ] `/sw.js` (Service Worker) carrega

### Durante Instalação
- [ ] Prompt de instalação aparece (Android)
- [ ] Ícone de preview mostra logo correta
- [ ] Nome do app está correto

### Após Instalação
- [ ] Ícone na tela inicial mostra logo
- [ ] App abre em tela cheia (standalone)
- [ ] Funciona offline (cache básico)
- [ ] Analytics registra instalação

---

## 🆘 Suporte

Se os ícones NÃO aparecerem corretamente:

1. **Verifique os arquivos:**
   ```bash
   https://seudominio.com/icon-192.png
   https://seudominio.com/icon-512.png
   https://seudominio.com/manifest.json
   ```

2. **Force clear cache:**
   - Android: Settings → Apps → Chrome → Storage → Clear Cache
   - iOS: Settings → Safari → Clear History and Website Data

3. **Regenere os ícones (se necessário):**
   ```bash
   npm run generate-icons
   git add public/icon-*.png
   git commit -m "chore: regenerar ícones PWA"
   git push
   ```

---

**Data:** 28 de dezembro de 2024
**Status dos Ícones:** ✅ Gerados e prontos
**Service Worker:** ✅ Registrado
**Manifest:** ✅ Configurado
