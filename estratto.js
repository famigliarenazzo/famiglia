/* =====================================================================
   LETTORE DI ESTRATTI CONTO
   Non è scritto su misura per una banca: riconosce le righe di movimento
   qualunque sia la disposizione delle colonne, perché ogni banca ha il suo
   formato. Se qualcosa non torna, i movimenti si correggono a mano prima
   di salvarli.

   Il PDF viene letto dentro il browser: non lascia mai il dispositivo.
   ===================================================================== */

/* ---------- date ---------- */
var MESI_IT = {
  gen: 1, feb: 2, mar: 3, apr: 4, mag: 5, giu: 6, lug: 7, ago: 8, set: 9, ott: 10, nov: 11, dic: 12,
  gennaio: 1, febbraio: 2, marzo: 3, aprile: 4, maggio: 5, giugno: 6, luglio: 7,
  agosto: 8, settembre: 9, ottobre: 10, novembre: 11, dicembre: 12
};

/* Riconosce 12/03/2026, 12-03-26, 12.03.2026, 12 mar 2026, 2026-03-12 */
function parseDate(s) {
  if (!s) return null;
  s = String(s).trim();
  var m;

  /* gg mm aa con spazi: "01 04 26" (Banca Sella e altre).
     Senza questo, le righe di Sella non venivano riconosciute affatto. */
  m = s.match(/^(\d{1,2})\s+(\d{1,2})\s+(\d{2,4})$/);
  if (m) {
    var gd = +m[1], gm = +m[2], gy = +m[3];
    if (gy < 100) gy += 2000;
    return valid(gy, gm, gd);
  }

  /* gg/mm/aaaa oppure gg-mm-aa */
  m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    var d = +m[1], mo = +m[2], y = +m[3];
    if (y < 100) y += (y > 70 ? 1900 : 2000);
    return valid(y, mo, d);
  }
  /* aaaa-mm-gg */
  m = s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
  if (m) return valid(+m[1], +m[2], +m[3]);

  /* 12 mar 2026 */
  m = s.match(/^(\d{1,2})\s+([a-zA-Zàèéìòù]{3,10})\.?\s+(\d{2,4})$/);
  if (m) {
    var mm = MESI_IT[m[2].toLowerCase()];
    if (!mm) return null;
    var yy = +m[3];
    if (yy < 100) yy += 2000;
    return valid(yy, mm, +m[1]);
  }
  /* gg/mm senza anno: l'anno lo mette chi chiama */
  m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})$/);
  if (m) return { partial: true, day: +m[1], month: +m[2] };

  return null;

  function valid(y, mo, d) {
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    if (y < 1990 || y > 2100) return null;
    return y + "-" + pad(mo) + "-" + pad(d);
  }
}
function pad(n) { return (n < 10 ? "0" : "") + n; }

/* ---------- importi ---------- */
/* Riconosce 1.234,56 · 1,234.56 · -45,20 · 45,20- · (45,20) · 45,20 EUR */
function parseAmount(s) {
  if (s == null) return null;
  var t = String(s).trim();
  if (!t) return null;

  var neg = false;
  /* segno finale, usato da diverse banche: "45,20-" */
  if (/-\s*$/.test(t)) { neg = true; t = t.replace(/-\s*$/, ""); }
  /* fra parentesi = negativo, uso contabile */
  if (/^\(.*\)$/.test(t)) { neg = true; t = t.slice(1, -1); }
  if (/^-/.test(t)) { neg = true; t = t.replace(/^-\s*/, ""); }
  if (/^\+/.test(t)) { t = t.replace(/^\+\s*/, ""); }

  t = t.replace(/\s|€|EUR|eur/g, "");
  if (!t) return null;

  /* Distinguo il separatore decimale: l'ultimo simbolo con 2 cifre dopo. */
  var lastC = t.lastIndexOf(","), lastD = t.lastIndexOf(".");
  if (lastC > lastD) {
    /* stile italiano: 1.234,56 */
    t = t.replace(/\./g, "").replace(",", ".");
  } else if (lastD > lastC) {
    /* stile inglese: 1,234.56 */
    t = t.replace(/,/g, "");
  } else {
    /* nessun decimale */
    t = t.replace(/[.,]/g, "");
  }
  if (!/^\d+(\.\d+)?$/.test(t)) return null;

  var n = parseFloat(t);
  if (isNaN(n)) return null;
  return neg ? -n : n;
}
/* Un testo è un importo plausibile? Serve a scovare le colonne. */
function looksAmount(s) {
  if (!s) return false;
  var t = String(s).trim();
  if (!/\d/.test(t)) return false;
  /* Deve avere i decimali: senza, rischio di scambiare numeri di conto per importi. */
  if (!/[.,]\d{2}\s*-?\)?$/.test(t.replace(/\s|€|EUR/g, ""))) return false;
  return parseAmount(t) != null;
}
function looksDate(s) {
  var d = parseDate(s);
  return d != null;
}

