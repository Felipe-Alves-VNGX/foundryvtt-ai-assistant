/**
 * Interface de chat para IA
 * Responsável por processar comandos, gerenciar conversas e integrar com provedores de IA
 */

export class ChatInterface {
    constructor(permissionManager, apiHandler, aiUserManager) {
        this.permissionManager = permissionManager;
        this.apiHandler = apiHandler;
        this.aiUserManager = aiUserManager;
        this.initialized = false;
        this.commandPrefix = '/ai';
        this.commands = new Map();
        this.conversationHistory = [];
        this.activeConversations = new Map();
        this.aiProviders = new Map();
        this.currentProvider = null;
    }

    async initialize() {
        console.log('AI Assistant | Inicializando ChatInterface...');
        
        try {
            // Registrar comandos disponíveis
            this.registerCommands();
            
            // Configurar listeners de chat
            this.setupChatListeners();
            
            // Carregar provedores de IA
            await this.loadAIProviders();
            
            // Configurar provedor padrão
            await this.setDefaultProvider();
            
            this.initialized = true;
            console.log('AI Assistant | ChatInterface inicializado com sucesso');
            
        } catch (error) {
            console.error('AI Assistant | Erro na inicialização do ChatInterface:', error);
            throw error;
        }
    }

    registerCommands() {
        // Comandos básicos
        this.commands.set('help', {
            description: 'Mostra comandos disponíveis',
            usage: '/ai help [comando]',
            permission: 'sendMessage',
            handler: this.handleHelpCommand.bind(this)
        });

        this.commands.set('status', {
            description: 'Mostra status do sistema',
            usage: '/ai status',
            permission: 'sendMessage',
            handler: this.handleStatusCommand.bind(this)
        });

        // Comandos de dados
        this.commands.set('roll', {
            description: 'Rola dados',
            usage: '/ai roll <fórmula> [motivo]',
            permission: 'rollDice',
            handler: this.handleRollCommand.bind(this)
        });

        // Comandos de criação
        this.commands.set('create', {
            description: 'Cria elementos do jogo',
            usage: '/ai create <tipo> <dados>',
            permission: 'createActor',
            handler: this.handleCreateCommand.bind(this)
        });

        // Comandos de busca
        this.commands.set('search', {
            description: 'Busca elementos do jogo',
            usage: '/ai search <tipo> [filtros]',
            permission: 'queryActors',
            handler: this.handleSearchCommand.bind(this)
        });

        // Comandos de macro
        this.commands.set('macro', {
            description: 'Executa macro',
            usage: '/ai macro <nome> [argumentos]',
            permission: 'executeMacro',
            handler: this.handleMacroCommand.bind(this)
        });

        // Comandos de cena
        this.commands.set('scene', {
            description: 'Gerencia cenas',
            usage: '/ai scene <ação> [parâmetros]',
            permission: 'createScene',
            handler: this.handleSceneCommand.bind(this)
        });

        // Comandos de configuração
        this.commands.set('config', {
            description: 'Configura o assistente',
            usage: '/ai config <opção> <valor>',
            permission: 'modifySettings',
            handler: this.handleConfigCommand.bind(this)
        });

        // Comando de conversa livre
        this.commands.set('chat', {
            description: 'Conversa livre com IA',
            usage: '/ai chat <mensagem>',
            permission: 'sendMessage',
            handler: this.handleChatCommand.bind(this)
        });
    }

    setupChatListeners() {
        // Simular hook do FoundryVTT - em implementação real seria:
        // Hooks.on('createChatMessage', this.onChatMessage.bind(this));
        
        // Para demonstração, vamos simular o sistema de hooks
        this.simulateFoundryHooks();
    }

    simulateFoundryHooks() {
        // Simular sistema de mensagens do FoundryVTT
        console.log('AI Assistant | Hooks de chat configurados (simulação)');
    }

    async onChatMessage(message, options, userId) {
        try {
            const content = message.content;
            
            // Verificar se é comando para IA
            if (content.startsWith(this.commandPrefix)) {
                await this.processCommand(content, message);
                return;
            }
            
            // Verificar se é menção à IA
            if (this.isMentionedInMessage(content)) {
                await this.processAIMention(content, message);
                return;
            }
            
            // Adicionar à história de conversação se relevante
            if (this.isRelevantMessage(message)) {
                this.addToConversationHistory(message);
            }
            
        } catch (error) {
            console.error('AI Assistant | Erro ao processar mensagem de chat:', error);
            await this.sendErrorMessage(error.message);
        }
    }

