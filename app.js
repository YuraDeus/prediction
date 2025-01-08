import { telegramSession } from './src/telegram.js';
import { getMarkets } from './src/storage.js';

// В начале файла добавим версию
const APP_VERSION = new Date().getTime();

// Убираем демо-данные
const markets = [];  // Теперь все события будут загружаться из админ-панели

let userBets = [];

// Вспомогательные функции
function calculateProbability(yesAmount, noAmount) {
    const total = yesAmount + noAmount;
    return total === 0 ? 50 : Math.round((yesAmount / total) * 100);
}

function createMarketCard(market) {
    const card = document.createElement('div');
    card.className = 'market-card';
    
    const probability = calculateProbability(market.yesAmount || 0, market.noAmount || 0);
    
    card.innerHTML = `
        <h3 class="market-title">${market.question}</h3>
        <p class="market-description">${market.description}</p>
        <div class="probability">
            <div class="probability-bar" style="width: ${probability}%"></div>
        </div>
        <div class="market-stats">
            <div class="yes-stats">
                <div>YES</div>
                <div>${market.yesAmount || 0} TON</div>
            </div>
            <div class="no-stats">
                <div>NO</div>
                <div>${market.noAmount || 0} TON</div>
            </div>
        </div>
        <div class="bet-buttons">
            <button class="bet-btn bet-yes">YES</button>
            <button class="bet-btn bet-no">NO</button>
        </div>
    `;
    
    return card;
}

function updateWalletInfo() {
    const walletSection = document.querySelector('.wallet');
    if (isWalletConnected) {
        walletSection.innerHTML = `
            <span class="balance">${userBalance.toFixed(2)} TON</span>
            <button id="connectWallet">Отключить кошелек</button>
        `;
    } else {
        walletSection.innerHTML = `
            <button id="connectWallet">Подключить кошелек</button>
        `;
    }
    document.getElementById('connectWallet').addEventListener('click', toggleWallet);
}

function toggleWallet() {
    isWalletConnected = !isWalletConnected;
    if (isWalletConnected) {
        userBalance = 1000;
    }
    updateWalletInfo();
}

function filterMarkets(category) {
    const marketsList = document.getElementById('marketsList');
    marketsList.innerHTML = '';
    
    const filteredMarkets = category === 'all' 
        ? markets 
        : markets.filter(market => market.category === category);
    
    filteredMarkets.forEach(market => {
        marketsList.appendChild(createMarketCard(market));
    });
    
    document.querySelectorAll('.category-button').forEach(button => {
        button.classList.toggle('active', button.dataset.category === category);
    });
}

function updateMyBets() {
    const myBetsSection = document.getElementById('myBets');
    
    myBetsSection.innerHTML = `
        <h2>Мои прогнозы</h2>
        ${userBets.map(bet => `
            <div class="bet-card">
                <div class="bet-header">
                    <h3>${bet.question}</h3>
                    <span class="bet-amount ${bet.isYes ? 'yes' : 'no'}">
                        ${bet.amount} TON
                    </span>
                </div>
                <div class="bet-details">
                    <div class="bet-prediction">
                        Прогноз: <span class="${bet.isYes ? 'yes' : 'no'}">${bet.isYes ? 'ДА' : 'НЕТ'}</span>
                    </div>
                    <div class="bet-date">
                        ${new Date(bet.timestamp).toLocaleString()}
                    </div>
                </div>
            </div>
        `).join('')}
    `;
}

function showSection(sectionId) {
    console.log('Переключение на секцию:', sectionId);
    
    // Находим все секции
    const sections = document.querySelectorAll('.section');
    
    // Скрываем все секции и убираем класс active
    sections.forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active');
    });

    // Показываем нужную секцию
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.style.display = 'block';
        activeSection.classList.add('active');
        
        // Если открыли "Мои прогнозы" - обновляем их
        if (sectionId === 'myBets') {
            updateMyBets();
        }
    }

    // Обновляем активную вкладку
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.toggle('active', button.dataset.tab === sectionId);
    });
}

