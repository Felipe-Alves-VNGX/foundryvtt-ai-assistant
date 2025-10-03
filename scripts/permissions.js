/**
 * Sistema de permissões para IA
 * Gerencia o que a IA pode e não pode fazer no FoundryVTT
 */

export class PermissionManager {
    constructor() {
        this.permissions = new Map();
        this.permissionLevels = new Map();
        this.temporaryPermissions = new Map();
        this.permissionHistory = [];
        this.initialized = false;
    }

    async initialize() {
        console.log('AI Assistant | Inicializando PermissionManager...');
        
        try {
            // Definir níveis de permissão
            this.definePermissionLevels();
            
            // Carregar permissões salvas
            await this.loadPermissions();
            
            // Configurar permissões padrão se necessário
            if (this.permissions.size === 0) {
                await this.setDefaultPermissions();
            }
            
            // Inicializar limpeza de permissões temporárias
            this.startTemporaryPermissionCleanup();
            
            this.initialized = true;
            console.log('AI Assistant | PermissionManager inicializado com sucesso');
            
        } catch (error) {
            console.error('AI Assistant | Erro na inicialização do PermissionManager:', error);
            throw error;
        }
    }

    definePermissionLevels() {
        // Definir níveis hierárquicos de permissão
        this.permissionLevels.set('NONE', {
            level: 0,
            name: 'Nenhuma',
            description: 'Sem permissões',
            permissions: {}
        });

        this.permissionLevels.set('BASIC', {
            level: 1,
            name: 'Básico',
            description: 'Permissões básicas de leitura e chat',
            permissions: {
                // Chat e comunicação
                sendMessage: true,
                sendWhisper: true,
                rollDice: true,
                
                // Consultas (somente leitura)
                queryActors: true,
                queryItems: true,
                queryScenes: true,
                queryJournal: true,
                queryMacros: true,
                queryTables: true,
                queryPlaylists: true,
                queryCompendium: true,
                
                // Visualização
                viewDocuments: true
            }
        });

        this.permissionLevels.set('STANDARD', {
            level: 2,
            name: 'Padrão',
            description: 'Permissões para criar e editar conteúdo básico',
            permissions: {
                // Herdar do BASIC
                ...this.permissionLevels.get('BASIC').permissions,
                
                // Criação e edição básica
                createItem: true,
                updateItem: true,
                deleteItem: true,
                
                createJournal: true,
                updateJournal: true,
                deleteJournal: true,
                
                createMacro: true,
                updateMacro: true,
                executeMacro: true,
                
                // Manipulação de atores limitada
                updateActor: true,
                
                // Importação de compêndios
                importFromCompendium: true
            }
        });

        this.permissionLevels.set('ADVANCED', {
            level: 3,
            name: 'Avançado',
            description: 'Permissões para manipulação completa de conteúdo',
            permissions: {
                // Herdar do STANDARD
                ...this.permissionLevels.get('STANDARD').permissions,
                
                // Criação e manipulação de atores
                createActor: true,
                deleteActor: true,
                
                // Manipulação de cenas
                createScene: true,
                updateScene: true,
                deleteScene: true,
                activateScene: true,
                
                // Tabelas e playlists
                createRollTable: true,
                updateRollTable: true,
                deleteRollTable: true,
                rollTable: true,
                
                createPlaylist: true,
                updatePlaylist: true,
                deletePlaylist: true,
                playAudio: true,
                
                // Tokens e combate
                createToken: true,
                updateToken: true,
                deleteToken: true,
                manageCombat: true
            }
        });

        this.permissionLevels.set('FULL', {
            level: 4,
            name: 'Completo',
            description: 'Todas as permissões (use com cuidado)',
            permissions: {
                // Herdar do ADVANCED
                ...this.permissionLevels.get('ADVANCED').permissions,
                
                // Permissões administrativas
                manageUsers: true,
                modifySettings: true,
                manageModules: true,
                
                // Operações perigosas
                deleteAnyDocument: true,
                executeArbitraryCode: true,
                modifyPermissions: true,
                
                // Sistema
                accessFileSystem: true,
                networkAccess: true
            }
        });
    }

    async loadPermissions() {
        try {
            // Simular carregamento de configurações (FoundryVTT real usaria game.settings)
            const savedPermissions = this.getStoredPermissions() || {};
            const savedLevel = this.getStoredPermissionLevel() || 'BASIC';
            
            // Aplicar nível de permissão
            await this.setPermissionLevel(savedLevel);
            
            // Aplicar permissões customizadas
            for (const [permission, value] of Object.entries(savedPermissions)) {
                this.permissions.set(permission, value);
            }
            
            console.log('AI Assistant | Permissões carregadas:', savedLevel);
            
        } catch (error) {
            console.warn('AI Assistant | Erro ao carregar permissões, usando padrão:', error);
            await this.setDefaultPermissions();
        }
    }

