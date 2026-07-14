/* Service worker del portale di famiglia.
   Mette in cache solo l'involucro dell'app (HTML, CSS, icone).
   I dati passano sempre dalla rete: mai in cache. */
var VERSION = "famiglia-v21";
var SHELL = [
  "./",
  "./index.html",
  "./ricettario.html",
  "./biblioteca.html",
  "./spese.html",
  "./clinica.html",
  "./scanner.html",
  "./documenti.html",
  "./firma.html",
  "./salva.html",
  "./famiglia.css",
  "./famiglia.js",
  "./ricettario.js",
  "./estratto.js",
  "./spese.js",
  "./bordi.js",
  "./firma.js",
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

  /* --------------------------------------------------------------
     I file dell'app: PRIMA LA RETE, la cache solo come riserva.

     Prima era il contrario: se il file era in cache veniva servito
     quello e la rete non veniva mai interpellata. Risultato: dopo un
     aggiornamento il telefono continuava a mostrare la versione
     vecchia, e mescolando HTML nuovo e CSS vecchio la pagina si
     rompeva in modi difficili da capire (icone giganti, stili spariti).

     Adesso, se c'e rete, si prende sempre la versione buona; se non
     c'e, si usa la copia salvata e l'app funziona lo stesso offline.
     Costa qualche millisecondo, e vale la pena.
     -------------------------------------------------------------- */
  var isApp = url.origin === location.origin
    && /\.(html|css|js|webmanifest)$|\/$/.test(url.pathname);

  if (isApp) {
    e.respondWith(
      fetch(e.request).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(VERSION).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () {
        /* niente rete: uso la copia salvata */
        return caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
          if (hit) return hit;
          if (e.request.mode === "navigate") return caches.match("./index.html");
        });
      })
    );
    return;
  }

  /* Tutto il resto (icone, caratteri, librerie esterne) non cambia mai:
     li la cache va benissimo e li rende istantanei. */
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
