import { GitHubStorage } from '../storage/github.storage.js';

export class MarketService {
    constructor() {
        this.storage = new GitHubStorage();
    }

    // Получение всех активных событий
    async getActiveMarkets() {
        const markets = await this.storage.getMarkets();
        return markets.filter(m => 
            m.status === 'active' && 
            new Date(m.deadline) > new Date()
        );
    }

    // Создание события
    async create(marketData) {
        await this.storage.saveMarket(marketData);
    }

    // Обновление события
    async update(id, marketData) {
        await this.storage.updateMarket(id, marketData);
    }

    // Удаление события
    async delete(id) {
        await this.storage.deleteMarket(id);
    }
} 