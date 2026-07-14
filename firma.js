/* =====================================================================
   LA FIRMA

   Il problema di quasi tutti i riquadri "firma qui" e che disegnano una
   linea di spessore costante fra un punto e l'altro del dito. Viene fuori
   un tratto da pennarello, con gli angoli spezzati, e si vede subito che
   non e una firma vera.

   Una penna vera lascia un segno di spessore VARIABILE: sottile dove la
   mano corre, spesso dove rallenta e nelle curve. E le curve sono curve,
   non spezzate.

   Qui faccio due cose:
   1. lo spessore lo ricavo dalla VELOCITA del dito (piu veloce = piu
      sottile), con un'inerzia che evita i salti bruschi;
   2. i punti li unisco con curve, non con segmenti dritti.

   Non usa librerie: solo canvas.
   ===================================================================== */

(function (global) {
  "use strict";

  function Firma(canvas, opts) {
    opts = opts || {};
    this.c = canvas;
    this.x = canvas.getContext("2d");

    this.min = opts.min || 1.1;      /* tratto piu sottile */
    this.max = opts.max || 3.4;      /* tratto piu spesso */
    /* La soglia di velocita: sopra questa il tratto e al minimo.
       Misurando un tratto di firma vero, le velocita stanno fra 6 e 27.
       Una prima versione aveva la soglia a 1.6: qualunque movimento la
       superava, e lo spessore restava sempre al minimo. Veniva fuori
       esattamente il pennarello che non volevamo. */
    this.vel = opts.vel || 26;
    this.inerzia = 0.55;             /* quanto lo spessore resiste ai salti */
    this.colore = opts.colore || "#16213B";   /* blu-nero da penna, non nero puro */

    this.punti = [];                 /* il tratto in corso */
    this.tratti = [];                /* tutti i tratti disegnati */
    this.giu = false;
    this.ultimo = null;
    this.spess = (this.min + this.max) / 2;
    this.vuoto = true;

    this._init();
  }

  Firma.prototype._pos = function (e) {
    var r = this.c.getBoundingClientRect();
    var t = (e.touches && e.touches[0]) ? e.touches[0] : e;
    return {
      x: (t.clientX - r.left) * (this.c.width / r.width),
      y: (t.clientY - r.top) * (this.c.height / r.height),
      t: Date.now()
    };
  };

  Firma.prototype._init = function () {
    var self = this;

    function giu(e) {
      e.preventDefault();
      self.giu = true;
      var p = self._pos(e);
      self.punti = [p];
      self.ultimo = p;
      self.spess = (self.min + self.max) / 2;
    }
    function muovi(e) {
      if (!self.giu) return;
      e.preventDefault();
      var p = self._pos(e);
      var u = self.ultimo;

      var dx = p.x - u.x, dy = p.y - u.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var dt = Math.max(1, p.t - u.t);

      /* Troppo vicino: aspetto, se no il tratto trema. */
      if (dist < 1.1) return;

      /* La velocita decide lo spessore. Il dito veloce lascia un segno
         sottile, come una penna vera. */
      var v = dist / dt * 10;

      /* La radice quadrata rende la variazione piu morbida: senza, il
         tratto passa da spesso a sottile di scatto, e si vede. */
      var k = Math.min(1, Math.sqrt(v / self.vel));
      var target = self.max - (self.max - self.min) * k;

      /* L'inerzia evita che lo spessore salti da un estremo all'altro:
         una penna non cambia larghezza di colpo. */
      self.spess = self.spess * self.inerzia + target * (1 - self.inerzia);

      p.w = self.spess;
      self.punti.push(p);
      self._disegnaUltimo();
      self.ultimo = p;
      self.vuoto = false;
    }
    function su(e) {
      if (!self.giu) return;
      self.giu = false;
      if (self.punti.length > 1) self.tratti.push(self.punti);
      else if (self.punti.length === 1) {
        /* un tocco secco: un punto, come il puntino di una i */
        var p = self.punti[0];
        self.x.fillStyle = self.colore;
        self.x.beginPath();
        self.x.arc(p.x, p.y, self.max / 2, 0, Math.PI * 2);
        self.x.fill();
        self.tratti.push(self.punti);
        self.vuoto = false;
      }
      self.punti = [];
    }

    ["mousedown", "touchstart"].forEach(function (ev) { self.c.addEventListener(ev, giu, { passive: false }); });
    ["mousemove", "touchmove"].forEach(function (ev) { self.c.addEventListener(ev, muovi, { passive: false }); });
    ["mouseup", "mouseleave", "touchend", "touchcancel"].forEach(function (ev) {
      self.c.addEventListener(ev, su, { passive: false });
    });
  };

  /* Disegno l'ultimo pezzo di tratto: una curva, non un segmento dritto. */
  Firma.prototype._disegnaUltimo = function () {
    var p = this.punti, n = p.length;
    if (n < 3) return;

    var a = p[n - 3], b = p[n - 2], c = p[n - 1];

    /* Punto di mezzo fra a e b, e fra b e c: passando di li con una curva
       quadratica il tratto viene liscio, senza spigoli. */
    var m1 = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    var m2 = { x: (b.x + c.x) / 2, y: (b.y + c.y) / 2 };

    var x = this.x;
    x.strokeStyle = this.colore;
    x.lineCap = "round";
    x.lineJoin = "round";
    x.lineWidth = b.w || this.max;
    x.beginPath();
    x.moveTo(m1.x, m1.y);
    x.quadraticCurveTo(b.x, b.y, m2.x, m2.y);
    x.stroke();
  };

  Firma.prototype.pulisci = function () {
    this.x.clearRect(0, 0, this.c.width, this.c.height);
    this.tratti = [];
    this.punti = [];
    this.vuoto = true;
  };

  Firma.prototype.annullaUltimo = function () {
    this.tratti.pop();
    this.x.clearRect(0, 0, this.c.width, this.c.height);
    var self = this;
    var salva = this.tratti.slice();
    this.tratti = [];
    salva.forEach(function (t) {
      self.punti = [];
      t.forEach(function (p) {
        self.punti.push(p);
        self._disegnaUltimo();
      });
      self.tratti.push(t);
    });
    this.punti = [];
    this.vuoto = this.tratti.length === 0;
  };

  /* La firma ritagliata: via il bianco intorno, sfondo trasparente.
     Senza il ritaglio, appoggiando la firma sul PDF ci si porta dietro un
     rettangolone vuoto che copre il testo sotto. */
  Firma.prototype.ritaglia = function (margine) {
    if (this.vuoto) return null;
    margine = margine == null ? 8 : margine;

    var w = this.c.width, h = this.c.height;
    var d = this.x.getImageData(0, 0, w, h).data;
    var x0 = w, y0 = h, x1 = -1, y1 = -1;

    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        if (d[(y * w + x) * 4 + 3] > 8) {          /* pixel non trasparente */
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    if (x1 < 0) return null;

    x0 = Math.max(0, x0 - margine); y0 = Math.max(0, y0 - margine);
    x1 = Math.min(w - 1, x1 + margine); y1 = Math.min(h - 1, y1 + margine);

    var out = document.createElement("canvas");
    out.width = x1 - x0 + 1;
    out.height = y1 - y0 + 1;
    out.getContext("2d").drawImage(this.c, x0, y0, out.width, out.height,
                                   0, 0, out.width, out.height);
    return out;
  };

  global.Firma = Firma;
  if (typeof module !== "undefined") module.exports = { Firma: Firma };
})(typeof window !== "undefined" ? window : this);
