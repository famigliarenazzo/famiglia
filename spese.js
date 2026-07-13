/* =====================================================================
   LE SPESE DI CASA
   Legge l'estratto conto, divide le spese per tipologia, tiene il conto
   di ogni mese. Le regole di categoria imparano dalle correzioni.
   ===================================================================== */

var expenses = [], ecats = [], rules = [];
var fMonth = "", fCat = "", selCat = null;

$("top").innerHTML = toolHeader("Le spese di casa", "");

function monthKey(d) { return String(d).slice(0, 7); }         /* 2026-07 */
function monthLabel(k) {
  var p = k.split("-");
  return MESI[+p[1]] + " " + p[0];
}
function ecatOf(id) { return ecats.filter(function (c) { return c.id === id; })[0] || null; }

/* ==================================================================
   VISTA
   ================================================================== */
function months() {
  var set = {};
  expenses.forEach(function (e) { set[monthKey(e.date)] = 1; });
  return Object.keys(set).sort().reverse();
}
function rows() {
  var q = $("q").value.trim().toLowerCase();
  return expenses.filter(function (e) {
    if (fMonth && monthKey(e.date) !== fMonth) return false;
    if (fCat === "__none") { if (e.category_id) return false; }
    else if (fCat && e.category_id !== fCat) return false;
    if (selCat && e.category_id !== selCat) return false;
    if (q && (e.description || "").toLowerCase().indexOf(q) < 0) return false;
    return true;
  }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
}
function draw() {
  /* filtro mesi */
  var ms = months();
  var cur = fMonth;
  $("fMonth").innerHTML = '<option value="">Tutti i mesi</option>'
    + ms.map(function (k) {
      return '<option value="' + k + '"' + (k === cur ? " selected" : "") + ">" + monthLabel(k) + "</option>";
    }).join("");
  $("fCat").innerHTML = '<option value="">Tutte le categorie</option>'
    + '<option value="__none"' + (fCat === "__none" ? " selected" : "") + ">⚠️ Da classificare</option>"
    + ecats.map(function (c) {
      return '<option value="' + c.id + '"' + (c.id === fCat ? " selected" : "") + ">"
        + (c.icon || "💸") + " " + esc(c.name) + "</option>";
    }).join("");

  var list = rows();
  var h = $("body");

  if (!expenses.length) {
    h.innerHTML = '<div class="empty"><div class="emo">📄</div><h3>Nessuna spesa registrata</h3>'
      + "<p>Carica l'estratto conto della banca: leggo i movimenti e li divido per tipologia.</p>"
      + '<button class="btn" onclick="document.getElementById(\'impBtn\').click()">📄 Estratto conto</button></div>';
    return;
  }

  /* riepilogo del periodo mostrato */
  var scope = expenses.filter(function (e) { return !fMonth || monthKey(e.date) === fMonth; });
  var out = 0, inc = 0;
  scope.forEach(function (e) {
    var a = Number(e.amount);
    if (a < 0) out += -a; else inc += a;
  });
  var noCat = scope.filter(function (e) { return !e.category_id; }).length;

  var sum = '<div class="sum">'
    + '<div class="sbox"><div class="k">Uscite</div><div class="v out">' + fmtEur(out) + "</div>"
    + '<div class="s">' + (fMonth ? monthLabel(fMonth) : "tutto il periodo") + "</div></div>"
    + '<div class="sbox"><div class="k">Entrate</div><div class="v in">' + fmtEur(inc) + "</div>"
    + '<div class="s">' + scope.length + " movimenti</div></div>"
    + '<div class="sbox"><div class="k">Differenza</div><div class="v' + (inc - out < 0 ? " out" : " in") + '">'
    + fmtEur(inc - out) + "</div>"
    + '<div class="s">' + (inc - out < 0 ? "in rosso" : "in nero") + "</div></div>"
    + (noCat ? '<div class="sbox" style="cursor:pointer" id="goNoCat"><div class="k">Da classificare</div>'
      + '<div class="v" style="color:var(--rust)">' + noCat + "</div>"
      + '<div class="s">tocca per vederli</div></div>' : "")
    + "</div>";

  /* spese per categoria */
  var byCat = {};
  scope.forEach(function (e) {
    var a = Number(e.amount);
    if (a >= 0) return;                    /* solo le uscite */
    var k = e.category_id || "__none";
    byCat[k] = (byCat[k] || 0) + (-a);
  });
  var cl = Object.keys(byCat).map(function (k) {
    var c = ecatOf(k);
    return { id: k, name: c ? c.name : "Da classificare", icon: c ? c.icon : "⚠️", tot: byCat[k] };
  }).sort(function (a, b) { return b.tot - a.tot; });

  var maxv = cl.length ? cl[0].tot : 1;
  var cats = cl.length ? '<div class="cats"><h3>Dove sono finiti i soldi</h3>'
    + cl.map(function (c) {
      var pc = out ? Math.round(c.tot / out * 100) : 0;
      return '<div class="cbar' + (selCat === c.id ? " sel" : "") + '" data-c="' + c.id + '">'
        + '<div class="cbar-t"><span>' + c.icon + "</span>"
        + '<span class="n">' + esc(c.name) + "</span>"
        + '<span class="a">' + fmtEur(c.tot) + "</span>"
        + '<span class="p">' + pc + "%</span></div>"
        + '<div class="cbar-b"><div class="cbar-f" style="width:' + Math.round(c.tot / maxv * 100) + '%"></div></div>'
        + "</div>";
    }).join("") + "</div>" : "";

  /* movimenti */
  var mv = list.length ? '<div class="mv">' + list.map(function (e) {
    var a = Number(e.amount);
    var d = e.date.split("-");
    var opts = '<option value="">— da classificare —</option>'
      + ecats.map(function (c) {
        return '<option value="' + c.id + '"' + (c.id === e.category_id ? " selected" : "") + ">"
          + (c.icon || "💸") + " " + esc(c.name) + "</option>";
      }).join("");
    return '<div class="mrow" data-e="' + e.id + '">'
      + '<span class="d">' + d[2] + " " + MESI_BREVI[+d[1]] + "</span>"
      + '<span class="ds">' + esc(e.description)
      + (e.source ? "<small>" + esc(e.source) + "</small>" : "") + "</span>"
      + '<select data-cat class="' + (e.category_id ? "" : "none") + '">' + opts + "</select>"
      + '<span class="am' + (a >= 0 ? " pos" : "") + '">' + fmtEur(a) + "</span>"
      + '<button class="x" data-del>✕</button></div>';
  }).join("") + "</div>"
    : '<div class="empty"><div class="emo">🔍</div><h3>Nessun movimento</h3><p>Nessun movimento con questi filtri.</p></div>';

  h.innerHTML = sum + cats + mv;

  if ($("goNoCat")) $("goNoCat").addEventListener("click", function () {
    fCat = "__none"; selCat = null; draw();
  });
  h.querySelectorAll("[data-c]").forEach(function (b) {
    b.addEventListener("click", function () {
      var id = b.getAttribute("data-c");
      selCat = (selCat === id) ? null : id;
      draw();
    });
  });
  h.querySelectorAll(".mrow").forEach(function (r) {
    var id = r.getAttribute("data-e");
    var e = expenses.filter(function (x) { return x.id === id; })[0];
    if (!e) return;
    r.querySelector("[data-cat]").addEventListener("change", function () {
      setCategory(e, this.value || null);
    });
    r.querySelector("[data-del]").addEventListener("click", function () {
      expenses = expenses.filter(function (x) { return x.id !== id; });
      draw();
      sb.from("expenses").delete().eq("id", id);
      toast("Movimento eliminato");
    });
  });

  setStatus("ok", "<b>" + expenses.length + "</b> movimenti · <b>" + rules.length + "</b> regole imparate");
}
["fMonth", "fCat"].forEach(function (id) {
  $(id).addEventListener("change", function () {
    if (id === "fMonth") fMonth = this.value; else fCat = this.value;
    selCat = null;
    draw();
  });
});
$("q").addEventListener("input", draw);

/* ==================================================================
   CATEGORIE CHE IMPARANO
   Quando correggi la categoria di un movimento, imparo il modello dalla
   descrizione e lo applico agli altri movimenti simili non classificati.
   ================================================================== */
function setCategory(e, catId) {
  var old = e.category_id;
  e.category_id = catId;
  sb.from("expenses").update({ category_id: catId }).eq("id", e.id).then(function (r) {
    if (r.error) { e.category_id = old; toast("Errore"); draw(); return; }
    if (!catId) { draw(); return; }
    learn(e.description, catId);
  });
}
function learn(desc, catId) {
  var pat = learnPattern(desc);
  if (!pat || pat.length < 4) { draw(); return; }

  var existing = rules.filter(function (r) {
    return (r.pattern || "").toUpperCase() === pat.toUpperCase();
  })[0];

  var save;
  if (existing) {
    /* la regola c'era ma puntava altrove: la correggo */
    if (existing.category_id === catId) { applyRule(pat, catId); return; }
    existing.category_id = catId;
    save = sb.from("expense_rules").update({ category_id: catId }).eq("id", existing.id);
  } else {
    save = sb.from("expense_rules").insert({ pattern: pat, category_id: catId, auto: true }).select();
  }
  save.then(function (r) {
    if (r.error) { console.error(r.error); draw(); return; }
    if (r.data && r.data[0]) rules.push(r.data[0]);
    applyRule(pat, catId);
  });
}
/* Applica la regola appena imparata agli altri movimenti non classificati. */
function applyRule(pat, catId) {
  var hit = expenses.filter(function (e) {
    return !e.category_id && ruleMatches(e.description, pat);
  });
  if (!hit.length) { draw(); toast("Regola imparata: «" + pat + "»"); return; }

  hit.forEach(function (e) { e.category_id = catId; });
  draw();
  var ids = hit.map(function (e) { return e.id; });
  sb.from("expenses").update({ category_id: catId }).in("id", ids).then(function () {
    var c = ecatOf(catId);
    toast("Imparato «" + pat + "» → " + (c ? c.name : "") + ". Classificati altri " + hit.length + ".");
  });
}

/* ==================================================================
   IMPORTAZIONE
   ================================================================== */
var pending = [];   /* movimenti in attesa di conferma */

$("impBtn").addEventListener("click", function () {
  $("impStep1").hidden = false;
  $("impStep2").hidden = true;
  $("impFoot").hidden = true;
  $("prog").classList.remove("on");
  $("warns").innerHTML = "";
  $("impT").textContent = "Leggi l'estratto conto";
  $("impModal").hidden = false;
});
$("impX").addEventListener("click", function () { $("impModal").hidden = true; });
$("impBack").addEventListener("click", function () { $("impModal").hidden = true; });
$("drop").addEventListener("click", function () { $("file").click(); });
$("file").addEventListener("change", function () {
  var f = this.files && this.files[0];
  this.value = "";
  if (f) readFile(f);
});

function prog(pc, txt) {
  $("prog").classList.add("on");
  $("fill").style.width = pc + "%";
  $("lbl").textContent = txt;
}
function warn(msg) {
  $("warns").innerHTML += '<div class="warn">' + esc(msg) + "</div>";
}

function readFile(f) {
  $("warns").innerHTML = "";
  var name = f.name || "estratto";

  if (/\.(csv|txt)$/i.test(name)) { readCsv(f, name); return; }
  readPdf(f, name);
}

/* ---------- CSV ---------- */
function readCsv(f, name) {
  prog(10, "Leggo il file…");
  var fr = new FileReader();
  fr.onload = function () {
    var lines = String(fr.result).split(/\r?\n/).filter(function (l) { return l.trim(); });
    /* separatore: quello più frequente tra ; e , e tab */
    var seps = [";", "\t", ","];
    var sep = seps.map(function (s) {
      return { s: s, n: (lines[0].match(new RegExp("\\" + s, "g")) || []).length };
    }).sort(function (a, b) { return b.n - a.n; })[0].s;

    var pages = [[]];
    lines.forEach(function (l, i) {
      var cells = l.split(sep).map(function (c, j) {
        return { x: j * 100, t: c.replace(/^"|"$/g, "").trim() };
      });
      pages[0].push({ y: -i, cells: cells, text: cells.map(function (c) { return c.t; }).join(" ") });
    });
    prog(70, "Riconosco i movimenti…");
    finish(parseStatement(pages), name);
  };
  fr.onerror = function () { warn("Non riesco a leggere il file."); };
  fr.readAsText(f, "utf-8");
}

/* ---------- PDF ---------- */
function readPdf(f, name) {
  prog(5, "Carico il lettore PDF…");
  loadPdfJs().then(function (pdfjsLib) {
    prog(15, "Apro il documento…");
    var fr = new FileReader();
    fr.onload = function () {
      pdfjsLib.getDocument({ data: new Uint8Array(fr.result) }).promise.then(function (pdf) {
        var pages = [], n = pdf.numPages;
        function page(i) {
          if (i > n) {
            prog(90, "Riconosco i movimenti…");
            finish(parseStatement(pages), name);
            return;
          }
          prog(15 + Math.round(i / n * 70), "Leggo la pagina " + i + " di " + n + "…");
          pdf.getPage(i).then(function (p) {
            return p.getTextContent();
          }).then(function (tc) {
            pages.push(pageToLines(tc.items));
            page(i + 1);
          }).catch(function (e) {
            console.error(e);
            warn("Pagina " + i + " illeggibile, la salto.");
            page(i + 1);
          });
        }
        page(1);
      }).catch(function (e) {
        console.error(e);
        $("prog").classList.remove("on");
        warn("Non riesco ad aprire il PDF: " + (e.message || "file non valido")
          + ". Se è protetto da password, toglila prima.");
      });
    };
    fr.readAsArrayBuffer(f);
  }).catch(function (e) {
    console.error(e);
    $("prog").classList.remove("on");
    warn("Non riesco a caricare il lettore PDF (" + (e.message || "errore") + "). "
      + "Può succedere se la connessione è assente o se una rete aziendale blocca le librerie esterne. "
      + "Puoi riprovare, oppure scaricare dalla banca l'estratto conto in formato CSV, "
      + "che leggo senza bisogno di nulla.");
  });
}
/* PDF.js pesa: lo carico solo quando serve davvero.
   Attenzione alla versione: dalla 4 in poi il pacchetto distribuisce solo
   moduli (.mjs), che non si caricano con un <script> classico. Uso quindi la
   3.11, che ha ancora il file tradizionale, e in particolare la variante
   "legacy", quella pensata per i browser meno recenti (Safari su iPhone).
   Provo più fonti in fila: se una CDN non risponde, passo alla successiva. */
var PDF_SOURCES = [
  {
    lib: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.min.js",
    worker: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js"
  },
  {
    lib: "https://unpkg.com/pdfjs-dist@3.11.174/legacy/build/pdf.min.js",
    worker: "https://unpkg.com/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js"
  },
  {
    lib: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
    worker: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
  }
];

var pdfjsPromise = null;
function loadPdfJs() {
  if (pdfjsPromise) return pdfjsPromise;

  pdfjsPromise = new Promise(function (resolve, reject) {
    var i = 0;

    function attempt() {
      if (i >= PDF_SOURCES.length) {
        pdfjsPromise = null;      /* così un nuovo tentativo è possibile */
        reject(new Error("nessuna fonte raggiungibile"));
        return;
      }
      var src = PDF_SOURCES[i++];
      var s = document.createElement("script");
      var done = false;

      /* Se una CDN è lenta o bloccata non resto appeso: dopo 12 secondi
         passo alla prossima. */
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        s.remove();
        attempt();
      }, 12000);

      s.src = src.lib;
      s.onload = function () {
        if (done) return;
        done = true;
        clearTimeout(timer);
        var lib = window.pdfjsLib;
        if (!lib || !lib.getDocument) { attempt(); return; }
        lib.GlobalWorkerOptions.workerSrc = src.worker;
        resolve(lib);
      };
      s.onerror = function () {
        if (done) return;
        done = true;
        clearTimeout(timer);
        s.remove();
        attempt();          /* questa fonte non va: provo la successiva */
      };
      document.head.appendChild(s);
    }
    attempt();
  });
  return pdfjsPromise;
}