    getStoredPermissions() {
        // Simular storage - em FoundryVTT real seria game.settings.get()
        try {
            return JSON.parse(localStorage.getItem('ai-assistant-permissions') || '{}');
        } catch {
            return {};
        }
    }

    getStoredPermissionLevel() {
        // Simular storage - em FoundryVTT real seria game.settings.get()
        return localStorage.getItem('ai-assistant-permission-level') || 'BASIC';
    }

    async savePermissions() {
        try {
            const permissionsObj = Object.fromEntries(this.permissions);
            
            // Simular storage - em FoundryVTT real seria game.settings.set()
            localStorage.setItem('ai-assistant-permissions', JSON.stringify(permissionsObj));
            
            // Salvar histórico
            this.permissionHistory.push({
                timestamp: Date.now(),
                permissions: { ...permissionsObj },
                changedBy: 'system' // Em FoundryVTT real seria game.user.id
            });
            
            // Manter apenas os últimos 100 registros
            if (this.permissionHistory.length > 100) {
                this.permissionHistory.splice(0, this.permissionHistory.length - 100);
            }
            
            localStorage.setItem('ai-assistant-permission-history', JSON.stringify(this.permissionHistory));
            
            console.log('AI Assistant | Permissões salvas');
            
        } catch (error) {
            console.error('AI Assistant | Erro ao salvar permissões:', error);
            throw error;
        }
    }

    async setDefaultPermissions() {
        console.log('AI Assistant | Configurando permissões padrão (BASIC)');
        await this.setPermissionLevel('BASIC');
    }

    async setPermissionLevel(levelName) {
        const level = this.permissionLevels.get(levelName);
        if (!level) {
            throw new Error(`Nível de permissão "${levelName}" não encontrado`);
        }

        // Limpar permissões atuais
        this.permissions.clear();
        
        // Aplicar permissões do nível
        for (const [permission, value] of Object.entries(level.permissions)) {
            this.permissions.set(permission, value);
        }

        // Salvar nível atual
        localStorage.setItem('ai-assistant-permission-level', levelName);
        
        // Salvar permissões
        await this.savePermissions();
        
        console.log(`AI Assistant | Nível de permissão definido para: ${level.name}`);
        
        // Notificar mudança
        this.notifyPermissionChange(levelName, level.name);
    }

    checkPermission(action) {
        if (!this.initialized) {
            console.warn('AI Assistant | PermissionManager não inicializado, negando permissão');
            return false;
        }

        // Verificar permissão temporária primeiro
        const tempPermission = this.temporaryPermissions.get(action);
        if (tempPermission && tempPermission.expires > Date.now()) {
            return tempPermission.granted;
        }

        // Verificar permissão permanente
        const hasPermission = this.permissions.get(action) || false;
        
        // Log da verificação (apenas para debug)
        if (!hasPermission) {
            console.debug(`AI Assistant | Permissão negada para: ${action}`);
        }
        
        return hasPermission;
    }

    async grantPermission(action, granted = true, options = {}) {
        if (!this.checkPermission('modifyPermissions') && !options.force) {
            throw new Error('Permissão insuficiente para modificar permissões');
        }

        const oldValue = this.permissions.get(action);
        this.permissions.set(action, granted);
        
        // Salvar se não for temporário
        if (!options.temporary) {
            await this.savePermissions();
        }
        
        console.log(`AI Assistant | Permissão ${granted ? 'concedida' : 'revogada'}: ${action}`);
        
        // Log da mudança
        this.logPermissionChange(action, oldValue, granted, options);
        
        return true;
    }

    async revokePermission(action, options = {}) {
        return await this.grantPermission(action, false, options);
    }

    grantTemporaryPermission(action, duration = 300000, granted = true) { // 5 minutos padrão
        const expires = Date.now() + duration;
        
        this.temporaryPermissions.set(action, {
            granted: granted,
            expires: expires,
            grantedAt: Date.now(),
            grantedBy: 'system' // Em FoundryVTT real seria game.user.id
        });
        
        console.log(`AI Assistant | Permissão temporária ${granted ? 'concedida' : 'revogada'}: ${action} (expira em ${duration/1000}s)`);
        
        // Agendar limpeza
        setTimeout(() => {
            this.temporaryPermissions.delete(action);
            console.log(`AI Assistant | Permissão temporária expirada: ${action}`);
        }, duration);
        
        return true;
    }

