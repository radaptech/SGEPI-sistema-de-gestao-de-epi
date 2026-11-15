// Service worker do PWA. Só guarda a "casca" do app (HTML, JS, CSS, ícones):
// chamadas à API nunca passam pelo cache, porque são autenticadas e por empresa.
const CACHE = "sgepi-v2";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api")) {
    return;
  }

  // Navegação: sempre tenta a rede (pega deploy novo); offline cai no index.html guardado.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          if (resp.ok) {
            const copia = resp.clone();
            caches.open(CACHE).then((c) => c.put("/index.html", copia));
          }
          return resp;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // /assets/ (saída do vite) tem hash no nome, então nunca muda: cache primeiro.
  // ponytail: bundles de deploys antigos ficam no cache até trocar CACHE; troque a versão se crescer demais.
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(request).then(
        (cache) =>
          cache ||
          fetch(request).then((resp) => {
            if (resp.ok) {
              const copia = resp.clone();
              caches.open(CACHE).then((c) => c.put(request, copia));
            }
            return resp;
          })
      )
    );
    return;
  }

  // Resto (ícones, manifest): rede, com o cache de reserva offline.
  event.respondWith(
    fetch(request)
      .then((resp) => {
        if (resp.ok) {
          const copia = resp.clone();
          caches.open(CACHE).then((c) => c.put(request, copia));
        }
        return resp;
      })
      .catch(() => caches.match(request))
  );
});
