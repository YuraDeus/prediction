// Общее хранилище для событий
export function saveMarkets(markets) {
    localStorage.setItem('prediction_markets', JSON.stringify(markets));
}

export function getMarkets() {
    const saved = localStorage.getItem('prediction_markets');
    return saved ? JSON.parse(saved) : [];
} 