/* ---------- estrazione dal PDF ---------- */
/* PDF.js restituisce frammenti di testo con la loro posizione.
   Ricostruisco le righe raggruppando i frammenti alla stessa altezza. */
function pageToLines(items) {
  var rows = {};
  items.forEach(function (it) {
    var t = (it.str || "").trim();
    if (!t) return;
    var y = Math.round(it.transform[5]);   /* altezza sulla pagina */
    var x = it.transform[4];               /* posizione orizzontale */
    /* tolleranza: frammenti a 2 punti di distanza stanno sulla stessa riga */
    var key = null;
    for (var k in rows) {
      if (Math.abs(k - y) <= 2.2) { key = k; break; }
    }
    if (key == null) { key = y; rows[key] = []; }
    rows[key].push({ x: x, t: t });
  });

  return Object.keys(rows)
    .sort(function (a, b) { return b - a; })   /* dall'alto al basso */
    .map(function (k) {
      var cells = rows[k].sort(function (a, b) { return a.x - b.x; });
      return {
        y: +k,
        cells: cells,
        text: cells.map(function (c) { return c.t; }).join(" ").replace(/\s+/g, " ").trim()
      };
    });
}

/* Da una riga ricostruita ricavo un movimento, se c'è.
   balanceX: posizione orizzontale della colonna del saldo, se individuata
   (vedi findBalanceColumn: il saldo sta sempre nella stessa colonna, mentre
   la grandezza dell'importo non è un indizio affidabile). */
