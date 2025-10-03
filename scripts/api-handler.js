/**
 * Manipulador de APIs do FoundryVTT
 * Responsável por todas as operações CRUD nos elementos do jogo
 */

export class APIHandler {
    constructor(permissionManager, logger) {
        this.permissionManager = permissionManager;
        this.logger = logger;
        this.initialized = false;
        this.operationQueue = [];
        this.isProcessingQueue = false;
    }

    async initialize() {
        console.log('AI Assistant | Inicializando APIHandler...');
        
        try {
            // Verificar se as APIs do FoundryVTT estão disponíveis
            this.validateFoundryAPIs();
            
            // Configurar templates padrão
            this.setupDefaultTemplates();
            
            // Inicializar fila de operações
            this.startQueueProcessor();
            
            this.initialized = true;
            console.log('AI Assistant | APIHandler inicializado com sucesso');
            
        } catch (error) {
            console.error('AI Assistant | Erro na inicialização do APIHandler:', error);
            throw error;
        }
    }

    validateFoundryAPIs() {
        const requiredAPIs = ['game.actors', 'game.items', 'game.scenes', 'game.journal', 'game.macros', 'game.tables', 'game.playlists'];
        
        for (const api of requiredAPIs) {
            if (!foundry.utils.getProperty(window, api)) {
                throw new Error(`API necessária não encontrada: ${api}`);
            }
        }
    }

    setupDefaultTemplates() {
        this.templates = {
            actor: {
                character: {
                    type: 'character',
                    system: {
                        abilities: {
                            str: { value: 10 }, dex: { value: 10 }, con: { value: 10 },
                            int: { value: 10 }, wis: { value: 10 }, cha: { value: 10 }
                        },
                        attributes: { hp: { value: 8, max: 8 }, ac: { value: 10 } },
                        details: { level: { value: 1 }, xp: { value: 0 } }
                    }
                },
                npc: {
                    type: 'npc',
                    system: {
                        abilities: {
                            str: { value: 10 }, dex: { value: 10 }, con: { value: 10 },
                            int: { value: 10 }, wis: { value: 10 }, cha: { value: 10 }
                        },
                        attributes: { hp: { value: 4, max: 4 }, ac: { value: 10 } },
                        details: { cr: 0.125, type: { value: 'humanoid' } }
                    }
                }
            },
            item: {
                weapon: {
                    type: 'weapon',
                    system: {
                        weaponType: 'simpleM',
                        damage: { parts: [['1d6', 'slashing']] },
                        properties: { finesse: false, light: false }
                    }
                },
                spell: {
                    type: 'spell',
                    system: {
                        level: 1,
                        school: 'evocation',
                        components: { verbal: true, somatic: true, material: false }
                    }
                }
            }
        };
    }

    startQueueProcessor() {
        setInterval(async () => {
            if (!this.isProcessingQueue && this.operationQueue.length > 0) {
                await this.processOperationQueue();
            }
        }, 100);
    }

    async processOperationQueue() {
        this.isProcessingQueue = true;
        
        try {
            while (this.operationQueue.length > 0) {
                const operation = this.operationQueue.shift();
                await this.executeOperation(operation);
            }
        } catch (error) {
            console.error('AI Assistant | Erro no processamento da fila:', error);
        } finally {
            this.isProcessingQueue = false;
        }
    }

    async executeOperation(operation) {
        try {
            const result = await operation.execute();
            if (operation.callback) {
                operation.callback(null, result);
            }
        } catch (error) {
            if (operation.callback) {
                operation.callback(error, null);
            }
        }
    }