// Функция для отображения деталей события
function showMarketDetails(market) {
    const detailsSection = document.getElementById('marketDetails');
    
    detailsSection.innerHTML = `
        <div class="market-details">
            <div class="details-header">
                <button class="back-button">← Назад</button>
                <h2>${market.question}</h2>
            </div>
            
            <div class="details-section">
                <h3>Описание</h3>
                <p>${market.description}</p>
            </div>
            
            <div class="details-section">
                <h3>Правила</h3>
                <div class="rules">
                    <div class="rule yes">
                        <h4>Условия победы "ДА"</h4>
                        <p>${market.rules.yes}</p>
                    </div>
                    <div class="rule no">
                        <h4>Условия победы "НЕТ"</h4>
                        <p>${market.rules.no}</p>
                    </div>
                </div>
            </div>
            
            <div class="details-section">
                <h3>Статистика</h3>
                <div class="voters-stats">
                    <div class="stat-item">
                        <span class="stat-label">Проголосовали "ДА":</span>
                        <span class="stat-value yes">${market.yesVoters}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Проголосовали "НЕТ":</span>
                        <span class="stat-value no">${market.noVoters}</span>
                    </div>
                </div>
                <div class="pool-stats">
                    <div class="stat-item">
                        <span class="stat-label">Пул "ДА":</span>
                        <span class="stat-value">${market.yesAmount} TON</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Пул "НЕТ":</span>
                        <span class="stat-value">${market.noAmount} TON</span>
                    </div>
                </div>
            </div>
            
            <div class="details-section">
                <h3>Распределение голосов</h3>
                <div class="chart-container">
                    <canvas id="votesChart"></canvas>
                </div>
            </div>
            
            <div class="bet-section">
                <!-- Добавим форму для ставки здесь -->
            </div>
        </div>
    `;

    // Создаем линейный график
    const ctx = document.getElementById('votesChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: market.votingHistory.map(item => new Date(item.date).toLocaleDateString()),
            datasets: [
                {
                    label: 'Голоса "ДА"',
                    data: market.votingHistory.map(item => item.yesVotes),
                    borderColor: 'rgba(52, 168, 83, 1)',
                    backgroundColor: 'rgba(52, 168, 83, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: 'white',
                    pointBorderColor: 'rgba(52, 168, 83, 1)',
                    pointBorderWidth: 2
                },
                {
                    label: 'Голоса "НЕТ"',
                    data: market.votingHistory.map(item => item.noVotes),
                    borderColor: 'rgba(234, 67, 53, 1)',
                    backgroundColor: 'rgba(234, 67, 53, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: 'white',
                    pointBorderColor: 'rgba(234, 67, 53, 1)',
                    pointBorderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 14
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Динамика голосов',
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    padding: {
                        top: 10,
                        bottom: 30
                    }
                },
                tooltip: {
                    backgroundColor: 'white',
                    titleColor: 'black',
                    bodyColor: 'black',
                    borderColor: 'rgba(0,0,0,0.1)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y} голосов`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        padding: 10,
                        font: {
                            size: 12
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        padding: 10,
                        font: {
                            size: 12
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });

    // Обработчик кнопки "Назад"
    detailsSection.querySelector('.back-button').addEventListener('click', () => {
        showSection('markets');
    });

    // Показываем секцию с деталями
    showSection('marketDetails');
}

// Функция получения событий
async function getMarketsFromStorage() {
    return getMarkets();
}

// Обновление отображения
async function updateMarketsDisplay() {
    const marketsList = document.getElementById('marketsList');
    if (!marketsList) return;

    const markets = getMarkets();
    console.log('Пытаемся отобразить события:', markets);
    
    marketsList.innerHTML = '';
    
    if (!markets || markets.length === 0) {
        marketsList.innerHTML = '<div class="no-markets">Нет активных событий</div>';
        return;
    }

    markets.forEach(market => {
        const card = createMarketCard(market);
        marketsList.appendChild(card);
    });
}

// Вызываем обновление при загрузке страницы
document.addEventListener('DOMContentLoaded', updateMarketsDisplay);

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
    // Инициализируем сессию Telegram
    const user = telegramSession.initSession();
    
    if (user) {
        console.log('Пользователь авторизован:', user);
        updateUserInterface(user);
    } else {
        console.log('Ошибка авторизации');
        showAuthError();
    }
    
    // Загружаем и отображаем события
    console.log('Загружаем события из хранилища');
    updateMarketsDisplay();
});

// Функция обновления интерфейса для авторизованного пользователя
function updateUserInterface(user) {
    const header = document.querySelector('header');
    // Обновляем информацию пользователя
    const userAvatar = document.querySelector('.user-avatar');
    const username = document.querySelector('.username');
    const userTag = document.querySelector('.user-tag');

    // Добавляем аватар, если есть
    if (user.photo_url) {
        userAvatar.innerHTML = `<img src="${user.photo_url}" alt="${user.firstName}">`;
    } else {
        // Если аватара нет, показываем первую букву имени
        userAvatar.innerHTML = `<div class="avatar-placeholder">${user.firstName.charAt(0)}</div>`;
    }

    // Обновляем имя и тег
    username.textContent = `${user.firstName} ${user.lastName || ''}`;
    if (user.username) {
        userTag.textContent = `@${user.username}`;
        userTag.style.display = 'block';
    } else {
        userTag.style.display = 'none';
    }
}

// Функция для показа приглашения авторизоваться
function showAuthPrompt() {
    const header = document.querySelector('header');
    const authPrompt = document.createElement('div');
    authPrompt.className = 'auth-prompt';
    authPrompt.innerHTML = `
        <p>Войдите через Telegram для доступа к прогнозам</p>
        <button onclick="telegramSession.initSession()">Войти</button>
    `;
    header.appendChild(authPrompt);
}

window.addEventListener('showMarketDetails', (event) => {
    const market = event.detail.market;
    showMarketDetails(market);
});

// Добавляем слушатель сообщений от админ-панели
window.addEventListener('message', (event) => {
    console.log('Получено сообщение в основном приложении:', {
        origin: event.origin,
        data: event.data,
        source: event.source
    });

    if (event.data.type === 'MARKET_UPDATED') {
        console.log('Получено обновление от админ-панели:', event.data.markets);
        localStorage.setItem('prediction_markets', JSON.stringify(event.data.markets));
        updateMarketsDisplay();
    }
});

// Функция для проверки обновлений
function checkForUpdates() {
    const currentVersion = localStorage.getItem('app_version');
    const lastCheck = localStorage.getItem('last_check_time');
    const now = Date.now();
    
    // Проверяем не чаще раза в минуту
    if (lastCheck && now - parseInt(lastCheck) < 60000) {
        return;
    }
    
    localStorage.setItem('last_check_time', now);
    
    fetch('https://api.github.com/repos/YuraDeus/prediction/commits/main' + '?v=' + APP_VERSION)
        .then(response => response.json())
        .then(data => {
            const latestVersion = data.sha;
            
            if (currentVersion !== latestVersion) {
                localStorage.setItem('app_version', latestVersion);
                // Мягкое обновление только при существенных изменениях
                updateMarketsDisplay();
            }
        })
        .catch(error => console.error('Ошибка проверки обновлений:', error));
}

// Проверяем раз в 2 минуты
setInterval(checkForUpdates, 120 * 1000);

// Проверяем при загрузке страницы
document.addEventListener('DOMContentLoaded', checkForUpdates);
