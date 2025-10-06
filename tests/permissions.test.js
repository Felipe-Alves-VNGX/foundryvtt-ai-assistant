/**
 * Testes para o PermissionManager
 */

import { PermissionManager } from '../scripts/permissions.js';

describe('PermissionManager', () => {
    let permissionManager;

    beforeEach(() => {
        permissionManager = new PermissionManager();
    });

    describe('Inicialização', () => {
        test('deve inicializar corretamente', async () => {
            await permissionManager.initialize();
            
            expect(permissionManager.initialized).toBe(true);
            expect(permissionManager.permissions).toBeInstanceOf(Map);
            expect(permissionManager.permissionLevels).toBeInstanceOf(Map);
        });

        test('deve definir níveis de permissão padrão', async () => {
            await permissionManager.initialize();
            
            expect(permissionManager.permissionLevels.has('NONE')).toBe(true);
            expect(permissionManager.permissionLevels.has('BASIC')).toBe(true);
            expect(permissionManager.permissionLevels.has('INTERMEDIATE')).toBe(true);
            expect(permissionManager.permissionLevels.has('ADVANCED')).toBe(true);
            expect(permissionManager.permissionLevels.has('FULL')).toBe(true);
        });
    });

    describe('Verificação de Permissões', () => {
        beforeEach(async () => {
            await permissionManager.initialize();
        });

        test('deve verificar permissões básicas corretamente', () => {
            permissionManager.setPermissionLevel('BASIC');
            
            expect(permissionManager.checkPermission('readActors')).toBe(true);
            expect(permissionManager.checkPermission('createActors')).toBe(false);
            expect(permissionManager.checkPermission('executeScripts')).toBe(false);
        });

        test('deve verificar permissões avançadas corretamente', () => {
            permissionManager.setPermissionLevel('ADVANCED');
            
            expect(permissionManager.checkPermission('readActors')).toBe(true);
            expect(permissionManager.checkPermission('createActors')).toBe(true);
            expect(permissionManager.checkPermission('modifyActors')).toBe(true);
            expect(permissionManager.checkPermission('executeScripts')).toBe(false);
        });

        test('deve verificar permissões completas corretamente', () => {
            permissionManager.setPermissionLevel('FULL');
            
            expect(permissionManager.checkPermission('readActors')).toBe(true);
            expect(permissionManager.checkPermission('createActors')).toBe(true);
            expect(permissionManager.checkPermission('executeScripts')).toBe(true);
            expect(permissionManager.checkPermission('accessAPI')).toBe(true);
        });

        test('deve negar todas as permissões no nível NONE', () => {
            permissionManager.setPermissionLevel('NONE');
            
            expect(permissionManager.checkPermission('readActors')).toBe(false);
            expect(permissionManager.checkPermission('createChatMessage')).toBe(false);
            expect(permissionManager.checkPermission('rollDice')).toBe(false);
        });
    });

    describe('Concessão de Permissões', () => {
        beforeEach(async () => {
            await permissionManager.initialize();
        });

        test('deve conceder permissão específica', async () => {
            await permissionManager.grantPermission('readActors', true);
            
            expect(permissionManager.checkPermission('readActors')).toBe(true);
        });

        test('deve negar permissão específica', async () => {
            await permissionManager.grantPermission('readActors', false);
            
            expect(permissionManager.checkPermission('readActors')).toBe(false);
        });

        test('deve registrar histórico de permissões', async () => {
            await permissionManager.grantPermission('readActors', true);
            await permissionManager.grantPermission('createActors', false);
            
            expect(permissionManager.permissionHistory.length).toBeGreaterThan(0);
            
            const lastEntry = permissionManager.permissionHistory[permissionManager.permissionHistory.length - 1];
            expect(lastEntry.action).toBe('createActors');
            expect(lastEntry.granted).toBe(false);
        });
    });

    describe('Permissões Temporárias', () => {
        beforeEach(async () => {
            await permissionManager.initialize();
        });

        test('deve conceder permissão temporária', async () => {
            await permissionManager.grantTemporaryPermission('readActors', 1000); // 1 segundo
            
            expect(permissionManager.checkPermission('readActors')).toBe(true);
            expect(permissionManager.temporaryPermissions.has('readActors')).toBe(true);
        });

        test('deve expirar permissão temporária', async () => {
            await permissionManager.grantTemporaryPermission('readActors', 100); // 100ms
            
            expect(permissionManager.checkPermission('readActors')).toBe(true);
            
            // Aguardar expiração
            await new Promise(resolve => setTimeout(resolve, 150));
            
            expect(permissionManager.checkPermission('readActors')).toBe(false);
            expect(permissionManager.temporaryPermissions.has('readActors')).toBe(false);
        });
    });

    describe('Estatísticas', () => {
        beforeEach(async () => {
            await permissionManager.initialize();
        });

        test('deve retornar estatísticas corretas', async () => {
            await permissionManager.grantPermission('readActors', true);
            await permissionManager.grantPermission('createActors', false);
            
            const stats = permissionManager.getStats();
            
            expect(stats).toHaveProperty('currentLevel');
            expect(stats).toHaveProperty('grantedPermissions');
            expect(stats).toHaveProperty('deniedPermissions');
            expect(stats).toHaveProperty('temporaryPermissions');
            expect(stats).toHaveProperty('historyCount');
            
            expect(stats.historyCount).toBeGreaterThan(0);
        });
    });

    describe('Reset', () => {
        beforeEach(async () => {
            await permissionManager.initialize();
        });

        test('deve resetar para configurações padrão', async () => {
            // Modificar configurações
            await permissionManager.grantPermission('readActors', true);
            permissionManager.setPermissionLevel('FULL');
            
            // Resetar
            await permissionManager.resetToDefault();
            
            // Verificar se foi resetado
            const stats = permissionManager.getStats();
            expect(stats.currentLevel).toBe('BASIC'); // Nível padrão
            expect(permissionManager.permissions.size).toBe(0);
        });
    });

    describe('Validação de Entrada', () => {
        beforeEach(async () => {
            await permissionManager.initialize();
        });

        test('deve lidar com ações inválidas', () => {
            expect(permissionManager.checkPermission('invalidAction')).toBe(false);
        });

        test('deve lidar com níveis inválidos', () => {
            expect(() => {
                permissionManager.setPermissionLevel('INVALID_LEVEL');
            }).toThrow();
        });

        test('deve validar parâmetros de permissão temporária', async () => {
            await expect(
                permissionManager.grantTemporaryPermission('readActors', -1000)
            ).rejects.toThrow();
            
            await expect(
                permissionManager.grantTemporaryPermission('', 1000)
            ).rejects.toThrow();
        });
    });
});
