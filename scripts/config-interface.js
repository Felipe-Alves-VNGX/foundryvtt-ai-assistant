/**
 * Interface de configuração para o AI Assistant
 * Fornece uma UI amigável para configurar o módulo
 */

export class ConfigInterface extends FormApplication {
    constructor(aiAssistant, options = {}) {
        super({}, options);
        this.aiAssistant = aiAssistant;
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: 'ai-assistant-config',
            title: 'AI Assistant - Configurações',
            template: 'modules/foundryvtt-ai-assistant/templates/config-form.hbs',
            width: 600,
            height: 'auto',
            closeOnSubmit: true,
            submitOnChange: false,
            submitOnClose: false,
            resizable: true,
            classes: ['ai-assistant-config-form']
        });
    }

    getData() {
        const config = this.aiAssistant.config;
        
        return {
            // Configurações gerais
            enabled: config.enabled,
            debugMode: config.debugMode,
            commandPrefix: config.commandPrefix,
            autoCreateAIUser: config.autoCreateAIUser,
            defaultPermissionLevel: config.defaultPermissionLevel,
            rateLimitEnabled: config.rateLimitEnabled,
            maxRequestsPerMinute: config.maxRequestsPerMinute,
            showStatusInChat: config.showStatusInChat,
            compactMode: config.compactMode,
            conversationHistoryLimit: config.conversationHistoryLimit,

            // Provedores disponíveis
            providers: this.getProviderOptions(),
            
            // Configurações de provedores
            providerConfigs: this.getProviderConfigs(),
            
            // Níveis de permissão
            permissionLevels: this.getPermissionLevels()
        };
    }

    getProviderOptions() {
        const currentProvider = this.aiAssistant.config.defaultProvider;
        
        return [
            {
                id: 'manus',
                name: 'Manus',
                selected: currentProvider === 'manus'
            },
            {
                id: 'openai',
                name: 'OpenAI',
                selected: currentProvider === 'openai'
            }
        ];
    }

    getProviderConfigs() {
        const configs = {};
        
        // Configuração Manus
        configs.manus = {
            name: 'Manus',
            enabled: this.aiAssistant.config.providers.manus.enabled,
            apiKey: this.aiAssistant.config.providers.manus.apiKey,
            maxTokens: this.aiAssistant.config.providers.manus.maxTokens,
            temperature: this.aiAssistant.config.providers.manus.temperature,
            models: [
                {
                    id: 'gpt-4.1-mini',
                    name: 'GPT-4.1 Mini',
                    selected: this.aiAssistant.config.providers.manus.model === 'gpt-4.1-mini'
                },
                {
                    id: 'gpt-4.1-nano',
                    name: 'GPT-4.1 Nano',
                    selected: this.aiAssistant.config.providers.manus.model === 'gpt-4.1-nano'
                },
                {
                    id: 'gemini-2.5-flash',
                    name: 'Gemini 2.5 Flash',
                    selected: this.aiAssistant.config.providers.manus.model === 'gemini-2.5-flash'
                }
            ]
        };

        // Configuração OpenAI
        configs.openai = {
            name: 'OpenAI',
            enabled: this.aiAssistant.config.providers.openai.enabled,
            apiKey: this.aiAssistant.config.providers.openai.apiKey,
            maxTokens: this.aiAssistant.config.providers.openai.maxTokens,
            temperature: this.aiAssistant.config.providers.openai.temperature,
            models: [
                {
                    id: 'gpt-4',
                    name: 'GPT-4',
                    selected: this.aiAssistant.config.providers.openai.model === 'gpt-4'
                },
                {
                    id: 'gpt-4-turbo',
                    name: 'GPT-4 Turbo',
                    selected: this.aiAssistant.config.providers.openai.model === 'gpt-4-turbo'
                },
                {
                    id: 'gpt-3.5-turbo',
                    name: 'GPT-3.5 Turbo',
                    selected: this.aiAssistant.config.providers.openai.model === 'gpt-3.5-turbo'
                }
            ]
        };

        return configs;
    }

    getPermissionLevels() {
        const currentLevel = this.aiAssistant.config.defaultPermissionLevel;
        
        return [
            {
                id: 'NONE',
                name: 'Nenhuma',
                selected: currentLevel === 'NONE'
            },
            {
                id: 'BASIC',
                name: 'Básica',
                selected: currentLevel === 'BASIC'
            },
            {
                id: 'INTERMEDIATE',
                name: 'Intermediária',
                selected: currentLevel === 'INTERMEDIATE'
            },
            {
                id: 'ADVANCED',
                name: 'Avançada',
                selected: currentLevel === 'ADVANCED'
            },
            {
                id: 'FULL',
                name: 'Completa',
                selected: currentLevel === 'FULL'
            }
        ];
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Botão de teste de conexão para provedores
        html.find('.test-connection').click(this._onTestConnection.bind(this));
        
        // Botão de reset para configurações padrão
        html.find('.reset-config').click(this._onResetConfig.bind(this));
        
        // Validação em tempo real de API keys
        html.find('input[name*="apiKey"]').on('input', this._onApiKeyInput.bind(this));
    }

    async _onTestConnection(event) {
        event.preventDefault();
        
        const button = event.currentTarget;
        const provider = button.dataset.provider;
        const originalText = button.textContent;
        
        button.textContent = 'Testando...';
        button.disabled = true;
        
        try {
            // Obter configurações atuais do formulário
            const formData = new FormData(this.form);
            const apiKey = formData.get(`providers.${provider}.apiKey`);
            const model = formData.get(`providers.${provider}.model`);
            
            if (!apiKey) {
                throw new Error('API Key é obrigatória');
            }
            
            // Testar conexão com o provedor
            const providerInstance = this.aiAssistant.providers.get(provider);
            if (providerInstance && providerInstance.testConnection) {
                await providerInstance.testConnection({ apiKey, model });
                ui.notifications.info(`Conexão com ${provider} testada com sucesso!`);
            } else {
                throw new Error('Provedor não suporta teste de conexão');
            }
            
        } catch (error) {
            ui.notifications.error(`Erro ao testar conexão: ${error.message}`);
        } finally {
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    async _onResetConfig(event) {
        event.preventDefault();
        
        const confirmed = await Dialog.confirm({
            title: 'Resetar Configurações',
            content: '<p>Tem certeza que deseja resetar todas as configurações para os valores padrão?</p>',
            yes: () => true,
            no: () => false
        });
        
        if (confirmed) {
            await this.aiAssistant.resetModule();
            this.render(true);
            ui.notifications.info('Configurações resetadas para os valores padrão');
        }
    }

    _onApiKeyInput(event) {
        const input = event.currentTarget;
        const value = input.value.trim();
        
        // Validação básica de API key
        if (value.length > 0 && value.length < 10) {
            input.style.borderColor = '#ff6b6b';
            input.title = 'API Key parece muito curta';
        } else if (value.length >= 10) {
            input.style.borderColor = '#51cf66';
            input.title = 'API Key válida';
        } else {
            input.style.borderColor = '';
            input.title = '';
        }
    }

    async _updateObject(event, formData) {
        try {
            // Processar dados do formulário
            const config = foundry.utils.expandObject(formData);
            
            // Atualizar configuração do AI Assistant
            this.aiAssistant.config = foundry.utils.mergeObject(this.aiAssistant.config, config);
            
            // Salvar configurações
            await this.aiAssistant.saveConfiguration();
            
            // Reinicializar provedores se necessário
            if (config.providers) {
                await this.aiAssistant.initializeProviders();
            }
            
            // Atualizar provedor padrão se mudou
            if (config.defaultProvider && config.defaultProvider !== this.aiAssistant.config.defaultProvider) {
                await this.aiAssistant.setProvider(config.defaultProvider);
            }
            
            ui.notifications.info('Configurações salvas com sucesso!');
            
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            ui.notifications.error(`Erro ao salvar configurações: ${error.message}`);
        }
    }

    // Método estático para abrir a interface
    static async show(aiAssistant) {
        const configInterface = new ConfigInterface(aiAssistant);
        return configInterface.render(true);
    }
}

// Registrar comando de chat para abrir configurações
export function registerConfigCommand(aiAssistant) {
    if (typeof Hooks !== 'undefined') {
        Hooks.on('chatMessage', (chatLog, message, chatData) => {
            if (message === '/ai-config' && game.user.isGM) {
                ConfigInterface.show(aiAssistant);
                return false; // Prevenir que a mensagem apareça no chat
            }
        });
    }
}
