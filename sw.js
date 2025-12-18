// Micro Rent PWA cache — v4
const CACHE = "micro-rent-pwa-v4";
const ASSETS = [
  "./",
  "./index.html",
  "./admin.html",
  "./styles.css",
  "./app.js",
  "./admin.js",
  "./manifest.json",
  "./config.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE ? caches.delete(k) : null)))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request).catch(()=>caches.match("./index.html")))
  );
});
