import { GITHUB_CONFIG } from './config.js';

const GITHUB_TOKEN = GITHUB_CONFIG.TOKEN;
const REPO_URL = GITHUB_CONFIG.REPO_URL;

// Дублирование в GitHub
export async function syncWithGitHub(markets) {
    try {
        console.log('=== Начало синхронизации с GitHub ===');
        console.log('Токен:', GITHUB_TOKEN ? 'Присутствует' : 'Отсутствует');
        console.log('URL репозитория:', REPO_URL);
        console.log('Данные для сохранения:', markets);

        // Получаем текущий SHA файла
        console.log('Получаем SHA файла...');
        const currentFile = await fetch(REPO_URL, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!currentFile.ok) {
            throw new Error(`Ошибка получения файла: ${currentFile.status}`);
        }

        const fileData = await currentFile.json();
        console.log('Получен ответ от GitHub:', fileData);
        const sha = fileData.sha;

        // Готовим новый контент
        const content = JSON.stringify({ markets }, null, 2);
        const encodedContent = btoa(unescape(encodeURIComponent(content)));
        console.log('Подготовлен контент:', content);

        // Отправляем обновление
        console.log('Отправляем обновление...');
        const response = await fetch(REPO_URL, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Update markets data',
                content: encodedContent,
                sha: sha
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Ошибка сохранения: ${response.status}\n${JSON.stringify(errorData, null, 2)}`);
        }

        const result = await response.json();
        console.log('Успешно сохранено:', result);
        console.log('=== Конец синхронизации ===');
    } catch (error) {
        console.error('Ошибка синхронизации с GitHub:', error);
        console.error('Полная ошибка:', error.stack);
    }
} 