/* ---------- anteprima e conferma ---------- */
function finish(res, name) {
  $("prog").classList.remove("on");
  res.warnings.forEach(warn);

  if (!res.moves.length) {
    warn("Nessun movimento riconosciuto. Se il PDF è una scansione (un'immagine), "
      + "prova a scaricare dalla banca la versione CSV o Excel.");
    return;
  }

  /* impronta anti-doppioni: scarto quelli già presenti */
  var known = {};
  expenses.forEach(function (e) { if (e.fingerprint) known[e.fingerprint] = 1; });

  pending = res.moves.map(function (m) {
    var fp = fingerprint(m);
    return {
      date: m.date,
      description: m.description,
      amount: m.amount,
      category_id: categorize(m.description, rules),
      fingerprint: fp,
      source: name,
      dup: !!known[fp],
      keep: !known[fp]
    };
  });

  var dups = pending.filter(function (p) { return p.dup; }).length;
  drawPreview(dups);

  $("impT").textContent = "Controlla i movimenti";
  $("impStep1").hidden = true;
  $("impStep2").hidden = false;
  $("impFoot").hidden = false;
}
function drawPreview(dups) {
  var keep = pending.filter(function (p) { return p.keep; });
  var out = 0, inc = 0, noCat = 0;
  keep.forEach(function (p) {
    if (p.amount < 0) out += -p.amount; else inc += p.amount;
    if (!p.category_id) noCat++;
  });

  $("pvSum").innerHTML = "<span><b>" + keep.length + "</b> movimenti</span>"
    + "<span>uscite <b>" + fmtEur(out) + "</b></span>"
    + "<span>entrate <b>" + fmtEur(inc) + "</b></span>"
    + (noCat ? '<span style="color:var(--rust)"><b>' + noCat + "</b> da classificare</span>" : "")
    + (dups ? '<span style="color:var(--ink-soft)">' + dups + " già presenti, esclusi</span>" : "");

  $("pv").innerHTML = pending.map(function (p, i) {
    var opts = '<option value="">— scegli —</option>'
      + ecats.map(function (c) {
        return '<option value="' + c.id + '"' + (c.id === p.category_id ? " selected" : "") + ">"
          + (c.icon || "💸") + " " + esc(c.name) + "</option>";
      }).join("");
    var d = p.date.split("-");
    return '<div class="pvrow' + (p.keep ? "" : " skip") + '" data-i="' + i + '">'
      + '<button class="ck" data-k>✓</button>'
      + '<span class="d">' + d[2] + " " + MESI_BREVI[+d[1]] + "</span>"
      + '<span class="ds" title="' + esc(p.description) + '">' + esc(p.description) + "</span>"
      + '<select data-c>' + opts + "</select>"
      + '<span class="am' + (p.amount >= 0 ? " pos" : "") + '">' + fmtEur(p.amount) + "</span>"
      + "</div>";
  }).join("");

  $("pv").querySelectorAll(".pvrow").forEach(function (r) {
    var i = +r.getAttribute("data-i");
    r.querySelector("[data-k]").addEventListener("click", function () {
      pending[i].keep = !pending[i].keep;
      r.classList.toggle("skip", !pending[i].keep);
      drawPreviewSummary();
    });
    r.querySelector("[data-c]").addEventListener("change", function () {
      pending[i].category_id = this.value || null;
      pending[i].corrected = true;      /* segno: da questa imparo */

      /* La correzione vale subito anche per gli altri movimenti simili
         ancora da classificare: se correggo un PANIFICIO, l'altro
         PANIFICIO si sistema da solo senza doverlo rifare a mano. */
      if (pending[i].category_id) {
        var pat = learnPattern(pending[i].description);
        if (pat && pat.length >= 4) {
          var n = 0;
          pending.forEach(function (p, j) {
            if (j === i || p.category_id) return;
            if (ruleMatches(p.description, pat)) {
              p.category_id = pending[i].category_id;
              p.corrected = true;
              n++;
            }
          });
          if (n) {
            drawPreview(pending.filter(function (p) { return p.dup; }).length);
            toast("Sistemati altri " + n + " movimenti simili");
            return;
          }
        }
      }
      drawPreviewSummary();
    });
  });
}
function drawPreviewSummary() {
  var keep = pending.filter(function (p) { return p.keep; });
  var out = 0, inc = 0, noCat = 0;
  keep.forEach(function (p) {
    if (p.amount < 0) out += -p.amount; else inc += p.amount;
    if (!p.category_id) noCat++;
  });
  var dups = pending.filter(function (p) { return p.dup; }).length;
  $("pvSum").innerHTML = "<span><b>" + keep.length + "</b> movimenti</span>"
    + "<span>uscite <b>" + fmtEur(out) + "</b></span>"
    + "<span>entrate <b>" + fmtEur(inc) + "</b></span>"
    + (noCat ? '<span style="color:var(--rust)"><b>' + noCat + "</b> da classificare</span>" : "")
    + (dups ? '<span style="color:var(--ink-soft)">' + dups + " già presenti</span>" : "");
}