    async processCommand(content, originalMessage) {
        const parts = content.slice(this.commandPrefix.length).trim().split(' ');
        const commandName = parts[0];
        const args = parts.slice(1);

        console.log(`AI Assistant | Processando comando: ${commandName}`, args);

        const command = this.commands.get(commandName);
        if (!command) {
            await this.sendMessage(`❌ Comando "${commandName}" não reconhecido. Use \`/ai help\` para ver comandos disponíveis.`);
            return;
        }

        // Verificar permissões
        if (!this.permissionManager.checkPermission(command.permission)) {
            await this.sendMessage(`🔒 Permissão insuficiente para executar "${commandName}". Permissão necessária: ${command.permission}`);
            return;
        }

        try {
            await command.handler(args, originalMessage);
        } catch (error) {
            console.error(`AI Assistant | Erro no comando ${commandName}:`, error);
            await this.sendMessage(`❌ Erro ao executar comando: ${error.message}`);
        }
    }

    async processAIMention(content, originalMessage) {
        console.log('AI Assistant | Processando menção à IA:', content);
        
        // Extrair a mensagem sem a menção
        const cleanContent = content.replace(/@AI|@ai/gi, '').trim();
        
        if (cleanContent.length === 0) {
            await this.sendMessage('👋 Olá! Como posso ajudar? Use `/ai help` para ver os comandos disponíveis.');
            return;
        }

        // Processar como conversa livre
        await this.handleFreeConversation(cleanContent, originalMessage);
    }

    isMentionedInMessage(content) {
        return /@AI|@ai/i.test(content);
    }

    isRelevantMessage(message) {
        // Determinar se a mensagem é relevante para o contexto da IA
        return message.type === 'ic' || message.type === 'ooc';
    }

    addToConversationHistory(message) {
        this.conversationHistory.push({
            timestamp: Date.now(),
            user: message.user?.name || 'Unknown',
            content: message.content,
            type: message.type
        });

        // Manter apenas as últimas 100 mensagens
        if (this.conversationHistory.length > 100) {
            this.conversationHistory.shift();
        }
    }

    // ========== HANDLERS DE COMANDOS ==========

    async handleHelpCommand(args, originalMessage) {
        if (args.length > 0) {
            // Ajuda específica para um comando
            const commandName = args[0];
            const command = this.commands.get(commandName);
            
            if (command) {
                const helpText = `
                    <div class="ai-help-specific">
                        <h3>📖 Ajuda: ${commandName}</h3>
                        <p><strong>Descrição:</strong> ${command.description}</p>
                        <p><strong>Uso:</strong> <code>${command.usage}</code></p>
                        <p><strong>Permissão necessária:</strong> ${command.permission}</p>
                    </div>
                `;
                await this.sendMessage(helpText);
            } else {
                await this.sendMessage(`❌ Comando "${commandName}" não encontrado.`);
            }
        } else {
            // Ajuda geral
            const commandList = Array.from(this.commands.entries())
                .filter(([name, cmd]) => this.permissionManager.checkPermission(cmd.permission))
                .map(([name, cmd]) => `<li><strong>${name}</strong> - ${cmd.description}</li>`)
                .join('');

            const helpText = `
                <div class="ai-help-general">
                    <h3>🤖 AI Assistant - Comandos Disponíveis</h3>
                    <ul>${commandList}</ul>
                    <p><em>Use <code>/ai help &lt;comando&gt;</code> para ajuda específica.</em></p>
                    <p><em>Você também pode me mencionar com @AI para conversar livremente!</em></p>
                </div>
            `;
            
            await this.sendMessage(helpText);
        }
    }

