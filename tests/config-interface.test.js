/**
 * Testes para a ConfigInterface
 */

import { ConfigInterface } from '../scripts/config-interface.js';

describe('ConfigInterface', () => {
    let configInterface;
    let mockAIAssistant;

    beforeEach(() => {
        mockAIAssistant = {
            config: {
                enabled: true,
                debugMode: false,
                commandPrefix: '/ai',
                autoCreateAIUser: true,
                defaultPermissionLevel: 'BASIC',
                rateLimitEnabled: true,
                maxRequestsPerMinute: 30,
                showStatusInChat: true,
                compactMode: false,
                conversationHistoryLimit: 100,
                defaultProvider: 'manus',
                providers: {
                    manus: {
                        enabled: true,
                        apiKey: 'test-key',
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
                }
            },
            providers: new Map([
                ['manus', { testConnection: jest.fn() }],
                ['openai', { testConnection: jest.fn() }]
            ]),
            saveConfiguration: jest.fn(),
            initializeProviders: jest.fn(),
            setProvider: jest.fn(),
            resetModule: jest.fn()
        };

        configInterface = new ConfigInterface(mockAIAssistant);
    });

    describe('Configuração Padrão', () => {
        test('deve ter opções padrão corretas', () => {
            const options = ConfigInterface.defaultOptions;
            
            expect(options.id).toBe('ai-assistant-config');
            expect(options.title).toBe('AI Assistant - Configurações');
            expect(options.template).toBe('modules/foundryvtt-ai-assistant/templates/config-form.hbs');
            expect(options.width).toBe(600);
            expect(options.closeOnSubmit).toBe(true);
            expect(options.resizable).toBe(true);
        });
    });

    describe('Dados do Formulário', () => {
        test('deve retornar dados corretos', () => {
            const data = configInterface.getData();
            
            expect(data.enabled).toBe(true);
            expect(data.debugMode).toBe(false);
            expect(data.commandPrefix).toBe('/ai');
            expect(data.autoCreateAIUser).toBe(true);
            expect(data.defaultPermissionLevel).toBe('BASIC');
            expect(data.providers).toHaveLength(2);
            expect(data.providerConfigs).toHaveProperty('manus');
            expect(data.providerConfigs).toHaveProperty('openai');
            expect(data.permissionLevels).toHaveLength(5);
        });

        test('deve configurar provedores corretamente', () => {
            const data = configInterface.getData();
            
            const manusProvider = data.providers.find(p => p.id === 'manus');
            expect(manusProvider.selected).toBe(true);
            
            const openaiProvider = data.providers.find(p => p.id === 'openai');
            expect(openaiProvider.selected).toBe(false);
        });

        test('deve configurar modelos corretamente', () => {
            const data = configInterface.getData();
            
            const manusConfig = data.providerConfigs.manus;
            expect(manusConfig.models).toHaveLength(3);
            
            const selectedModel = manusConfig.models.find(m => m.selected);
            expect(selectedModel.id).toBe('gpt-4.1-mini');
        });

        test('deve configurar níveis de permissão corretamente', () => {
            const data = configInterface.getData();
            
            expect(data.permissionLevels).toHaveLength(5);
            
            const selectedLevel = data.permissionLevels.find(l => l.selected);
            expect(selectedLevel.id).toBe('BASIC');
        });
    });

    describe('Teste de Conexão', () => {
        test('deve testar conexão com sucesso', async () => {
            const mockEvent = {
                preventDefault: jest.fn(),
                currentTarget: {
                    dataset: { provider: 'manus' },
                    textContent: 'Testar Conexão',
                    disabled: false
                }
            };

            // Mock do formulário
            configInterface.form = {
                elements: {
                    'providers.manus.apiKey': { value: 'test-key' },
                    'providers.manus.model': { value: 'gpt-4.1-mini' }
                }
            };

            // Mock FormData
            global.FormData = jest.fn().mockImplementation(() => ({
                get: jest.fn((key) => {
                    if (key === 'providers.manus.apiKey') return 'test-key';
                    if (key === 'providers.manus.model') return 'gpt-4.1-mini';
                    return null;
                })
            }));

            const manusProvider = mockAIAssistant.providers.get('manus');
            manusProvider.testConnection.mockResolvedValue(true);

            await configInterface._onTestConnection(mockEvent);

            expect(manusProvider.testConnection).toHaveBeenCalledWith({
                apiKey: 'test-key',
                model: 'gpt-4.1-mini'
            });
            expect(ui.notifications.info).toHaveBeenCalledWith(
                'Conexão com manus testada com sucesso!'
            );
        });

        test('deve lidar com erro no teste de conexão', async () => {
            const mockEvent = {
                preventDefault: jest.fn(),
                currentTarget: {
                    dataset: { provider: 'manus' },
                    textContent: 'Testar Conexão',
                    disabled: false
                }
            };

            configInterface.form = {
                elements: {
                    'providers.manus.apiKey': { value: '' }
                }
            };

            global.FormData = jest.fn().mockImplementation(() => ({
                get: jest.fn(() => '')
            }));

            await configInterface._onTestConnection(mockEvent);

            expect(ui.notifications.error).toHaveBeenCalledWith(
                'Erro ao testar conexão: API Key é obrigatória'
            );
        });
    });

    describe('Reset de Configuração', () => {
        test('deve resetar configuração com confirmação', async () => {
            const mockEvent = {
                preventDefault: jest.fn()
            };

            // Mock do Dialog.confirm
            global.Dialog = {
                confirm: jest.fn().mockResolvedValue(true)
            };

            configInterface.render = jest.fn();

            await configInterface._onResetConfig(mockEvent);

            expect(Dialog.confirm).toHaveBeenCalled();
            expect(mockAIAssistant.resetModule).toHaveBeenCalled();
            expect(configInterface.render).toHaveBeenCalledWith(true);
            expect(ui.notifications.info).toHaveBeenCalledWith(
                'Configurações resetadas para os valores padrão'
            );
        });

        test('deve cancelar reset se não confirmado', async () => {
            const mockEvent = {
                preventDefault: jest.fn()
            };

            global.Dialog = {
                confirm: jest.fn().mockResolvedValue(false)
            };

            await configInterface._onResetConfig(mockEvent);

            expect(mockAIAssistant.resetModule).not.toHaveBeenCalled();
        });
    });

    describe('Validação de API Key', () => {
        test('deve validar API key muito curta', () => {
            const mockEvent = {
                currentTarget: {
                    value: '123',
                    style: {},
                    title: ''
                }
            };

            configInterface._onApiKeyInput(mockEvent);

            expect(mockEvent.currentTarget.style.borderColor).toBe('#ff6b6b');
            expect(mockEvent.currentTarget.title).toBe('API Key parece muito curta');
        });

        test('deve validar API key válida', () => {
            const mockEvent = {
                currentTarget: {
                    value: '1234567890abcdef',
                    style: {},
                    title: ''
                }
            };

            configInterface._onApiKeyInput(mockEvent);

            expect(mockEvent.currentTarget.style.borderColor).toBe('#51cf66');
            expect(mockEvent.currentTarget.title).toBe('API Key válida');
        });

        test('deve limpar validação para API key vazia', () => {
            const mockEvent = {
                currentTarget: {
                    value: '   ',
                    style: {},
                    title: ''
                }
            };

            configInterface._onApiKeyInput(mockEvent);

            expect(mockEvent.currentTarget.style.borderColor).toBe('');
            expect(mockEvent.currentTarget.title).toBe('');
        });
    });

    describe('Atualização de Objeto', () => {
        test('deve salvar configurações corretamente', async () => {
            const mockEvent = {};
            const formData = {
                enabled: false,
                debugMode: true,
                defaultProvider: 'openai',
                providers: {
                    manus: {
                        enabled: false
                    }
                }
            };

            global.foundry = {
                utils: {
                    expandObject: jest.fn().mockReturnValue(formData),
                    mergeObject: jest.fn().mockImplementation((original, other) => ({
                        ...original,
                        ...other
                    }))
                }
            };

            await configInterface._updateObject(mockEvent, formData);

            expect(foundry.utils.expandObject).toHaveBeenCalledWith(formData);
            expect(foundry.utils.mergeObject).toHaveBeenCalled();
            expect(mockAIAssistant.saveConfiguration).toHaveBeenCalled();
            expect(ui.notifications.info).toHaveBeenCalledWith(
                'Configurações salvas com sucesso!'
            );
        });

        test('deve reinicializar provedores se necessário', async () => {
            const mockEvent = {};
            const formData = {
                providers: {
                    manus: { enabled: false }
                }
            };

            global.foundry = {
                utils: {
                    expandObject: jest.fn().mockReturnValue(formData),
                    mergeObject: jest.fn().mockImplementation((original, other) => ({
                        ...original,
                        ...other
                    }))
                }
            };

            await configInterface._updateObject(mockEvent, formData);

            expect(mockAIAssistant.initializeProviders).toHaveBeenCalled();
        });

        test('deve alterar provedor padrão se mudou', async () => {
            const mockEvent = {};
            const formData = {
                defaultProvider: 'openai'
            };

            global.foundry = {
                utils: {
                    expandObject: jest.fn().mockReturnValue(formData),
                    mergeObject: jest.fn().mockImplementation((original, other) => ({
                        ...original,
                        ...other
                    }))
                }
            };

            await configInterface._updateObject(mockEvent, formData);

            expect(mockAIAssistant.setProvider).toHaveBeenCalledWith('openai');
        });

        test('deve lidar com erro ao salvar', async () => {
            const mockEvent = {};
            const formData = {};

            global.foundry = {
                utils: {
                    expandObject: jest.fn().mockReturnValue(formData),
                    mergeObject: jest.fn().mockImplementation(() => {
                        throw new Error('Erro de teste');
                    })
                }
            };

            await configInterface._updateObject(mockEvent, formData);

            expect(ui.notifications.error).toHaveBeenCalledWith(
                'Erro ao salvar configurações: Erro de teste'
            );
        });
    });

    describe('Método Estático Show', () => {
        test('deve criar e renderizar interface', async () => {
            const mockRender = jest.fn().mockResolvedValue(true);
            
            // Mock do constructor
            const originalConfigInterface = ConfigInterface;
            const MockConfigInterface = jest.fn().mockImplementation(() => ({
                render: mockRender
            }));
            MockConfigInterface.show = originalConfigInterface.show;

            const result = await MockConfigInterface.show(mockAIAssistant);

            expect(MockConfigInterface).toHaveBeenCalledWith(mockAIAssistant);
            expect(mockRender).toHaveBeenCalledWith(true);
            expect(result).toBe(true);
        });
    });
});
