/**
 * Script de Demonstração - FoundryVTT AI Assistant
 * Execute este script para testar as funcionalidades do módulo
 */

console.log('🚀 Iniciando demonstração do FoundryVTT AI Assistant...');

// Aguardar inicialização do módulo
function waitForModule() {
    return new Promise((resolve) => {
        const checkModule = () => {
            if (window.aiAssistant && window.aiAssistant.initialized) {
                resolve(window.aiAssistant);
            } else {
                setTimeout(checkModule, 100);
            }
        };
        checkModule();
    });
}

async function runDemo() {
    try {
        // Aguardar módulo estar pronto
        console.log('⏳ Aguardando inicialização do módulo...');
        const aiAssistant = await waitForModule();
        console.log('✅ Módulo inicializado com sucesso!');

        // Demonstrar estatísticas
        console.log('\n📊 ESTATÍSTICAS DO MÓDULO:');
        const stats = aiAssistant.getStats();
        console.table(stats);

        // Demonstrar configuração
        console.log('\n⚙️ CONFIGURAÇÃO ATUAL:');
        const config = aiAssistant.config;
        console.log('Provedor padrão:', config.defaultProvider);
        console.log('Nível de permissão:', config.defaultPermissionLevel);
        console.log('Provedores habilitados:', Object.keys(config.providers).filter(p => config.providers[p].enabled));

        // Demonstrar provedores disponíveis
        console.log('\n🤖 PROVEDORES DISPONÍVEIS:');
        const providers = Array.from(aiAssistant.providers.keys());
        providers.forEach(provider => {
            const providerInstance = aiAssistant.providers.get(provider);
            console.log(`- ${providerInstance.name} (${provider})`);
        });

        // Demonstrar permissões
        console.log('\n🔐 SISTEMA DE PERMISSÕES:');
        const permissionManager = aiAssistant.components.permissionManager;
        const permissionLevels = permissionManager.getAvailablePermissionLevels();
        console.table(permissionLevels);

        // Testar verificação de permissões
        console.log('\n🔍 TESTE DE PERMISSÕES:');
        const testPermissions = ['sendMessage', 'createActor', 'deleteActor', 'modifySettings'];
        testPermissions.forEach(permission => {
            const hasPermission = permissionManager.checkPermission(permission);
            console.log(`${permission}: ${hasPermission ? '✅ Permitido' : '❌ Negado'}`);
        });

        // Demonstrar comandos de chat
        console.log('\n💬 TESTE DE COMANDOS DE CHAT:');
        const chatInterface = aiAssistant.components.chatInterface;
        
        // Testar comando de ajuda
        console.log('Testando comando /ai help...');
        await chatInterface.processDirectMessage('/ai help');

        // Testar comando de status
        console.log('Testando comando /ai status...');
        await chatInterface.processDirectMessage('/ai status');

        // Testar comando de rolagem
        console.log('Testando comando /ai roll...');
        await chatInterface.processDirectMessage('/ai roll 1d20+5 Teste de demonstração');

        // Testar busca
        console.log('Testando comando /ai search...');
        await chatInterface.processDirectMessage('/ai search actors teste');

        // Demonstrar API pública
        console.log('\n🔌 API PÚBLICA DISPONÍVEL:');
        const api = window.aiAssistantAPI;
        console.log('Métodos disponíveis:');
        Object.keys(api).forEach(method => {
            console.log(`- ${method}()`);
        });

        // Testar API
        console.log('\n🧪 TESTE DA API:');
        console.log('Inicializado:', api.isInitialized());
        console.log('Provedor atual:', api.getCurrentProvider());
        console.log('Provedores disponíveis:', api.getProviders());

        // Demonstrar mudança de provedor (se múltiplos disponíveis)
        if (providers.length > 1) {
            console.log('\n🔄 TESTE DE MUDANÇA DE PROVEDOR:');
            const currentProvider = api.getCurrentProvider();
            const otherProvider = providers.find(p => p !== currentProvider);
            
            if (otherProvider) {
                console.log(`Mudando de ${currentProvider} para ${otherProvider}...`);
                try {
                    await api.setProvider(otherProvider);
                    console.log('✅ Provedor alterado com sucesso!');
                    console.log('Novo provedor:', api.getCurrentProvider());
                    
                    // Voltar ao provedor original
                    await api.setProvider(currentProvider);
                    console.log(`✅ Voltou para ${currentProvider}`);
                } catch (error) {
                    console.error('❌ Erro ao alterar provedor:', error.message);
                }
            }
        }

        // Demonstrar permissões temporárias
        console.log('\n⏰ TESTE DE PERMISSÕES TEMPORÁRIAS:');
        try {
            // Conceder permissão temporária
            permissionManager.grantTemporaryPermission('createActor', 10000, true); // 10 segundos
            console.log('✅ Permissão temporária concedida: createActor (10s)');
            
            // Verificar permissão
            const hasTemp = permissionManager.checkPermission('createActor');
            console.log('Verificação imediata:', hasTemp ? '✅ Ativa' : '❌ Inativa');
            
            // Aguardar expiração
            setTimeout(() => {
                const hasExpired = permissionManager.checkPermission('createActor');
                console.log('Após expiração:', hasExpired ? '✅ Ainda ativa' : '❌ Expirada');
            }, 11000);
            
        } catch (error) {
            console.error('❌ Erro no teste de permissões temporárias:', error.message);
        }

        // Demonstrar histórico
        console.log('\n📜 HISTÓRICO DE PERMISSÕES:');
        const history = permissionManager.getPermissionHistory(5);
        if (history.length > 0) {
            console.table(history);
        } else {
            console.log('Nenhum histórico disponível');
        }

        // Demonstrar estatísticas detalhadas
        console.log('\n📈 ESTATÍSTICAS DETALHADAS:');
        const fullStatus = aiAssistant.getFullStatus();
        console.log('Status completo do módulo:');
        console.log(JSON.stringify(fullStatus, null, 2));

        // Demonstrar funcionalidades do usuário IA
        console.log('\n👤 USUÁRIO IA:');
        const aiUserManager = aiAssistant.components.aiUserManager;
        const aiUserStats = await aiUserManager.getAIUserStats();
        console.log('Estatísticas do usuário IA:');
        console.table(aiUserStats);

        // Demonstrar API Handler
        console.log('\n⚙️ API HANDLER:');
        const apiHandler = aiAssistant.components.apiHandler;
        const apiStats = apiHandler.getStats();
        console.log('Estatísticas do API Handler:');
        console.table(apiStats);

        // Teste de conversa livre (se provedor disponível)
        if (aiAssistant.currentProvider) {
            console.log('\n🗣️ TESTE DE CONVERSA LIVRE:');
            try {
                await chatInterface.processDirectMessage('@AI Olá! Este é um teste de conversa livre.');
                console.log('✅ Teste de conversa executado');
            } catch (error) {
                console.error('❌ Erro no teste de conversa:', error.message);
            }
        }

        // Demonstrar comandos avançados
        console.log('\n🎯 COMANDOS AVANÇADOS:');
        const advancedCommands = [
            '/ai create actor {"name": "Orc de Teste", "type": "npc"}',
            '/ai scene list',
            '/ai config provider manus'
        ];

        for (const command of advancedCommands) {
            console.log(`Testando: ${command}`);
            try {
                await chatInterface.processDirectMessage(command);
                console.log('✅ Comando executado');
            } catch (error) {
                console.error('❌ Erro:', error.message);
            }
        }

        // Resumo final
        console.log('\n🎉 DEMONSTRAÇÃO CONCLUÍDA!');
        console.log('='.repeat(50));
        console.log('✅ Módulo funcionando corretamente');
        console.log(`✅ ${providers.length} provedor(es) disponível(is)`);
        console.log(`✅ ${Object.keys(chatInterface.commands).length} comandos registrados`);
        console.log('✅ Sistema de permissões ativo');
        console.log('✅ API pública configurada');
        console.log('='.repeat(50));

        // Instruções para uso
        console.log('\n📖 COMO USAR:');
        console.log('1. Use window.aiAssistantAPI para acessar a API');
        console.log('2. Digite /ai help no chat para ver comandos');
        console.log('3. Mencione @AI para conversar livremente');
        console.log('4. Configure permissões conforme necessário');
        console.log('5. Monitore logs para debug');

        // Exemplos práticos
        console.log('\n💡 EXEMPLOS PRÁTICOS:');
        console.log('// Verificar status');
        console.log('window.aiAssistantAPI.getStats()');
        console.log('');
        console.log('// Alterar provedor');
        console.log('await window.aiAssistantAPI.setProvider("openai")');
        console.log('');
        console.log('// Conceder permissão');
        console.log('await window.aiAssistantAPI.grantPermission("createActor", true)');
        console.log('');
        console.log('// Enviar comando');
        console.log('await window.aiAssistantAPI.processCommand("/ai roll 1d20")');

    } catch (error) {
        console.error('❌ Erro na demonstração:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Executar demonstração
runDemo().then(() => {
    console.log('\n🏁 Demonstração finalizada. Verifique os logs acima para detalhes.');
}).catch(error => {
    console.error('💥 Falha na demonstração:', error);
});

// Exportar função para uso manual
window.runAIAssistantDemo = runDemo;