    async handleStatusCommand(args, originalMessage) {
        const aiUserStats = await this.aiUserManager.getAIUserStats();
        const permissionStats = this.permissionManager.getStats();
        const apiStats = this.apiHandler.getStats();
        
        const statusText = `
            <div class="ai-status">
                <h3>🔍 Status do AI Assistant</h3>
                <div class="status-section">
                    <h4>👤 Usuário IA</h4>
                    <p>Nome: ${aiUserStats?.name || 'N/A'}</p>
                    <p>Status: ${aiUserStats?.sessionActive ? '🟢 Ativo' : '🔴 Inativo'}</p>
                    <p>Última atividade: ${aiUserStats?.lastActivity ? new Date(aiUserStats.lastActivity).toLocaleString() : 'N/A'}</p>
                </div>
                <div class="status-section">
                    <h4>🔐 Permissões</h4>
                    <p>Nível atual: ${permissionStats.currentLevel}</p>
                    <p>Permissões ativas: ${permissionStats.activePermissions}</p>
                    <p>Permissões temporárias: ${permissionStats.temporaryPermissions}</p>
                </div>
                <div class="status-section">
                    <h4>⚙️ API Handler</h4>
                    <p>Status: ${apiStats.initialized ? '🟢 Inicializado' : '🔴 Não inicializado'}</p>
                    <p>Fila de operações: ${apiStats.queueLength}</p>
                    <p>Processando: ${apiStats.isProcessingQueue ? 'Sim' : 'Não'}</p>
                </div>
                <div class="status-section">
                    <h4>🎲 Coleções do Mundo</h4>
                    <p>Atores: ${apiStats.collections?.actors || 0}</p>
                    <p>Itens: ${apiStats.collections?.items || 0}</p>
                    <p>Cenas: ${apiStats.collections?.scenes || 0}</p>
                    <p>Jornais: ${apiStats.collections?.journal || 0}</p>
                </div>
            </div>
        `;
        
        await this.sendMessage(statusText);
    }

    async handleRollCommand(args, originalMessage) {
        if (args.length === 0) {
            await this.sendMessage('❌ Uso: `/ai roll <fórmula> [motivo]`\nExemplo: `/ai roll 1d20+5 Teste de Percepção`');
            return;
        }

        const formula = args[0];
        const flavor = args.slice(1).join(' ') || `Rolagem solicitada pela IA`;

        const result = await this.apiHandler.rollDice(formula, {
            toChat: true,
            flavor: flavor
        });

        if (result.success) {
            await this.sendMessage(`🎲 **${formula}** = **${result.total}**${flavor ? ` (${flavor})` : ''}`);
        } else {
            await this.sendMessage(`❌ Erro na rolagem: ${result.error}`);
        }
    }

    async handleCreateCommand(args, originalMessage) {
        if (args.length < 2) {
            await this.sendMessage('❌ Uso: `/ai create <tipo> <dados>`\nTipos: actor, item, scene, journal, macro');
            return;
        }

        const type = args[0].toLowerCase();
        const dataString = args.slice(1).join(' ');

        try {
            let data;
            try {
                data = JSON.parse(dataString);
            } catch {
                // Se não for JSON, tratar como nome simples
                data = { name: dataString };
            }

            let result;
            switch (type) {
                case 'actor':
                    result = await this.apiHandler.createActor(data);
                    break;
                case 'item':
                    result = await this.apiHandler.createItem(data);
                    break;
                case 'scene':
                    result = await this.apiHandler.createScene(data);
                    break;
                case 'journal':
                    result = await this.apiHandler.createJournalEntry(data);
                    break;
                case 'macro':
                    result = await this.apiHandler.createMacro(data);
                    break;
                default:
                    await this.sendMessage(`❌ Tipo "${type}" não suportado. Tipos válidos: actor, item, scene, journal, macro`);
                    return;
            }

            if (result.success) {
                await this.sendMessage(`✅ ${result.message}`);
            } else {
                await this.sendMessage(`❌ ${result.message}`);
            }

        } catch (error) {
            await this.sendMessage(`❌ Erro ao criar ${type}: ${error.message}`);
        }
    }

