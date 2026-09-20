/**
 * Service Worker - 离线支持
 * 策略：全部 network first（在线拿最新，离线回退缓存）
 */

const CACHE_NAME = 'study-app-v29';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './css/style.css',
    './js/sm2.js',
    './js/app.js',
    './data/cet6-vocabulary.json'
];

// 安装
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

// 接收消息 - 让新的 SW 立即激活
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// 激活 - 清理旧缓存
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// 拦截请求 - 全部 network first（在线永远拿最新，离线回退缓存）
self.addEventListener('fetch', (event) => {
    const request = event.request;

    // 只处理 GET 请求
    if (request.method !== 'GET') return;

    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response && response.status === 200) {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => caches.match(request).then((r) => r || caches.match('./index.html')))
    );
});
