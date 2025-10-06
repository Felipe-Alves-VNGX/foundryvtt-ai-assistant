#!/usr/bin/env node

/**
 * Script de validação para o módulo FoundryVTT AI Assistant
 * Verifica se o módulo está configurado corretamente
 */

const fs = require('fs');
const path = require('path');

class ModuleValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.moduleRoot = path.join(__dirname, '..');
    }

    validate() {
        console.log('🔍 Validando módulo FoundryVTT AI Assistant...\n');

        this.validateModuleJson();
        this.validatePackageJson();
        this.validateFiles();
        this.validateLanguages();
        this.validateBuild();

        this.printResults();
        
        return this.errors.length === 0;
    }

    validateModuleJson() {
        const moduleJsonPath = path.join(this.moduleRoot, 'module.json');
        
        if (!fs.existsSync(moduleJsonPath)) {
            this.errors.push('module.json não encontrado');
            return;
        }

        try {
            const moduleJson = JSON.parse(fs.readFileSync(moduleJsonPath, 'utf8'));
            
            // Campos obrigatórios
            const requiredFields = ['id', 'title', 'description', 'version', 'compatibility'];
            for (const field of requiredFields) {
                if (!moduleJson[field]) {
                    this.errors.push(`module.json: Campo obrigatório '${field}' ausente`);
                }
            }

            // Verificar se usa esmodules em vez de scripts
            if (moduleJson.scripts && moduleJson.scripts.length > 0) {
                this.warnings.push('module.json: Recomenda-se usar "esmodules" em vez de "scripts"');
            }

            if (!moduleJson.esmodules || moduleJson.esmodules.length === 0) {
                this.errors.push('module.json: Campo "esmodules" ausente ou vazio');
            }

            // Verificar compatibilidade
            if (moduleJson.compatibility) {
                const minVersion = parseInt(moduleJson.compatibility.minimum);
                if (minVersion < 11) {
                    this.warnings.push('module.json: Versão mínima muito antiga, considere atualizar');
                }
            }

            // Verificar relationships
            if (!moduleJson.relationships) {
                this.warnings.push('module.json: Campo "relationships" ausente - recomendado para declarar dependências');
            }

            console.log('✓ module.json validado');
        } catch (error) {
            this.errors.push(`module.json: Erro ao parsear JSON - ${error.message}`);
        }
    }

    validatePackageJson() {
        const packageJsonPath = path.join(this.moduleRoot, 'package.json');
        
        if (!fs.existsSync(packageJsonPath)) {
            this.warnings.push('package.json não encontrado - recomendado para desenvolvimento');
            return;
        }

        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            
            // Verificar scripts essenciais
            const recommendedScripts = ['build', 'test', 'lint'];
            for (const script of recommendedScripts) {
                if (!packageJson.scripts || !packageJson.scripts[script]) {
                    this.warnings.push(`package.json: Script '${script}' recomendado ausente`);
                }
            }

            // Verificar se versão bate com module.json
            const moduleJson = JSON.parse(fs.readFileSync(path.join(this.moduleRoot, 'module.json'), 'utf8'));
            if (packageJson.version !== moduleJson.version) {
                this.errors.push('Versões em package.json e module.json não coincidem');
            }

            console.log('✓ package.json validado');
        } catch (error) {
            this.errors.push(`package.json: Erro ao parsear JSON - ${error.message}`);
        }
    }

    validateFiles() {
        const moduleJson = JSON.parse(fs.readFileSync(path.join(this.moduleRoot, 'module.json'), 'utf8'));
        
        // Verificar arquivos JavaScript
        if (moduleJson.esmodules) {
            for (const jsFile of moduleJson.esmodules) {
                const filePath = path.join(this.moduleRoot, jsFile);
                if (!fs.existsSync(filePath)) {
                    this.errors.push(`Arquivo JavaScript não encontrado: ${jsFile}`);
                }
            }
        }

        // Verificar arquivos CSS
        if (moduleJson.styles) {
            for (const cssFile of moduleJson.styles) {
                const filePath = path.join(this.moduleRoot, cssFile);
                if (!fs.existsSync(filePath)) {
                    this.errors.push(`Arquivo CSS não encontrado: ${cssFile}`);
                }
            }
        }

        // Verificar arquivos essenciais
        const essentialFiles = ['README.md', 'LICENSE'];
        for (const file of essentialFiles) {
            if (!fs.existsSync(path.join(this.moduleRoot, file))) {
                this.warnings.push(`Arquivo recomendado não encontrado: ${file}`);
            }
        }

        console.log('✓ Arquivos validados');
    }

    validateLanguages() {
        const moduleJson = JSON.parse(fs.readFileSync(path.join(this.moduleRoot, 'module.json'), 'utf8'));
        
        if (!moduleJson.languages || moduleJson.languages.length === 0) {
            this.warnings.push('Nenhum arquivo de idioma configurado');
            return;
        }

        for (const lang of moduleJson.languages) {
            const langPath = path.join(this.moduleRoot, lang.path);
            if (!fs.existsSync(langPath)) {
                this.errors.push(`Arquivo de idioma não encontrado: ${lang.path}`);
                continue;
            }

            try {
                JSON.parse(fs.readFileSync(langPath, 'utf8'));
            } catch (error) {
                this.errors.push(`Arquivo de idioma inválido ${lang.path}: ${error.message}`);
            }
        }

        console.log('✓ Arquivos de idioma validados');
    }

    validateBuild() {
        // Verificar se existe webpack config
        const webpackConfigPath = path.join(this.moduleRoot, 'webpack.config.cjs');
        const webpackConfigPathJs = path.join(this.moduleRoot, 'webpack.config.js');
        if (!fs.existsSync(webpackConfigPath) && !fs.existsSync(webpackConfigPathJs)) {
            this.warnings.push('webpack.config.js/.cjs não encontrado - recomendado para otimização');
        }

        // Verificar se build foi executado
        const indexJsPath = path.join(this.moduleRoot, 'index.js');
        if (!fs.existsSync(indexJsPath)) {
            this.warnings.push('index.js não encontrado - execute npm run build');
        }

        console.log('✓ Configuração de build validada');
    }

    printResults() {
        console.log('\n📊 Resultados da Validação:\n');

        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('🎉 Módulo válido! Nenhum erro ou aviso encontrado.');
            return;
        }

        if (this.errors.length > 0) {
            console.log('❌ Erros encontrados:');
            for (const error of this.errors) {
                console.log(`   • ${error}`);
            }
            console.log();
        }

        if (this.warnings.length > 0) {
            console.log('⚠️  Avisos:');
            for (const warning of this.warnings) {
                console.log(`   • ${warning}`);
            }
            console.log();
        }

        if (this.errors.length === 0) {
            console.log('✅ Módulo válido com avisos menores.');
        } else {
            console.log('❌ Módulo inválido. Corrija os erros antes de publicar.');
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const validator = new ModuleValidator();
    const isValid = validator.validate();
    process.exit(isValid ? 0 : 1);
}

module.exports = ModuleValidator;
