#!/usr/bin/env node

/**
 * Script automatizado para criar releases do módulo FoundryVTT AI Assistant
 * Baseado nas melhores práticas do enhancedcombathud-dnd5e
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ReleaseManager {
    constructor() {
        this.moduleJsonPath = path.join(__dirname, '..', 'module.json');
        this.packageJsonPath = path.join(__dirname, '..', 'package.json');
        this.changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
    }

    async createRelease() {
        try {
            console.log('🚀 Iniciando processo de release...');

            // 1. Verificar se estamos na branch main/master
            this.checkBranch();

            // 2. Verificar se há mudanças não commitadas
            this.checkWorkingDirectory();

            // 3. Executar testes
            this.runTests();

            // 4. Fazer build de produção
            this.buildProduction();

            // 5. Atualizar versão
            const newVersion = this.updateVersion();

            // 6. Criar pacote
            this.createPackage(newVersion);

            // 7. Commit e tag
            this.commitAndTag(newVersion);

            // 8. Criar release no GitHub (se gh CLI estiver disponível)
            this.createGitHubRelease(newVersion);

            console.log(`✅ Release ${newVersion} criado com sucesso!`);

        } catch (error) {
            console.error('❌ Erro durante o processo de release:', error.message);
            process.exit(1);
        }
    }

    checkBranch() {
        try {
            const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
            if (branch !== 'main' && branch !== 'master') {
                throw new Error(`Você deve estar na branch main/master para criar um release. Branch atual: ${branch}`);
            }
            console.log(`✓ Branch verificada: ${branch}`);
        } catch (error) {
            throw new Error('Erro ao verificar branch: ' + error.message);
        }
    }

    checkWorkingDirectory() {
        try {
            const status = execSync('git status --porcelain', { encoding: 'utf8' });
            if (status.trim()) {
                throw new Error('Há mudanças não commitadas. Commit ou stash suas mudanças antes de criar um release.');
            }
            console.log('✓ Working directory limpo');
        } catch (error) {
            throw new Error('Erro ao verificar working directory: ' + error.message);
        }
    }

    runTests() {
        try {
            console.log('🧪 Executando testes...');
            execSync('npm test', { stdio: 'inherit' });
            console.log('✓ Testes passaram');
        } catch (error) {
            throw new Error('Testes falharam. Corrija os erros antes de criar um release.');
        }
    }

    buildProduction() {
        try {
            console.log('🔨 Fazendo build de produção...');
            execSync('npm run build', { stdio: 'inherit' });
            console.log('✓ Build de produção concluído');
        } catch (error) {
            throw new Error('Build de produção falhou: ' + error.message);
        }
    }

    updateVersion() {
        // Ler versão atual
        const moduleJson = JSON.parse(fs.readFileSync(this.moduleJsonPath, 'utf8'));
        const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));

        const currentVersion = moduleJson.version;
        console.log(`📦 Versão atual: ${currentVersion}`);

        // Incrementar versão (patch por padrão)
        const versionParts = currentVersion.split('.').map(Number);
        versionParts[2]++; // Incrementar patch
        const newVersion = versionParts.join('.');

        console.log(`📦 Nova versão: ${newVersion}`);

        // Atualizar module.json
        moduleJson.version = newVersion;
        moduleJson.download = moduleJson.download.replace(
            /v[\d.]+/,
            `v${newVersion}`
        );

        // Atualizar package.json
        packageJson.version = newVersion;

        // Salvar arquivos
        fs.writeFileSync(this.moduleJsonPath, JSON.stringify(moduleJson, null, 2) + '\n');
        fs.writeFileSync(this.packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

        console.log('✓ Versões atualizadas');
        return newVersion;
    }

    createPackage(version) {
        try {
            console.log('📦 Criando pacote...');
            
            const packageName = `foundryvtt-ai-assistant-v${version}.zip`;
            
            // Remover pacote anterior se existir
            if (fs.existsSync(packageName)) {
                fs.unlinkSync(packageName);
            }

            // Criar novo pacote
            execSync(`zip -r ${packageName} module.json index.js index.js.map styles/ lang/ templates/ README.md LICENSE CHANGELOG.md`, {
                stdio: 'inherit'
            });

            console.log(`✓ Pacote criado: ${packageName}`);
            return packageName;
        } catch (error) {
            throw new Error('Erro ao criar pacote: ' + error.message);
        }
    }

    commitAndTag(version) {
        try {
            console.log('📝 Commitando mudanças...');
            
            // Add arquivos modificados
            execSync('git add module.json package.json index.js index.js.map');
            
            // Commit
            execSync(`git commit -m "Release v${version}"`, { stdio: 'inherit' });
            
            // Criar tag
            execSync(`git tag -a v${version} -m "Release v${version}"`, { stdio: 'inherit' });
            
            console.log(`✓ Commit e tag v${version} criados`);
        } catch (error) {
            throw new Error('Erro ao commitar: ' + error.message);
        }
    }

    createGitHubRelease(version) {
        try {
            // Verificar se gh CLI está disponível
            execSync('gh --version', { stdio: 'ignore' });
            
            console.log('🐙 Criando release no GitHub...');
            
            const packageName = `foundryvtt-ai-assistant-v${version}.zip`;
            const releaseNotes = this.generateReleaseNotes(version);
            
            // Criar release
            execSync(`gh release create v${version} ${packageName} --title "Release v${version}" --notes "${releaseNotes}"`, {
                stdio: 'inherit'
            });
            
            console.log('✓ Release criado no GitHub');
        } catch (error) {
            console.log('⚠️  GitHub CLI não disponível ou erro ao criar release:', error.message);
            console.log('💡 Você pode criar o release manualmente no GitHub');
        }
    }

    generateReleaseNotes(version) {
        try {
            // Tentar extrair notas do CHANGELOG.md
            if (fs.existsSync(this.changelogPath)) {
                const changelog = fs.readFileSync(this.changelogPath, 'utf8');
                const versionSection = changelog.match(new RegExp(`## \\[${version}\\][\\s\\S]*?(?=## \\[|$)`));
                if (versionSection) {
                    return versionSection[0].replace(`## [${version}]`, '').trim();
                }
            }
            
            // Fallback para notas padrão
            return `Release v${version} do FoundryVTT AI Assistant\\n\\nVeja o CHANGELOG.md para detalhes completos.`;
        } catch (error) {
            return `Release v${version} do FoundryVTT AI Assistant`;
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const releaseManager = new ReleaseManager();
    releaseManager.createRelease();
}

module.exports = ReleaseManager;