    async requestPermission(action, reason = '', options = {}) {
        // Se já tem permissão, retornar true
        if (this.checkPermission(action)) {
            return { granted: true, message: 'Permissão já concedida' };
        }

        // Log da solicitação
        console.log(`AI Assistant | Solicitação de permissão: ${action} - Motivo: ${reason}`);
        
        // Se for auto-aprovação para permissões básicas
        if (options.autoApprove && this.isBasicPermission(action)) {
            this.grantTemporaryPermission(action, options.duration || 300000);
            return { granted: true, temporary: true, message: 'Permissão temporária auto-aprovada' };
        }
        
        return { granted: false, pending: true, message: 'Solicitação enviada aos GMs' };
    }

    isBasicPermission(action) {
        const basicPermissions = [
            'rollDice', 'sendMessage', 'queryActors', 'queryItems', 
            'queryScenes', 'viewDocuments'
        ];
        return basicPermissions.includes(action);
    }

    notifyPermissionChange(levelName, levelDisplayName) {
        console.log(`AI Assistant | Nível de permissão da IA alterado para: ${levelDisplayName}`);
    }

    logPermissionChange(action, oldValue, newValue, options) {
        const logEntry = {
            timestamp: Date.now(),
            action: action,
            oldValue: oldValue,
            newValue: newValue,
            changedBy: 'system', // Em FoundryVTT real seria game.user.id
            temporary: options.temporary || false,
            reason: options.reason || ''
        };
        
        // Adicionar ao histórico local
        this.permissionHistory.push(logEntry);
    }

    startTemporaryPermissionCleanup() {
        // Limpar permissões temporárias expiradas a cada minuto
        setInterval(() => {
            const now = Date.now();
            const expired = [];
            
            for (const [action, permission] of this.temporaryPermissions.entries()) {
                if (permission.expires <= now) {
                    expired.push(action);
                }
            }
            
            for (const action of expired) {
                this.temporaryPermissions.delete(action);
                console.log(`AI Assistant | Permissão temporária expirada: ${action}`);
            }
        }, 60000);
    }

    // Métodos de conveniência para verificações específicas
    canCreateActors() {
        return this.checkPermission('createActor');
    }

    canDeleteActors() {
        return this.checkPermission('deleteActor');
    }

    canModifyScenes() {
        return this.checkPermission('createScene') || this.checkPermission('updateScene');
    }

    canExecuteMacros() {
        return this.checkPermission('executeMacro');
    }

    canManageUsers() {
        return this.checkPermission('manageUsers');
    }

    // Métodos de informação
    getCurrentPermissionLevel() {
        return this.getStoredPermissionLevel() || 'BASIC';
    }

    getAvailablePermissionLevels() {
        return Array.from(this.permissionLevels.entries()).map(([key, level]) => ({
            key: key,
            name: level.name,
            description: level.description,
            level: level.level
        }));
    }

    getActivePermissions() {
        const active = [];
        const now = Date.now();
        
        // Permissões permanentes
        for (const [action, granted] of this.permissions.entries()) {
            if (granted) {
                active.push({
                    action: action,
                    type: 'permanent',
                    granted: granted
                });
            }
        }
        
        // Permissões temporárias
        for (const [action, permission] of this.temporaryPermissions.entries()) {
            if (permission.expires > now) {
                active.push({
                    action: action,
                    type: 'temporary',
                    granted: permission.granted,
                    expires: permission.expires,
                    remaining: permission.expires - now
                });
            }
        }
        
        return active;
    }

    getPermissionHistory(limit = 50) {
        return this.permissionHistory.slice(-limit);
    }

    getStats() {
        return {
            initialized: this.initialized,
            currentLevel: this.getCurrentPermissionLevel(),
            totalPermissions: this.permissions.size,
            activePermissions: this.getActivePermissions().length,
            temporaryPermissions: this.temporaryPermissions.size,
            historyEntries: this.permissionHistory.length
        };
    }

    // Método para reset completo (apenas para emergências)
    async resetToDefault() {
        console.warn('AI Assistant | Resetando permissões para padrão');
        
        this.permissions.clear();
        this.temporaryPermissions.clear();
        this.permissionHistory = [];
        
        await this.setDefaultPermissions();
        
        console.log('AI Assistant | Permissões da IA foram resetadas para o padrão');
    }

    // Validação de segurança
    validatePermissionRequest(action, context = {}) {
        // Lista de ações que requerem validação extra
        const dangerousActions = [
            'deleteAnyDocument', 'executeArbitraryCode', 'modifySettings',
            'manageUsers', 'accessFileSystem', 'networkAccess'
        ];
        
        if (dangerousActions.includes(action)) {
            console.warn(`AI Assistant | Ação perigosa solicitada: ${action}`);
            return {
                valid: false,
                reason: 'Ação requer aprovação manual de GM',
                requiresGMApproval: true
            };
        }
        
        return { valid: true };
    }
}
