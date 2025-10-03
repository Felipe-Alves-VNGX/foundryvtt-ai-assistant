/**
 * FoundryVTT AI Assistant - Arquivo Principal
 * Integra todos os componentes do módulo
 */

import { AIUserManager } from './ai-user-manager.js';
import { APIHandler } from './api-handler.js';
import { PermissionManager } from './permissions.js';
import { ChatInterface } from './chat-interface.js';
import { ManusProvider } from './providers/manus.js';
import { OpenAIProvider } from './providers/openai.js';

class AIAssistant {
    constructor() {
        this.initialized = false;
        this.components = {};
        this.providers = new Map();
        this.currentProvider = null;
        this.config = {};
        this.startTime = Date.now();
    }

    async initialize() {
        console.log('AI Assistant | Iniciando módulo...');
        
        try {
            // Carregar configurações
            await this.loadConfiguration();
            
            // Inicializar componentes principais
            await this.initializeComponents();
            
            // Configurar provedores de IA
            await this.initializeProviders();
            
            // Configurar hooks do FoundryVTT
            this.setupFoundryHooks();
            
            // Registrar configurações do módulo
            this.registerModuleSettings();
            
            // Configurar API pública
            this.setupPublicAPI();
            
            this.initialized = true;
            const initTime = Date.now() - this.startTime;
            
            console.log(`AI Assistant | Módulo inicializado com sucesso em ${initTime}ms`);
            
            // Notificar usuários
            this.notifyInitialization();
            
        } catch (error) {
            console.error('AI Assistant | Erro na inicialização:', error);
            ui.notifications.error(`Erro ao inicializar AI Assistant: ${error.message}`);
            throw error;
        }
    }

    async loadConfiguration() {
        console.log('AI Assistant | Carregando configurações...');
        
        // Configurações padrão
        this.config = {
            // Configurações gerais
            enabled: true,
            debugMode: false,
            autoCreateAIUser: true,
            defaultPermissionLevel: 'BASIC',
            
            // Configurações de chat
            commandPrefix: '/ai',
            respondToMentions: true,
            conversationHistoryLimit: 100,
            
            // Configurações de provedores
            defaultProvider: 'manus',
            providers: {
                manus: {
                    enabled: true,
                    apiKey: '',
                    model: 'gpt-4.1-mini',
                    maxTokens: 2000,
                    temperature: 0.7
                },
                openai: {
                    enabled: false,
                    apiKey: '',
                    model: 'gpt-4',
                    maxTokens: 2000,
                    temperature: 0.7
                }
            },
            
            // Configurações de segurança
            rateLimitEnabled: true,
            maxRequestsPerMinute: 30,
            requireGMApprovalForDangerous: true,
            
            // Configurações de UI
            showStatusInChat: true,
            showPermissionRequests: true,
            compactMode: false
        };

        // Carregar configurações salvas (se existirem)
        try {
            // Simular carregamento de configurações (FoundryVTT real usaria game.settings)
            const savedConfig = this.getStoredConfig() || {};
            this.config = { ...this.config, ...savedConfig };
        } catch (error) {
            console.warn('AI Assistant | Erro ao carregar configurações salvas, usando padrão:', error);
        }
    }

    getStoredConfig() {
        // Simular storage - em FoundryVTT real seria game.settings.get()
        try {
            return JSON.parse(localStorage.getItem('ai-assistant-config') || '{}');
        } catch {
            return {};
        }
    }

    async initializeComponents() {
        console.log('AI Assistant | Inicializando componentes...');
        
        // Inicializar gerenciador de permissões
        this.components.permissionManager = new PermissionManager();
        await this.components.permissionManager.initialize();
        
        // Inicializar gerenciador de usuário IA
        this.components.aiUserManager = new AIUserManager(this.components.permissionManager);
        await this.components.aiUserManager.initialize();
        
        // Inicializar handler de API
        this.components.apiHandler = new APIHandler(
            this.components.permissionManager,
            this.components.aiUserManager
        );
        await this.components.apiHandler.initialize();
        
        // Inicializar interface de chat
        this.components.chatInterface = new ChatInterface(
            this.components.permissionManager,
            this.components.apiHandler,
            this.components.aiUserManager
        );
        await this.components.chatInterface.initialize();
        
        console.log('AI Assistant | Componentes inicializados com sucesso');
    }

