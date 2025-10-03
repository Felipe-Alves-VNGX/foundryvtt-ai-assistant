# FoundryVTT AI Assistant

Um módulo completo para FoundryVTT que integra assistentes de IA (Manus, OpenAI, Claude) diretamente no seu jogo, permitindo automação, criação de conteúdo e assistência em tempo real durante as sessões de RPG.

## 🚀 Funcionalidades Principais

### 🤖 Integração Multi-Provedor
- **Manus**: Integração nativa com a plataforma Manus
- **OpenAI**: Suporte completo para GPT-4 e modelos da OpenAI
- **Claude**: Integração com modelos Anthropic (em desenvolvimento)
- **Troca dinâmica**: Altere entre provedores sem reiniciar

### 👤 Usuário IA Dedicado
- Criação automática de usuário específico para a IA
- Gerenciamento de sessões e autenticação
- Controle de atividade e presença
- Logs detalhados de todas as ações

### 🔐 Sistema de Permissões Granular
- **5 níveis de permissão**: NONE, BASIC, STANDARD, ADVANCED, FULL
- **Permissões temporárias**: Conceda acesso por tempo limitado
- **Aprovação de GMs**: Solicitações automáticas para ações sensíveis
- **Auditoria completa**: Histórico de todas as mudanças de permissão

### 💬 Interface de Chat Avançada
- **Comandos especializados**: `/ai help`, `/ai create`, `/ai search`, etc.
- **Menções naturais**: Use `@AI` para conversar livremente
- **Contexto inteligente**: A IA entende o estado atual do jogo
- **Respostas formatadas**: HTML rico com botões e links interativos

### 🎲 Manipulação Completa do Jogo
- **Atores**: Criar, editar, deletar personagens e NPCs
- **Itens**: Gerenciar equipamentos, magias e objetos
- **Cenas**: Criar e modificar mapas e ambientes
- **Jornais**: Escrever e organizar anotações e lore
- **Macros**: Criar e executar automações
- **Tabelas**: Gerenciar tabelas de rolagem
- **Playlists**: Controlar música e efeitos sonoros
- **Compêndios**: Importar e organizar conteúdo

## 📦 Instalação

### Método 1: Instalação Manual
1. Baixe o arquivo ZIP do módulo
2. Extraia na pasta `Data/modules/` do FoundryVTT
3. Ative o módulo nas configurações do mundo
4. Configure suas chaves de API

### Método 2: Via Manifest URL
```
https://github.com/seu-usuario/foundryvtt-ai-assistant/releases/latest/download/module.json
```

### Método 3: Desenvolvimento
```bash
git clone https://github.com/seu-usuario/foundryvtt-ai-assistant.git
cd foundryvtt-ai-assistant
npm install
npm run build
```

## ⚙️ Configuração

### 1. Configuração Básica
1. Acesse **Configurações do Mundo** → **Configurar Módulos**
2. Encontre "AI Assistant" e clique em **Configurar**
3. Defina o **Provedor de IA** padrão
4. Configure o **Nível de Permissão** inicial

### 2. Configuração de Provedores

#### Manus
```javascript
// Configuração via API
window.aiAssistantAPI.setProvider('manus');

// Ou via configurações do módulo
{
  "providers": {
    "manus": {
      "enabled": true,
      "apiKey": "sua-chave-manus",
      "model": "gpt-4.1-mini",
      "maxTokens": 2000,
      "temperature": 0.7
    }
  }
}
```

#### OpenAI
```javascript
// Configuração via API
window.aiAssistantAPI.setProvider('openai');

// Ou via configurações do módulo
{
  "providers": {
    "openai": {
      "enabled": true,
      "apiKey": "sk-sua-chave-openai",
      "model": "gpt-4",
      "maxTokens": 2000,
      "temperature": 0.7
    }
  }
}
```

## 🎮 Uso

### Comandos de Chat

#### Comandos Básicos
```
/ai help                    # Lista todos os comandos
/ai status                  # Mostra status do sistema
/ai config provider manus   # Altera provedor de IA
```

#### Rolagem de Dados
```
/ai roll 1d20+5 Teste de Percepção
/ai roll 3d6 Dano da espada
/ai roll 1d100 Tabela de eventos
```

#### Criação de Conteúdo
```
/ai create actor {"name": "Orc Guerreiro", "type": "npc"}
/ai create item {"name": "Espada Mágica", "type": "weapon"}
/ai create scene {"name": "Taverna do Javali", "width": 20, "height": 15}
/ai create journal {"name": "História da Cidade"}
```

