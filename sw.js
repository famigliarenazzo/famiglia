/* Service worker del portale di famiglia.
   Mette in cache solo l'involucro dell'app (HTML, CSS, icone).
   I dati passano sempre dalla rete: mai in cache. */
var VERSION = "famiglia-v11";
var SHELL = [
  "./",
  "./index.html",
  "./ricettario.html",
  "./biblioteca.html",
  "./spese.html",
  "./clinica.html",
  "./scanner.html",
  "./famiglia.css",
  "./famiglia.js",
  "./ricettario.js",
  "./estratto.js",
  "./spese.js",
  "./bordi.js",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-mask-512.png",
  "./icon-512.png",
  "./icon-180.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(VERSION)
      .then(function (c) { return Promise.allSettled(SHELL.map(function (u) { return c.add(u); })); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== VERSION) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var url = new URL(e.request.url);

  /* Supabase (dati, login, foto) non va mai in cache:
     serve sempre il dato aggiornato e la sessione valida. */
  if (url.hostname.indexOf("supabase.co") >= 0) return;

  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      return fetch(e.request).then(function (res) {
        if (res && res.ok && (url.origin === location.origin || url.hostname.indexOf("fonts.") >= 0)) {
          var copy = res.clone();
          caches.open(VERSION).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () {
        if (e.request.mode === "navigate") return caches.match("./index.html");
      });
    })
  );
});