    async initializeProviders() {
        console.log('AI Assistant | Inicializando provedores de IA...');
        
        // Inicializar provedor Manus
        if (this.config.providers.manus.enabled) {
            try {
                const manusProvider = new ManusProvider(this.config.providers.manus);
                await manusProvider.initialize();
                this.providers.set('manus', manusProvider);
                console.log('AI Assistant | Provedor Manus inicializado');
            } catch (error) {
                console.warn('AI Assistant | Erro ao inicializar provedor Manus:', error);
            }
        }
        
        // Inicializar provedor OpenAI
        if (this.config.providers.openai.enabled) {
            try {
                const openaiProvider = new OpenAIProvider(this.config.providers.openai);
                await openaiProvider.initialize();
                this.providers.set('openai', openaiProvider);
                console.log('AI Assistant | Provedor OpenAI inicializado');
            } catch (error) {
                console.warn('AI Assistant | Erro ao inicializar provedor OpenAI:', error);
            }
        }
        
        // Configurar provedor padrão
        await this.setDefaultProvider();
    }

    async setDefaultProvider() {
        const defaultProviderName = this.config.defaultProvider;
        const provider = this.providers.get(defaultProviderName);
        
        if (provider) {
            this.currentProvider = provider;
            console.log(`AI Assistant | Provedor padrão configurado: ${provider.name}`);
        } else {
            // Usar o primeiro provedor disponível
            const firstProvider = this.providers.values().next().value;
            if (firstProvider) {
                this.currentProvider = firstProvider;
                console.log(`AI Assistant | Usando primeiro provedor disponível: ${firstProvider.name}`);
            } else {
                console.warn('AI Assistant | Nenhum provedor de IA disponível');
            }
        }
        
        // Configurar provedor na interface de chat
        if (this.currentProvider && this.components.chatInterface) {
            await this.components.chatInterface.setAIProvider(this.currentProvider.name.toLowerCase());
        }
    }

    setupFoundryHooks() {
        console.log('AI Assistant | Configurando hooks do FoundryVTT...');
        
        // Simular hooks do FoundryVTT para demonstração
        // Em implementação real, usaria Hooks.on() do FoundryVTT
        this.simulateFoundryHooks();
    }

    simulateFoundryHooks() {
        // Simular sistema de hooks do FoundryVTT
        console.log('AI Assistant | Hooks configurados (simulação)');
    }

    registerModuleSettings() {
        console.log('AI Assistant | Registrando configurações do módulo...');
        
        // Simular registro de configurações
        // Em FoundryVTT real, usaria game.settings.register()
        this.simulateSettingsRegistration();
    }

    simulateSettingsRegistration() {
        // Simular registro de configurações
        console.log('AI Assistant | Configurações registradas (simulação)');
    }

    setupPublicAPI() {
        console.log('AI Assistant | Configurando API pública...');
        
        // Expor API pública do módulo
        const api = {
            // Métodos principais
            isInitialized: () => this.initialized,
            getStats: () => this.getStats(),
            getConfig: () => ({ ...this.config }),
            
            // Gerenciamento de provedores
            getProviders: () => Array.from(this.providers.keys()),
            getCurrentProvider: () => this.currentProvider?.name || null,
            setProvider: (name) => this.setProvider(name),
            
            // Permissões
            checkPermission: (action) => this.components.permissionManager?.checkPermission(action) || false,
            grantPermission: (action, granted) => this.components.permissionManager?.grantPermission(action, granted),
            setPermissionLevel: (level) => this.components.permissionManager?.setPermissionLevel(level),
            
            // Chat e comandos
            sendMessage: (content, options) => this.components.chatInterface?.sendMessage(content, options),
            processCommand: (command) => this.components.chatInterface?.processDirectMessage(command),
            
            // Usuário IA
            getAIUser: () => this.components.aiUserManager?.getAIUser(),
            getAIUserStats: () => this.components.aiUserManager?.getAIUserStats(),
            
            // Utilitários
            approvePermission: (action) => this.approvePermission(action),
            denyPermission: (action) => this.denyPermission(action),
            resetModule: () => this.resetModule()
        };

        // Expor API globalmente
        window.aiAssistantAPI = api;
        
        console.log('AI Assistant | API pública configurada');
    }

    // ========== MÉTODOS PÚBLICOS ==========

    async setProvider(providerName) {
        const provider = this.providers.get(providerName);
        if (!provider) {
            throw new Error(`Provedor "${providerName}" não encontrado`);
        }
        
        this.currentProvider = provider;
        this.config.defaultProvider = providerName;
        
        // Atualizar interface de chat
        if (this.components.chatInterface) {
            await this.components.chatInterface.setAIProvider(providerName);
        }
        
        // Salvar configuração
        await this.saveConfiguration();
        
        console.log(`AI Assistant | Provedor alterado para: ${provider.name}`);
    }

    async approvePermission(action) {
        if (this.components.permissionManager) {
            await this.components.permissionManager.grantPermission(action, true, { force: true });
            console.log(`AI Assistant | Permissão "${action}" aprovada para a IA`);
        }
    }

