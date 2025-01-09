const GITHUB_TOKEN = process.env.GITHUB_TOKEN || localStorage.getItem('GITHUB_TOKEN');
const REPO_URL = 'https://api.github.com/repos/YuraDeus/prediction/contents/data/markets.json';

// Получение данных
export async function getMarketsData() {
    try {
        const response = await fetch(REPO_URL);
        const data = await response.json();
        const content = atob(data.content);
        return JSON.parse(content).markets;
    } catch (error) {
        console.error('Ошибка получения данных:', error);
        return [];
    }
}

// Сохранение данных
export async function saveMarketsData(markets) {
    try {
        // Получаем текущий SHA файла
        const currentFile = await fetch(REPO_URL);
        const fileData = await currentFile.json();
        const sha = fileData.sha;

        // Готовим новый контент
        const content = JSON.stringify({ markets }, null, 2);
        const encodedContent = btoa(content);

        // Отправляем обновление
        const response = await fetch(REPO_URL, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Update markets data',
                content: encodedContent,
                sha: sha
            })
        });

        return response.ok;
    } catch (error) {
        console.error('Ошибка сохранения данных:', error);
        return false;
    }
} 