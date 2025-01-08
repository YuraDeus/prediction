import { getMarketsData, saveMarketsData } from '../src/storage.js';

// Проверка авторизации
if (localStorage.getItem('adminAuthenticated') !== 'true') {
    window.location.href = 'login.html';
}

// Функция показа уведомления (упрощенная версия)
function showNotification(message, type = 'success') {
    const overlay = document.createElement('div');
    overlay.className = 'notification-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
    `;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        background: white;
        padding: 25px 35px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        text-align: center;
        min-width: 300px;
        position: relative;
    `;

    notification.innerHTML = `
        <div style="margin-bottom: 20px;">${message}</div>
        <button style="padding: 8px 16px; background: #2481cc; color: white; border: none; border-radius: 6px; cursor: pointer;">OK</button>
    `;

    overlay.appendChild(notification);
    document.body.appendChild(overlay);

    // Закрытие по клику на кнопку
    const button = notification.querySelector('button');
    button.onclick = () => overlay.remove();

    // Автоматическое закрытие
    setTimeout(() => overlay.remove(), 3000);
}

// Основные функции
function createMarketEvent(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    const newMarket = {
        id: Date.now(),
        question: formData.get('question'),
        description: formData.get('description'),
        rules: {
            yes: formData.get('yesRule'),
            no: formData.get('noRule')
        },
        yesAmount: 0,
        noAmount: 0,
        yesVoters: 0,
        noVoters: 0,
        category: "crypto",
        createdAt: new Date().toISOString(),
        votingHistory: [
            {
                date: new Date().toISOString(),
                yesVotes: 0,
                noVotes: 0
            }
        ],
        totalVotes: 0,
        totalAmount: 0,
        probability: 50,
        isClickable: true,
        status: 'active'
    };

    markets.push(newMarket);
    localStorage.setItem('markets', JSON.stringify(markets));
    form.reset();
    displayMarkets();
    
    // Добавляем отправку события
    window.parent.postMessage({
        type: 'MARKET_UPDATED',
        markets: markets
    }, '*');
    
    showNotification('Событие успешно создано');
}

function displayMarkets() {
    const marketsList = document.getElementById('marketsList');
    marketsList.innerHTML = `
        <h2>Активные события (${markets.length})</h2>
        ${markets.map(market => `
            <div class="market-card">
                <h3 class="market-title clickable" onclick="showMarketDetails(${market.id})">${market.question}</h3>
                <p>${market.description}</p>
                <div class="rules">
                    <p><strong>Условие ДА:</strong> ${market.rules.yes}</p>
                    <p><strong>Условие НЕТ:</strong> ${market.rules.no}</p>
                </div>
                <div class="stats">
                    <p>Ставки ДА: ${market.yesAmount} TON</p>
                    <p>Ставки НЕТ: ${market.noAmount} TON</p>
                </div>
                <div class="actions">
                    <button onclick="editMarket(${market.id})">Редактировать</button>
                    <button onclick="deleteMarket(${market.id})">Удалить</button>
                </div>
            </div>
        `).join('')}
    `;

    // Добавляем обработчики кликов для заголовков
    const titles = marketsList.querySelectorAll('.market-title');
    titles.forEach(title => {
        title.style.cursor = 'pointer';
        title.addEventListener('click', () => {
            const marketId = parseInt(title.closest('.market-card').dataset.id);
            const market = markets.find(m => m.id === marketId);
            if (market) {
                window.dispatchEvent(new CustomEvent('showMarketDetails', {
                    detail: { market }
                }));
            }
        });
    });
}

// Функция удаления события
function deleteMarket(id) {
    const overlay = document.createElement('div');
    overlay.className = 'notification-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        padding: 25px 35px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        text-align: center;
        min-width: 300px;
    `;

    modal.innerHTML = `
        <h3 style="margin-bottom: 20px;">Подтверждение удаления</h3>
        <p style="margin-bottom: 20px;">Вы уверены, что хотите удалить это событие?</p>
        <div style="display: flex; justify-content: center; gap: 10px;">
            <button class="cancel-btn" style="padding: 8px 16px; background: #f1f1f1; border: none; border-radius: 6px; cursor: pointer;">Отмена</button>
            <button class="confirm-btn" style="padding: 8px 16px; background: #ea4335; color: white; border: none; border-radius: 6px; cursor: pointer;">Удалить</button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Обработчики кнопок
    modal.querySelector('.cancel-btn').onclick = () => overlay.remove();
    modal.querySelector('.confirm-btn').onclick = () => {
        markets = markets.filter(market => market.id !== id);
        localStorage.setItem('markets', JSON.stringify(markets));
        displayMarkets();
        
        // Добавляем отправку события
        window.parent.postMessage({
            type: 'MARKET_UPDATED',
            markets: markets
        }, '*');
        
        overlay.remove();
        showNotification('Событие удалено');
    };
}

