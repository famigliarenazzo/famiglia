/* =====================================================================
   RILEVAMENTO AUTOMATICO DEI BORDI DEL FOGLIO

   Prima gli angoli partivano fissi sui bordi della foto e andavano
   trascinati a mano ogni volta. Qui il foglio viene cercato da solo,
   come fa iScanner.

   Come funziona, in breve:
   1. rimpicciolisco l'immagine (il lavoro va fatto su pochi pixel, se no
      sul telefono ci mette troppo)
   2. calcolo quanto cambia il colore da un punto all'altro: dove cambia
      molto c'e un contorno (e il metodo di Sobel)
   3. dal centro dell'immagine "guardo" verso l'esterno in tutte le
      direzioni e mi fermo sul primo contorno forte che incontro
   4. da quei punti ricavo i quattro angoli piu esterni
   5. se il risultato non e credibile (troppo piccolo, troppo storto),
      mi arrendo e lascio i bordi della foto: meglio non fare niente che
      tagliare male il documento

   Non usa librerie esterne: solo canvas.
   ===================================================================== */

(function (global) {
  "use strict";

  /* Scala di grigi, a dimensione ridotta. */
  function toGray(canvas, maxSide) {
    var w = canvas.width, h = canvas.height;
    var sc = Math.min(1, maxSide / Math.max(w, h));
    var gw = Math.max(8, Math.round(w * sc));
    var gh = Math.max(8, Math.round(h * sc));

    var c = document.createElement("canvas");
    c.width = gw; c.height = gh;
    c.getContext("2d").drawImage(canvas, 0, 0, gw, gh);
    var d = c.getContext("2d").getImageData(0, 0, gw, gh).data;

    var g = new Float32Array(gw * gh);
    for (var i = 0, j = 0; j < g.length; i += 4, j++) {
      g[j] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    }
    return { g: g, w: gw, h: gh, scale: gw / w };
  }

  /* Una sfocatura leggera: toglie il rumore della fotocamera, che
     altrimenti verrebbe scambiato per un contorno. */
  function blur(src, w, h) {
    var out = new Float32Array(w * h);
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var s = 0, n = 0;
        for (var dy = -1; dy <= 1; dy++) {
          for (var dx = -1; dx <= 1; dx++) {
            var yy = y + dy, xx = x + dx;
            if (yy < 0 || yy >= h || xx < 0 || xx >= w) continue;
            s += src[yy * w + xx]; n++;
          }
        }
        out[y * w + x] = s / n;
      }
    }
    return out;
  }

  /* Sobel: quanto e forte il contorno in ogni punto. */
  function sobel(g, w, h) {
    var m = new Float32Array(w * h);
    for (var y = 1; y < h - 1; y++) {
      for (var x = 1; x < w - 1; x++) {
        var i = y * w + x;
        var tl = g[i - w - 1], t = g[i - w], tr = g[i - w + 1];
        var l = g[i - 1], r = g[i + 1];
        var bl = g[i + w - 1], b = g[i + w], br = g[i + w + 1];
        var gx = (tr + 2 * r + br) - (tl + 2 * l + bl);
        var gy = (bl + 2 * b + br) - (tl + 2 * t + tr);
        m[i] = Math.sqrt(gx * gx + gy * gy);
      }
    }
    return m;
  }

  /* La soglia oltre la quale un punto conta come contorno.
     La ricavo dai dati: prendo il valore sotto cui sta il 92% dei punti.
     Cosi si adatta da sola a una foto chiara o scura. */
  function threshold(m, frac) {
    var hist = new Uint32Array(256), max = 0, i;
    for (i = 0; i < m.length; i++) if (m[i] > max) max = m[i];
    if (max <= 0) return Infinity;
    for (i = 0; i < m.length; i++) {
      hist[Math.min(255, Math.round(m[i] * 255 / max))]++;
    }
    var target = m.length * frac, acc = 0;
    for (var v = 0; v < 256; v++) {
      acc += hist[v];
      if (acc >= target) return v * max / 255;
    }
    return max;
  }

  /* Dal centro verso fuori: il primo contorno forte che incontro. */
  function castRays(m, w, h, thr) {
    var cx = w / 2, cy = h / 2;
    var pts = [];
    var N = 180;                              /* una direzione ogni 2 gradi */
    var maxR = Math.sqrt(cx * cx + cy * cy);

    for (var k = 0; k < N; k++) {
      var a = (k / N) * Math.PI * 2;
      var dx = Math.cos(a), dy = Math.sin(a);
      var found = null;

      /* Parto da lontano e vengo verso il centro: cosi trovo il bordo
         PIU ESTERNO, non le righe di testo dentro al foglio. */
      for (var r = maxR; r > 8; r -= 1) {
        var x = Math.round(cx + dx * r), y = Math.round(cy + dy * r);
        if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1) continue;
        if (m[y * w + x] >= thr) { found = { x: x, y: y }; break; }
      }
      if (found) pts.push(found);
    }
    return pts;
  }

  /* I quattro angoli: fra tutti i punti trovati, quelli che spingono
     piu in la in ciascuna delle quattro diagonali. */
  function cornersFrom(pts, w, h) {
    if (pts.length < 12) return null;
    var tl = null, tr = null, br = null, bl = null;
    var vTL = Infinity, vTR = -Infinity, vBR = -Infinity, vBL = Infinity;

    pts.forEach(function (p) {
      var s = p.x + p.y;      /* piccolo in alto a sinistra, grande in basso a destra */
      var d = p.x - p.y;      /* grande in alto a destra, piccolo in basso a sinistra */
      if (s < vTL) { vTL = s; tl = p; }
      if (s > vBR) { vBR = s; br = p; }
      if (d > vTR) { vTR = d; tr = p; }
      if (d < vBL) { vBL = d; bl = p; }
    });
    if (!tl || !tr || !br || !bl) return null;
    return [tl, tr, br, bl];
  }

  /* Il risultato e credibile? Se il quadrilatero e minuscolo o
     degenere, e meglio non usarlo. */
  function plausible(c, w, h) {
    if (!c) return false;
    /* area con la formula del laccio di scarpa */
    var area = 0;
    for (var i = 0; i < 4; i++) {
      var a = c[i], b = c[(i + 1) % 4];
      area += a.x * b.y - b.x * a.y;
    }
    area = Math.abs(area) / 2;
    if (area < w * h * 0.18) return false;      /* meno del 18% della foto: sospetto */

    /* nessun lato ridicolmente corto */
    for (var j = 0; j < 4; j++) {
      var p = c[j], q = c[(j + 1) % 4];
      var len = Math.hypot(p.x - q.x, p.y - q.y);
      if (len < Math.min(w, h) * 0.15) return false;
    }
    return true;
  }

  /* Allarga di pochissimo, per non tagliare il bordo del foglio. */
  function grow(c, w, h, px) {
    var cx = (c[0].x + c[1].x + c[2].x + c[3].x) / 4;
    var cy = (c[0].y + c[1].y + c[2].y + c[3].y) / 4;
    return c.map(function (p) {
      var dx = p.x - cx, dy = p.y - cy;
      var len = Math.hypot(dx, dy) || 1;
      return {
        x: Math.max(0, Math.min(w, p.x + dx / len * px)),
        y: Math.max(0, Math.min(h, p.y + dy / len * px))
      };
    });
  }

  /* --------------------------------------------------------------
     La funzione da usare: canvas -> quattro angoli in [tl,tr,br,bl],
     nelle coordinate del canvas originale.
     Restituisce null se non trova niente di convincente: in quel caso
     chi chiama tiene i bordi della foto e li sposta a mano.
     -------------------------------------------------------------- */
  function detectCorners(canvas) {
    try {
      var G = toGray(canvas, 320);
      var g = blur(G.g, G.w, G.h);
      var m = sobel(g, G.w, G.h);
      var thr = threshold(m, 0.92);
      if (!isFinite(thr)) return null;

      var pts = castRays(m, G.w, G.h, thr);
      var c = cornersFrom(pts, G.w, G.h);
      if (!plausible(c, G.w, G.h)) return null;

      c = grow(c, G.w, G.h, 2);

      /* torno alle dimensioni vere della foto */
      var k = 1 / G.scale;
      return c.map(function (p) {
        return {
          x: Math.max(0, Math.min(canvas.width, p.x * k)),
          y: Math.max(0, Math.min(canvas.height, p.y * k))
        };
      });
    } catch (e) {
      console.warn("rilevamento bordi non riuscito", e);
      return null;
    }
  }

  global.detectCorners = detectCorners;
  if (typeof module !== "undefined") module.exports = { detectCorners: detectCorners, _t: { toGray: toGray, sobel: sobel, threshold: threshold, castRays: castRays, cornersFrom: cornersFrom, plausible: plausible } };
})(typeof window !== "undefined" ? window : this);