    async denyPermission(action) {
        if (this.components.permissionManager) {
            await this.components.permissionManager.grantPermission(action, false, { force: true });
            console.log(`AI Assistant | Permissão "${action}" negada para a IA`);
        }
    }

    async resetModule() {
        console.warn('AI Assistant | Resetando módulo...');
        
        try {
            // Reset de componentes
            if (this.components.permissionManager) {
                await this.components.permissionManager.resetToDefault();
            }
            
            // Limpar provedores
            for (const provider of this.providers.values()) {
                if (provider.cleanup) {
                    provider.cleanup();
                }
            }
            
            // Recarregar configurações
            await this.loadConfiguration();
            
            console.log('AI Assistant | Módulo resetado com sucesso');
            
        } catch (error) {
            console.error('AI Assistant | Erro ao resetar módulo:', error);
        }
    }

    async saveConfiguration() {
        try {
            // Simular salvamento - em FoundryVTT real seria game.settings.set()
            localStorage.setItem('ai-assistant-config', JSON.stringify(this.config));
            console.log('AI Assistant | Configuração salva');
        } catch (error) {
            console.error('AI Assistant | Erro ao salvar configuração:', error);
        }
    }

    getStats() {
        const stats = {
            initialized: this.initialized,
            enabled: this.config.enabled,
            uptime: Date.now() - this.startTime,
            currentProvider: this.currentProvider?.name || null,
            availableProviders: Array.from(this.providers.keys()),
            components: {}
        };

        // Estatísticas dos componentes
        if (this.components.permissionManager) {
            stats.components.permissions = this.components.permissionManager.getStats();
        }
        
        if (this.components.aiUserManager) {
            stats.components.aiUser = this.components.aiUserManager.getAIUserStats();
        }
        
        if (this.components.apiHandler) {
            stats.components.apiHandler = this.components.apiHandler.getStats();
        }
        
        if (this.components.chatInterface) {
            stats.components.chatInterface = this.components.chatInterface.getStats();
        }

        // Estatísticas dos provedores
        stats.providers = {};
        for (const [name, provider] of this.providers.entries()) {
            if (provider.getStats) {
                stats.providers[name] = provider.getStats();
            }
        }

        return stats;
    }

    notifyInitialization() {
        const providerCount = this.providers.size;
        const message = `AI Assistant inicializado com ${providerCount} provedor(es) de IA`;
        
        console.log(`AI Assistant | ${message}`);
    }

    // Método para demonstração - processar comando diretamente
    async processTestCommand(command) {
        if (this.components.chatInterface) {
            await this.components.chatInterface.processDirectMessage(command);
        }
    }

    // Método para demonstração - obter status completo
    getFullStatus() {
        return {
            module: {
                initialized: this.initialized,
                uptime: Date.now() - this.startTime,
                config: this.config
            },
            components: {
                permissionManager: this.components.permissionManager?.getStats(),
                aiUserManager: this.components.aiUserManager?.getAIUserStats(),
                apiHandler: this.components.apiHandler?.getStats(),
                chatInterface: this.components.chatInterface?.getStats()
            },
            providers: Object.fromEntries(
                Array.from(this.providers.entries()).map(([name, provider]) => [
                    name, 
                    provider.getStats ? provider.getStats() : { name: provider.name }
                ])
            )
        };
    }
}

// ========== INICIALIZAÇÃO DO MÓDULO ==========

// Instância global do módulo
let aiAssistant = null;

// Função de inicialização
async function initializeAIAssistant() {
    console.log('AI Assistant | Iniciando inicialização...');
    
    try {
        aiAssistant = new AIAssistant();
        await aiAssistant.initialize();
        
        // Expor instância globalmente
        window.aiAssistant = aiAssistant;
        
        return aiAssistant;
        
    } catch (error) {
        console.error('AI Assistant | Falha na inicialização:', error);
        throw error;
    }
}

// Simular hooks do FoundryVTT para demonstração
// Em implementação real, seria:
// Hooks.once('init', initializeAIAssistant);

// Para demonstração, inicializar imediatamente
initializeAIAssistant().then(() => {
    console.log('AI Assistant | Módulo pronto para uso!');
    
    // Demonstrar funcionalidades
    console.log('AI Assistant | Estatísticas:', aiAssistant.getStats());
    console.log('AI Assistant | API disponível em window.aiAssistantAPI');
    console.log('AI Assistant | Instância disponível em window.aiAssistant');
    
}).catch(error => {
    console.error('AI Assistant | Erro na inicialização:', error);
});

// Exportar para uso em outros módulos
export { AIAssistant, initializeAIAssistant };
