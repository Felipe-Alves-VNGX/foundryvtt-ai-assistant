# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Não Lançado]

### Planejado
- Suporte para provedor Claude/Anthropic
- Interface gráfica de configuração
- Sistema de templates para criação de conteúdo
- Integração com compêndios externos
- Suporte para múltiplos idiomas
- Sistema de backup automático

## [1.0.0] - 2024-12-03

### Adicionado
- 🎉 **Lançamento inicial do FoundryVTT AI Assistant**
- 🤖 **Sistema de usuário IA dedicado**
  - Criação automática de usuário para a IA
  - Gerenciamento de sessões e autenticação
  - Controle de atividade e presença
  - Logs detalhados de todas as ações

- 🔐 **Sistema de permissões granular**
  - 5 níveis de permissão (NONE, BASIC, STANDARD, ADVANCED, FULL)
  - Permissões temporárias com expiração automática
  - Solicitações automáticas para aprovação de GMs
  - Auditoria completa com histórico de mudanças

- 💬 **Interface de chat avançada**
  - 14 comandos especializados (`/ai help`, `/ai create`, `/ai search`, etc.)
  - Conversa livre via menções `@AI`
  - Processamento inteligente de contexto
  - Respostas formatadas em HTML rico

- 🎲 **Manipulação completa do FoundryVTT**
  - **Atores**: Criar, editar, deletar, consultar personagens e NPCs
  - **Itens**: Gerenciar equipamentos, magias e objetos
  - **Cenas**: Criar e modificar mapas e ambientes
  - **Jornais**: Escrever e organizar anotações e lore
  - **Macros**: Criar e executar automações
  - **Tabelas**: Gerenciar tabelas de rolagem
  - **Playlists**: Controlar música e efeitos sonoros
  - **Compêndios**: Importar e organizar conteúdo

- 🤖 **Provedores de IA**
  - **Manus**: Integração completa com rate limiting
  - **OpenAI**: Suporte para GPT-4 e modelos da OpenAI
  - Troca dinâmica entre provedores
  - Monitoramento de uso e custos

- ⚙️ **API JavaScript completa**
  - Métodos para verificação de status
  - Gerenciamento de provedores
  - Controle de permissões
  - Envio de mensagens e comandos

- 🛡️ **Recursos de segurança**
  - Rate limiting automático
  - Validação de todas as operações
  - Logs de auditoria detalhados
  - Aprovação de GM para operações sensíveis

- 📊 **Monitoramento e estatísticas**
  - Estatísticas em tempo real de uso
  - Métricas de performance dos provedores
  - Histórico de permissões e ações
  - Alertas para problemas de conectividade

### Comandos Disponíveis
- `/ai help [comando]` - Lista comandos ou ajuda específica
- `/ai status` - Mostra status do sistema
- `/ai roll <fórmula> [motivo]` - Rola dados
- `/ai create <tipo> <dados>` - Cria elementos do jogo
- `/ai search <tipo> [filtros]` - Busca elementos
- `/ai macro <nome> [argumentos]` - Executa macros
- `/ai scene <ação> [parâmetros]` - Gerencia cenas
- `/ai config <opção> <valor>` - Configura o assistente
- `/ai chat <mensagem>` - Conversa livre com IA

### Funcionalidades Técnicas
- Arquitetura modular e extensível
- Sistema de hooks do FoundryVTT
- Configurações persistentes
- Tratamento robusto de erros
- Documentação completa com JSDoc
- Testes unitários e de integração

### Compatibilidade
- FoundryVTT v10.0.0 ou superior
- Sistemas suportados: D&D 5e, Pathfinder, e outros
- Navegadores: Chrome, Firefox, Safari, Edge

### Instalação
- Instalação via manifest URL
- Instalação manual via ZIP
- Configuração automática de dependências

---

## Tipos de Mudanças

- `Added` - Para novas funcionalidades
- `Changed` - Para mudanças em funcionalidades existentes
- `Deprecated` - Para funcionalidades que serão removidas
- `Removed` - Para funcionalidades removidas
- `Fixed` - Para correções de bugs
- `Security` - Para correções de vulnerabilidades

## Links

- [Repositório GitHub](https://github.com/seu-usuario/foundryvtt-ai-assistant)
- [Documentação](https://github.com/seu-usuario/foundryvtt-ai-assistant/wiki)
- [Issues](https://github.com/seu-usuario/foundryvtt-ai-assistant/issues)
- [Releases](https://github.com/seu-usuario/foundryvtt-ai-assistant/releases)