    async handleSearchCommand(args, originalMessage) {
        if (args.length === 0) {
            await this.sendMessage('❌ Uso: `/ai search <tipo> [filtros]`\nTipos: actors, items, scenes, journal');
            return;
        }

        const type = args[0].toLowerCase();
        const searchTerm = args.slice(1).join(' ');

        try {
            let result;
            const filters = searchTerm ? { name: searchTerm } : {};

            switch (type) {
                case 'actors':
                    result = await this.apiHandler.queryActors(filters, { limit: 10 });
                    break;
                case 'items':
                    // Implementar busca de itens
                    result = { success: false, message: 'Busca de itens não implementada ainda' };
                    break;
                case 'scenes':
                    // Implementar busca de cenas
                    result = { success: false, message: 'Busca de cenas não implementada ainda' };
                    break;
                default:
                    await this.sendMessage(`❌ Tipo "${type}" não suportado para busca.`);
                    return;
            }

            if (result.success) {
                if (result.actors && result.actors.length > 0) {
                    const actorList = result.actors
                        .map(actor => `• **${actor.name}** (${actor.type}) - Nível ${actor.level || 'N/A'}`)
                        .join('\n');
                    
                    await this.sendMessage(`🔍 **Atores encontrados:**\n${actorList}`);
                } else {
                    await this.sendMessage('🔍 Nenhum resultado encontrado.');
                }
            } else {
                await this.sendMessage(`❌ ${result.message}`);
            }

        } catch (error) {
            await this.sendMessage(`❌ Erro na busca: ${error.message}`);
        }
    }

    async handleMacroCommand(args, originalMessage) {
        if (args.length === 0) {
            await this.sendMessage('❌ Uso: `/ai macro <nome> [argumentos]`');
            return;
        }

        const macroName = args[0];
        const macroArgs = args.slice(1);

        // Simular busca de macro por nome
        // Em FoundryVTT real seria: game.macros.find(m => m.name === macroName)
        const mockMacroId = 'mock-macro-id';

        const result = await this.apiHandler.executeMacro(mockMacroId, macroArgs);

        if (result.success) {
            await this.sendMessage(`⚙️ Macro "${macroName}" executado com sucesso.`);
        } else {
            await this.sendMessage(`❌ ${result.message}`);
        }
    }

    async handleSceneCommand(args, originalMessage) {
        if (args.length === 0) {
            await this.sendMessage('❌ Uso: `/ai scene <ação> [parâmetros]`\nAções: activate, create, list');
            return;
        }

        const action = args[0].toLowerCase();
        const params = args.slice(1);

        try {
            switch (action) {
                case 'activate':
                    if (params.length === 0) {
                        await this.sendMessage('❌ Uso: `/ai scene activate <nome_ou_id>`');
                        return;
                    }
                    // Simular ativação de cena
                    await this.sendMessage(`🎬 Tentando ativar cena: ${params[0]}`);
                    break;

                case 'create':
                    if (params.length === 0) {
                        await this.sendMessage('❌ Uso: `/ai scene create <nome>`');
                        return;
                    }
                    const sceneData = { name: params.join(' ') };
                    const result = await this.apiHandler.createScene(sceneData);
                    
                    if (result.success) {
                        await this.sendMessage(`✅ ${result.message}`);
                    } else {
                        await this.sendMessage(`❌ ${result.message}`);
                    }
                    break;

                case 'list':
                    // Simular listagem de cenas
                    await this.sendMessage('🎬 **Cenas disponíveis:**\n• Taverna do Javali Dourado\n• Floresta Sombria\n• Masmorra Antiga');
                    break;

                default:
                    await this.sendMessage(`❌ Ação "${action}" não reconhecida. Ações válidas: activate, create, list`);
            }

        } catch (error) {
            await this.sendMessage(`❌ Erro no comando de cena: ${error.message}`);
        }
    }

    async handleConfigCommand(args, originalMessage) {
        if (args.length < 2) {
            await this.sendMessage('❌ Uso: `/ai config <opção> <valor>`\nOpções: provider, permission-level');
            return;
        }

        const option = args[0].toLowerCase();
        const value = args.slice(1).join(' ');

        try {
            switch (option) {
                case 'provider':
                    await this.setAIProvider(value);
                    await this.sendMessage(`⚙️ Provedor de IA alterado para: ${value}`);
                    break;

                case 'permission-level':
                    await this.permissionManager.setPermissionLevel(value.toUpperCase());
                    await this.sendMessage(`🔐 Nível de permissão alterado para: ${value}`);
                    break;

                default:
                    await this.sendMessage(`❌ Opção "${option}" não reconhecida.`);
            }

        } catch (error) {
            await this.sendMessage(`❌ Erro na configuração: ${error.message}`);
        }
    }

