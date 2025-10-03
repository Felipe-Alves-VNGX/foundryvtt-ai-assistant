/**
 * Provedor Manus para AI Assistant
 * Integração com a API do Manus
 */

export class ManusProvider {
    constructor(config = {}) {
        this.name = 'Manus';
        this.apiKey = config.apiKey || process.env.MANUS_API_KEY;
        this.baseUrl = config.baseUrl || 'https://api.manus.im';
        this.model = config.model || 'gpt-4.1-mini';
        this.maxTokens = config.maxTokens || 2000;
        this.temperature = config.temperature || 0.7;
        this.initialized = false;
        this.rateLimiter = new Map();
        this.requestHistory = [];
    }

    async initialize() {
        console.log('Manus Provider | Inicializando...');
        
        try {
            // Verificar se a API key está configurada
            if (!this.apiKey) {
                throw new Error('API Key do Manus não configurada');
            }

            // Testar conectividade
            await this.testConnection();
            
            this.initialized = true;
            console.log('Manus Provider | Inicializado com sucesso');
            
        } catch (error) {
            console.error('Manus Provider | Erro na inicialização:', error);
            throw error;
        }
    }

    async testConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/v1/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Erro na conexão: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Manus Provider | Conexão testada com sucesso');
            return data;
            
        } catch (error) {
            console.error('Manus Provider | Erro no teste de conexão:', error);
            throw new Error(`Falha na conexão com Manus: ${error.message}`);
        }
    }

    async processMessage(message, context = {}) {
        if (!this.initialized) {
            throw new Error('Provedor Manus não inicializado');
        }

        // Verificar rate limiting
        if (!this.checkRateLimit()) {
            throw new Error('Rate limit excedido. Tente novamente em alguns segundos.');
        }

        try {
            // Construir prompt com contexto
            const prompt = this.buildPrompt(message, context);
            
            // Fazer requisição para API
            const response = await this.makeAPIRequest(prompt);
            
            // Processar resposta
            const processedResponse = this.processResponse(response);
            
            // Adicionar ao histórico
            this.addToHistory(message, processedResponse, context);
            
            return processedResponse;
            
        } catch (error) {
            console.error('Manus Provider | Erro ao processar mensagem:', error);
            throw new Error(`Erro do Manus: ${error.message}`);
        }
    }

    buildPrompt(message, context) {
        const systemPrompt = this.getSystemPrompt(context);
        const conversationHistory = this.formatConversationHistory(context.recentHistory || []);
        const worldContext = this.formatWorldContext(context.worldContext || {});

        return {
            model: this.model,
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                ...conversationHistory,
                {
                    role: 'user',
                    content: `${worldContext}\n\nUsuário: ${message}`
                }
            ],
            max_tokens: this.maxTokens,
            temperature: this.temperature,
            stream: false
        };
    }

    getSystemPrompt(context) {
        return `Você é um AI Assistant integrado ao FoundryVTT, um sistema de RPG virtual. Suas responsabilidades incluem:

1. **Assistência em Jogos de RPG**: Ajudar com regras, criação de personagens, narrativa e mecânicas de jogo.

2. **Gerenciamento de Conteúdo**: Criar e modificar atores, itens, cenas, jornais e outros elementos do jogo quando solicitado.

3. **Rolagem de Dados**: Interpretar e executar rolagens de dados usando a notação padrão (ex: 1d20+5).

4. **Narrativa e Interpretação**: Ajudar com descrições, diálogos de NPCs e desenvolvimento de história.

5. **Consultas de Regras**: Responder perguntas sobre sistemas de RPG, especialmente D&D 5e.

**Diretrizes de Comportamento:**
- Seja útil, criativo e envolvente
- Mantenha o tom apropriado para o contexto do jogo
- Quando criar conteúdo, forneça detalhes suficientes mas concisos
- Se não tiver certeza sobre uma regra, admita e sugira onde encontrar a informação
- Respeite o tom e estilo da campanha em andamento

**Contexto Atual:**
- Sistema: ${context.worldContext?.systemName || 'D&D 5e'}
- Cena Ativa: ${context.worldContext?.activeScene || 'Não especificada'}
- Jogadores: ${context.worldContext?.playerCount || 'Não especificado'}

Responda de forma natural e útil, como se fosse um assistente experiente de RPG.`;
    }

    formatConversationHistory(history) {
        return history.slice(-10).map(msg => ({
            role: msg.user === 'AI Assistant' ? 'assistant' : 'user',
            content: `${msg.user}: ${msg.content}`
        }));
    }

    formatWorldContext(worldContext) {
        if (!worldContext || Object.keys(worldContext).length === 0) {
            return '';
        }

        return `**Contexto do Mundo:**
- Cena Ativa: ${worldContext.activeScene || 'N/A'}
- Sistema: ${worldContext.systemName || 'N/A'}
- Jogadores Conectados: ${worldContext.playerCount || 'N/A'}`;
    }

    async makeAPIRequest(prompt) {
        const startTime = Date.now();
        
        try {
            const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(prompt)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API Error ${response.status}: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            const duration = Date.now() - startTime;
            
            console.log(`Manus Provider | Requisição concluída em ${duration}ms`);
            
            return data;
            
        } catch (error) {
            const duration = Date.now() - startTime;
            console.error(`Manus Provider | Erro na requisição (${duration}ms):`, error);
            throw error;
        }
    }

    processResponse(apiResponse) {
        try {
            if (!apiResponse.choices || apiResponse.choices.length === 0) {
                throw new Error('Resposta da API não contém choices');
            }

            const choice = apiResponse.choices[0];
            if (!choice.message || !choice.message.content) {
                throw new Error('Resposta da API não contém conteúdo');
            }

            let content = choice.message.content.trim();
            
            // Processar comandos especiais na resposta
            content = this.processSpecialCommands(content);
            
            // Limitar tamanho da resposta
            if (content.length > 2000) {
                content = content.substring(0, 1997) + '...';
            }

            return content;
            
        } catch (error) {
            console.error('Manus Provider | Erro ao processar resposta:', error);
            throw new Error(`Erro ao processar resposta: ${error.message}`);
        }
    }

    processSpecialCommands(content) {
        // Processar comandos especiais que a IA pode incluir na resposta
        // Por exemplo: [ROLL:1d20+5] ou [CREATE_ACTOR:Orc Warrior]
        
        // Processar rolagens inline
        content = content.replace(/\[ROLL:([^\]]+)\]/g, (match, formula) => {
            // Em implementação real, executaria a rolagem
            return `🎲 ${formula}`;
        });

        // Processar criação de elementos inline
        content = content.replace(/\[CREATE_(\w+):([^\]]+)\]/g, (match, type, name) => {
            // Em implementação real, criaria o elemento
            return `✨ Criando ${type.toLowerCase()}: ${name}`;
        });

        return content;
    }

    addToHistory(message, response, context) {
        this.requestHistory.push({
            timestamp: Date.now(),
            user: context.user || 'Unknown',
            message: message,
            response: response,
            model: this.model,
            tokens: response.length // Aproximação simples
        });

        // Manter apenas os últimos 100 registros
        if (this.requestHistory.length > 100) {
            this.requestHistory.shift();
        }
    }

    checkRateLimit() {
        const now = Date.now();
        const windowMs = 60000; // 1 minuto
        const maxRequests = 30; // 30 requests por minuto

        // Limpar entradas antigas
        const cutoff = now - windowMs;
        const recentRequests = Array.from(this.rateLimiter.values()).filter(time => time > cutoff);
        
        // Atualizar rate limiter
        this.rateLimiter.clear();
        recentRequests.forEach((time, index) => {
            this.rateLimiter.set(index, time);
        });

        // Verificar limite
        if (recentRequests.length >= maxRequests) {
            return false;
        }

        // Adicionar requisição atual
        this.rateLimiter.set(this.rateLimiter.size, now);
        return true;
    }

    // Métodos específicos para FoundryVTT

    async generateNPC(type, options = {}) {
        const prompt = `Crie um NPC do tipo "${type}" para D&D 5e. ${options.description ? `Descrição adicional: ${options.description}` : ''}

Forneça:
1. Nome
2. Raça e classe (se aplicável)
3. Breve descrição física
4. Personalidade (2-3 traços)
5. Motivação principal
6. Estatísticas básicas (se necessário)

Formato: JSON estruturado para fácil importação.`;

        return await this.processMessage(prompt, { 
            worldContext: { systemName: 'D&D 5e' },
            specialRequest: 'npc_generation'
        });
    }

    async explainRule(rule, system = 'D&D 5e') {
        const prompt = `Explique a regra "${rule}" do sistema ${system}. Seja claro e conciso, incluindo exemplos práticos se relevante.`;

        return await this.processMessage(prompt, {
            worldContext: { systemName: system },
            specialRequest: 'rule_explanation'
        });
    }

    async generateDescription(type, subject, context = '') {
        const prompt = `Gere uma descrição ${type} para: ${subject}. ${context ? `Contexto: ${context}` : ''}

A descrição deve ser:
- Envolvente e imersiva
- Apropriada para RPG
- Entre 2-4 frases
- Rica em detalhes sensoriais`;

        return await this.processMessage(prompt, {
            specialRequest: 'description_generation'
        });
    }

    // Métodos de configuração

    updateConfig(newConfig) {
        if (newConfig.apiKey) this.apiKey = newConfig.apiKey;
        if (newConfig.baseUrl) this.baseUrl = newConfig.baseUrl;
        if (newConfig.model) this.model = newConfig.model;
        if (newConfig.maxTokens) this.maxTokens = newConfig.maxTokens;
        if (newConfig.temperature) this.temperature = newConfig.temperature;

        console.log('Manus Provider | Configuração atualizada');
    }

    getConfig() {
        return {
            name: this.name,
            model: this.model,
            maxTokens: this.maxTokens,
            temperature: this.temperature,
            initialized: this.initialized,
            hasApiKey: !!this.apiKey
        };
    }

    getStats() {
        const recentRequests = this.requestHistory.filter(req => 
            Date.now() - req.timestamp < 3600000 // Última hora
        );

        return {
            name: this.name,
            initialized: this.initialized,
            totalRequests: this.requestHistory.length,
            recentRequests: recentRequests.length,
            averageResponseTime: this.calculateAverageResponseTime(),
            rateLimitStatus: {
                current: this.rateLimiter.size,
                max: 30,
                windowMs: 60000
            }
        };
    }

    calculateAverageResponseTime() {
        if (this.requestHistory.length === 0) return 0;
        
        const recentRequests = this.requestHistory.slice(-10);
        const totalTime = recentRequests.reduce((sum, req) => sum + (req.responseTime || 1000), 0);
        return Math.round(totalTime / recentRequests.length);
    }

    // Método para cleanup
    cleanup() {
        this.rateLimiter.clear();
        this.requestHistory = [];
        this.initialized = false;
        console.log('Manus Provider | Cleanup realizado');
    }
}
