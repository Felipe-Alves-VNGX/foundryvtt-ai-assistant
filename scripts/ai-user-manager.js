/**
 * Gerenciador do usuário IA
 * Responsável por criar, gerenciar e manter o usuário dedicado para IA
 */

export class AIUserManager {
  constructor () {
    this.aiUser = null
    this.aiUserId = null
    this.sessionData = new Map()
    this.lastActivity = null
    this.sessionTimeout = 30 * 60 * 1000 // 30 minutos
  }

  async initialize () {
    console.log('AI Assistant | Inicializando AIUserManager...')

    try {
      // Verificar se usuário IA já existe
      this.aiUser = await this.findExistingAIUser()

      if (!this.aiUser) {
        console.log('AI Assistant | Usuário IA não encontrado, criando...')
        await this.createAIUser()
      } else {
        console.log('AI Assistant | Usuário IA encontrado:', this.aiUser.name)
        this.aiUserId = this.aiUser.id
        await this.validateAIUser()
      }

      // Configurar monitoramento de sessão
      this.setupSessionMonitoring()

      // Marcar como ativo
      this.updateActivity()
    } catch (error) {
      console.error('AI Assistant | Erro na inicialização do AIUserManager:', error)
      throw error
    }
  }

  async findExistingAIUser () {
    // Buscar usuário marcado como IA
    const aiUser = game.users.find(u => u.getFlag('foundryvtt-ai-assistant', 'isAIUser'))

    if (aiUser) {
      // Verificar se ainda é válido
      const isValid = await this.validateUserData(aiUser)
      return isValid ? aiUser : null
    }

    return null
  }

  async validateUserData (user) {
    try {
      // Verificar se usuário ainda existe e tem dados válidos
      if (!user || !user.id || !user.name) return false

      // Verificar se tem as flags necessárias
      const isAIUser = user.getFlag('foundryvtt-ai-assistant', 'isAIUser')
      if (!isAIUser) return false

      // Verificar se não foi deletado
      const currentUser = game.users.get(user.id)
      return currentUser !== undefined
    } catch (error) {
      console.warn('AI Assistant | Erro na validação do usuário:', error)
      return false
    }
  }

  async createAIUser (options = {}) {
    const defaultOptions = {
      name: 'AI Assistant',
      avatar: 'icons/svg/robot.svg',
      color: '#00ff88',
      role: CONST.USER_ROLES.PLAYER
    }

    const userData = foundry.utils.mergeObject(defaultOptions, options)

    try {
      // Verificar se nome já existe
      const existingUser = game.users.find(u => u.name === userData.name)
      if (existingUser) {
        userData.name = `${userData.name} (${Date.now()})`
      }

      // Criar usuário
      this.aiUser = await User.create(userData)
      this.aiUserId = this.aiUser.id

      // Configurar flags específicas
      await this.aiUser.setFlag('foundryvtt-ai-assistant', 'isAIUser', true)
      await this.aiUser.setFlag('foundryvtt-ai-assistant', 'createdAt', Date.now())
      await this.aiUser.setFlag('foundryvtt-ai-assistant', 'version', '1.0.0')

      // Configurar permissões iniciais
      await this.setupInitialPermissions()

      console.log('AI Assistant | Usuário IA criado com sucesso:', this.aiUser.name)

      // Notificar outros usuários
      await this.notifyUserCreation()

      return this.aiUser
    } catch (error) {
      console.error('AI Assistant | Erro ao criar usuário IA:', error)
      throw new Error(`Falha ao criar usuário IA: ${error.message}`)
    }
  }

  async setupInitialPermissions () {
    if (!this.aiUser) return

    try {
      // Configurar permissões básicas do FoundryVTT
      const permissions = {
        ACTOR_CREATE: true,
        DRAWING_CREATE: true,
        ITEM_CREATE: true,
        JOURNAL_CREATE: true,
        MACRO_SCRIPT: true,
        MESSAGE_WHISPER: true,
        NOTE_CREATE: true,
        SETTINGS_MODIFY: false,
        SHOW_CURSOR: true,
        SHOW_RULER: true,
        TEMPLATE_CREATE: true,
        TOKEN_CREATE: true,
        TOKEN_CONFIGURE: true,
        WALL_DOORS: true
      }

      // Aplicar permissões (simulado - FoundryVTT real requer abordagem diferente)
      await this.aiUser.setFlag('foundryvtt-ai-assistant', 'permissions', permissions)

      console.log('AI Assistant | Permissões iniciais configuradas')
    } catch (error) {
      console.error('AI Assistant | Erro ao configurar permissões:', error)
    }
  }

  async validateAIUser () {
    if (!this.aiUser) return false

    try {
      // Verificar se usuário ainda existe
      const currentUser = game.users.get(this.aiUserId)
      if (!currentUser) {
        console.warn('AI Assistant | Usuário IA não encontrado, recriando...')
        await this.createAIUser()
        return true
      }

      // Verificar flags
      const isAIUser = currentUser.getFlag('foundryvtt-ai-assistant', 'isAIUser')
      if (!isAIUser) {
        console.warn('AI Assistant | Flag de usuário IA perdida, restaurando...')
        await currentUser.setFlag('foundryvtt-ai-assistant', 'isAIUser', true)
      }

      // Atualizar referência local
      this.aiUser = currentUser

      return true
    } catch (error) {
      console.error('AI Assistant | Erro na validação do usuário IA:', error)
      return false
    }
  }

