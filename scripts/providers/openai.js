/**
 * Provedor OpenAI para AI Assistant
 * Integração com a API da OpenAI
 */

export class OpenAIProvider {
  constructor (config = {}) {
    this.name = 'OpenAI'
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY
    this.baseUrl = config.baseUrl || 'https://api.openai.com'
    this.model = config.model || 'gpt-4'
    this.maxTokens = config.maxTokens || 2000
    this.temperature = config.temperature || 0.7
    this.initialized = false
    this.rateLimiter = new Map()
    this.requestHistory = []
    this.tokenUsage = { total: 0, prompt: 0, completion: 0 }
  }

  async initialize () {
    console.log('OpenAI Provider | Inicializando...')

    try {
      // Verificar se a API key está configurada
      if (!this.apiKey) {
        throw new Error('API Key da OpenAI não configurada')
      }

      // Testar conectividade
      await this.testConnection()

      this.initialized = true
      console.log('OpenAI Provider | Inicializado com sucesso')
    } catch (error) {
      console.error('OpenAI Provider | Erro na inicialização:', error)
      throw error
    }
  }

  async testConnection () {
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Erro na conexão: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('OpenAI Provider | Conexão testada com sucesso')
      return data
    } catch (error) {
      console.error('OpenAI Provider | Erro no teste de conexão:', error)
      throw new Error(`Falha na conexão com OpenAI: ${error.message}`)
    }
  }

  async processMessage (message, context = {}) {
    if (!this.initialized) {
      throw new Error('Provedor OpenAI não inicializado')
    }

    // Verificar rate limiting
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit excedido. Tente novamente em alguns segundos.')
    }

    try {
      // Construir prompt com contexto
      const prompt = this.buildPrompt(message, context)

      // Fazer requisição para API
      const response = await this.makeAPIRequest(prompt)

      // Processar resposta
      const processedResponse = this.processResponse(response)

      // Atualizar estatísticas de tokens
      this.updateTokenUsage(response.usage)

      // Adicionar ao histórico
      this.addToHistory(message, processedResponse, context, response.usage)

      return processedResponse
    } catch (error) {
      console.error('OpenAI Provider | Erro ao processar mensagem:', error)
      throw new Error(`Erro da OpenAI: ${error.message}`)
    }
  }

  buildPrompt (message, context) {
    const systemPrompt = this.getSystemPrompt(context)
    const conversationHistory = this.formatConversationHistory(context.recentHistory || [])
    const worldContext = this.formatWorldContext(context.worldContext || {})

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
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    }
  }

  getSystemPrompt (context) {
    return `Você é um AI Assistant especializado em RPG integrado ao FoundryVTT. Suas funções incluem:

**Capacidades Principais:**
1. **Assistência em RPG**: Ajudar com regras, mecânicas, criação de personagens e narrativa
2. **Gerenciamento de Jogo**: Criar e modificar elementos do jogo (atores, itens, cenas, etc.)
3. **Interpretação de Dados**: Executar e interpretar rolagens de dados
4. **Narrativa Criativa**: Gerar descrições, diálogos de NPCs e elementos de história
5. **Consulta de Regras**: Responder sobre sistemas de RPG, especialmente D&D 5e

**Diretrizes de Comportamento:**
- Seja preciso e útil nas respostas sobre regras
- Mantenha um tom envolvente e apropriado para RPG
- Quando criar conteúdo, seja criativo mas equilibrado
- Se incerto sobre uma regra, seja honesto e sugira fontes
- Adapte-se ao tom e estilo da campanha

**Comandos Especiais:**
- Use [ROLL:fórmula] para sugerir rolagens
- Use [CREATE:tipo:nome] para sugerir criação de elementos
- Use [SEARCH:tipo:termo] para sugerir buscas

**Contexto Atual:**
- Sistema: ${context.worldContext?.systemName || 'D&D 5e'}
- Cena: ${context.worldContext?.activeScene || 'Não especificada'}
- Jogadores: ${context.worldContext?.playerCount || 'Não especificado'}

Responda como um mestre experiente e assistente útil.`
  }

  formatConversationHistory (history) {
    return history.slice(-8).map(msg => ({
      role: msg.user === 'AI Assistant' ? 'assistant' : 'user',
      content: msg.content.length > 500 ? msg.content.substring(0, 497) + '...' : msg.content
    }))
  }

  formatWorldContext (worldContext) {
    if (!worldContext || Object.keys(worldContext).length === 0) {
      return ''
    }

    return `**Contexto do Mundo:**
- Cena Ativa: ${worldContext.activeScene || 'N/A'}
- Sistema: ${worldContext.systemName || 'N/A'}
- Jogadores: ${worldContext.playerCount || 'N/A'}`
  }

  async makeAPIRequest (prompt) {
    const startTime = Date.now()

    try {
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(prompt)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        // Tratar erros específicos da OpenAI
        if (response.status === 429) {
          throw new Error('Rate limit da OpenAI excedido. Tente novamente em alguns segundos.')
        } else if (response.status === 401) {
          throw new Error('API Key da OpenAI inválida ou expirada.')
        } else if (response.status === 400) {
          throw new Error(`Requisição inválida: ${errorData.error?.message || 'Parâmetros incorretos'}`)
        }

        throw new Error(`API Error ${response.status}: ${errorData.error?.message || response.statusText}`)
      }

      const data = await response.json()
      const duration = Date.now() - startTime

      console.log(`OpenAI Provider | Requisição concluída em ${duration}ms`)

      return data
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`OpenAI Provider | Erro na requisição (${duration}ms):`, error)
      throw error
    }
  }

  processResponse (apiResponse) {
    try {
      if (!apiResponse.choices || apiResponse.choices.length === 0) {
        throw new Error('Resposta da API não contém choices')
      }

      const choice = apiResponse.choices[0]
      if (!choice.message || !choice.message.content) {
        throw new Error('Resposta da API não contém conteúdo')
      }

      let content = choice.message.content.trim()

      // Processar comandos especiais na resposta
      content = this.processSpecialCommands(content)

      // Verificar se a resposta foi truncada
      if (choice.finish_reason === 'length') {
        content += '\n\n*[Resposta truncada devido ao limite de tokens]*'
      }

      // Limitar tamanho da resposta para chat
      if (content.length > 2000) {
        content = content.substring(0, 1997) + '...'
      }

      return content
    } catch (error) {
      console.error('OpenAI Provider | Erro ao processar resposta:', error)
      throw new Error(`Erro ao processar resposta: ${error.message}`)
    }
  }

  processSpecialCommands (content) {
    // Processar comandos especiais que a IA pode incluir na resposta

    // Processar rolagens inline
    content = content.replace(/\[ROLL:([^\]]+)\]/g, (match, formula) => {
      return `🎲 *Sugestão de rolagem: ${formula}*`
    })

    // Processar criação de elementos inline
    content = content.replace(/\[CREATE:(\w+):([^\]]+)\]/g, (match, type, name) => {
      return `✨ *Sugestão: Criar ${type.toLowerCase()} "${name}"*`
    })

    // Processar buscas inline
    content = content.replace(/\[SEARCH:(\w+):([^\]]+)\]/g, (match, type, term) => {
      return `🔍 *Sugestão: Buscar ${type} por "${term}"*`
    })

    return content
  }

  updateTokenUsage (usage) {
    if (usage) {
      this.tokenUsage.total += usage.total_tokens || 0
      this.tokenUsage.prompt += usage.prompt_tokens || 0
      this.tokenUsage.completion += usage.completion_tokens || 0
    }
  }

  addToHistory (message, response, context, usage) {
    this.requestHistory.push({
      timestamp: Date.now(),
      user: context.user || 'Unknown',
      message,
      response,
      model: this.model,
      usage,
      responseTime: Date.now() - (context.startTime || Date.now())
    })

    // Manter apenas os últimos 100 registros
    if (this.requestHistory.length > 100) {
      this.requestHistory.shift()
    }
  }

  checkRateLimit () {
    const now = Date.now()
    const windowMs = 60000 // 1 minuto
    const maxRequests = 20 // 20 requests por minuto (conservador)

    // Limpar entradas antigas
    const cutoff = now - windowMs
    const recentRequests = Array.from(this.rateLimiter.values()).filter(time => time > cutoff)

    // Atualizar rate limiter
    this.rateLimiter.clear()
    recentRequests.forEach((time, index) => {
      this.rateLimiter.set(index, time)
    })

    // Verificar limite
    if (recentRequests.length >= maxRequests) {
      return false
    }

    // Adicionar requisição atual
    this.rateLimiter.set(this.rateLimiter.size, now)
    return true
  }

  // Métodos específicos para FoundryVTT

  async generateNPC (type, options = {}) {
    const prompt = `Crie um NPC detalhado do tipo "${type}" para D&D 5e.

${options.description ? `Descrição adicional: ${options.description}` : ''}
${options.level ? `Nível/CR sugerido: ${options.level}` : ''}
${options.role ? `Papel na história: ${options.role}` : ''}

Forneça:
1. **Nome** e título (se aplicável)
2. **Raça e classe** (ou tipo de criatura)
3. **Descrição física** (2-3 frases)
4. **Personalidade** (3-4 traços distintos)
5. **Motivação principal** e objetivos
6. **Background** (breve história)
7. **Estatísticas básicas** (CA, HP, atributos principais)
8. **Habilidades especiais** ou equipamentos notáveis

Formato: Estruturado e pronto para uso no jogo.`

    return await this.processMessage(prompt, {
      worldContext: { systemName: 'D&D 5e' },
      specialRequest: 'npc_generation'
    })
  }

  async explainRule (rule, system = 'D&D 5e') {
    const prompt = `Explique detalhadamente a regra "${rule}" do sistema ${system}.

Inclua:
1. **Definição** clara da regra
2. **Como funciona** na prática
3. **Exemplos** de uso em jogo
4. **Interações** com outras regras (se relevante)
5. **Dicas** para mestres e jogadores

Seja preciso mas acessível.`

    return await this.processMessage(prompt, {
      worldContext: { systemName: system },
      specialRequest: 'rule_explanation'
    })
  }

  async generateDescription (type, subject, context = '') {
    const prompt = `Gere uma descrição ${type} envolvente para: "${subject}"

${context ? `Contexto adicional: ${context}` : ''}

A descrição deve ser:
- **Imersiva** e rica em detalhes sensoriais
- **Apropriada** para RPG de fantasia
- **Concisa** mas evocativa (3-5 frases)
- **Útil** para mestres narrarem

Foque em criar atmosfera e ajudar a visualizar a cena.`

    return await this.processMessage(prompt, {
      specialRequest: 'description_generation'
    })
  }

  async generateEncounter (difficulty, environment, partyLevel = 5) {
    const prompt = `Crie um encontro de dificuldade "${difficulty}" para um grupo de nível ${partyLevel} em ambiente: ${environment}

Inclua:
1. **Descrição da cena** e atmosfera
2. **Inimigos** (tipos, quantidades, táticas)
3. **Terreno** e elementos ambientais
4. **Objetivos** possíveis além de combate
5. **Recompensas** apropriadas
6. **Variações** para diferentes abordagens

Torne o encontro memorável e estratégico.`

    return await this.processMessage(prompt, {
      worldContext: { systemName: 'D&D 5e' },
      specialRequest: 'encounter_generation'
    })
  }

  async generateLoot (challenge, type = 'mixed') {
    const prompt = `Gere um tesouro apropriado para desafio de nível ${challenge}, tipo "${type}".

Inclua:
1. **Moedas** (quantidade apropriada)
2. **Itens mundanos** valiosos
3. **Itens mágicos** (se apropriado)
4. **Itens únicos** ou com história
5. **Valor total** estimado

Equilibre utilidade e valor, considerando o nível do grupo.`

    return await this.processMessage(prompt, {
      worldContext: { systemName: 'D&D 5e' },
      specialRequest: 'loot_generation'
    })
  }

  // Métodos de configuração

  updateConfig (newConfig) {
    if (newConfig.apiKey) this.apiKey = newConfig.apiKey
    if (newConfig.baseUrl) this.baseUrl = newConfig.baseUrl
    if (newConfig.model) this.model = newConfig.model
    if (newConfig.maxTokens) this.maxTokens = newConfig.maxTokens
    if (newConfig.temperature) this.temperature = newConfig.temperature

    console.log('OpenAI Provider | Configuração atualizada')
  }

  getConfig () {
    return {
      name: this.name,
      model: this.model,
      maxTokens: this.maxTokens,
      temperature: this.temperature,
      initialized: this.initialized,
      hasApiKey: !!this.apiKey,
      tokenUsage: { ...this.tokenUsage }
    }
  }

  getStats () {
    const recentRequests = this.requestHistory.filter(req =>
      Date.now() - req.timestamp < 3600000 // Última hora
    )

    const avgResponseTime = this.calculateAverageResponseTime()
    const avgTokensPerRequest = this.requestHistory.length > 0
      ? Math.round(this.tokenUsage.total / this.requestHistory.length)
      : 0

    return {
      name: this.name,
      initialized: this.initialized,
      totalRequests: this.requestHistory.length,
      recentRequests: recentRequests.length,
      averageResponseTime: avgResponseTime,
      tokenUsage: { ...this.tokenUsage },
      averageTokensPerRequest: avgTokensPerRequest,
      rateLimitStatus: {
        current: this.rateLimiter.size,
        max: 20,
        windowMs: 60000
      },
      estimatedCost: this.calculateEstimatedCost()
    }
  }

  calculateAverageResponseTime () {
    if (this.requestHistory.length === 0) return 0

    const recentRequests = this.requestHistory.slice(-10)
    const totalTime = recentRequests.reduce((sum, req) => sum + (req.responseTime || 1000), 0)
    return Math.round(totalTime / recentRequests.length)
  }

  calculateEstimatedCost () {
    // Estimativa baseada nos preços da OpenAI (valores aproximados)
    const costs = {
      'gpt-4': { prompt: 0.03, completion: 0.06 }, // por 1K tokens
      'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
      'gpt-3.5-turbo': { prompt: 0.001, completion: 0.002 }
    }

    const modelCost = costs[this.model] || costs['gpt-4']
    const promptCost = (this.tokenUsage.prompt / 1000) * modelCost.prompt
    const completionCost = (this.tokenUsage.completion / 1000) * modelCost.completion

    return {
      total: promptCost + completionCost,
      prompt: promptCost,
      completion: completionCost,
      currency: 'USD'
    }
  }

  // Método para cleanup
  cleanup () {
    this.rateLimiter.clear()
    this.requestHistory = []
    this.tokenUsage = { total: 0, prompt: 0, completion: 0 }
    this.initialized = false
    console.log('OpenAI Provider | Cleanup realizado')
  }
}
