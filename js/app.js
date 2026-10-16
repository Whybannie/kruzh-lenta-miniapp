// Получаем доступ к Telegram Web App
const tg = window.Telegram.WebApp;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Инициализация
    // Разворачиваем мини-апп на весь экран
    tg.expand();
    
    // Сообщаем телеграму, что мы готовы
    tg.ready();
    
    // Устанавливаем цвет шапки (чтобы было стильно)
    tg.setHeaderColor('#000000');
    
    console.log("Круж Лента запущена!");

    const loading = document.getElementById('loading');
    const container = document.getElementById('video-container');
    const uploadBtn = document.getElementById('upload-btn');

    // ВРЕМЕННЫЕ ДАННЫЕ ДЛЯ ТЕСТА
    // В будущем здесь будет запрос к твоему боту
    const mockVideos = [
        {
            src: 'https://www.w3schools.com/html/mov_bbb.mp4',
            author: '@ivan_petrov',
            desc: 'Когда понял, что завтра понедельник...'
        },
        {
            src: 'https://www.w3schools.com/html/movie.mp4',
            author: '@kruk_master',
            desc: 'Тот самый момент, когда скинул кружочек в этот бот 😂'
        }
    ];

    // Функция отрисовки ленты
    function renderFeed(videos) {
        loading.style.display = 'none';
        
        videos.forEach(item => {
            const card = document.createElement('div');
            card.className = 'video-card';

            // Видео
            const video = document.createElement('video');
            video.src = item.src;
            video.loop = true;
            video.muted = true; // Обязательно для автоплея в браузерах
            video.playsInline = true;
            
            // Автоплей когда видео на экране
            video.addEventListener('play', () => {
                // Можно добавить счетчик просмотров здесь
            });

            // Оверлей с информацией
            const overlay = document.createElement('div');
            overlay.className = 'overlay';
            overlay.innerHTML = `
                <span class="author">${item.author}</span>
                <span class="description">${item.desc}</span>
            `;

            // Кнопки действий
            const actions = document.createElement('div');
            actions.className = 'action-buttons';
            
            const likeBtn = document.createElement('div');
            likeBtn.className = 'like-btn';
            likeBtn.innerHTML = '❤️';
            likeBtn.onclick = (e) => {
                e.stopPropagation();
                handleLike();
            };

            actions.appendChild(likeBtn);

            // Собираем карточку
            card.appendChild(video);
            card.appendChild(overlay);
            card.appendChild(actions);
            container.appendChild(card);

            // Обработка тапа по видео (пауза/плей)
            card.addEventListener('click', () => {
                if (video.paused) {
                    video.play();
                } else {
                    video.pause();
                }
            });
        });
    }

    // Обработка лайка
    function handleLike() {
        // В будущем здесь будет отправка данных боту
        // Например: tg.sendData('like_video_123');
        console.log("Лайк отправлен!");
        
        // Вибрация (если поддерживается)
        if (tg.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('light');
        }
    }

    // Обработка кнопки "Отправить кружочек"
    uploadBtn.addEventListener('click', () => {
        // Здесь можно открыть диалог с ботом или показать инструкцию
        // В телеграме это часто делается через tg.openTelegramLink
        alert('Чтобы попасть в ленту, отправь свой кружочек боту @Kruzh_Lenta_bot!');
    });

    // Имитация загрузки данных (потом заменим на API)
    setTimeout(() => {
        renderFeed(mockVideos);
    }, 800);
});
