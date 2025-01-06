function login(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Добавим логирование для отладки
    console.log('Попытка входа:', { username, password });

    if (username === 'admin' && password === 'admin123') {
        console.log('Успешный вход');
        localStorage.setItem('adminAuthenticated', 'true');
        window.location.href = 'index.html';
    } else {
        console.log('Неверные учетные данные');
        alert('Неверные учетные данные. Используйте:\nЛогин: admin\nПароль: admin123');
    }
}

// Проверяем при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Если уже авторизован, перенаправляем в админку
    if (localStorage.getItem('adminAuthenticated') === 'true') {
        window.location.href = 'index.html';
    }
}); 