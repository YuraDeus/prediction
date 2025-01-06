// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;

// Управление сессией пользователя
class TelegramSession {
    constructor() {
        this.sessionKey = 'telegram_session';
        this.userDataKey = 'user_data';
        this.actionsKey = 'user_actions';
        this.initTelegram();
    }

    // Инициализация Telegram WebApp
    initTelegram() {
        try {
            tg.ready();
            tg.expand();
        } catch (error) {
            console.error('Error initializing Telegram WebApp:', error);
        }
    }

    // Получение данных пользователя
    getTelegramUser() {
        try {
            if (tg.initDataUnsafe?.user) {
                return {
                    id: tg.initDataUnsafe.user.id,
                    username: tg.initDataUnsafe.user.username,
                    firstName: tg.initDataUnsafe.user.first_name,
                    lastName: tg.initDataUnsafe.user.last_name,
                    languageCode: tg.initDataUnsafe.user.language_code,
                    isPremium: tg.initDataUnsafe.user.is_premium || false
                };
            }
            return null;
        } catch (error) {
            console.error('Error getting Telegram user:', error);
            return null;
        }
    }

    // Сохранение сессии
    saveSession(userData) {
        try {
            const session = {
                user: userData,
                timestamp: Date.now(),
                lastActive: Date.now(),
                platform: tg.platform,
                version: tg.version,
                colorScheme: tg.colorScheme
            };
            localStorage.setItem(this.sessionKey, JSON.stringify(session));
            return true;
        } catch (error) {
            console.error('Error saving session:', error);
            return false;
        }
    }

    // Получение сессии
    getSession() {
        try {
            const saved = localStorage.getItem(this.sessionKey);
            return saved ? JSON.parse(saved) : null;
        } catch (error) {
            console.error('Error getting session:', error);
            return null;
        }
    }

    // Обновление времени последней активности
    updateLastActive() {
        try {
            const session = this.getSession();
            if (session) {
                session.lastActive = Date.now();
                localStorage.setItem(this.sessionKey, JSON.stringify(session));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating last active:', error);
            return false;
        }
    }

    // Инициализация сессии
    initSession() {
        try {
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
        } catch (error) {
            console.error('Error initializing session:', error);
            return null;
        }
    }

    // Сохранение пользовательских настроек
    saveUserPreferences(preferences) {
        try {
            const userData = this.getUserData() || {};
            userData.preferences = {
                ...userData.preferences,
                ...preferences,
                updatedAt: Date.now()
            };
            localStorage.setItem(this.userDataKey, JSON.stringify(userData));
            return true;
        } catch (error) {
            console.error('Error saving user preferences:', error);
            return false;
        }
    }

    // Сохранение истории действий пользователя
    saveUserAction(action) {
        try {
            const actions = JSON.parse(localStorage.getItem(this.actionsKey) || '[]');
            const newAction = {
                ...action,
                timestamp: Date.now(),
                sessionId: this.getSession()?.timestamp,
                platform: tg.platform,
                version: tg.version
            };
            
            actions.push(newAction);
            localStorage.setItem(this.actionsKey, JSON.stringify(actions));
            
            // Обновляем статистику
            this.updateUserStats({
                totalActions: (this.getUserStats().totalActions || 0) + 1,
                lastActionAt: Date.now()
            });
            
            return true;
        } catch (error) {
            console.error('Error saving user action:', error);
            return false;
        }
    }

    // Получение всех данных пользователя
    getUserData() {
        try {
            const saved = localStorage.getItem(this.userDataKey);
            return saved ? JSON.parse(saved) : null;
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    }

    // Получение статистики пользователя
    getUserStats() {
        const userData = this.getUserData();
        return userData?.stats || {
            totalBets: 0,
            totalAmount: 0,
            winCount: 0,
            loseCount: 0,
            totalActions: 0,
            lastActionAt: null
        };
    }

    // Обновление статистики пользователя
    updateUserStats(stats) {
        try {
            const userData = this.getUserData() || {};
            userData.stats = {
                ...userData.stats,
                ...stats,
                updatedAt: Date.now()
            };
            localStorage.setItem(this.userDataKey, JSON.stringify(userData));
            return true;
        } catch (error) {
            console.error('Error updating user stats:', error);
            return false;
        }
    }

    // Проверка прав администратора
    isAdmin() {
        try {
            const userData = this.getTelegramUser();
            // Здесь можно добавить логику проверки администратора
            // Например, проверка по ID или username
            const adminIds = [123456789]; // Замените на реальные ID администраторов
            return userData ? adminIds.includes(userData.id) : false;
        } catch (error) {
            console.error('Error checking admin rights:', error);
            return false;
        }
    }

    // Очистка данных сессии
    clearSession() {
        try {
            // Сохраняем действие очистки
            this.saveUserAction({
                type: 'CLEAR_SESSION',
                data: {
                    timestamp: Date.now()
                }
            });

            localStorage.removeItem(this.sessionKey);
            localStorage.removeItem(this.userDataKey);
            return true;
        } catch (error) {
            console.error('Error clearing session:', error);
            return false;
        }
    }

    // Получение истории действий пользователя
    getUserActions() {
        try {
            const actions = localStorage.getItem(this.actionsKey);
            return actions ? JSON.parse(actions) : [];
        } catch (error) {
            console.error('Error getting user actions:', error);
            return [];
        }
    }

    // Проверка активности сессии
    isSessionActive() {
        const session = this.getSession();
        if (!session) return false;

        const inactiveThreshold = 30 * 60 * 1000; // 30 минут
        return Date.now() - session.lastActive < inactiveThreshold;
    }
}

// Создаем и экспортируем единственный экземпляр
export const telegramSession = new TelegramSession(); 