$("impOk").addEventListener("click", function () {
  var keep = pending.filter(function (p) { return p.keep; });
  if (!keep.length) { toast("Nessun movimento da salvare"); return; }

  var b = $("impOk");
  b.disabled = true; b.textContent = "Salvo…";

  /* Le categorie corrette a mano nell'anteprima diventano regole. */
  var toLearn = {};
  keep.forEach(function (p) {
    if (!p.corrected || !p.category_id) return;
    var pat = learnPattern(p.description);
    if (pat && pat.length >= 4) toLearn[pat] = p.category_id;
  });

  var rows = keep.map(function (p) {
    return {
      date: p.date, description: p.description, amount: p.amount,
      category_id: p.category_id, fingerprint: p.fingerprint, source: p.source
    };
  });

  /* a gruppi, per non far cadere la connessione */
  var CH = 50, i = 0, saved = 0;
  function step() {
    if (i >= rows.length) {
      var pats = Object.keys(toLearn);
      var jobs = pats.map(function (pat) {
        return sb.from("expense_rules").upsert(
          { pattern: pat.toUpperCase(), category_id: toLearn[pat], auto: true },
          { onConflict: "pattern" });
      });
      Promise.all(jobs).then(function () {
        b.disabled = false; b.textContent = "Salva i movimenti";
        $("impModal").hidden = true;
        return Promise.all([loadExpenses(), loadRules()]);
      }).then(function () {
        draw();
        toast(saved + " movimenti salvati"
          + (pats.length ? " · " + pats.length + " nuove regole imparate" : ""));
      });
      return;
    }
    var slice = rows.slice(i, i + CH);
    /* onConflict sull'impronta: reimportare lo stesso estratto non duplica */
    sb.from("expenses").upsert(slice, { onConflict: "fingerprint" }).then(function (r) {
      if (r.error) { console.error(r.error); toast("Errore: " + r.error.message); }
      else saved += slice.length;
      i += CH;
      step();
    });
  }
  step();
});

