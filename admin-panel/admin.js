import { saveMarkets, getMarkets } from '../src/storage.js';

// Глобальные переменные
let markets = [];

// Функция показа уведомления
function showNotification(message, type = 'success') {
    alert(message); // Простое уведомление через alert
}

// Функция добавления нового события
function addMarket(event) {
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

    console.log('Создаем событие:', market);

    // Добавляем событие в массив
    markets.push(market);
    
    // Сохраняем в общее хранилище
    saveMarkets(markets);
    
    // Отправляем сообщение в основное приложение
    try {
        window.parent.postMessage({
            type: 'MARKET_UPDATED',
            markets: markets
        }, '*');
        console.log('Сообщение отправлено в основное приложение');
    } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
    }
    
    // Очищаем форму и обновляем отображение
    event.target.reset();
    displayMarkets();
    showNotification('Событие успешно добавлено');
}

// Функция отображения событий
function displayMarkets() {
    const marketsList = document.getElementById('marketsList');
    if (!marketsList) {
        console.error('Элемент marketsList не найден');
        return;
    }
    
    console.log('Отображаем события:', markets);
    
    marketsList.innerHTML = '';
    
    markets.forEach(market => {
        const card = document.createElement('div');
        card.className = 'market-card';
        card.innerHTML = `
            <h3>${market.question}</h3>
            <p>${market.description}</p>
            <div class="rules">
                <p><strong>YES:</strong> ${market.rules.yes}</p>
                <p><strong>NO:</strong> ${market.rules.no}</p>
            </div>
            <div class="actions">
                <button onclick="editMarket(${market.id})" class="edit-btn">Редактировать</button>
                <button onclick="deleteMarket(${market.id})" class="delete-btn">Удалить</button>
            </div>
        `;
        marketsList.appendChild(card);
    });
}

// Функция удаления события
function deleteMarket(id) {
    if (confirm('Вы уверены, что хотите удалить это событие?')) {
        markets = markets.filter(market => market.id !== id);
        saveMarkets(markets);
        
        // Отправляем обновление в основное приложение
        window.parent.postMessage({
            type: 'MARKET_UPDATED',
            markets: markets
        }, '*');
        
        // Для отладки
        console.log('Отправлено обновление после удаления:', markets);
        
        displayMarkets();
        showNotification('Событие удалено');
    }
}

// Функция редактирования события
function editMarket(id) {
    const market = markets.find(m => m.id === id);
    if (!market) return;

    const form = document.createElement('form');
    form.className = 'edit-form';
    form.innerHTML = `
        <input type="text" name="question" value="${market.question}" required>
        <textarea name="description" required>${market.description}</textarea>
        <input type="text" name="yesRule" value="${market.rules.yes}" required>
        <input type="text" name="noRule" value="${market.rules.no}" required>
        <div class="form-actions">
            <button type="button" onclick="this.closest('.edit-form').remove()">Отмена</button>
            <button type="submit">Сохранить</button>
        </div>
    `;

    form.onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        market.question = formData.get('question');
        market.description = formData.get('description');
        market.rules.yes = formData.get('yesRule');
        market.rules.no = formData.get('noRule');

        saveMarkets(markets);
        
        // Отправляем обновление в основное приложение
        window.parent.postMessage({
            type: 'MARKET_UPDATED',
            markets: markets
        }, '*');

        form.remove();
        displayMarkets();
        showNotification('Событие обновлено');
    };

    // Находим карточку события и добавляем форму после неё
    const card = document.querySelector(`[data-id="${id}"]`);
    if (card) card.after(form);
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен'); // Отладочный вывод
    
    // Загружаем сохраненные события
    markets = getMarkets();
    console.log('Загружены сохраненные события:', markets); // Отладочный вывод
    
    // Добавляем обработчик формы
    const form = document.querySelector('#addMarketForm');
    if (form) {
        form.addEventListener('submit', addMarket);
        console.log('Обработчик формы добавлен'); // Отладочный вывод
    } else {
        console.error('Форма не найдена');
    }
    
    displayMarkets();
}); 

// Делаем функции глобально доступными
window.deleteMarket = deleteMarket;
window.editMarket = editMarket; 