# Guia de Instalação - FoundryVTT AI Assistant

Este guia fornece instruções detalhadas para instalar e configurar o FoundryVTT AI Assistant em seu servidor FoundryVTT.

## 📋 Pré-requisitos

### Versões Suportadas
- **FoundryVTT**: v11.0.0 ou superior (testado até v12.331)
- **Navegadores**: Chrome, Firefox, Safari, Edge (versões recentes)
- **Sistemas**: D&D 5e, Pathfinder, e outros sistemas compatíveis

### Chaves de API Necessárias
Você precisará de pelo menos uma das seguintes chaves de API:

- **Manus**: Chave de API da plataforma Manus
- **OpenAI**: Chave de API da OpenAI (formato: `sk-...`)

## 🚀 Métodos de Instalação

### Método 1: Via Manifest URL (Recomendado)

1. **Abra o FoundryVTT** e acesse as configurações do mundo
2. **Navegue para** "Add-on Modules" → "Install Module"
3. **Cole a URL do manifest** no campo "Manifest URL":
   ```
   https://github.com/Felipe-Alves-VNGX/foundryvtt-ai-assistant/releases/latest/download/module.json
   ```
4. **Clique em "Install"** e aguarde o download
5. **Ative o módulo** nas configurações do mundo

### Método 2: Download Manual

