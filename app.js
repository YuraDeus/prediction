import { MarketService } from './src/services/market.service.js';

class PredictionApp {
    constructor() {
        this.marketService = new MarketService();
        this.updateInterval = 30000; // 30 секунд
    }

    // Инициализация приложения
    async init() {
        await this.loadMarkets();
        this.startAutoUpdate();
    }

    // Загрузка событий
    async loadMarkets() {
        const markets = await this.marketService.getActiveMarkets();
        this.displayMarkets(markets);
    }

    // Автообновление
    startAutoUpdate() {
        setInterval(() => this.loadMarkets(), this.updateInterval);
    }
}