#### Busca e Consulta
```
/ai search actors Orc           # Busca atores com "Orc" no nome
/ai search items espada         # Busca itens com "espada"
/ai search scenes taverna       # Busca cenas com "taverna"
```

### Conversa Livre

#### Menções Diretas
```
@AI Crie um NPC comerciante para minha taverna
@AI Explique as regras de combate à distância
@AI Gere uma descrição para esta masmorra
```

#### Chat Direto
```
/ai chat Preciso de ajuda para criar um encontro desafiador
/ai chat Como funciona a mecânica de vantagem no D&D 5e?
/ai chat Gere um tesouro apropriado para um grupo de nível 5
```

### API JavaScript

#### Verificar Status
```javascript
// Verificar se está inicializado
console.log(window.aiAssistantAPI.isInitialized());

// Obter estatísticas completas
console.log(window.aiAssistantAPI.getStats());
```

#### Gerenciar Provedores
```javascript
// Listar provedores disponíveis
console.log(window.aiAssistantAPI.getProviders());

// Alterar provedor
await window.aiAssistantAPI.setProvider('openai');
```

#### Controlar Permissões
```javascript
// Verificar permissão específica
const canCreate = window.aiAssistantAPI.checkPermission('createActor');

// Conceder permissão
await window.aiAssistantAPI.grantPermission('deleteActor', true);
```

## 🔧 Desenvolvimento

### Estrutura do Projeto
```
foundryvtt-ai-assistant/
├── module.json                 # Manifest do módulo
├── scripts/
│   ├── main.js                # Arquivo principal
│   ├── ai-user-manager.js     # Gerenciamento do usuário IA
│   ├── api-handler.js         # Handler de API do FoundryVTT
│   ├── permissions.js         # Sistema de permissões
│   ├── chat-interface.js      # Interface de chat
│   └── providers/
│       ├── manus.js          # Provedor Manus
│       ├── openai.js         # Provedor OpenAI
│       └── claude.js         # Provedor Claude
├── styles/
│   └── ai-assistant.css      # Estilos do módulo
├── lang/
│   ├── en.json              # Localização inglês
│   └── pt-BR.json           # Localização português
└── README.md
```

### Adicionando Novos Provedores

1. **Criar arquivo do provedor**:
```javascript
// scripts/providers/meu-provedor.js
export class MeuProvedor {
    constructor(config) {
        this.name = 'Meu Provedor';
        this.apiKey = config.apiKey;
    }

    async initialize() {
        // Inicialização
    }

    async processMessage(message, context) {
        // Processar mensagem
        return response;
    }
}
```

2. **Registrar no main.js**:
```javascript
import { MeuProvedor } from './providers/meu-provedor.js';

// No método initializeProviders()
const provider = new MeuProvedor(this.config.providers.meuProvedor);
await provider.initialize();
this.providers.set('meuProvedor', provider);
```

## 🛡️ Segurança

### Práticas Recomendadas
- **Nunca** use nível FULL em servidores públicos
- Configure **rate limiting** apropriado
- Monitore **logs de auditoria** regularmente
- Use **permissões temporárias** para testes
- Mantenha **chaves de API** seguras

## 📊 Monitoramento

### Logs e Auditoria
```javascript
// Obter histórico de permissões
const history = window.aiAssistant.components.permissionManager.getPermissionHistory();

// Obter estatísticas de uso
const stats = window.aiAssistantAPI.getStats();
```

## 🤝 Contribuição

### Como Contribuir
1. Fork o repositório
2. Crie uma branch para sua feature
3. Implemente suas mudanças
4. Adicione testes se necessário
5. Envie um Pull Request

## 📝 Changelog

### v1.0.0 (2024-XX-XX)
- ✨ Lançamento inicial
- 🤖 Suporte para Manus e OpenAI
- 🔐 Sistema completo de permissões
- 💬 Interface de chat avançada
- 🎲 Manipulação completa do FoundryVTT

## 📄 Licença

Este projeto está licenciado sob a MIT License.

## 🆘 Suporte

### Problemas Comuns

#### "API Key inválida"
- Verifique se a chave está correta
- Confirme se o provedor está habilitado
- Teste a conectividade

#### "Permissão negada"
- Verifique o nível de permissão atual
- Solicite aprovação do GM se necessário
- Consulte os logs de auditoria

#### "Módulo não inicializa"
- Verifique o console do navegador
- Confirme compatibilidade com versão do FoundryVTT
- Desative outros módulos conflitantes

---

**Desenvolvido com ❤️ para a comunidade FoundryVTT**

*Este módulo não é afiliado oficialmente com FoundryVTT, Manus, OpenAI ou Anthropic.*