// Функция редактирования события
function editMarket(id) {
    const market = markets.find(m => m.id === id);
    if (!market) return;

    const overlay = document.createElement('div');
    overlay.className = 'notification-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        padding: 25px 35px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        min-width: 400px;
        max-width: 600px;
    `;

    modal.innerHTML = `
        <h3 style="margin-bottom: 20px;">Редактирование события</h3>
        <form id="editForm">
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Вопрос:</label>
                <input type="text" name="question" value="${market.question}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Описание:</label>
                <textarea name="description" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px; min-height: 100px;">${market.description}</textarea>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Условие ДА:</label>
                <textarea name="yesRule" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">${market.rules.yes}</textarea>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Условие НЕТ:</label>
                <textarea name="noRule" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">${market.rules.no}</textarea>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                <button type="button" class="cancel-btn" style="padding: 8px 16px; background: #f1f1f1; border: none; border-radius: 6px; cursor: pointer;">Отмена</button>
                <button type="submit" style="padding: 8px 16px; background: #34a853; color: white; border: none; border-radius: 6px; cursor: pointer;">Сохранить</button>
            </div>
        </form>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Обработчики
    modal.querySelector('.cancel-btn').onclick = () => overlay.remove();
    modal.querySelector('form').onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        market.question = formData.get('question');
        market.description = formData.get('description');
        market.rules.yes = formData.get('yesRule');
        market.rules.no = formData.get('noRule');

        localStorage.setItem('markets', JSON.stringify(markets));
        displayMarkets();
        
        // Добавляем отправку события
        window.parent.postMessage({
            type: 'MARKET_UPDATED',
            markets: markets
        }, '*');
        
        overlay.remove();
        showNotification('Событие обновлено');
    };
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    loadMarkets();
});

// Функция сохранения событий
async function saveMarket(market) {
    try {
        // Получаем текущие события
        const markets = await getMarketsData();
        
        // Добавляем новое событие
        markets.push(market);
        
        // Сохраняем в GitHub
        await saveMarketsData(markets);
        
        // Обновляем отображение
        displayMarkets();
        
        // Отправляем сообщение в основное приложение
        window.parent.postMessage({
            type: 'MARKET_UPDATED',
            markets: markets
        }, '*');
        
        showNotification('Событие успешно добавлено');
    } catch (error) {
        console.error('Ошибка при сохранении события:', error);
        showNotification('Ошибка при сохранении события', 'error');
    }
}

// Функция загрузки событий
async function loadMarkets() {
    try {
        const markets = await getMarketsData();
        displayMarkets(markets);
    } catch (error) {
        console.error('Ошибка при загрузке событий:', error);
        showNotification('Ошибка при загрузке событий', 'error');
    }
}

function setGithubToken(token) {
    localStorage.setItem('GITHUB_TOKEN', token);
}

// При успешной авторизации
if (localStorage.getItem('GITHUB_TOKEN')) {
    console.log('GitHub токен найден');
} else {
    console.error('GitHub токен не найден');
}

// Функция добавления нового события
async function addMarket(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const market = {
        id: Date.now(),
        question: formData.get('question'),
        description: formData.get('description'),
        rules: {
            yes: formData.get('yesRule'),
            no: formData.get('noRule')
        },
        yesAmount: 0,
        noAmount: 0,
        category: 'crypto',
        createdAt: new Date().toISOString()
    };

    try {
        await saveMarket(market);
        event.target.reset();
        showNotification('Событие успешно добавлено');
    } catch (error) {
        console.error('Ошибка при добавлении события:', error);
        showNotification('Ошибка при добавлении события', 'error');
    }
}

// Добавляем обработчик формы
document.querySelector('#addMarketForm').addEventListener('submit', addMarket); 