  async updateAIUserPermissions (permissions) {
    if (!this.aiUser) {
      throw new Error('Usuário IA não inicializado')
    }

    try {
      // Obter permissões atuais
      const currentPermissions = this.aiUser.getFlag('foundryvtt-ai-assistant', 'permissions') || {}
      const updatedPermissions = { ...currentPermissions, ...permissions }

      await this.aiUser.setFlag('foundryvtt-ai-assistant', 'permissions', updatedPermissions)

      // Log da mudança
      console.log('AI Assistant | Permissões atualizadas:', permissions)

      // Salvar histórico de mudanças
      await this.logPermissionChange(permissions)
    } catch (error) {
      console.error('AI Assistant | Erro ao atualizar permissões:', error)
      throw error
    }
  }

  async logPermissionChange (permissions) {
    const changeLog = this.aiUser.getFlag('foundryvtt-ai-assistant', 'permissionHistory') || []

    changeLog.push({
      timestamp: Date.now(),
      changes: permissions,
      changedBy: game.user.id
    })

    // Manter apenas os últimos 50 registros
    if (changeLog.length > 50) {
      changeLog.splice(0, changeLog.length - 50)
    }

    await this.aiUser.setFlag('foundryvtt-ai-assistant', 'permissionHistory', changeLog)
  }

  async deleteAIUser (confirm = false) {
    if (!confirm) {
      throw new Error('Confirmação necessária para deletar usuário IA')
    }

    if (!this.aiUser) {
      console.warn('AI Assistant | Nenhum usuário IA para deletar')
      return
    }

    try {
      const userName = this.aiUser.name
      const userId = this.aiUserId

      // Limpar dados associados
      await this.cleanupUserData()

      // Deletar usuário
      await this.aiUser.delete()

      // Limpar referências locais
      this.aiUser = null
      this.aiUserId = null
      this.sessionData.clear()

      console.log('AI Assistant | Usuário IA deletado:', userName)

      // Notificar
      ui.notifications.info(`Usuário IA "${userName}" foi removido`)
    } catch (error) {
      console.error('AI Assistant | Erro ao deletar usuário IA:', error)
      throw error
    }
  }

  async cleanupUserData () {
    if (!this.aiUser) return

    try {
      // Remover mensagens de chat do usuário IA
      const messages = game.messages.filter(m => m.user?.id === this.aiUserId)
      for (const message of messages) {
        await message.delete()
      }

      // Remover ownership de documentos
      const collections = [game.actors, game.items, game.scenes, game.journal, game.macros]

      for (const collection of collections) {
        for (const document of collection.contents) {
          if (document.ownership?.[this.aiUserId]) {
            const ownership = { ...document.ownership }
            delete ownership[this.aiUserId]
            await document.update({ ownership })
          }
        }
      }

      console.log('AI Assistant | Dados do usuário IA limpos')
    } catch (error) {
      console.error('AI Assistant | Erro na limpeza de dados:', error)
    }
  }

  setupSessionMonitoring () {
    // Monitorar atividade a cada 5 minutos
    setInterval(() => {
      this.checkSessionTimeout()
    }, 5 * 60 * 1000)
  }

  checkSessionTimeout () {
    if (!this.lastActivity) return

    const now = Date.now()
    const timeSinceActivity = now - this.lastActivity

    if (timeSinceActivity > this.sessionTimeout) {
      console.log('AI Assistant | Sessão expirada, renovando...')
      this.refreshSession()
    }
  }

  async refreshSession () {
    try {
      await this.validateAIUser()
      this.updateActivity()
      console.log('AI Assistant | Sessão renovada')
    } catch (error) {
      console.error('AI Assistant | Erro ao renovar sessão:', error)
    }
  }

  updateActivity () {
    this.lastActivity = Date.now()
  }

  async notifyUserCreation () {
    const messageData = {
      content: '🤖 <strong>AI Assistant</strong> foi conectado ao mundo e está pronto para ajudar!',
      type: CONST.CHAT_MESSAGE_TYPES.OTHER,
      speaker: {
        alias: 'Sistema'
      }
    }

    await ChatMessage.create(messageData)
  }

  // Getters
  getAIUser () {
    return this.aiUser
  }

  getAIUserId () {
    return this.aiUserId
  }

  isInitialized () {
    return this.aiUser !== null && this.aiUserId !== null
  }

  getSessionData (key) {
    return this.sessionData.get(key)
  }

  setSessionData (key, value) {
    this.sessionData.set(key, value)
    this.updateActivity()
  }

  clearSessionData () {
    this.sessionData.clear()
  }

  async getAIUserStats () {
    if (!this.aiUser) return null

    try {
      const stats = {
        id: this.aiUserId,
        name: this.aiUser.name,
        createdAt: this.aiUser.getFlag('foundryvtt-ai-assistant', 'createdAt'),
        lastActivity: this.lastActivity,
        sessionActive: this.lastActivity && (Date.now() - this.lastActivity) < this.sessionTimeout,
        permissionHistory: this.aiUser.getFlag('foundryvtt-ai-assistant', 'permissionHistory') || [],
        version: this.aiUser.getFlag('foundryvtt-ai-assistant', 'version')
      }

      return stats
    } catch (error) {
      console.error('AI Assistant | Erro ao obter estatísticas:', error)
      return null
    }
  }
}