/* ==================================================================
   MOVIMENTO A MANO
   ================================================================== */
$("addBtn").addEventListener("click", function () {
  $("mvD").value = new Date().toISOString().slice(0, 10);
  $("mvA").value = "";
  $("mvDs").value = "";
  $("mvC").innerHTML = '<option value="">— nessuna —</option>'
    + ecats.map(function (c) {
      return '<option value="' + c.id + '">' + (c.icon || "💸") + " " + esc(c.name) + "</option>";
    }).join("");
  $("mvModal").hidden = false;
  setTimeout(function () { $("mvDs").focus(); }, 60);
});
$("mvX").addEventListener("click", function () { $("mvModal").hidden = true; });
$("mvCanc").addEventListener("click", function () { $("mvModal").hidden = true; });
$("mvSave").addEventListener("click", function () {
  var d = $("mvD").value, ds = $("mvDs").value.trim();
  var a = parseAmount($("mvA").value);
  if (!d) { toast("Serve la data"); return; }
  if (!ds) { toast("Serve la descrizione"); $("mvDs").focus(); return; }
  if (a == null || a === 0) { toast("Serve un importo"); $("mvA").focus(); return; }

  var row = {
    date: d, description: ds, amount: a,
    category_id: $("mvC").value || null, manual: true
  };
  row.fingerprint = fingerprint(row);

  var b = $("mvSave");
  b.disabled = true; b.textContent = "Salvo…";
  sb.from("expenses").insert(row).select().then(function (r) {
    b.disabled = false; b.textContent = "Salva";
    if (r.error) {
      if ((r.error.message || "").indexOf("duplicate") >= 0)
        toast("Questo movimento è già presente");
      else toast("Errore: " + r.error.message);
      return;
    }
    expenses.push(r.data[0]);
    $("mvModal").hidden = true;
    draw();
    toast("Movimento aggiunto");
  });
});

