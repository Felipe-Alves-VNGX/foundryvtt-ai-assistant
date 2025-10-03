# Contribuindo para o FoundryVTT AI Assistant

Obrigado por seu interesse em contribuir para o FoundryVTT AI Assistant! Este documento fornece diretrizes e informações para contribuidores.

## 🚀 Como Contribuir

### 1. Fork e Clone
```bash
# Fork o repositório no GitHub
# Clone seu fork
git clone https://github.com/SEU-USUARIO/foundryvtt-ai-assistant.git
cd foundryvtt-ai-assistant

# Adicione o repositório original como upstream
git remote add upstream https://github.com/USUARIO-ORIGINAL/foundryvtt-ai-assistant.git
```

### 2. Configurar Ambiente de Desenvolvimento
```bash
# Instalar dependências
npm install

# Executar testes
npm test

# Executar em modo de desenvolvimento
npm run dev
```

### 3. Criar Branch para Feature
```bash
# Criar e mudar para nova branch
git checkout -b feature/minha-nova-funcionalidade

# Ou para correção de bug
git checkout -b fix/correcao-do-bug
```

## 📋 Diretrizes de Desenvolvimento

### Estrutura do Código
- **Modular**: Cada componente deve ter responsabilidade única
- **Documentado**: Funções e classes devem ter JSDoc
- **Testável**: Código deve ser facilmente testável
- **Consistente**: Seguir padrões estabelecidos

### Padrões de Código
```javascript
/**
 * Exemplo de função bem documentada
 * @param {string} message - Mensagem a ser processada
 * @param {Object} context - Contexto da conversa
 * @returns {Promise<string>} Resposta processada
 */
async function processMessage(message, context) {
    // Implementação
}
```

### Convenções de Nomenclatura
- **Classes**: PascalCase (`AIUserManager`)
- **Funções**: camelCase (`processMessage`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Arquivos**: kebab-case (`ai-user-manager.js`)

## 🧪 Testes

### Executar Testes
```bash
# Todos os testes
npm test

# Testes específicos
npm test -- --grep "PermissionManager"

# Testes com coverage
npm run test:coverage
```

### Escrever Testes
```javascript
describe('PermissionManager', () => {
    it('should grant basic permissions by default', async () => {
        const manager = new PermissionManager();
        await manager.initialize();
        
        expect(manager.checkPermission('sendMessage')).toBe(true);
    });
});
```

## 📝 Documentação

### JSDoc
Todas as funções públicas devem ter documentação JSDoc:

```javascript
/**
 * Cria um novo ator no FoundryVTT
 * @param {Object} actorData - Dados do ator
 * @param {string} actorData.name - Nome do ator
 * @param {string} actorData.type - Tipo do ator
 * @param {Object} [options={}] - Opções adicionais
 * @returns {Promise<Object>} Resultado da operação
 * @throws {Error} Se dados inválidos
 * @example
 * const result = await createActor({
 *   name: "Orc Guerreiro",
 *   type: "npc"
 * });
 */
```

### README
Atualize o README.md se sua contribuição:
- Adiciona nova funcionalidade
- Muda API pública
- Adiciona dependências
- Muda processo de instalação

## 🔧 Tipos de Contribuição

### 🐛 Correção de Bugs
1. Verifique se o bug já foi reportado
2. Crie issue descrevendo o problema
3. Implemente a correção
4. Adicione testes para evitar regressão

### ✨ Novas Funcionalidades
1. Discuta a funcionalidade em uma issue
2. Aguarde aprovação dos mantenedores
3. Implemente seguindo as diretrizes
4. Adicione documentação e testes

### 📚 Documentação
- Correções de typos
- Melhorias na clareza
- Exemplos adicionais
- Traduções

### 🧪 Testes
- Aumentar cobertura de testes
- Testes de integração
- Testes de performance

## 🔍 Processo de Review

### Checklist do Pull Request
- [ ] Código segue padrões estabelecidos
- [ ] Testes passam (`npm test`)
- [ ] Documentação atualizada
- [ ] Commit messages são claros
- [ ] Não quebra funcionalidades existentes

### Commit Messages
Use o padrão Conventional Commits:

```
feat: adiciona suporte para provedor Claude
fix: corrige erro de permissão em createActor
docs: atualiza README com exemplos de API
test: adiciona testes para ChatInterface
refactor: melhora estrutura do PermissionManager
```

### Tipos de Commit
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (não afeta lógica)
- `refactor`: Refatoração de código
- `test`: Testes
- `chore`: Tarefas de manutenção

## 🚦 Processo de Aprovação

### Critérios para Aprovação
1. **Funcionalidade**: Código funciona conforme esperado
2. **Qualidade**: Segue padrões de qualidade
3. **Testes**: Tem cobertura adequada de testes
4. **Documentação**: Está bem documentado
5. **Compatibilidade**: Não quebra funcionalidades existentes

### Timeline
- **Review inicial**: 2-3 dias úteis
- **Feedback**: Resposta em 1-2 dias
- **Merge**: Após aprovação e CI verde

## 🤝 Código de Conduta

### Nossos Valores
- **Respeito**: Trate todos com respeito e cortesia
- **Inclusão**: Seja acolhedor para novos contribuidores
- **Colaboração**: Trabalhe em equipe de forma construtiva
- **Qualidade**: Busque sempre a excelência

### Comportamentos Esperados
- Use linguagem acolhedora e inclusiva
- Respeite diferentes pontos de vista
- Aceite críticas construtivas
- Foque no que é melhor para a comunidade

### Comportamentos Inaceitáveis
- Linguagem ou imagens ofensivas
- Ataques pessoais ou políticos
- Assédio público ou privado
- Publicar informações privadas sem permissão

## 📞 Suporte

### Onde Buscar Ajuda
- **Issues**: Para bugs e solicitações de funcionalidades
- **Discussions**: Para perguntas gerais e discussões
- **Discord**: Para chat em tempo real (se disponível)
- **Email**: Para questões sensíveis

### Informações Úteis
- **Versão do FoundryVTT**: Sempre especifique
- **Sistema Operacional**: Windows/Mac/Linux
- **Navegador**: Chrome/Firefox/Safari
- **Logs**: Inclua logs relevantes

## 🏆 Reconhecimento

### Contribuidores
Todos os contribuidores são reconhecidos:
- Nome no arquivo CONTRIBUTORS.md
- Menção em releases
- Badge de contribuidor

### Tipos de Contribuição
Reconhecemos todos os tipos:
- 💻 Código
- 📖 Documentação
- 🐛 Relatórios de bug
- 💡 Ideias
- 🎨 Design
- 🌍 Tradução

## 📋 Checklist Final

Antes de submeter seu PR:

- [ ] Código testado localmente
- [ ] Testes passam
- [ ] Documentação atualizada
- [ ] Commit messages seguem padrão
- [ ] Branch está atualizada com main
- [ ] PR tem descrição clara
- [ ] Issues relacionadas estão linkadas

---

**Obrigado por contribuir! 🎉**

Sua contribuição ajuda a tornar o FoundryVTT AI Assistant melhor para toda a comunidade.
