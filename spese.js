/* =====================================================================
   LE SPESE DI CASA
   Legge l'estratto conto, divide le spese per tipologia, tiene il conto
   di ogni mese. Le regole di categoria imparano dalle correzioni.
   ===================================================================== */

var expenses = [], ecats = [], rules = [], mrules = [];
var vista = "cat";   /* "cat" = per tipologia, "mer" = per esercente */
var fMonth = "", fCat = "", selCat = null, selMer = null;

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
    if (q) {
      var testo = ((e.description || "") + " " + (e.label || "") + " "
                 + (e.merchant || "") + " " + (e.notes || "")).toLowerCase();
      if (testo.indexOf(q) < 0) return false;
    }
    if (selMer && merchOf(e) !== selMer) return false;
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

  /* --- le stesse spese, ma raggruppate per esercente --- */
  var byMer = {};
  scope.forEach(function (e) {
    var a = Number(e.amount);
    if (a >= 0) return;                 /* le entrate non hanno un esercente */
    var m = merchOf(e);
    if (!m) return;                     /* non riconosciuto: fuori dal conteggio */
    byMer[m] = (byMer[m] || 0) + (-a);
  });
  var ml = Object.keys(byMer).map(function (k) {
    return { name: k, tot: byMer[k] };
  }).sort(function (a, b) { return b.tot - a.tot; }).slice(0, 12);
  var maxm = ml.length ? ml[0].tot : 1;

  var pannello;
  if (vista === "mer") {
    pannello = ml.length
      ? ml.map(function (m) {
          var pc = out ? Math.round(m.tot / out * 100) : 0;
          return '<div class="cbar' + (selMer === m.name ? " sel" : "") + '" data-m="' + esc(m.name) + '">'
            + '<div class="cbar-t"><span>\ud83c\udfea</span>'
            + '<span class="n">' + esc(m.name) + "</span>"
            + '<span class="a">' + fmtEur(m.tot) + "</span>"
            + '<span class="p">' + pc + "%</span></div>"
            + '<div class="cbar-b"><div class="cbar-f" style="width:' + Math.round(m.tot / maxm * 100) + '%"></div></div>'
            + "</div>";
        }).join("")
      : '<p class="hint" style="opacity:.6;font-size:13px">Nessun esercente riconosciuto. '
        + 'Tocca un movimento e dagli un nome: da lì in poi li accorpo da solo.</p>';
  } else {
    pannello = cl.map(function (c) {
      var pc = out ? Math.round(c.tot / out * 100) : 0;
      return '<div class="cbar' + (selCat === c.id ? " sel" : "") + '" data-c="' + c.id + '">'
        + '<div class="cbar-t"><span>' + c.icon + "</span>"
        + '<span class="n">' + esc(c.name) + "</span>"
        + '<span class="a">' + fmtEur(c.tot) + "</span>"
        + '<span class="p">' + pc + "%</span></div>"
        + '<div class="cbar-b"><div class="cbar-f" style="width:' + Math.round(c.tot / maxv * 100) + '%"></div></div>'
        + "</div>";
    }).join("");
  }

  var cats = (cl.length || ml.length) ? '<div class="cats">'
    + '<div class="cats-head">'
    + "<h3>Dove sono finiti i soldi</h3>"
    + '<div class="vsw">'
    + '<button class="vb' + (vista === "cat" ? " on" : "") + '" data-v="cat">Per tipologia</button>'
    + '<button class="vb' + (vista === "mer" ? " on" : "") + '" data-v="mer">Per esercente</button>'
    + "</div></div>"
    + pannello + "</div>" : "";

  /* movimenti */
  var mv = list.length ? '<div class="mv">' + list.map(function (e) {
    var a = Number(e.amount);
    var d = e.date.split("-");
    var opts = '<option value="">— da classificare —</option>'
      + ecats.map(function (c) {
        return '<option value="' + c.id + '"' + (c.id === e.category_id ? " selected" : "") + ">"
          + (c.icon || "💸") + " " + esc(c.name) + "</option>";
      }).join("");
    var mer = merchOf(e);
    var sotto = [];
    if (mer) sotto.push('<span class="mtag">\ud83c\udfea ' + esc(mer) + "</span>");
    if (e.notes) sotto.push('<span class="ntag">\u270e ' + esc(e.notes) + "</span>");
    if (e.source) sotto.push("<small>" + esc(e.source) + "</small>");

    return '<div class="mrow" data-e="' + e.id + '">'
      + '<span class="d">' + d[2] + " " + MESI_BREVI[+d[1]] + "</span>"
      + '<span class="ds"><button class="dsn" data-edit>' + esc(titleOf(e)) + "</button>"
      + (sotto.length ? '<span class="msub">' + sotto.join(" ") + "</span>" : "") + "</span>"
      + '<select data-cat class="' + (e.category_id ? "" : "none") + '">' + opts + "</select>"
      + '<span class="am' + (a >= 0 ? " pos" : "") + '">' + fmtEur(a) + "</span>"
      + '<button class="x" data-del>\u2715</button></div>';
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
  h.querySelectorAll("[data-v]").forEach(function (b) {
    b.addEventListener("click", function () {
      vista = b.getAttribute("data-v");
      selCat = null; selMer = null;
      draw();
    });
  });
  h.querySelectorAll("[data-m]").forEach(function (b) {
    b.addEventListener("click", function () {
      var n = b.getAttribute("data-m");
      selMer = (selMer === n) ? null : n;
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
    r.querySelector("[data-edit]").addEventListener("click", function () { openMove(e); });
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
   GLI ESERCENTI
   Lo stesso negozio compare con nomi diversi ("Carrefour 2117 Rivalta",
   "Carrefour 2117 Nichelino"). Accorpandoli sotto un nome solo si vede
   quanto si spende DA CHI, non solo IN COSA.
   ================================================================== */

/* Deduce il nome dell'esercente dalla descrizione della banca.

   Le descrizioni sono zeppe di rumore: numeri di carta, date, codici,
   citta', sigle di circuito. Sotto c'e' quasi sempre un nome, e quel nome
   e' lo stesso per il Carrefour di Rivalta e per quello di Nichelino.

   Non fa miracoli e non deve farne: se non e' ragionevolmente sicuro
   restituisce null, e il movimento resta com'e' finche' non lo rinomini
   tu. Meglio nessuna proposta che una proposta sbagliata, perche' una
   proposta sbagliata accorpa spese che non c'entrano niente.            */

/* I fornitori che riconosco per nome: qui il nome pulito e' noto. */
var NOTI = [
  "Carrefour","Esselunga","Lidl","Aldi","Penny Market","Coop","Conad","Eurospin",
  "Naturasi","Naturasi","Bennet","Mercato","Pam","Crai","Iper","Ipercoop",
  "Amazon","Apple","Google","Netflix","Disney Plus","Spotify","Satispay",
  "American Express","Paypal","Booking","Airbnb","Trenitalia","Italo",
  "Ikea","Decathlon","Leroy Merlin","Zara","H&M","Kiabi","Iperbimbo",
  "Lillydoo","Lush","Redcare","Trekkinn","Istock","Wordpress",
  "Claude.ai","Anthropic","Octopus Energy","Multiwire","Prima Assicurazioni",
  "Negozio Leggero","Antica Legumeria","Giunti Al Punto","Libreria dei Ragazzi",
  "Poke House","Droppos","Discar","Shopsi","Upgrowin","Omegor","Gelateria"
];

/* Parole che non sono mai il nome di un esercente. */
var RUMORE = new RegExp(
  "\\b(carta|n\\.?|data|operazione|pagamento|pos|prelevamento|prelievo|"
  + "addebito|accredito|bonifico|sdd|mand|mandato|fattura|vs|carico|da|per|"
  + "il|lo|la|di|del|della|dei|srl|s\\.r\\.l|spa|s\\.p\\.a|sa|s\\.a|gmbh|"
  + "ltd|inc|bv|nv|www|com|it|eu|europe|italia|italy|subscription|"
  + "commissioni|canone|mensile|sconto|imposta|bollo|giroconto|cc|"
  + "ord|ben|dt|info|cli|iban|transid|cau|ins|atm|ora|"
  + "torino|rivoli|bruino|milano|roma|rivalta|orbassano|collegno|beinasco|"
  + "nichelino|piossasco|giaveno|lecco|monza|verona|pordenone|dublin|"
  + "luxembourg|frankfurt|celra|hoofddorp|sumirago|asola|to|mi|ie|lu|de|es|nl|fr|ca|mt)\\b",
  "gi");

/* Non sono esercenti: sono movimenti fra conti, tasse, canoni. Accorparli
   sotto un "negozio" non ha senso e sporcherebbe le statistiche.        */
var NON_ESERCENTE = /giroconto|bonifico|^ord:|assegno unico|saldo|canone|sconto canone|commissioni|imposta di bollo|prelevamento|prelievo|timeout prel|pagamento bollettino|protocollo delega|addebito imposta/i;

function guessMerchant(desc) {
  if (!desc) return null;
  var d = String(desc);

  if (NON_ESERCENTE.test(d)) return null;

  /* Le farmacie sono esercenti diversi fra loro: la Comunale di Orbassano
     non e la F20 di Bruino. Tengo il nome per esteso, cosi non si sommano
     spese fatte in posti diversi. */
  var fa = d.match(/\bfarmacia\s+([\w']+(?:\s+[\w']+)?)/i);
  if (fa) {
    var nf = ("Farmacia " + fa[1]).replace(/\s+/g, " ").trim();
    return nf.toLowerCase().replace(/(^|\s)\S/g, function (c) { return c.toUpperCase(); });
  }

  /* 1. Un nome noto dentro la descrizione: e' la via piu' sicura. */
  for (var i = 0; i < NOTI.length; i++) {
    var n = NOTI[i];
    var re = new RegExp("\\b" + n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    if (re.test(d)) return n;
  }

  /* 2. Niente nome noto: provo a ricavarlo dalle prime parole, togliendo
        il rumore. Prendo solo la parte prima di "Carta N." o simili, che
        e' dove le banche mettono il nome del negozio. */
  var testa = d.split(/\bcarta\s+n|\bdata\s+operazione|\baddebito\s+sdd|\bins:/i)[0];
  testa = testa.replace(RUMORE, " ")
               .replace(/[*#°]+/g, " ")
               .replace(/\b\d[\d.,\-\/]*\b/g, " ")   /* numeri e codici */
               .replace(/\b[a-z0-9]{8,}\b/gi, " ")   /* codici lunghi alfanumerici */
               .replace(/\s+/g, " ")
               .trim();

  var parole = testa.split(" ").filter(function (w) { return w.length >= 3; });
  if (!parole.length) return null;

  /* Due parole bastano a identificare un negozio senza incollarci addosso
     mezza descrizione. Se resta una parola sola e' corta o generica: lascio
     perdere, perche' accorpare su una parola sola e' pericoloso. */
  /* Il ripiego e la parte piu fragile: se ho poco materiale rischio di
     inventare un nome e accorpare spese scollegate. Preferisco arrendermi.
     Servono almeno due parole, o una sola ma lunga e distintiva. */
  if (parole.length === 1 && parole[0].length < 6) return null;
  var nome = parole.slice(0, 2).join(" ");
  if (nome.length < 5) return null;

  /* Maiuscole all'inizio, per leggibilita'. */
  return nome.toLowerCase().replace(/(^|\s)\S/g, function (c) { return c.toUpperCase(); });
}

/* Il nome sotto cui accorpare un movimento: prima la regola che hai
   scritto tu, poi quella dedotta, poi il nome che hai dato a mano. */
function merchOf(e) {
  if (e.merchant) return e.merchant;
  for (var i = 0; i < mrules.length; i++) {
    var r = mrules[i];
    if ((e.description || "").toLowerCase().indexOf(r.pattern.toLowerCase()) >= 0) return r.merchant;
  }
  return guessMerchant(e.description);
}

/* Il nome da mostrare: quello che hai scelto tu, se c'e. */
function titleOf(e) { return e.label || e.description || ""; }

/* Rinomina un movimento e, se vuoi, tutti quelli dello stesso esercente. */
function setMerchant(e, nome, propaga) {
  nome = (nome || "").trim();
  e.merchant = nome || null;

  var q = guard(sb.from("expenses").update({ merchant: e.merchant }).eq("id", e.id), "merch");

  if (nome && propaga) {
    /* Imparo la regola: il pezzo di descrizione piu lungo in comune
       diventa il modello. Cosi anche i movimenti futuri si accorpano. */
    var pat = (e.description || "").trim().split(/\s+/).slice(0, 2).join(" ");
    if (pat.length >= 4) {
      q = q.then(function () {
        return sb.from("merchant_rules")
          .upsert({ pattern: pat, merchant: nome, auto: false }, { onConflict: "pattern" });
      }).then(function () {
        /* applico a tutti i movimenti che combaciano */
        var tocc = expenses.filter(function (x) {
          return (x.description || "").toLowerCase().indexOf(pat.toLowerCase()) >= 0
            && x.merchant !== nome;
        });
        tocc.forEach(function (x) { x.merchant = nome; });
        if (!tocc.length) return;
        return sb.from("expenses").update({ merchant: nome })
          .in("id", tocc.map(function (x) { return x.id; }))
          .then(function () { toast("Accorpati " + tocc.length + " movimenti sotto " + nome); });
      }).then(loadMerchRules);
    }
  }
  return q.then(draw);
}

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

/* ---------- la scheda di un movimento ---------- */
var edId = null;

function openMove(e) {
  edId = e.id;
  $("edOrig").innerHTML = "<b>Come l\u2019ha scritto la banca:</b><br>" + esc(e.description);
  $("edLabel").value = e.label || "";
  $("edMerch").value = e.merchant || (guessMerchant(e.description) || "");
  $("edNotes").value = e.notes || "";
  $("edProp").checked = true;

  /* i nomi gia usati, per non doverli riscrivere */
  var nomi = {};
  expenses.forEach(function (x) { var m = merchOf(x); if (m) nomi[m] = 1; });
  $("merchList").innerHTML = Object.keys(nomi).sort().map(function (n) {
    return '<option value="' + esc(n) + '">';
  }).join("");

  $("edModal").hidden = false;
}
function closeMove() { $("edModal").hidden = true; edId = null; }
$("edX").addEventListener("click", closeMove);
$("edCanc").addEventListener("click", closeMove);
$("edModal").addEventListener("click", function (ev) { if (ev.target === $("edModal")) closeMove(); });

$("edSave").addEventListener("click", function () {
  var e = expenses.filter(function (x) { return x.id === edId; })[0];
  if (!e) return;

  var nome = $("edMerch").value.trim();
  var propaga = $("edProp").checked;

  e.label = $("edLabel").value.trim() || null;
  e.notes = $("edNotes").value.trim() || null;

  $("edSave").disabled = true;
  guard(sb.from("expenses").update({ label: e.label, notes: e.notes }).eq("id", e.id), "mv")
    .then(function () { return setMerchant(e, nome, propaga); })
    .then(function () { closeMove(); toast("Salvato"); })
    .catch(function () { })
    .then(function () { $("edSave").disabled = false; });
});

function loadMerchRules() {
  return sb.from("merchant_rules").select("*").then(function (r) {
    if (r.error) { mrules = []; return; }   /* schema5 non ancora eseguito: pazienza */
    mrules = r.data || [];
  });
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
  return Promise.all([loadExpenses(), loadRules(), loadCats(), loadMerchRules()])
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
