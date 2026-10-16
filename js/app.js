const tg = window.Telegram.WebApp;

// ТВОЯ РАБОЧАЯ ССЫЛКА ИЗ LOGS / API
const API_BASE_RAW = "https://jun-puzzle-bone-rug.trycloudflare.com";
const API_BASE = API_BASE_RAW.replace(/\/+$/, ""); // Убираем лишний слэш в конце

document.addEventListener("DOMContentLoaded", () => {
    // Инициализация Telegram Web App
    if (tg && tg.initDataUnsafe) {
        tg.expand();
        tg.ready();
        tg.setHeaderColor("#000000");
    } else {
        console.warn("Не открыто внутри Telegram, некоторые функции могут не работать.");
    }

    const loading = document.getElementById("loading");
    const container = document.getElementById("video-container");
    const uploadBtn = document.getElementById("upload-btn");

    // Проверка, не забыл ли пользователь заменить ссылку
    if (API_BASE.includes("вставь-ссылку") || !API_BASE.startsWith("http")) {
        loading.innerText = "Ошибка: Не задан API URL в коде.";
        return;
    }

    // Intersection Observer для автоплея (как в TikTok)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const video = entry.target;
            if (entry.isIntersecting) {
                loadAndPlayVideo(video);
            } else {
                video.pause();
            }
        });
    }, {
        root: container,
        threshold: 0.6
    });

    async function loadAndPlayVideo(videoElement) {
        const fileId = videoElement.dataset.fileId;
        if (!fileId) return;

        // Если src уже есть, просто играем
        if (videoElement.src && videoElement.src !== "") {
            videoElement.play().catch(() => {});
            return;
        }

        // Строим ссылку на прокси-видео через наш API
        // Важно: используем /api/video?file_id=...
        const url = `${API_BASE}/api/video?file_id=${encodeURIComponent(fileId)}`;
        
        videoElement.src = url;
        videoElement.load();
        
        videoElement.oncanplay = () => {
            videoElement.play().catch(err => console.log("Autoplay blocked:", err));
        };
    }

    async function loadFeed() {
        try {
            loading.innerText = "Загружаем кружочки...";
            
            const response = await fetch(`${API_BASE}/api/videos`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const videos = await response.json();

            if (!Array.isArray(videos)) {
                loading.innerText = "Сервер вернул неверный формат данных";
                console.error(videos);
                return;
            }

            if (videos.length === 0) {
                loading.innerText = "Лента пока пустая. Отправь первый кружочек боту!";
                return;
            }

            renderFeed(videos);
        } catch (e) {
            console.error("Ошибка загрузки ленты:", e);
            loading.innerText = "Ошибка подключения к серверу. Попробуй позже.";
        }
    }

    function renderFeed(videos) {
        loading.style.display = "none";
        container.innerHTML = ""; // Очищаем контейнер

        videos.forEach((item) => {
            const card = document.createElement("div");
            card.className = "video-card";

            const video = document.createElement("video");
            video.loop = true;
            video.muted = true; // Обязательно для автоплея в браузерах
            video.playsInline = true;
            video.setAttribute("playsinline", "");
            video.preload = "metadata";
            video.dataset.fileId = item.file_id;

            // Обработка ошибок видео
            video.onerror = () => {
                const desc = card.querySelector(".description");
                if (desc) desc.innerText = "❌ Ошибка загрузки видео";
            };

            const overlay = document.createElement("div");
            overlay.className = "overlay";
            overlay.innerHTML = `
                <span class="author">@${item.username || "Аноним"}</span>
                <span class="description">Круж Лента</span>
            `;

            const actions = document.createElement("div");
            actions.className = "action-buttons";

            const likeBtn = document.createElement("div");
            likeBtn.className = "like-btn";
            likeBtn.innerHTML = "❤️";
            likeBtn.onclick = (e) => {
                e.stopPropagation();
                handleLike(item.id);
            };

            actions.appendChild(likeBtn);

            card.appendChild(video);
            card.appendChild(overlay);
            card.appendChild(actions);
            container.appendChild(card);

            // Добавляем наблюдателя для этого конкретного видео
            observer.observe(video);

            // Клик по экрану: пауза/плей
            card.addEventListener("click", () => {
                if (video.paused) {
                    loadAndPlayVideo(video);
                } else {
                    video.pause();
                }
            });
        });
    }

    function handleLike(videoId) {
        console.log("Лайк для видео ID:", videoId);
        // Здесь можно добавить отправку данных боту позже
        if (tg.HapticFeedback) {
            tg.HapticFeedback.impactOccurred("light");
        }
    }

    // Кнопка загрузки своего кружка
    if (uploadBtn) {
        uploadBtn.addEventListener("click", () => {
            if (tg.openTelegramLink) {
                tg.openTelegramLink("https://t.me/Kruzh_Lenta_bot");
            } else {
                alert("Отправь свой кружочек боту @Kruzh_Lenta_bot!");
            }
        });
    }

    // Запуск
    loadFeed();
});
