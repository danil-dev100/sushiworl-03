# 📱 Guia de Configuração do PWA - Sushi World

## 📋 Sumário
1. [Gerar Ícones](#gerar-ícones)
2. [Criar APK Android (PWABuilder)](#criar-apk-android)
3. [Distribuir Links de Instalação](#distribuir-links)
4. [Analytics e Métricas](#analytics)
5. [Política de Privacidade](#privacidade)

---

## 1. 🎨 Gerar Ícones

### Instalar Dependência
```bash
npm install sharp --save-dev
```

### Gerar Ícones
```bash
node scripts/generate-icons.js
```

Isso irá criar:
- ✅ `icon-192.png` (192x192) - PWA Android/Chrome
- ✅ `icon-512.png` (512x512) - PWA Android/Chrome
- ✅ `apple-touch-icon.png` (180x180) - iOS Safari
- ✅ `favicon-32x32.png` (32x32) - Navegadores
- ✅ `favicon-16x16.png` (16x16) - Navegadores

**Nota:** Os ícones são gerados a partir da logo existente em `/public/logo.webp/` com fundo laranja (#FF6B00).

---

## 2. 📦 Criar APK Android (PWABuilder)

### Passo 1: Acessar PWABuilder
1. Abra https://www.pwabuilder.com
2. Cole a URL do site: `https://seudominio.com`
3. Clique em "Start"

### Passo 2: Revisar Manifest
- ✅ Verificar se manifest.json foi detectado
- ✅ Confirmar nome do app, ícones e cor
- ✅ Ajustar configurações se necessário

### Passo 3: Gerar APK
1. Clique em "Package For Stores"
2. Selecione "Android" → "APK"
3. Configure opções:
   - **Package ID**: `com.sushiworld.app`
   - **App Name**: `Sushi World`
   - **Version**: `1.0.0`
   - **Signing**: Gerar novo keystore (salvar backup!)
4. Baixar APK assinado

### Passo 4: Hospedar APK (Opcional)
Se quiser distribuir APK diretamente:
```bash
# Fazer upload do APK para /public/downloads/
mv sushiworld.apk public/downloads/app-android.apk
```

**⚠️ Importante:**
- Guardar keystore em local seguro (necessário para atualizações)
- Nunca committar keystore no git
- APK deve ser assinado digitalmente

---

## 3. 🔗 Distribuir Links de Instalação

### Acessar Painel Admin
1. Login no painel: `/admin/marketing/apps`
2. Definir nome da campanha (ex: `promo_natal`)
3. Gerar links:
   - **Android**: Clique em "Gerar Link para Android"
   - **iOS**: Clique em "Gerar Link para iOS"

### QR Codes
- QR codes são gerados automaticamente
- Download individual: Botão "Baixar QR Code"
- Formato: PNG (300x300px)

### Compartilhar Links
**Android:**
```
https://seusite.com/?utm_source=qr&utm_medium=android_app&utm_campaign=promo_natal
```

**iOS:**
```
https://seusite.com/?utm_source=qr&utm_medium=ios_app&utm_campaign=promo_natal
```

### Instruções para Usuários

**Android (Chrome/Edge):**
1. Acessar o link ou escanear QR code
2. Tocar no menu (⋮) → "Adicionar à tela inicial"
3. Confirmar instalação

**iOS (Safari):**
1. Abrir link no Safari (NÃO Chrome)
2. Tocar botão "Compartilhar" (ícone ↑)
3. Rolar e tocar "Adicionar à Tela de Início"
4. Confirmar tocando "Adicionar"

---

## 4. 📊 Analytics e Métricas

### Acessar Dashboard
1. Ir para `/admin/marketing/apps`
2. Clicar na aba "Analytics"

### Métricas Disponíveis
- **Total de Cliques**: Quantas pessoas clicaram nos links
- **Instalações**: Quantos realmente instalaram o app
- **Taxa de Conversão**: % de cliques que viraram instalações
- **Por Dispositivo**: Android vs iOS vs Desktop
- **Por Origem (UTM)**: Qual campanha trouxe mais cliques

### Como Funciona
1. **Link Clicado**: Quando usuário acessa link com UTM
2. **App Instalado**: Detectado via event `appinstalled`
3. **App Aberto**: Detectado quando roda em modo standalone

### Dados Armazenados (Anônimos)
- ✅ UTM parameters (source, medium, campaign)
- ✅ User-Agent (para detectar SO/browser)
- ✅ Hash do IP (SHA-256, nunca IP real)
- ✅ Tipo de dispositivo (android/ios/desktop)
- ✅ Timestamps de eventos

### Dados NÃO Armazenados
- ❌ IP real do usuário
- ❌ Informações pessoais
- ❌ Cookies de terceiros
- ❌ Integração com Google Analytics
- ❌ Pixels de rastreamento externos

---

## 5. 🔒 Política de Privacidade

### Princípios
1. **Self-Hosted**: Todos os dados ficam no Supabase próprio
2. **Anônimo**: IP nunca armazenado (só hash)
3. **Transparente**: Código open-source auditável
4. **Mínimo Necessário**: Só coleta o essencial para analytics

### Texto Sugerido (Para Site)

```markdown
## Instalação do Aplicativo

Ao instalar nosso aplicativo (PWA), coletamos as seguintes informações de forma anônima:

### Dados Coletados
- Origem da instalação (QR code, link, etc.)
- Tipo de dispositivo (Android, iOS, Desktop)
- Data e hora do evento
- Hash anônimo do endereço IP (não identificável)

### Finalidade
Estes dados são usados exclusivamente para:
- Medir eficácia de campanhas de marketing
- Melhorar a experiência do usuário
- Entender como os clientes descobrem nosso app

### Não Coletamos
- Endereço IP real
- Dados pessoais identificáveis
- Localização precisa
- Histórico de navegação

### Armazenamento
- Dados armazenados em servidores seguros (Supabase)
- Acesso restrito apenas à equipe administrativa
- Sem compartilhamento com terceiros
- Sem uso de Google Analytics ou pixels externos

### Seus Direitos
- Direito de solicitar exclusão de dados
- Direito de saber quais dados temos
- Contato: [seu-email@sushiworld.com]

**Última atualização:** Dezembro 2024
```

---

## 6. 🛡️ Segurança

### Rate Limiting
- Máximo 1 evento a cada 10 segundos por IP
- Previne abuse de tracking

### Hash de IP
```javascript
// Exemplo de como funciona
const ipHash = crypto
  .createHash('sha256')
  .update(ip + process.env.HASH_SALT)
  .digest('hex');
```

**⚠️ Importante:** Adicionar `HASH_SALT` ao `.env`:
```bash
HASH_SALT=sua-chave-secreta-aleatoria-aqui
```

### Variáveis de Ambiente
```bash
# .env.local
DATABASE_URL=postgresql://...
HASH_SALT=sua-chave-secreta-aqui
NEXT_PUBLIC_APP_URL=https://seusite.com
```

**⚠️ NUNCA commitar .env no git!**

---

## 7. 🚀 Deploy

### Build de Produção
```bash
npm run build
```

### Aplicar Migração do Banco
```bash
npx prisma migrate dev --name add-app-install-tracking
npx prisma generate
```

### Verificar PWA
1. Abrir DevTools → Application → Manifest
2. Verificar se manifest.json foi carregado
3. Verificar ícones (192px e 512px)
4. Verificar Service Worker registrado

### Testar Instalação
**Android:**
1. Acessar site em Chrome mobile
2. Deve aparecer banner "Adicionar à tela inicial"
3. Instalar e verificar tracking

**iOS:**
1. Acessar site em Safari mobile
2. Tocar "Compartilhar" → "Adicionar à Tela de Início"
3. Verificar se ícone e nome aparecem corretamente

---

## 8. 📚 Recursos Adicionais

### Documentação Oficial
- PWABuilder: https://docs.pwabuilder.com
- Web.dev PWA: https://web.dev/progressive-web-apps/
- MDN Service Workers: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API

### Ferramentas Úteis
- Lighthouse (PWA audit): DevTools → Lighthouse
- PWA Asset Generator: https://www.pwabuilder.com/imageGenerator

### Checklist de Launch
- [ ] Ícones gerados e otimizados
- [ ] Manifest.json configurado
- [ ] Service Worker registrado
- [ ] Tracking de instalação funcionando
- [ ] Analytics dashboard acessível
- [ ] APK Android gerado (opcional)
- [ ] QR codes criados
- [ ] Política de privacidade publicada
- [ ] HASH_SALT configurado no .env
- [ ] Migração do banco aplicada
- [ ] Testes em Android e iOS

---

## 9. ⚠️ Troubleshooting

### Service Worker não registra
```javascript
// Verificar no console
navigator.serviceWorker.getRegistration().then(reg => console.log(reg))
```

### Manifest não carrega
- Verificar `manifest.json` em `/public/`
- Verificar Content-Type: `application/manifest+json`
- Verificar CORS headers

### Tracking não funciona
- Verificar URL tem parâmetros UTM
- Verificar API `/api/pwa/track-install` responde
- Verificar banco de dados (tabela `AppInstallLog`)
- Verificar console do navegador por erros

### QR Code não gera
- Instalar `qr-code-styling`: `npm install qr-code-styling`
- Verificar se canvas está disponível no DOM

---

## 📞 Suporte

**Problemas técnicos?**
- Verificar logs do servidor: `npm run dev` ou `vercel logs`
- Verificar console do navegador (F12)
- Revisar documentação acima

**Dúvidas sobre PWA?**
- PWABuilder Discord: https://discord.gg/PWABuilder
- Stack Overflow tag: `progressive-web-apps`

---

**Criado com ❤️ por Claude Code**
