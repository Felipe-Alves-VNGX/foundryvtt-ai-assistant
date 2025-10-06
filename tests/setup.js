/**
 * Configuração de testes para o AI Assistant
 * Simula o ambiente do FoundryVTT para testes unitários
 */

// Mock do ambiente FoundryVTT
global.game = {
    settings: {
        register: jest.fn(),
        get: jest.fn(),
        set: jest.fn()
    },
    user: {
        isGM: true,
        id: 'test-user-id'
    },
    users: {
        contents: []
    },
    i18n: {
        localize: jest.fn((key) => key)
    }
};

global.ui = {
    notifications: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }
};

global.Hooks = {
    on: jest.fn(),
    once: jest.fn(),
    call: jest.fn(),
    callAll: jest.fn()
};

global.ChatMessage = {
    create: jest.fn()
};

global.Actor = {
    create: jest.fn()
};

global.Item = {
    create: jest.fn()
};

global.foundry = {
    utils: {
        mergeObject: (original, other) => ({ ...original, ...other }),
        expandObject: (obj) => obj,
        deepClone: (obj) => JSON.parse(JSON.stringify(obj))
    }
};

global.FormApplication = class FormApplication {
    constructor(object, options) {
        this.object = object;
        this.options = options;
    }
    
    static get defaultOptions() {
        return {};
    }
    
    getData() {
        return {};
    }
    
    activateListeners() {}
    
    render() {
        return Promise.resolve();
    }
};

// Mock do localStorage para testes
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};

global.localStorage = localStorageMock;

// Mock do console para capturar logs
global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

// Configurações globais de teste
beforeEach(() => {
    // Limpar todos os mocks antes de cada teste
    jest.clearAllMocks();
    
    // Resetar configurações padrão
    game.settings.get.mockReturnValue({});
    game.i18n.localize.mockImplementation((key) => key);
});

afterEach(() => {
    // Limpeza após cada teste
    jest.clearAllTimers();
});
