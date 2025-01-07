import { telegramSession } from './src/telegram.js';

// Убираем демо-данные
const markets = [];  // Теперь все события будут загружаться из админ-панели

let userBalance = 1000;
let isWalletConnected = false;
const MAX_BET_AMOUNT = 10;
let userBets = [];

// Вспомогательные функции
function calculateProbability(yesAmount, noAmount) {
    const total = yesAmount + noAmount;
    return total === 0 ? 50 : Math.round((yesAmount / total) * 100);
}

function createMarketCard(market) {
    const probability = calculateProbability(market.yesAmount, market.noAmount);
    
    const card = document.createElement('div');
    card.className = 'market-card';
    card.dataset.id = market.id;
    
    card.innerHTML = `
        <h2 class="market-title clickable">${market.question}</h2>
        <p class="market-description">${market.description}</p>
        <div class="market-stats">
            <div class="probability">
                <div class="probability-bar" style="width: ${probability}%"></div>
                <span class="probability-text">Вероятность: ${probability}%</span>
            </div>
            <div class="pool-info">
                <div>YES: ${market.yesAmount} TON</div>
                <div>NO: ${market.noAmount} TON</div>
            </div>
        </div>
        <div class="bet-form">
            <input type="number" class="bet-input" placeholder="Сумма в TON (макс. ${MAX_BET_AMOUNT})" />
            <div class="error" style="display: none;"></div>
            <div class="bet-buttons">
                <button class="yes-button">YES</button>
                <button class="no-button">NO</button>
            </div>
        </div>
    `;

    const input = card.querySelector('.bet-input');
    const error = card.querySelector('.error');
    const yesButton = card.querySelector('.yes-button');
    const noButton = card.querySelector('.no-button');

    function placeBet(isYes) {
        const user = telegramSession.getTelegramUser();
        if (user) {
            // Сохраняем действие в историю
            telegramSession.saveUserAction({
                type: 'PLACE_BET',
                data: {
                    amount,
                    isYes,
                    marketId: market.id
                }
            });

            // Обновляем статистику
            const userStats = telegramSession.getUserData()?.stats || {};
            telegramSession.updateUserStats({
                totalBets: (userStats.totalBets || 0) + 1,
                totalAmount: (userStats.totalAmount || 0) + amount
            });

            if (!user) {
                error.textContent = 'Необходима авторизация через Telegram';
                error.style.display = 'block';
                return;
            }

            const amount = Number(input.value);
            if (isNaN(amount) || amount <= 0) {
                error.textContent = 'Введите корректную сумму';
                error.style.display = 'block';
                return;
            }

            if (amount > MAX_BET_AMOUNT) {
                error.textContent = `Максимальная ставка: ${MAX_BET_AMOUNT} TON`;
                error.style.display = 'block';
                return;
            }

            if (amount > userBalance) {
                error.textContent = 'Недостаточно средств';
                error.style.display = 'block';
                return;
            }

            // Создаем объект ставки
            const bet = {
                marketId: market.id,
                amount: amount,
                isYes: isYes,
                timestamp: new Date(),
                question: market.question
            };

            // Добавляем логирование
            console.log('Создана новая ставка:', bet);
            console.log('Текущие ставки до добавления:', userBets);

            // Добавляем ставку в массив
            userBets.push(bet);

            console.log('Текущие ставки после добавления:', userBets);

            // Обновляем баланс и пулы
            userBalance -= amount;
            if (isYes) {
                market.yesAmount += amount;
            } else {
                market.noAmount += amount;
            }

            updateWalletInfo();
            updateMyBets(); // Добавляем обновление раздела ставок
            
            const newProbability = calculateProbability(market.yesAmount, market.noAmount);
            card.querySelector('.probability').textContent = `Вероятность: ${newProbability}%`;
            
            input.value = '';
            error.style.display = 'none';
        }
    }

    yesButton.addEventListener('click', () => placeBet(true));
    noButton.addEventListener('click', () => placeBet(false));

    // Добавляем обработчик клика на заголовок
    const title = card.querySelector('.market-title');
    title.addEventListener('click', () => {
        showMarketDetails(market);
    });

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

// Функция для получения всех событий
function getMarkets() {
    try {
        const markets = localStorage.getItem('markets');
        return markets ? JSON.parse(markets) : [];
    } catch (error) {
        console.error('Ошибка при получении рынков:', error);
        return [];
    }
}

// Обновляем список событий в основном приложении
function updateMarketsDisplay() {
    const marketsList = document.getElementById('marketsList');
    if (!marketsList) return;

    const currentMarkets = getMarkets();
    console.log('Обновление списка рынков:', currentMarkets);

    marketsList.innerHTML = '';
    if (currentMarkets.length === 0) {
        marketsList.innerHTML = '<div class="no-markets">Нет активных событий</div>';
        return;
    }

    currentMarkets.forEach(market => {
        marketsList.appendChild(createMarketCard(market));
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
        console.log('Пользователь не авторизован');
        showAuthPrompt();
    }
});

// Функция обновления интерфейса для авторизованного пользователя
function updateUserInterface(user) {
    const header = document.querySelector('header');
    const userData = telegramSession.getUserData();
    const stats = userData?.stats || {};

    // Обновляем информацию о пользователе в шапке
    const userInfo = document.createElement('div');
    userInfo.className = 'user-info';
    userInfo.innerHTML = `
        <div class="user-profile">
            <span class="username">${user.firstName} ${user.lastName || ''}</span>
            ${user.username ? `<span class="user-tag">@${user.username}</span>` : ''}
        </div>
        <div class="user-stats">
            <span class="stat">Баланс: ${stats.totalAmount || 0} TON</span>
            <span class="stat">Ставок: ${stats.totalBets || 0}</span>
        </div>
    `;

    // Находим существующий user-info или добавляем новый
    const existingUserInfo = header.querySelector('.user-info');
    if (existingUserInfo) {
        existingUserInfo.replaceWith(userInfo);
    } else {
        header.appendChild(userInfo);
    }

    // Обновляем кнопку кошелька
    const walletButton = document.getElementById('connectWallet');
    if (walletButton) {
        walletButton.textContent = 'Подключено';
        walletButton.disabled = true;
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

// Слушаем обновления от админ-панели
window.addEventListener('marketsUpdated', () => {
    console.log('Получено обновление от админ-панели');
    updateMarketsDisplay();
});

window.addEventListener('showMarketDetails', (event) => {
    const market = event.detail.market;
    showMarketDetails(market);
});

// Добавляем слушатель сообщений от админ-панели
window.addEventListener('message', (event) => {
    if (event.data.type === 'MARKET_UPDATED') {
        console.log('Получено обновление рынков:', event.data.markets);
        // Обновляем локальное хранилище
        localStorage.setItem('markets', JSON.stringify(event.data.markets));
        // Обновляем отображение
        updateMarketsDisplay();
    }
});

// Добавляем автоматическое обновление каждые 30 секунд
setInterval(updateMarketsDisplay, 30000);