    async handleChatCommand(args, originalMessage) {
        const message = args.join(' ');
        
        if (!message) {
            await this.sendMessage('❌ Uso: `/ai chat <mensagem>`');
            return;
        }

        await this.handleFreeConversation(message, originalMessage);
    }

    async handleFreeConversation(message, originalMessage) {
        if (!this.currentProvider) {
            await this.sendMessage('❌ Nenhum provedor de IA configurado. Use `/ai config provider <nome>` para configurar.');
            return;
        }

        try {
            // Preparar contexto da conversa
            const context = this.buildConversationContext(originalMessage);
            
            // Enviar para provedor de IA
            const response = await this.currentProvider.processMessage(message, context);
            
            // Enviar resposta
            await this.sendMessage(`🤖 ${response}`);
            
            // Adicionar à história
            this.addToConversationHistory({
                user: 'AI Assistant',
                content: response,
                type: 'ai-response',
                timestamp: Date.now()
            });

        } catch (error) {
            console.error('AI Assistant | Erro na conversa livre:', error);
            await this.sendMessage('❌ Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.');
        }
    }

    buildConversationContext(originalMessage) {
        return {
            user: originalMessage?.user?.name || 'Unknown',
            recentHistory: this.conversationHistory.slice(-10),
            worldContext: this.getWorldContext(),
            timestamp: Date.now()
        };
    }

    getWorldContext() {
        // Simular contexto do mundo
        return {
            activeScene: 'Taverna do Javali Dourado',
            playerCount: 4,
            systemName: 'D&D 5e'
        };
    }

    // ========== PROVEDORES DE IA ==========

    async loadAIProviders() {
        // Simular carregamento de provedores
        console.log('AI Assistant | Carregando provedores de IA...');
        
        // Em implementação real, carregaria os provedores dos arquivos
        this.aiProviders.set('mock', {
            name: 'Mock Provider',
            processMessage: async (message, context) => {
                return `Você disse: "${message}". Esta é uma resposta simulada.`;
            }
        });
    }

    async setDefaultProvider() {
        // Configurar provedor padrão
        this.currentProvider = this.aiProviders.get('mock');
        console.log('AI Assistant | Provedor padrão configurado: Mock Provider');
    }

    async setAIProvider(providerName) {
        const provider = this.aiProviders.get(providerName);
        if (!provider) {
            throw new Error(`Provedor "${providerName}" não encontrado`);
        }
        
        this.currentProvider = provider;
        console.log(`AI Assistant | Provedor alterado para: ${provider.name}`);
    }

    // ========== UTILITÁRIOS ==========

    async sendMessage(content, options = {}) {
        const messageData = {
            content: content,
            type: options.type || 'other',
            speaker: {
                alias: options.alias || 'AI Assistant'
            },
            whisper: options.whisper || null
        };

        // Simular criação de mensagem do FoundryVTT
        console.log('AI Assistant | Enviando mensagem:', content);
        
        // Em FoundryVTT real seria: await ChatMessage.create(messageData);
        return messageData;
    }

    async sendErrorMessage(error) {
        await this.sendMessage(`❌ **Erro:** ${error}`, { type: 'error' });
    }

    async sendWhisper(content, targetUserId) {
        await this.sendMessage(content, { whisper: [targetUserId] });
    }

    getStats() {
        return {
            initialized: this.initialized,
            commandsRegistered: this.commands.size,
            conversationHistoryLength: this.conversationHistory.length,
            activeConversations: this.activeConversations.size,
            availableProviders: this.aiProviders.size,
            currentProvider: this.currentProvider?.name || null
        };
    }

    // Método para processar mensagem diretamente (para testes)
    async processDirectMessage(content, options = {}) {
        const mockMessage = {
            content: content,
            user: { name: options.userName || 'Test User' },
            type: options.type || 'ic'
        };

        await this.onChatMessage(mockMessage, {}, 'test-user-id');
    }
}
