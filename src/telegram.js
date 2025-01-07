// Весь код из нашей новой версии src/telegram.js

// Класс для работы с Telegram WebApp
export class TelegramSession {
    constructor() {
        this.tg = window.Telegram.WebApp;
        this.user = null;
        this.sessionKey = 'telegram_session';
    }

    // Инициализация сессии
    initSession() {
        try {
            // Проверяем, запущено ли приложение в Telegram
            if (!this.tg) {
                console.error('Приложение должно быть запущено в Telegram');
                return null;
            }

            // Получаем данные пользователя из Telegram WebApp
            const initData = this.tg.initData;
            const user = this.tg.initDataUnsafe.user;

            if (!user) {
                console.error('Не удалось получить данные пользователя');
                return null;
            }

            // Создаем объект с данными пользователя
            this.user = {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name || '',
                username: user.username || '',
                languageCode: user.language_code,
                initData: initData
            };

            // Сохраняем сессию
            this.saveSession();

            // Настраиваем внешний вид WebApp
            this.setupWebApp();

            return this.user;
        } catch (error) {
            console.error('Ошибка при инициализации сессии:', error);
            return null;
        }
    }

    // Настройка внешнего вида WebApp
    setupWebApp() {
        this.tg.ready();
        this.tg.expand();
        
        // Настраиваем тему
        const colorScheme = this.tg.colorScheme;
        document.documentElement.setAttribute('data-theme', colorScheme);
        
        // Настраиваем основной цвет
        const themeParams = this.tg.themeParams;
        if (themeParams) {
            document.documentElement.style.setProperty('--tg-theme-bg-color', themeParams.bg_color);
            document.documentElement.style.setProperty('--tg-theme-text-color', themeParams.text_color);
            document.documentElement.style.setProperty('--tg-theme-hint-color', themeParams.hint_color);
            document.documentElement.style.setProperty('--tg-theme-link-color', themeParams.link_color);
            document.documentElement.style.setProperty('--tg-theme-button-color', themeParams.button_color);
            document.documentElement.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color);
        }
    }

    // Сохранение сессии
    saveSession() {
        if (this.user) {
            localStorage.setItem(this.sessionKey, JSON.stringify({
                user: this.user,
                timestamp: Date.now()
            }));
        }
    }

    // Получение данных сессии
    getSession() {
        try {
            const session = localStorage.getItem(this.sessionKey);
            if (!session) return null;

            const { user, timestamp } = JSON.parse(session);
            
            // Проверяем актуальность сессии (24 часа)
            if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
                this.clearSession();
                return null;
            }

            return user;
        } catch (error) {
            console.error('Ошибка при получении сессии:', error);
            return null;
        }
    }

    // Очистка сессии
    clearSession() {
        localStorage.removeItem(this.sessionKey);
        this.user = null;
    }

    // Получение данных пользователя
    getTelegramUser() {
        return this.user || this.getSession();
    }

    // Сохранение пользовательских данных
    saveUserData(data) {
        const userId = this.getTelegramUser()?.id;
        if (userId) {
            localStorage.setItem(`user_data_${userId}`, JSON.stringify(data));
        }
    }

    // Получение пользовательских данных
    getUserData() {
        const userId = this.getTelegramUser()?.id;
        if (userId) {
            try {
                const data = localStorage.getItem(`user_data_${userId}`);
                return data ? JSON.parse(data) : null;
            } catch (error) {
                console.error('Ошибка при получении данных пользователя:', error);
                return null;
            }
        }
        return null;
    }

    // Сохранение действия пользователя
    saveUserAction(action) {
        const userId = this.getTelegramUser()?.id;
        if (userId) {
            const actions = this.getUserActions();
            actions.push({
                ...action,
                timestamp: Date.now()
            });
            localStorage.setItem(`user_actions_${userId}`, JSON.stringify(actions));
        }
    }

    // Получение действий пользователя
    getUserActions() {
        const userId = this.getTelegramUser()?.id;
        if (userId) {
            try {
                const actions = localStorage.getItem(`user_actions_${userId}`);
                return actions ? JSON.parse(actions) : [];
            } catch (error) {
                console.error('Ошибка при получении действий пользователя:', error);
                return [];
            }
        }
        return [];
    }

    // Обновление статистики пользователя
    updateUserStats(stats) {
        const userData = this.getUserData() || {};
        userData.stats = { ...(userData.stats || {}), ...stats };
        this.saveUserData(userData);
    }
}

// Создаем и экспортируем экземпляр класса
export const telegramSession = new TelegramSession();