function lineToMove(line, defYear, balanceX) {
  var cells = line.cells;
  if (cells.length < 2) return null;

  /* 1. le date: le prime celle che sembrano una data */
  var dates = [], amounts = [];
  cells.forEach(function (c, i) {
    if (looksDate(c.t)) dates.push({ i: i, v: parseDate(c.t), x: c.x });
    if (looksAmount(c.t)) amounts.push({ i: i, v: parseAmount(c.t), x: c.x, raw: c.t });
  });

  if (!dates.length || !amounts.length) return null;

  /* La data del movimento è la prima (le banche mettono prima la data
     contabile, poi la valuta: la prima è quella che conta). */
  var dt = dates[0].v;
  if (dt && dt.partial) {
    if (!defYear) return null;
    dt = defYear + "-" + pad(dt.month) + "-" + pad(dt.day);
  }
  if (!dt || typeof dt !== "string") return null;

  /* Scarto il saldo progressivo: è il numero che cade nella colonna del saldo. */
  var usable = amounts;
  if (balanceX != null) {
    usable = amounts.filter(function (a) { return Math.abs(a.x - balanceX) > 12; });
    if (!usable.length) return null;   /* riga di solo saldo: non è un movimento */
  }

  /* L'importo è l'ultimo numero rimasto. */
  var amt = usable[usable.length - 1];

  /* La descrizione: le celle tra la data e l'importo. */
  var lo = dates[dates.length - 1].i + 1;
  var hi = amt.i;
  var desc = cells.slice(lo, hi).map(function (c) { return c.t; }).join(" ")
    .replace(/\s+/g, " ").trim();

  /* Se la descrizione è vuota, la riga non è un movimento (spesso è
     un'intestazione o il riepilogo del saldo). */
  if (!desc || desc.length < 2) return null;

  return {
    date: dt,
    description: desc,
    amount: amt.v,
    _x: amt.x,
    _signed: /^[-+(]/.test(amt.raw) || /-\s*$/.test(amt.raw),
    _raw: line.text
  };
}

/* Individua la colonna del saldo.
   Il criterio è posizionale: se sulle righe di movimento compare
   costantemente un numero nella stessa colonna più a destra di tutte,
   quella è la colonna del saldo progressivo. */
function findBalanceColumn(pages, defYear) {
  var rightmost = [], counts = {};
  pages.forEach(function (lines) {
    lines.forEach(function (line) {
      var cells = line.cells;
      var hasDate = cells.some(function (c) { return looksDate(c.t); });
      if (!hasDate) return;
      var amts = cells.filter(function (c) { return looksAmount(c.t); });
      /* Serve almeno due numeri: importo + saldo. */
      if (amts.length < 2) return;
      var last = amts[amts.length - 1];
      rightmost.push(last.x);
      var k = Math.round(last.x / 10) * 10;   /* raggruppo a blocchi di 10 punti */
      counts[k] = (counts[k] || 0) + 1;
    });
  });
  if (rightmost.length < 2) return null;

  /* La colonna più ricorrente tra le "ultime" è quella del saldo. */
  var best = null, n = 0;
  for (var k in counts) if (counts[k] > n) { n = counts[k]; best = +k; }

  /* Deve comparire su quasi tutte le righe con due numeri, altrimenti
     non è una colonna vera e rischio di buttare via importi buoni. */
  if (n < rightmost.length * 0.7) return null;

  /* media reale delle x in quel blocco */
  var near = rightmost.filter(function (x) { return Math.abs(x - best) <= 12; });
  var sum = near.reduce(function (a, b) { return a + b; }, 0);
  return sum / near.length;
}

/* Quando gli importi non hanno segno, capisco Dare/Avere dalla colonna:
   la colonna più a sinistra tra le due è quella delle uscite. */
function inferSigns(moves) {
  var unsigned = moves.filter(function (m) { return !m._signed; });
  if (unsigned.length < 3) return moves;

  var xs = unsigned.map(function (m) { return m._x; });
  var min = Math.min.apply(null, xs), max = Math.max.apply(null, xs);

  /* Due colonne distinte solo se sono ben separate. */
  if (max - min < 25) {
    /* Colonna unica e nessun segno: quasi sempre sono tutte uscite
       (i movimenti in entrata li correggerai a mano, sono pochi). */
    moves.forEach(function (m) {
      if (!m._signed && m.amount > 0) m.amount = -m.amount;
    });
    return moves;
  }

  var mid = (min + max) / 2;
  moves.forEach(function (m) {
    if (m._signed) return;
    /* a sinistra = uscita, a destra = entrata */
    m.amount = (m._x < mid) ? -Math.abs(m.amount) : Math.abs(m.amount);
  });
  return moves;
}

/* Cerca l'anno nell'intestazione, per le banche che sulle righe
   scrivono solo giorno e mese. */
function guessYear(allText) {
  var m = allText.match(/\b(20\d{2})\b/g);
  if (!m) return null;
  /* il più ricorrente */
  var c = {};
  m.forEach(function (y) { c[y] = (c[y] || 0) + 1; });
  var best = null, n = 0;
  for (var y in c) if (c[y] > n) { n = c[y]; best = y; }
  return best;
}


/* =====================================================================
   COLONNE DICHIARATE E QUADRATURA
   Il metodo "l'ultimo numero e' l'importo, quello piu' a destra e' il saldo"
   funziona su molti estratti conto ma non su tutti. Su Banca Sella il saldo
   cade nella stessa colonna delle Entrate: cosi' i bonifici in entrata
   (lo stipendio) verrebbero scambiati per saldi e buttati via.

   La via sicura e' non indovinare: le intestazioni "Uscite" ed "Entrate"
   sono scritte nel PDF. Le leggo, e assegno il segno in base a quale
   colonna e' piu' vicina. Se le intestazioni non ci sono, si torna al
   metodo generico di prima.
   ===================================================================== */

/* Righe che non sono movimenti: saldi, intestazioni, pie' di pagina. */
var RIGA_NON_MOVIMENTO = /SALDO\s+(INIZIALE|FINALE)|SALDO\s+A\s+VS|RIEPILOGO|Pagina\s+\d+\s+di\s+\d+|ESTRATTO CONTO N\.|Data\s+contabile/i;

/* Cerca le intestazioni delle colonne importi. */
function findHeaderColumns(pages) {
  var out = { uscite: null, entrate: null };
  pages.forEach(function (lines) {
    lines.forEach(function (line) {
      line.cells.forEach(function (c) {
        var t = c.t.trim();
        if (/^uscite$/i.test(t) && out.uscite == null) out.uscite = c.x;
        if (/^entrate$/i.test(t) && out.entrate == null) out.entrate = c.x;
        /* altre banche usano parole diverse per la stessa cosa */
        if (/^(dare|addebiti)$/i.test(t) && out.uscite == null) out.uscite = c.x;
        if (/^(avere|accrediti)$/i.test(t) && out.entrate == null) out.entrate = c.x;
      });
    });
  });
  return (out.uscite != null && out.entrate != null) ? out : null;
}

/* Legge i totali che la banca dichiara: servono a verificare il lavoro.
   Se la somma dei movimenti non torna con questi, qualcosa e' sfuggito
   e va detto, invece di lasciar credere che sia tutto a posto. */
function findDeclaredTotals(allText) {
  var out = {};
  var m;
  m = allText.match(/ENTRATE\s+COMPLESSIVE[^\n\d]*([\d.,]+)/i);
  if (m) out.entrate = parseAmount(m[1]);
  m = allText.match(/USCITE\s+COMPLESSIVE[^\n\d-]*(-?[\d.,]+)/i);
  if (m) out.uscite = Math.abs(parseAmount(m[1]) || 0);
  m = allText.match(/SALDO\s+INIZIALE[^\n\d-]*(-?[\d.,]+)/i);
  if (m) out.iniziale = parseAmount(m[1]);
  m = allText.match(/SALDO\s+FINALE[^\n\d-]*(-?[\d.,]+)/i);
  if (m) out.finale = parseAmount(m[1]);
  return out;
}

/* Estrae i movimenti usando le colonne dichiarate. */
function movesByColumns(pages, year, cols) {
  var moves = [];
  pages.forEach(function (lines) {
    lines.forEach(function (line) {
      if (RIGA_NON_MOVIMENTO.test(line.text)) return;
      var cells = line.cells, dates = [], amts = [];
      cells.forEach(function (c, i) {
        var d = parseDate(c.t);
        if (d) { dates.push({ i: i, v: d }); return; }
        if (looksAmount(c.t)) amts.push({ i: i, x: c.x, v: parseAmount(c.t), raw: c.t });
      });
      if (!dates.length || !amts.length) return;

      var dt = dates[0].v;
      if (dt && dt.partial) {
        if (!year) return;
        dt = year + "-" + pad(dt.month) + "-" + pad(dt.day);
      }
      if (!dt || typeof dt !== "string") return;

      /* L'importo del movimento e' l'ultimo numero della riga. */
      var a = amts[amts.length - 1];

      /* Il segno lo decide la colonna, non la fantasia. */
      var dU = Math.abs(a.x - cols.uscite);
      var dE = Math.abs(a.x - cols.entrate);
      var entrata = dE < dU;

      var lo = dates[dates.length - 1].i + 1;
      var desc = cells.slice(lo, a.i).map(function (c) { return c.t; })
        .join(" ").replace(/\s+/g, " ").trim();
      if (!desc || desc.length < 2) return;

      moves.push({
        date: dt,
        description: desc,
        amount: entrata ? Math.abs(a.v) : -Math.abs(a.v),
        _x: a.x,
        _signed: true,          /* il segno e' gia' deciso: non toccarlo dopo */
        _raw: line.text
      });
    });
  });
  return moves;
}

/* ---------- funzione principale ---------- */
/* Restituisce { moves: [...], pages: n, warnings: [...] } */
function parseStatement(pages) {
  var warnings = [];
  var allText = pages.map(function (p) {
    return p.map(function (l) { return l.text; }).join("\n");
  }).join("\n");
  var year = guessYear(allText);
  var totals = findDeclaredTotals(allText);

  var moves = [];
  var metodo = "";

  /* Prima scelta: le colonne dichiarate nell'intestazione del PDF.
     E' il metodo affidabile, perche' non deve indovinare niente. */
  var cols = findHeaderColumns(pages);
  if (cols) {
    moves = movesByColumns(pages, year, cols);
    metodo = "colonne";
  }

  /* Ripiego: il metodo generico di prima, per le banche che non
     scrivono le intestazioni o che usano un'unica colonna con il segno. */
  if (!moves.length) {
    var balanceX = findBalanceColumn(pages, year);
    pages.forEach(function (lines) {
      lines.forEach(function (line) {
        if (RIGA_NON_MOVIMENTO.test(line.text)) return;
        var m = lineToMove(line, year, balanceX);
        if (m) moves.push(m);
      });
    });
    if (moves.length) { inferSigns(moves); metodo = "generico"; }
  }

  if (!moves.length) {
    warnings.push("Non ho riconosciuto nessun movimento. "
      + "Il PDF potrebbe essere una scansione (immagine) invece che testo: "
      + "in quel caso scarica dalla banca il file CSV.");
    return { moves: [], warnings: warnings, year: year, totals: totals };
  }

  /* Doppioni interni allo stesso file. Attenzione: due movimenti identici
     nello stesso giorno possono essere veri (due spese uguali dallo stesso
     negozio), quindi tengo conto anche di quante volte la riga compare. */
  var seen = {}, uniq = [];
  moves.forEach(function (m) {
    var k = m.date + "|" + m.amount + "|" + m.description.slice(0, 40);
    seen[k] = (seen[k] || 0) + 1;
    uniq.push(m);
  });

  uniq.sort(function (a, b) { return a.date < b.date ? -1 : 1; });

  /* ---------- la verifica che conta ----------
     La banca dichiara i totali. Se la mia somma non coincide, ho perso
     o inventato qualcosa: e' meglio saperlo subito che scoprirlo fra un anno.  */
  var ent = 0, usc = 0;
  uniq.forEach(function (m) { if (m.amount > 0) ent += m.amount; else usc += -m.amount; });

  var quadra = null;
  if (totals.entrate != null && totals.uscite != null) {
    var dE = Math.abs(ent - totals.entrate);
    var dU = Math.abs(usc - totals.uscite);
    quadra = (dE < 0.02 && dU < 0.02);
    if (quadra) {
      warnings.push("Verifica riuscita: entrate e uscite coincidono con i totali "
        + "dichiarati dalla banca (" + fmtE(totals.entrate) + " e " + fmtE(totals.uscite) + ").");
    } else {
      warnings.push("Attenzione: i miei totali (entrate " + fmtE(ent) + ", uscite " + fmtE(usc)
        + ") non coincidono con quelli dichiarati dalla banca (" + fmtE(totals.entrate)
        + " e " + fmtE(totals.uscite) + "). Controlla i movimenti prima di salvarli.");
    }
  }

  return {
    moves: uniq, warnings: warnings, year: year,
    totals: totals, quadra: quadra, metodo: metodo,
    sommaEntrate: ent, sommaUscite: usc
  };
}

function fmtE(n) {
  return (n == null ? "?" : n.toFixed(2).replace(".", ",")) + " \u20ac";
}

/* ---------- impronta anti-doppioni ---------- */
/* Se reimporti lo stesso estratto conto, i movimenti non si duplicano. */
function fingerprint(m) {
  var s = m.date + "|" + m.amount.toFixed(2) + "|"
    + (m.description || "").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 60);
  /* somma di controllo semplice, sufficiente allo scopo */
  var h = 0;
  for (var i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return "fp" + (h >>> 0).toString(36) + s.length.toString(36);
}

/* ---------- categorizzazione ---------- */
/* Un modello corrisponde se TUTTE le sue parole compaiono nella descrizione,
   anche non attaccate: il modello "PANIFICIO MARIO" riconosce sia
   "PANIFICIO DA MARIO" sia "PANIFICIO MARIO SRL". */
function ruleMatches(desc, pattern) {
  var D = (desc || "").toUpperCase();
  var P = (pattern || "").toUpperCase().trim();
  if (!P) return false;
  var words = P.split(/\s+/);
  for (var i = 0; i < words.length; i++) {
    if (D.indexOf(words[i]) < 0) return false;
  }
  return true;
}
/* Cerca la regola più specifica (il modello più lungo) che corrisponde:
   così "CONAD SUPERSTORE" batte "CONAD" se entrambe esistono. */
function categorize(desc, rules) {
  var best = null, len = 0;
  rules.forEach(function (r) {
    var p = (r.pattern || "");
    if (!p) return;
    if (ruleMatches(desc, p) && p.length > len) { best = r; len = p.length; }
  });
  return best ? best.category_id : null;
}

/* Quando correggi a mano una categoria, ricavo il modello da imparare:
   la parte significativa della descrizione, senza numeri e date. */
function learnPattern(desc) {
  var D = (desc || "").toUpperCase();
  /* tolgo le parti che cambiano ogni volta */
  D = D.replace(/\b\d{1,2}[\/\-.]\d{1,2}([\/\-.]\d{2,4})?\b/g, " ");  /* date */
  D = D.replace(/\b\d[\d.,]*\b/g, " ");                               /* numeri */
  D = D.replace(/\bCARTA\b|\bPOS\b|\bOPERAZIONE\b|\bPAGAMENTO\b|\bACQUISTO\b|\bADDEBITO\b/g, " ");
  D = D.replace(/[^A-ZÀÈÉÌÒÙ ]/g, " ").replace(/\s+/g, " ").trim();

  /* prendo le prime parole lunghe: di solito sono il nome dell'esercente */
  var w = D.split(" ").filter(function (x) { return x.length >= 4; });
  if (!w.length) return null;
  return w.slice(0, 2).join(" ").trim() || null;
}

if (typeof module !== "undefined") {
  module.exports = { parseDate: parseDate, parseAmount: parseAmount, looksAmount: looksAmount,
    pageToLines: pageToLines, lineToMove: lineToMove, parseStatement: parseStatement,
    fingerprint: fingerprint, categorize: categorize, learnPattern: learnPattern, ruleMatches: ruleMatches,
    inferSigns: inferSigns, findBalanceColumn: findBalanceColumn,
    findHeaderColumns: findHeaderColumns, findDeclaredTotals: findDeclaredTotals,
    movesByColumns: movesByColumns };
}
