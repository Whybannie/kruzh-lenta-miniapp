const tg = window.Telegram.WebApp;

// ⚠️ ВСТАВЬ СЮДА ТВОЮ ТЕКУЩУЮ ССЫЛКУ ИЗ КОМАНДЫ /link
const API_BASE_RAW = "https://blogs-conditioning-logged-fares.trycloudflare.com"; 
const API_BASE = API_BASE_RAW.replace(/\/+$/, "");

document.addEventListener("DOMContentLoaded", () => {
    // Инициализация TG
    if (tg && tg.initDataUnsafe) {
        tg.expand();
        tg.ready();
        tg.setHeaderColor("#000000");
        tg.setBackgroundColor("#000000");
    }

    const loadingScreen = document.getElementById("loading-screen");
    const container = document.getElementById("video-container");
    const uploadBtn = document.getElementById("upload-btn");
    const progressBar = document.getElementById("scroll-progress");

    let currentVideos = [];
    let isLikedMap = {}; // Храним состояние лайков локально до синхронизации

    // --- УТИЛИТЫ ---

    function showLoading() {
        loadingScreen.style.opacity = '1';
        loadingScreen.style.pointerEvents = 'auto';
    }

    function hideLoading() {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.pointerEvents = 'none';
        }, 500);
    }

    async function fetchApi(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...(options.headers || {})
                }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (e) {
            console.error("API Fetch Error:", e);
            throw e;
        }
    }

    // --- ЛЕНТА И АВТОПЛЕЙ ---

    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            const card = video.closest('.video-card');
            
            if (entry.isIntersecting) {
                // Видео стало видимым (>60% экрана)
                playVideo(video);
                
                // Обновляем прогресс бар
                updateProgressBar(card);
            } else {
                // Видео ушло с экрана
                pauseVideo(video);
            }
        });
    }, {
        root: container,
        threshold: 0.6 // Срабатывает, когда 60% видео видно
    });

    function updateProgressBar(activeCard) {
        if (!activeCard) return;
        const cards = Array.from(container.children);
        const index = cards.indexOf(activeCard);
        const total = cards.length;
        if (total > 0) {
            const percent = ((index + 1) / total) * 100;
            progressBar.style.width = `${percent}%`;
        }
    }

    async function playVideo(videoEl) {
        if (!videoEl.src) {
            const fileId = videoEl.dataset.fileId;
            if (!fileId) return;
            
            // Показываем спиннер внутри карточки, если нужно (опционально)
            videoEl.src = `${API_BASE}/api/video?file_id=${encodeURIComponent(fileId)}`;
            videoEl.load();
        }
        
        try {
            await videoEl.play();
            videoEl.muted = false; // Разглушаем после первого взаимодействия или если браузер позволит
        } catch (err) {
            // Браузер блокирует автоплей со звуком
            videoEl.muted = true;
            videoEl.play().catch(e => console.log("Play blocked:", e));
        }
    }

    function pauseVideo(videoEl) {
        videoEl.pause();
        // Сбрасываем время, чтобы при возврате началось сначала (как в TT)
        // videoEl.currentTime = 0; 
    }

    // --- РЕНДЕРИНГ ---

    function renderFeed(videos) {
        container.innerHTML = "";
        currentVideos = videos;

        videos.forEach(item => {
            const card = document.createElement('div');
            card.className = 'video-card';
            card.dataset.id = item.id;

            const video = document.createElement('video');
            video.loop = true;
            video.playsInline = true;
            video.setAttribute('playsinline', '');
            video.preload = 'metadata';
            video.dataset.fileId = item.file_id;
            
            // Обработка ошибок видео
            video.onerror = () => {
                const desc = card.querySelector('.video-desc');
                if(desc) desc.innerText = "❌ Ошибка загрузки видео";
            };

            const overlay = document.createElement('div');
            overlay.className = 'overlay-info';
            overlay.innerHTML = `
                <span class="author-name">@${item.username || 'Аноним'}</span>
                <span class="video-desc">${item.description || ''}</span>
            `;

            const actions = document.createElement('div');
            actions.className = 'actions-panel';

            // Лайк
            const likeBtn = createActionButton('❤️', 'like', item.likes, item.id);
            likeBtn.onclick = (e) => {
                e.stopPropagation();
                toggleLike(item.id, likeBtn);
            };

            // Поделиться
            const shareBtn = createActionButton('➦', 'share', '', item.id);
            shareBtn.onclick = (e) => {
                e.stopPropagation();
                shareVideo(item);
            };

            actions.appendChild(likeBtn);
            actions.appendChild(shareBtn);

            card.appendChild(video);
            card.appendChild(overlay);
            card.appendChild(actions);
            
            container.appendChild(card);
            videoObserver.observe(video);

            // Двойной тап для лайка
            card.addEventListener('dblclick', (e) => {
                createFloatingHeart(e.clientX, e.clientY, card);
                if (!isLikedMap[item.id]) {
                    toggleLike(item.id, likeBtn);
                }
            });
            
            // Тап одиночный: пауза/плей
            card.addEventListener('click', () => {
                if (video.paused) playVideo(video);
                else pauseVideo(video);
            });
        });
    }

    function createActionButton(icon, type, count, id) {
        const btn = document.createElement('div');
        btn.className = `action-btn ${type}-btn`;
        btn.innerHTML = `
            <div class="icon-circle">${icon}</div>
            ${count !== '' ? `<span class="count-label">${formatNumber(count)}</span>` : ''}
        `;
        return btn;
    }

    function formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num;
    }

    // --- ИНТЕРАКТИВНОСТЬ ---

    function createFloatingHeart(x, y, parent) {
        const heart = document.createElement('div');
        heart.className = 'floating-heart';
        heart.innerText = '❤️';
        
        // Позиционируем относительно родителя (карточки)
        const rect = parent.getBoundingClientRect();
        heart.style.left = (x - rect.left - 30) + 'px'; // -30 центрирование ширины эмодзи
        heart.style.top = (y - rect.top - 30) + 'px';
        
        parent.appendChild(heart);
        
        // Удаляем элемент после анимации
        setTimeout(() => {
            heart.remove();
        }, 1000);
    }

    async function toggleLike(videoId, btnElement) {
        const iconCircle = btnElement.querySelector('.icon-circle');
        const label = btnElement.querySelector('.count-label');
        
        // Оптимистичный UI (меняем сразу)
        const isCurrentlyLiked = btnElement.classList.contains('active');
        
        if (isCurrentlyLiked) {
            btnElement.classList.remove('active');
            iconCircle.style.background = 'rgba(0,0,0,0.4)';
            iconCircle.style.borderColor = 'rgba(255,255,255,0.1)';
            if(label) label.innerText = formatNumber(parseInt(label.innerText.replace(/[^\d]/g,'')) - 1);
            isLikedMap[videoId] = false;
        } else {
            btnElement.classList.add('active');
            iconCircle.style.background = '#ff2b55';
            iconCircle.style.borderColor = '#ff2b55';
            if(label) label.innerText = formatNumber(parseInt(label.innerText.replace(/[^\d]/g,'') || 0) + 1);
            isLikedMap[videoId] = true;
            
            // Вибрация
            if (tg.HapticFeedback) {
                tg.HapticFeedback.notificationOccurred('success');
            }
        }

        // Отправка на сервер (асинхронно, не ждем ответа для скорости UI)
        // TODO: Реализовать эндпоинт /api/like в боте
        /*
        fetchApi(`/api/like`, {
            method: 'POST',
            body: JSON.stringify({ video_id: videoId, liked: !isCurrentlyLiked })
        }).catch(console.error);
        */
    }

    function shareVideo(item) {
        // Используем Telegram Web App API для шаринга
        if (tg.shareToStory) {
            // Если поддерживается шаринг в сторис
            tg.shareToStory(`https://t.me/Kruzh_Lenta_bot`, {
                caption: `Смотри кружок от @${item.username} в Круж Ленте! 🎥\n\n#КружЛента #TelegramBot`
            });
        } else if (navigator.share) {
            // Стандартный Web Share API
            navigator.share({
                title: 'Круж Лента',
                text: `Смотри этот кружок от @${item.username}!`,
                url: `https://t.me/Kruzh_Lenta_bot`
            }).catch(console.error);
        } else {
            alert("Шаринг недоступен в этом браузере.");
        }
    }

    // --- ЗАПУСК ---

    async function loadFeed() {
        showLoading();
        try {
            const videos = await fetchApi('/api/videos');
            if (videos.length === 0) {
                loadingScreen.innerHTML = '<p style="color:white;">Лента пуста. Отправь кружок боту!</p>';
                return;
            }
            renderFeed(videos);
            hideLoading();
        } catch (e) {
            console.error(e);
            loadingScreen.innerHTML = '<p style="color:red;">Ошибка подключения к серверу.</p>';
        }
    }

    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            if (tg.openTelegramLink) {
                tg.openTelegramLink('https://t.me/Kruzh_Lenta_bot');
            } else {
                window.location.href = 'https://t.me/Kruzh_Lenta_bot';
            }
        });
    }

    loadFeed();
});
