// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;

// Управление сессией пользователя
class TelegramSession {
    constructor() {
        this.sessionKey = 'telegram_session';
        this.userDataKey = 'user_data';
    }

    // Получение данных пользователя
    getTelegramUser() {
        if (tg.initDataUnsafe.user) {
            return {
                id: tg.initDataUnsafe.user.id,
                username: tg.initDataUnsafe.user.username,
                firstName: tg.initDataUnsafe.user.first_name,
                lastName: tg.initDataUnsafe.user.last_name,
                languageCode: tg.initDataUnsafe.user.language_code
            };
        }
        return null;
    }

    // Сохранение сессии
    saveSession(userData) {
        const session = {
            user: userData,
            timestamp: Date.now(),
            lastActive: Date.now()
        };
        localStorage.setItem(this.sessionKey, JSON.stringify(session));
    }

    // Получение сессии
    getSession() {
        const saved = localStorage.getItem(this.sessionKey);
        if (saved) {
            return JSON.parse(saved);
        }
        return null;
    }

    // Обновление времени последней активности
    updateLastActive() {
        const session = this.getSession();
        if (session) {
            session.lastActive = Date.now();
            localStorage.setItem(this.sessionKey, JSON.stringify(session));
        }
    }

    // Инициализация сессии
    initSession() {
        const userData = this.getTelegramUser();
        if (userData) {
            this.saveSession(userData);
            return userData;
        }

        // Проверяем существующую сессию
        const session = this.getSession();
        if (session) {
            this.updateLastActive();
            return session.user;
        }

        return null;
    }

    // Сохранение пользовательских настроек
    saveUserPreferences(preferences) {
        const userData = this.getUserData() || {};
        userData.preferences = {
            ...userData.preferences,
            ...preferences
        };
        localStorage.setItem(this.userDataKey, JSON.stringify(userData));
    }

    // Сохранение истории действий пользователя
    saveUserAction(action) {
        const userData = this.getUserData() || {};
        if (!userData.history) userData.history = [];
        
        userData.history.push({
            type: action.type,
            data: action.data,
            timestamp: Date.now()
        });

        localStorage.setItem(this.userDataKey, JSON.stringify(userData));
    }

    // Получение всех данных пользователя
    getUserData() {
        const saved = localStorage.getItem(this.userDataKey);
        return saved ? JSON.parse(saved) : null;
    }

    // Обновление статистики пользователя
    updateUserStats(stats) {
        const userData = this.getUserData() || {};
        userData.stats = {
            ...userData.stats,
            ...stats
        };
        localStorage.setItem(this.userDataKey, JSON.stringify(userData));
    }
}

export const telegramSession = new TelegramSession(); 