1. **Baixe o arquivo ZIP** da [página de releases](https://github.com/Felipe-Alves-VNGX/foundryvtt-ai-assistant/releases)
2. **Extraia o conteúdo** na pasta `Data/modules/` do seu FoundryVTT
3. **Renomeie a pasta** para `foundryvtt-ai-assistant` (se necessário)
4. **Reinicie o FoundryVTT** e ative o módulo

### Método 3: Desenvolvimento (Git)

```bash
# Navegue para a pasta de módulos do FoundryVTT
cd /caminho/para/foundrydata/Data/modules/

# Clone o repositório
git clone https://github.com/Felipe-Alves-VNGX/foundryvtt-ai-assistant.git

# Reinicie o FoundryVTT e ative o módulo
```

## ⚙️ Configuração Inicial

### 1. Ativação do Módulo

1. **Acesse** "Game Settings" → "Manage Modules"
2. **Encontre** "FoundryVTT AI Assistant" na lista
3. **Marque a checkbox** para ativar
4. **Clique em "Save Module Settings"**

### 2. Configuração de Provedores de IA

#### Configurar Manus

1. **Obtenha sua chave de API** na plataforma Manus
2. **Abra o console do navegador** (F12)
3. **Execute o comando**:
   ```javascript
   // Configurar provedor Manus
   window.aiAssistantAPI.setProvider('manus');
   
   // Configurar chave de API (substitua pela sua chave)
   window.aiAssistant.config.providers.manus.apiKey = 'sua-chave-manus-aqui';
   ```

#### Configurar OpenAI

1. **Obtenha sua chave de API** na OpenAI
2. **Execute no console**:
   ```javascript
   // Habilitar provedor OpenAI
   window.aiAssistant.config.providers.openai.enabled = true;
   window.aiAssistant.config.providers.openai.apiKey = 'sk-sua-chave-openai-aqui';
   
   // Alterar para OpenAI
   window.aiAssistantAPI.setProvider('openai');
   ```

### 3. Configuração de Permissões

#### Definir Nível de Permissão Inicial

```javascript
// Nível básico (recomendado para início)
window.aiAssistantAPI.setPermissionLevel('BASIC');

// Ou nível padrão para mais funcionalidades
window.aiAssistantAPI.setPermissionLevel('STANDARD');
```

#### Níveis de Permissão Disponíveis

- **BASIC**: Apenas chat e consultas básicas
- **STANDARD**: Criação e edição de conteúdo básico
- **ADVANCED**: Manipulação completa de elementos do jogo
- **FULL**: Todas as permissões (use com cuidado!)

## 🧪 Teste da Instalação

### 1. Verificar Status do Módulo

```javascript
// Verificar se está funcionando
console.log(window.aiAssistantAPI.isInitialized());

// Ver estatísticas
console.log(window.aiAssistantAPI.getStats());
```

### 2. Testar Comandos Básicos

No chat do FoundryVTT, digite:

```
/ai help
/ai status
/ai roll 1d20 Teste de instalação
```

### 3. Testar Conversa Livre

```
@AI Olá! Você está funcionando?
```

## 🔧 Configurações Avançadas

### Configuração via JavaScript

```javascript
// Configuração completa
const config = {
  enabled: true,
  debugMode: false,
  defaultProvider: 'manus',
  defaultPermissionLevel: 'STANDARD',
  
  providers: {
    manus: {
      enabled: true,
      apiKey: 'sua-chave-manus',
      model: 'gpt-4.1-mini',
      maxTokens: 2000,
      temperature: 0.7
    },
    openai: {
      enabled: true,
      apiKey: 'sk-sua-chave-openai',
      model: 'gpt-4',
      maxTokens: 2000,
      temperature: 0.7
    }
  },
  
  security: {
    rateLimitEnabled: true,
    maxRequestsPerMinute: 30,
    requireGMApprovalForDangerous: true
  }
};

// Aplicar configuração
Object.assign(window.aiAssistant.config, config);
```

### Configuração de Rate Limiting

```javascript
// Ajustar limites de requisições
window.aiAssistant.config.security.maxRequestsPerMinute = 60;
window.aiAssistant.config.security.rateLimitEnabled = true;
```

## 🛡️ Configurações de Segurança

### Permissões Recomendadas por Ambiente

#### Servidor Público
```javascript
window.aiAssistantAPI.setPermissionLevel('BASIC');
window.aiAssistant.config.security.requireGMApprovalForDangerous = true;
window.aiAssistant.config.security.maxRequestsPerMinute = 20;
```

#### Servidor Privado
```javascript
window.aiAssistantAPI.setPermissionLevel('STANDARD');
window.aiAssistant.config.security.requireGMApprovalForDangerous = false;
window.aiAssistant.config.security.maxRequestsPerMinute = 60;
```

#### Desenvolvimento/Teste
```javascript
window.aiAssistantAPI.setPermissionLevel('ADVANCED');
window.aiAssistant.config.debugMode = true;
```

## 📊 Monitoramento

### Verificar Logs

```javascript
// Ver logs de atividade
console.log(window.aiAssistant.components.permissionManager.getPermissionHistory());

// Ver estatísticas de uso
console.log(window.aiAssistant.getFullStatus());
```

### Monitorar Rate Limiting

```javascript
// Verificar status de rate limiting
const stats = window.aiAssistantAPI.getStats();
console.log(stats.providers.manus.rateLimitStatus);
```

## 🔄 Atualizações

### Atualização Automática (Manifest URL)

Se você instalou via manifest URL, o FoundryVTT verificará automaticamente por atualizações.

### Atualização Manual

1. **Baixe** a nova versão da página de releases
2. **Substitua** os arquivos na pasta do módulo
3. **Reinicie** o FoundryVTT

### Atualização via Git

```bash
cd /caminho/para/foundrydata/Data/modules/foundryvtt-ai-assistant/
git pull origin main
```

## ❌ Solução de Problemas

### Módulo Não Aparece na Lista

1. **Verifique** se a pasta está em `Data/modules/`
2. **Confirme** que o arquivo `module.json` existe
3. **Reinicie** o FoundryVTT completamente

### Erro "API Key Inválida"

1. **Verifique** se a chave está correta
2. **Confirme** se o provedor está habilitado
3. **Teste** a conectividade com a API

### Comandos Não Funcionam

1. **Verifique** se o módulo está ativo
2. **Confirme** o nível de permissão
3. **Veja** o console do navegador para erros

### Performance Lenta

1. **Reduza** o `maxTokens` nas configurações
2. **Ajuste** o rate limiting
3. **Verifique** a conectividade de rede

## 📞 Suporte

### Onde Buscar Ajuda

- **Issues GitHub**: [Reportar problemas](https://github.com/Felipe-Alves-VNGX/foundryvtt-ai-assistant/issues)
- **Documentação**: [Wiki do projeto](https://github.com/Felipe-Alves-VNGX/foundryvtt-ai-assistant/wiki)
- **Comunidade FoundryVTT**: [Fórum oficial](https://foundryvtt.com/community/)

### Informações para Suporte

Ao reportar problemas, inclua:

- **Versão do FoundryVTT**
- **Versão do módulo**
- **Sistema operacional**
- **Navegador utilizado**
- **Logs do console** (F12 → Console)
- **Passos para reproduzir** o problema

---

**Instalação concluída! 🎉**

Agora você pode usar o FoundryVTT AI Assistant para melhorar suas sessões de RPG com o poder da inteligência artificial.
