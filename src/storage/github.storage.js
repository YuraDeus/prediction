import { GITHUB_CONFIG } from '../config.js';

export class GitHubStorage {
    constructor() {
        this.token = GITHUB_CONFIG.TOKEN;
        this.repoUrl = GITHUB_CONFIG.REPO_URL;
    }

    // Получение всех событий
    async getMarkets() {
        try {
            const response = await fetch(this.repoUrl, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }

            const data = await response.json();
            const content = atob(data.content);
            const parsed = JSON.parse(content);
            return parsed.markets || [];
        } catch (error) {
            console.error('Error getting markets:', error);
            return [];
        }
    }

    // Сохранение нового события
    async saveMarket(marketData) {
        try {
            const markets = await this.getMarkets();
            markets.push({
                ...marketData,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                status: 'active',
                yesAmount: 0,
                noAmount: 0
            });
            await this._updateFile(markets);
        } catch (error) {
            console.error('Error saving market:', error);
            throw error;
        }
    }

    // Обновление события
    async updateMarket(id, marketData) {
        try {
            const markets = await this.getMarkets();
            const index = markets.findIndex(m => m.id === id);
            if (index === -1) throw new Error('Market not found');
            markets[index] = { ...markets[index], ...marketData };
            await this._updateFile(markets);
        } catch (error) {
            console.error('Error updating market:', error);
            throw error;
        }
    }

    // Удаление события
    async deleteMarket(id) {
        try {
            const markets = await this.getMarkets();
            const filtered = markets.filter(m => m.id !== id);
            await this._updateFile(filtered);
        } catch (error) {
            console.error('Error deleting market:', error);
            throw error;
        }
    }

    // Вспомогательный метод для обновления файла
    async _updateFile(markets) {
        try {
            // Получаем текущий SHA файла
            const currentFile = await fetch(this.repoUrl, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            const fileData = await currentFile.json();
            const sha = fileData.sha;

            // Готовим новый контент
            const content = JSON.stringify({ markets }, null, 2);
            const encodedContent = btoa(unescape(encodeURIComponent(content)));

            // Отправляем обновление
            const response = await fetch(this.repoUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: 'Update markets data',
                    content: encodedContent,
                    sha: sha
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`GitHub API error: ${response.status}\n${JSON.stringify(errorData, null, 2)}`);
            }
        } catch (error) {
            console.error('Error updating file:', error);
            throw error;
        }
    }
} 