document.addEventListener("keydown", function (e) {
  if (e.key !== "Escape") return;
  if (!$("mvModal").hidden) $("mvModal").hidden = true;
  else if (!$("impModal").hidden) $("impModal").hidden = true;
});
["impModal", "mvModal"].forEach(function (id) {
  $(id).addEventListener("click", function (e) { if (e.target === $(id)) $(id).hidden = true; });
});

/* ==================================================================
   CARICAMENTO
   ================================================================== */
function loadExpenses() {
  var all = [], from = 0, PAGE = 1000;
  function page() {
    return sb.from("expenses").select("*").order("date", { ascending: false })
      .range(from, from + PAGE - 1).then(function (r) {
        if (r.error) throw r.error;
        all = all.concat(r.data);
        if (r.data.length === PAGE) { from += PAGE; return page(); }
        expenses = all;
      });
  }
  return page();
}
function loadRules() {
  return sb.from("expense_rules").select("*").then(function (r) {
    if (r.error) throw r.error;
    rules = r.data;
  });
}
function loadCats() {
  return sb.from("expense_categories").select("*").order("name").then(function (r) {
    if (r.error) throw r.error;
    ecats = r.data;
  });
}
function boot() {
  setStatus("", "Carico…");
  return Promise.all([loadExpenses(), loadRules(), loadCats()])
    .then(function () {
      /* apro sul mese corrente, se ci sono movimenti */
      var ms = months();
      var now = new Date().toISOString().slice(0, 7);
      if (ms.indexOf(now) >= 0) fMonth = now;
      else if (ms.length) fMonth = ms[0];
      draw();
    })
    .catch(function (e) {
      console.error(e);
      setStatus("warn", "Errore: " + (e.message || "caricamento non riuscito"));
      $("body").innerHTML = '<div class="empty"><div class="emo">⚠️</div><h3>Non riesco a caricare</h3><p>'
        + esc(e.message || "") + "</p></div>";
    });
}
requireAuth().then(boot);
