const tg = window.Telegram.WebApp;
if (tg && tg.initDataUnsafe) { tg.expand(); tg.ready(); }

document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("video-container");
    const loading = document.getElementById("loading-screen");

    try {
        // Загружаем список видео из локального файла
        const res = await fetch('videos.json');
        if (!res.ok) throw new Error("Failed to load videos.json");
        const videos = await res.json();

        renderFeed(videos);
        
        loading.style.opacity = '0';
        setTimeout(() => loading.remove(), 500);

    } catch (e) {
        console.error(e);
        loading.innerHTML = '<p style="color:white;">Лента пуста или ошибка загрузки.</p>';
    }

    function renderFeed(videos) {
        container.innerHTML = "";
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                if (entry.isIntersecting) video.play().catch(() => {});
                else video.pause();
            });
        }, { root: container, threshold: 0.6 });

        videos.forEach(item => {
            const card = document.createElement('div');
            card.className = 'video-card';

            const video = document.createElement('video');
            video.src = item.src;
            video.loop = true;
            video.muted = true;
            video.playsInline = true;
            
            const overlay = document.createElement('div');
            overlay.className = 'overlay-info';
            overlay.innerHTML = `<span class="author-name">@${item.username || 'Аноним'}</span>`;

            card.appendChild(video);
            card.appendChild(overlay);
            container.appendChild(card);
            observer.observe(video);
        });
    }
});
