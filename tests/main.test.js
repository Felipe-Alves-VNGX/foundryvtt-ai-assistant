/**
 * Testes para a classe principal AIAssistant
 */

import { AIAssistant } from '../scripts/main.js';

// Mock dos módulos dependentes
jest.mock('../scripts/ai-user-manager.js');
jest.mock('../scripts/api-handler.js');
jest.mock('../scripts/permissions.js');
jest.mock('../scripts/chat-interface.js');
jest.mock('../scripts/providers/manus.js');
jest.mock('../scripts/providers/openai.js');
jest.mock('../scripts/config-interface.js');

describe('AIAssistant', () => {
    let aiAssistant;

    beforeEach(() => {
        aiAssistant = new AIAssistant();
    });

    describe('Inicialização', () => {
        test('deve criar instância corretamente', () => {
            expect(aiAssistant).toBeInstanceOf(AIAssistant);
            expect(aiAssistant.initialized).toBe(false);
            expect(aiAssistant.components).toEqual({});
            expect(aiAssistant.providers).toBeInstanceOf(Map);
            expect(aiAssistant.currentProvider).toBeNull();
        });

        test('deve inicializar com configurações padrão', async () => {
            await aiAssistant.initialize();
            
            expect(aiAssistant.initialized).toBe(true);
            expect(aiAssistant.config).toBeDefined();
            expect(aiAssistant.config.enabled).toBe(true);
            expect(aiAssistant.config.defaultProvider).toBe('manus');
            expect(aiAssistant.config.commandPrefix).toBe('/ai');
        });

        test('deve carregar configurações salvas', async () => {
            const savedConfig = {
                enabled: false,
                defaultProvider: 'openai',
                debugMode: true
            };
            
            game.settings.get.mockReturnValue(savedConfig);
            
            await aiAssistant.initialize();
            
            expect(aiAssistant.config.enabled).toBe(false);
            expect(aiAssistant.config.defaultProvider).toBe('openai');
            expect(aiAssistant.config.debugMode).toBe(true);
        });

        test('deve lidar com erro na inicialização', async () => {
            // Simular erro na inicialização de componentes
            const mockError = new Error('Erro de teste');
            aiAssistant.initializeComponents = jest.fn().mockRejectedValue(mockError);
            
            await expect(aiAssistant.initialize()).rejects.toThrow('Erro de teste');
            expect(aiAssistant.initialized).toBe(false);
        });
    });

    describe('Gerenciamento de Configuração', () => {
        beforeEach(async () => {
            await aiAssistant.initialize();
        });

        test('deve salvar configuração corretamente', async () => {
            aiAssistant.config.debugMode = true;
            
            await aiAssistant.saveConfiguration();
            
            expect(game.settings.set).toHaveBeenCalledWith(
                'foundryvtt-ai-assistant',
                'config',
                aiAssistant.config
            );
        });

        test('deve usar localStorage como fallback', async () => {
            // Simular ausência do game.settings
            global.game = undefined;
            
            aiAssistant.config.debugMode = true;
            await aiAssistant.saveConfiguration();
            
            expect(localStorage.setItem).toHaveBeenCalledWith(
                'ai-assistant-config',
                JSON.stringify(aiAssistant.config)
            );
            
            // Restaurar game mock
            global.game = {
                settings: {
                    register: jest.fn(),
                    get: jest.fn(),
                    set: jest.fn()
                },
                user: { isGM: true, id: 'test-user-id' },
                users: { contents: [] },
                i18n: { localize: jest.fn((key) => key) }
            };
        });
    });

    describe('Gerenciamento de Provedores', () => {
        beforeEach(async () => {
            await aiAssistant.initialize();
        });

        test('deve alterar provedor corretamente', async () => {
            await aiAssistant.setProvider('openai');
            
            expect(aiAssistant.config.defaultProvider).toBe('openai');
            expect(aiAssistant.saveConfiguration).toHaveBeenCalled();
        });

        test('deve rejeitar provedor inválido', async () => {
            await expect(aiAssistant.setProvider('invalid-provider')).rejects.toThrow(
                'Provedor "invalid-provider" não encontrado'
            );
        });

        test('deve retornar lista de provedores disponíveis', () => {
            // Simular provedores inicializados
            aiAssistant.providers.set('manus', { name: 'Manus' });
            aiAssistant.providers.set('openai', { name: 'OpenAI' });
            
            const api = aiAssistant.setupPublicAPI();
            const providers = window.aiAssistantAPI.getProviders();
            
            expect(providers).toEqual(['manus', 'openai']);
        });
    });

    describe('API Pública', () => {
        beforeEach(async () => {
            await aiAssistant.initialize();
        });

        test('deve expor API corretamente', () => {
            expect(window.aiAssistantAPI).toBeDefined();
            expect(typeof window.aiAssistantAPI.isInitialized).toBe('function');
            expect(typeof window.aiAssistantAPI.getStats).toBe('function');
            expect(typeof window.aiAssistantAPI.getConfig).toBe('function');
            expect(typeof window.aiAssistantAPI.setProvider).toBe('function');
            expect(typeof window.aiAssistantAPI.openConfig).toBe('function');
        });

        test('deve retornar status de inicialização', () => {
            expect(window.aiAssistantAPI.isInitialized()).toBe(true);
        });

        test('deve retornar configuração (cópia)', () => {
            const config = window.aiAssistantAPI.getConfig();
            
            expect(config).toEqual(aiAssistant.config);
            expect(config).not.toBe(aiAssistant.config); // Deve ser uma cópia
        });

        test('deve retornar estatísticas', () => {
            const stats = window.aiAssistantAPI.getStats();
            
            expect(stats).toHaveProperty('initialized');
            expect(stats).toHaveProperty('enabled');
            expect(stats).toHaveProperty('uptime');
            expect(stats).toHaveProperty('currentProvider');
            expect(stats).toHaveProperty('availableProviders');
            expect(stats).toHaveProperty('components');
            expect(stats).toHaveProperty('providers');
        });
    });

    describe('Reset do Módulo', () => {
        beforeEach(async () => {
            await aiAssistant.initialize();
        });

        test('deve resetar módulo corretamente', async () => {
            // Modificar configurações
            aiAssistant.config.debugMode = true;
            aiAssistant.config.enabled = false;
            
            await aiAssistant.resetModule();
            
            // Verificar se foi resetado
            expect(aiAssistant.config.debugMode).toBe(false);
            expect(aiAssistant.config.enabled).toBe(true);
        });

        test('deve lidar com erro no reset', async () => {
            // Simular erro no reset de componentes
            aiAssistant.components.permissionManager = {
                resetToDefault: jest.fn().mockRejectedValue(new Error('Erro de reset'))
            };
            
            // Não deve lançar erro, apenas logar
            await expect(aiAssistant.resetModule()).resolves.not.toThrow();
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('Hooks do FoundryVTT', () => {
        test('deve registrar hooks quando disponível', async () => {
            await aiAssistant.initialize();
            
            expect(Hooks.on).toHaveBeenCalledWith('renderChatLog', expect.any(Function));
            expect(Hooks.on).toHaveBeenCalledWith('createChatMessage', expect.any(Function));
            expect(Hooks.on).toHaveBeenCalledWith('updateActor', expect.any(Function));
            expect(Hooks.on).toHaveBeenCalledWith('closeSettingsConfig', expect.any(Function));
        });

        test('deve usar fallback quando hooks não disponível', async () => {
            const originalHooks = global.Hooks;
            global.Hooks = undefined;
            
            await aiAssistant.initialize();
            
            // Deve inicializar sem erro
            expect(aiAssistant.initialized).toBe(true);
            
            global.Hooks = originalHooks;
        });
    });

    describe('Configurações do FoundryVTT', () => {
        test('deve registrar configurações quando game.settings disponível', async () => {
            await aiAssistant.initialize();
            
            expect(game.settings.register).toHaveBeenCalledWith(
                'foundryvtt-ai-assistant',
                'config',
                expect.any(Object)
            );
            
            expect(game.settings.register).toHaveBeenCalledWith(
                'foundryvtt-ai-assistant',
                'enabled',
                expect.any(Object)
            );
            
            expect(game.settings.register).toHaveBeenCalledWith(
                'foundryvtt-ai-assistant',
                'defaultProvider',
                expect.any(Object)
            );
        });

        test('deve usar fallback quando game.settings não disponível', async () => {
            const originalGame = global.game;
            global.game = undefined;
            
            await aiAssistant.initialize();
            
            // Deve inicializar sem erro
            expect(aiAssistant.initialized).toBe(true);
            
            global.game = originalGame;
        });
    });

    describe('Medição de Performance', () => {
        test('deve medir tempo de inicialização', async () => {
            const startTime = Date.now();
            await aiAssistant.initialize();
            const endTime = Date.now();
            
            const stats = aiAssistant.getStats();
            expect(stats.uptime).toBeGreaterThan(0);
            expect(stats.uptime).toBeLessThan(endTime - startTime + 100); // Margem de erro
        });
    });
});
