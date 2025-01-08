// Базовый URL вашего GitHub репозитория
const STORAGE_URL = 'https://api.github.com/repos/YuraDeus/prediction/contents/data/markets.json';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || localStorage.getItem('GITHUB_TOKEN');

// Функция для получения данных
export async function getMarketsData() {
    try {
        const response = await fetch(STORAGE_URL);
        const data = await response.json();
        if (data.content) {
            const decodedContent = atob(data.content);
            return JSON.parse(decodedContent);
        }
        return [];
    } catch (error) {
        console.error('Ошибка получения данных:', error);
        return [];
    }
}

// Функция для сохранения данных
export async function saveMarketsData(markets) {
    try {
        const content = JSON.stringify(markets, null, 2);
        const encodedContent = btoa(content);
        
        const response = await fetch(STORAGE_URL, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Update markets data',
                content: encodedContent,
                sha: await getCurrentSHA()
            })
        });
        
        return response.ok;
    } catch (error) {
        console.error('Ошибка сохранения данных:', error);
        return false;
    }
}

// Получение текущего SHA файла
async function getCurrentSHA() {
    try {
        const response = await fetch(STORAGE_URL);
        const data = await response.json();
        return data.sha;
    } catch (error) {
        console.error('Ошибка получения SHA:', error);
        return null;
    }
} 