    queueOperation(operation) {
        return new Promise((resolve, reject) => {
            this.operationQueue.push({
                ...operation,
                callback: (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            });
        });
    }

    // ========== ATORES ==========
    
    async createActor(data, options = {}) {
        return this.queueOperation({
            execute: async () => {
                const startTime = Date.now();
                
                try {
                    // Verificar permissões
                    if (!this.permissionManager.checkPermission('createActor')) {
                        throw new Error('Permissão insuficiente para criar atores');
                    }

                    // Validar dados
                    this.validateActorData(data);

                    // Aplicar template se necessário
                    if (!data.system && data.type && this.templates.actor[data.type]) {
                        data = foundry.utils.mergeObject(this.templates.actor[data.type], data, { inplace: false });
                    }

                    // Verificar duplicatas
                    if (options.checkDuplicates !== false) {
                        const existing = game.actors.find(a => a.name === data.name);
                        if (existing && !options.allowDuplicates) {
                            throw new Error(`Ator com nome "${data.name}" já existe`);
                        }
                    }

                    // Criar ator
                    const actor = await Actor.create(data);

                    // Log da operação
                    const duration = Date.now() - startTime;
                    this.logger?.info('Ator criado', {
                        actorId: actor.id,
                        name: actor.name,
                        type: actor.type,
                        duration: `${duration}ms`
                    });

                    return {
                        success: true,
                        actor: actor,
                        message: `Ator "${actor.name}" criado com sucesso`
                    };

                } catch (error) {
                    this.logger?.error('Erro ao criar ator', { error: error.message, data });
                    return {
                        success: false,
                        error: error.message,
                        message: `Erro ao criar ator: ${error.message}`
                    };
                }
            }
        });
    }

    async updateActor(actorId, updates, options = {}) {
        return this.queueOperation({
            execute: async () => {
                try {
                    if (!this.permissionManager.checkPermission('updateActor')) {
                        throw new Error('Permissão insuficiente para atualizar atores');
                    }

                    const actor = game.actors.get(actorId);
                    if (!actor) {
                        throw new Error(`Ator com ID "${actorId}" não encontrado`);
                    }

                    // Validar atualizações
                    this.validateActorData(updates, true);

                    await actor.update(updates);

                    this.logger?.info('Ator atualizado', {
                        actorId: actor.id,
                        name: actor.name,
                        updatedFields: Object.keys(updates)
                    });

                    return {
                        success: true,
                        actor: actor,
                        message: `Ator "${actor.name}" atualizado com sucesso`
                    };

                } catch (error) {
                    this.logger?.error('Erro ao atualizar ator', { actorId, error: error.message });
                    return {
                        success: false,
                        error: error.message,
                        message: `Erro ao atualizar ator: ${error.message}`
                    };
                }
            }
        });
    }

    async deleteActor(actorId, options = {}) {
        return this.queueOperation({
            execute: async () => {
                try {
                    if (!this.permissionManager.checkPermission('deleteActor')) {
                        throw new Error('Permissão insuficiente para remover atores');
                    }

                    const actor = game.actors.get(actorId);
                    if (!actor) {
                        throw new Error(`Ator com ID "${actorId}" não encontrado`);
                    }

                    // Verificar se é personagem de jogador
                    if (actor.type === 'character' && actor.hasPlayerOwner && !options.force) {
                        throw new Error('Não é possível remover personagem de jogador sem confirmação');
                    }

                    const actorName = actor.name;
                    await actor.delete();

                    this.logger?.info('Ator removido', { actorId, name: actorName });

                    return {
                        success: true,
                        message: `Ator "${actorName}" removido com sucesso`
                    };

                } catch (error) {
                    this.logger?.error('Erro ao remover ator', { actorId, error: error.message });
                    return {
                        success: false,
                        error: error.message,
                        message: `Erro ao remover ator: ${error.message}`
                    };
                }
            }
        });
    }

    async queryActors(filters = {}, options = {}) {
        try {
            if (!this.permissionManager.checkPermission('queryActors')) {
                throw new Error('Permissão insuficiente para buscar atores');
            }

            let actors = game.actors.contents;

            // Aplicar filtros
            if (filters.name) {
                const nameRegex = new RegExp(filters.name, 'i');
                actors = actors.filter(actor => nameRegex.test(actor.name));
            }

            if (filters.type) {
                actors = actors.filter(actor => actor.type === filters.type);
            }

            if (filters.level) {
                actors = actors.filter(actor => {
                    const level = actor.system?.details?.level?.value;
                    return level === filters.level;
                });
            }

            // Aplicar limite
            if (options.limit) {
                actors = actors.slice(0, options.limit);
            }

            // Formatar resultados
            const results = actors.map(actor => ({
                id: actor.id,
                name: actor.name,
                type: actor.type,
                img: actor.img,
                level: actor.system?.details?.level?.value,
                hp: actor.system?.attributes?.hp
            }));

            return {
                success: true,
                actors: results,
                count: results.length,
                message: `Encontrados ${results.length} ator(es)`
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: `Erro na busca: ${error.message}`
            };
        }
    }

    validateActorData(data, isUpdate = false) {
        if (!isUpdate && !data.name) {
            throw new Error('Nome é obrigatório');
        }

        if (data.name && (data.name.length < 1 || data.name.length > 50)) {
            throw new Error('Nome deve ter entre 1 e 50 caracteres');
        }

        if (!isUpdate && !data.type) {
            throw new Error('Tipo é obrigatório');
        }

        if (data.type && !['character', 'npc', 'vehicle'].includes(data.type)) {
            throw new Error('Tipo deve ser character, npc ou vehicle');
        }
    }

    // ========== ITENS ==========
    
    async createItem(data, actorId = null, options = {}) {
        return this.queueOperation({
            execute: async () => {
                try {
                    if (!this.permissionManager.checkPermission('createItem')) {
                        throw new Error('Permissão insuficiente para criar itens');
                    }

                    this.validateItemData(data);

                    // Aplicar template se necessário
                    if (!data.system && data.type && this.templates.item[data.type]) {
                        data = foundry.utils.mergeObject(this.templates.item[data.type], data, { inplace: false });
                    }

                    let item;
                    if (actorId) {
                        const actor = game.actors.get(actorId);
                        if (!actor) {
                            throw new Error(`Ator com ID "${actorId}" não encontrado`);
                        }
                        item = await actor.createEmbeddedDocuments('Item', [data]);
                        item = item[0];
                    } else {
                        item = await Item.create(data);
                    }

                    this.logger?.info('Item criado', {
                        itemId: item.id,
                        name: item.name,
                        type: item.type,
                        actorId: actorId
                    });

                    return {
                        success: true,
                        item: item,
                        message: `Item "${item.name}" criado com sucesso`
                    };

                } catch (error) {
                    this.logger?.error('Erro ao criar item', { error: error.message, data });
                    return {
                        success: false,
                        error: error.message,
                        message: `Erro ao criar item: ${error.message}`
                    };
                }
            }
        });
    }

    async updateItem(itemId, updates, actorId = null) {
        return this.queueOperation({
            execute: async () => {
                try {
                    if (!this.permissionManager.checkPermission('updateItem')) {
                        throw new Error('Permissão insuficiente para atualizar itens');
                    }

                    let item;
                    if (actorId) {
                        const actor = game.actors.get(actorId);
                        if (!actor) {
                            throw new Error(`Ator com ID "${actorId}" não encontrado`);
                        }
                        item = actor.items.get(itemId);
                    } else {
                        item = game.items.get(itemId);
                    }

                    if (!item) {
                        throw new Error(`Item com ID "${itemId}" não encontrado`);
                    }

                    await item.update(updates);

                    return {
                        success: true,
                        item: item,
                        message: `Item "${item.name}" atualizado com sucesso`
                    };

                } catch (error) {
                    return {
                        success: false,
                        error: error.message,
                        message: `Erro ao atualizar item: ${error.message}`
                    };
                }
            }
        });
    }

    validateItemData(data, isUpdate = false) {
        if (!isUpdate && !data.name) {
            throw new Error('Nome é obrigatório');
        }

        if (!isUpdate && !data.type) {
            throw new Error('Tipo é obrigatório');
        }
    }

    // ========== CENAS ==========
    
    async createScene(data, options = {}) {
        return this.queueOperation({
            execute: async () => {
                try {
                    if (!this.permissionManager.checkPermission('createScene')) {
                        throw new Error('Permissão insuficiente para criar cenas');
                    }

                    this.validateSceneData(data);

                    const scene = await Scene.create(data);

                    this.logger?.info('Cena criada', {
                        sceneId: scene.id,
                        name: scene.name
                    });

                    return {
                        success: true,
                        scene: scene,
                        message: `Cena "${scene.name}" criada com sucesso`
                    };

                } catch (error) {
                    return {
                        success: false,
                        error: error.message,
                        message: `Erro ao criar cena: ${error.message}`
                    };
                }
            }
        });
    }

    async activateScene(sceneId) {
        return this.queueOperation({
            execute: async () => {
                try {
                    if (!this.permissionManager.checkPermission('activateScene')) {
                        throw new Error('Permissão insuficiente para ativar cenas');
                    }

                    const scene = game.scenes.get(sceneId);
                    if (!scene) {
                        throw new Error(`Cena com ID "${sceneId}" não encontrada`);
                    }

                    await scene.activate();

                    return {
                        success: true,
                        scene: scene,
                        message: `Cena "${scene.name}" ativada com sucesso`
                    };

                } catch (error) {
                    return {
                        success: false,
                        error: error.message,
                        message: `Erro ao ativar cena: ${error.message}`
                    };
                }
            }
        });
    }

    validateSceneData(data, isUpdate = false) {
        if (!isUpdate && !data.name) {
            throw new Error('Nome é obrigatório');
        }
    }

    // ========== JORNAIS ==========
    
    async createJournalEntry(data, options = {}) {
        return this.queueOperation({
            execute: async () => {
                try {
                    if (!this.permissionManager.checkPermission('createJournal')) {
                        throw new Error('Permissão insuficiente para criar entradas de jornal');
                    }

                    this.validateJournalData(data);

                    const journal = await JournalEntry.create(data);

                    this.logger?.info('Entrada de jornal criada', {
                        journalId: journal.id,
                        name: journal.name
                    });

                    return {
                        success: true,
                        journal: journal,
                        message: `Entrada de jornal "${journal.name}" criada com sucesso`
                    };

                } catch (error) {
                    return {
                        success: false,
                        error: error.message,
                        message: `Erro ao criar entrada de jornal: ${error.message}`
                    };
                }
            }
        });
    }

    validateJournalData(data, isUpdate = false) {
        if (!isUpdate && !data.name) {
            throw new Error('Nome é obrigatório');
        }
    }

    // ========== MACROS ==========
    
    async createMacro(data, options = {}) {
        return this.queueOperation({
            execute: async () => {
                try {
                    if (!this.permissionManager.checkPermission('createMacro')) {
                        throw new Error('Permissão insuficiente para criar macros');
                    }

                    this.validateMacroData(data);

                    const macro = await Macro.create(data);

                    this.logger?.info('Macro criado', {
                        macroId: macro.id,
                        name: macro.name,
                        type: macro.type
                    });

                    return {
                        success: true,
                        macro: macro,
                        message: `Macro "${macro.name}" criado com sucesso`
                    };

                } catch (error) {
                    return {
                        success: false,
                        error: error.message,
                        message: `Erro ao criar macro: ${error.message}`
                    };
                }
            }
        });
    }

    async executeMacro(macroId, args = {}) {
        return this.queueOperation({
            execute: async () => {
                try {
                    if (!this.permissionManager.checkPermission('executeMacro')) {
                        throw new Error('Permissão insuficiente para executar macros');
                    }

                    const macro = game.macros.get(macroId);
                    if (!macro) {
                        throw new Error(`Macro com ID "${macroId}" não encontrado`);
                    }

                    const result = await macro.execute(args);

                    this.logger?.info('Macro executado', {
                        macroId: macro.id,
                        name: macro.name,
                        args: args
                    });

                    return {
                        success: true,
                        result: result,
                        message: `Macro "${macro.name}" executado com sucesso`
                    };

                } catch (error) {
                    return {
                        success: false,
                        error: error.message,
                        message: `Erro ao executar macro: ${error.message}`
                    };
                }
            }
        });
    }

    validateMacroData(data, isUpdate = false) {
        if (!isUpdate && !data.name) {
            throw new Error('Nome é obrigatório');
        }

        if (!isUpdate && !data.command) {
            throw new Error('Comando é obrigatório');
        }
    }

    // ========== UTILITÁRIOS ==========
    
    async rollDice(formula, options = {}) {
        try {
            if (!this.permissionManager.checkPermission('rollDice')) {
                throw new Error('Permissão insuficiente para rolar dados');
            }

            const roll = new Roll(formula);
            await roll.evaluate();

            if (options.toChat) {
                await roll.toMessage({
                    speaker: { alias: 'AI Assistant' },
                    flavor: options.flavor || `Rolagem: ${formula}`
                });
            }

            return {
                success: true,
                roll: roll,
                total: roll.total,
                formula: formula,
                message: `Rolagem ${formula} = ${roll.total}`
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: `Erro na rolagem: ${error.message}`
            };
        }
    }

    getStats() {
        return {
            initialized: this.initialized,
            queueLength: this.operationQueue.length,
            isProcessingQueue: this.isProcessingQueue,
            collections: {
                actors: game.actors.size,
                items: game.items.size,
                scenes: game.scenes.size,
                journal: game.journal.size,
                macros: game.macros.size,
                tables: game.tables.size,
                playlists: game.playlists.size
            }
        };
    }
}
