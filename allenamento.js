/* =====================================================================
   L'ALLENAMENTO
   I programmi di casa, l'esecuzione passo passo col cronometro, lo
   storico, i progressi esercizio per esercizio e la bilancia.

   Le idee dietro a tutto:

   · il programma e' una scheda intestata a una persona, e le persone
     sono gia' quelle della cartella clinica;

   · mentre ti alleni vedi UN esercizio alla volta, grande, e un
     pulsante solo che conta. Il cronometro decide da se' come
     comportarsi leggendo quello che c'e' scritto nella scheda: "10
     min" scende, "4x12" sale e lo fermi tu;

   · prima di ogni esercizio puoi dire con quanti chili lo fai (o a
     che velocita' va il tapis). Nessuno dei due e' obbligatorio: le
     flessioni non hanno chili, e va bene cosi';

   · quando finisci resta una riga nello storico, con i tempi, i
     carichi e le note. Quella riga non cambia piu', nemmeno se un
     giorno riscrivi la scheda;

   · il corpo si misura a parte, quando sali sulla bilancia, e non
     dipende dall'esserti allenato quel giorno.
   ===================================================================== */

var PERSONE = [];
var PROG = [];
var SES = [];
var MISURE = [];
var VISTA = "prog";
var FILTRO = "";          /* id della persona, "" = tutta la famiglia */

/* ---------- utilita' ---------- */

function nomeBreve(n) {
  return String(n || "").trim().split(/\s+/)[0] || "—";
}
function personaDi(id) {
  for (var i = 0; i < PERSONE.length; i++) if (PERSONE[i].id === id) return PERSONE[i];
  return null;
}
function nomePersona(id) {
  var p = personaDi(id);
  return p ? nomeBreve(p.name) : "senza intestazione";
}

/* I numeri si scrivono come vengono: 78,4 oppure 78.4. */
function num(v) {
  var s = String(v == null ? "" : v).trim().replace(",", ".");
  if (!s) return null;
  var n = parseFloat(s);
  return isFinite(n) ? n : null;
}
function leggiPeso(v) {
  var n = num(v);
  return n != null && n > 0 ? Math.round(n * 10) / 10 : null;
}
function fmtN(n, d) {
  if (n == null || n === "") return "—";
  d = d == null ? 1 : d;
  return new Intl.NumberFormat("it-IT", { minimumFractionDigits: d, maximumFractionDigits: d }).format(Number(n));
}
function fmtPeso(n) {
  return n == null || n === "" ? "—" : fmtN(n, 1) + " kg";
}
function oggiISO() {
  var d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function dataDa(iso) {
  var p = String(iso || "").slice(0, 10).split("-");
  return new Date(+p[0], +p[1] - 1, +p[2]);
}
function fmtGiorno(iso) {
  if (!iso) return "—";
  var d = dataDa(iso);
  var oggi = new Date();
  oggi = new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate());
  var g = Math.round((oggi - d) / 86400000);
  if (g === 0) return "oggi";
  if (g === 1) return "ieri";
  return d.getDate() + " " + MESI[d.getMonth() + 1].toLowerCase() +
    (d.getFullYear() !== oggi.getFullYear() ? " " + d.getFullYear() : "");
}
function fmtDataObj(d) {
  return d.getDate() + " " + MESI[d.getMonth() + 1].toLowerCase() + " " + d.getFullYear();
}
function fmtGiornoLungo(iso) {
  if (!iso) return "—";
  return fmtDataObj(dataDa(iso));
}

/* Il tempo si scrive in due modi diversi a seconda di dove sta.
   Sul quadrante serve mm:ss, perche' lo guardi mentre sudi e devi
   capirlo in un colpo d'occhio. In tabella serve "48 min", perche' li'
   ti interessa l'ordine di grandezza e non il secondo. */
function mmss(sec) {
  sec = Math.max(0, Math.round(sec || 0));
  var m = Math.floor(sec / 60), s = sec % 60;
  if (m >= 60) {
    var h = Math.floor(m / 60);
    return h + ":" + String(m % 60).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }
  return m + ":" + String(s).padStart(2, "0");
}
function fmtDurata(sec) {
  if (sec == null || !isFinite(sec) || sec <= 0) return "—";
  sec = Math.round(sec);
  if (sec < 60) return sec + " sec";
  var m = Math.round(sec / 60);
  if (m < 60) return m + " min";
  return Math.floor(m / 60) + "h " + String(m % 60).padStart(2, "0") + "′";
}

/* Gli esercizi arrivano da jsonb: potrebbero essere qualunque cosa.
   Meglio normalizzarli una volta sola all'ingresso che difendersi in
   venti punti diversi. */
function normEs(v) {
  if (!Array.isArray(v)) return [];
  return v.map(function (e) {
    if (typeof e === "string") return { n: e, s: "", r: "", note: "" };
    e = e || {};
    return { n: String(e.n || ""), s: String(e.s || ""), r: String(e.r || ""), note: String(e.note || "") };
  }).filter(function (e) { return e.n; });
}

/* =====================================================================
   LEGGERE LA SCHEDA
   Quello che sta scritto nella colonna "serie / rip." e' una frase
   scritta a mano da un allenatore, non un dato: "3x30"", "10 min",
   "4x max", "3x10 + 10". Qui provo a capirla, perche' da questo
   dipende se il cronometro scende o sale.

   Se non capisco non e' un guaio: parte da zero e lo fermi tu. Il caso
   peggiore e' quello che l'app faceva prima, e prima andava bene.
   ===================================================================== */

function ripulisci(txt) {
  return String(txt || "").toLowerCase().trim()
    .replace(/[”″]/g, '"')      /* virgolette tipografiche → secondi */
    .replace(/[’′]/g, "'")      /* apostrofi tipografici → minuti */
    .replace(/''/g, '"')        /* due apici sono un secondo, non due minuti */
    .replace(/×/g, "x");
}

function analizzaSerie(txt) {
  var s = ripulisci(txt);
  var out = { serie: 1, sec: null, reps: null, tipo: "reps" };
  var m;

  if (s) {
    /* N serie da M secondi:  3x30"  ·  4 x 45 sec */
    m = s.match(/^(\d+)\s*x\s*(\d+(?:[.,]\d+)?)\s*(?:"|sec\b|secondi\b|s\b)/);
    if (m) { out.serie = +m[1]; out.sec = Math.round(num(m[2])); out.tipo = "tempo"; return descrivi(out); }

    /* N serie da M minuti:  3x2'  ·  2 x 5 min */
    m = s.match(/^(\d+)\s*x\s*(\d+(?:[.,]\d+)?)\s*(?:'|min\b|minuti\b)/);
    if (m) { out.serie = +m[1]; out.sec = Math.round(num(m[2]) * 60); out.tipo = "tempo"; return descrivi(out); }

    /* minuti e secondi attaccati:  1'30  ·  1'30"  ·  2:30
       Va prima della regola dei minuti, che altrimenti si prende l'1 e
       butta via il 30: un errore silenzioso da mezzo minuto per serie. */
    m = s.match(/^(\d+)\s*[':]\s*(\d{1,2})\s*"?$/);
    if (m) { out.sec = +m[1] * 60 + +m[2]; out.tipo = "tempo"; return descrivi(out); }

    /* solo minuti:  10 min  ·  5' */
    m = s.match(/^(\d+(?:[.,]\d+)?)\s*(?:'|min\b|minuti\b)/);
    if (m) { out.sec = Math.round(num(m[1]) * 60); out.tipo = "tempo"; return descrivi(out); }

    /* solo secondi:  45"  ·  30 sec */
    m = s.match(/^(\d+(?:[.,]\d+)?)\s*(?:"|sec\b|secondi\b|s\b)/);
    if (m) { out.sec = Math.round(num(m[1])); out.tipo = "tempo"; return descrivi(out); }

    /* N serie di ripetizioni:  4x12  ·  3x10 + 10  ·  4x max */
    m = s.match(/^(\d+)\s*x\s*(.+)$/);
    if (m) { out.serie = +m[1]; out.reps = m[2].trim(); return descrivi(out); }

    /* un blocco solo di ripetizioni:  20 reps  ·  15 */
    m = s.match(/^(\d+)\s*(?:reps?\b|rip\b|ripetizioni\b)?$/);
    if (m) { out.reps = m[1]; return descrivi(out); }

    out.reps = s;
  }
  return descrivi(out);
}

function descrivi(o) {
  if (o.tipo === "tempo") {
    o.testo = (o.serie > 1 ? o.serie + " serie da " : "conto alla rovescia di ") + mmss(o.sec) +
      (o.serie > 1 ? ", a scendere" : "");
  } else {
    o.testo = (o.serie > 1 ? o.serie + " serie · " : "") + "cronometro da zero, lo fermi tu";
  }
  return o;
}

/* Il recupero e' scritto come una nota ("recupero 1'", "45""): qui
   diventa un numero, cosi' fra una serie e l'altra parte da solo. */
function analizzaRecupero(txt) {
  var s = ripulisci(txt), m;
  if (!s) return null;
  m = s.match(/(\d+(?:[.,]\d+)?)\s*(?:'|min\b|minuti\b)/);
  if (m) return Math.round(num(m[1]) * 60);
  m = s.match(/(\d+(?:[.,]\d+)?)\s*(?:"|sec\b|secondi\b|s\b)/);
  if (m) return Math.round(num(m[1]));
  m = s.match(/(\d+)/);
  if (m) return +m[1];
  return null;
}

/* Le macchine hanno una velocita', i manubri hanno dei chili. Il
   riconoscimento e' sul nome, quindi ogni tanto sbagliera': per questo
   sotto ai parametri c'e' sempre il modo di chiedere l'altro campo. */
var CARDIO = /(tapis|tappeto|treadmill|corsa|corri|camminat|cyclette|bici\b|bike|ellittic|vogatore|rower|remoergometro|spinning|stepper|climber|scala\b)/;
function eCardio(nome) {
  return CARDIO.test(String(nome || "").toLowerCase());
}

/* ---------- caricamento ---------- */

function load() {
  setStatus("", "Carico…");
  return Promise.all([
    guard(sb.from("people").select("id,name,pos,height_cm").order("pos"), "persone"),
    guard(sb.from("workout_programs").select("*").eq("archived", false).order("pos").order("created_at"), "programmi"),
    guard(sb.from("workout_sessions").select("*").order("day", { ascending: false }).order("created_at", { ascending: false }), "allenamenti"),
    guard(sb.from("body_measurements").select("*").order("day", { ascending: false }), "pesate")
  ]).then(function (r) {
    PERSONE = r[0] || [];
    PROG = (r[1] || []).map(function (p) { p.exercises = normEs(p.exercises); return p; });
    SES = r[2] || [];
    MISURE = r[3] || [];
    riempiTendine();
    render();
    var n = SES.length;
    setStatus("ok", n ? ("<b>" + n + "</b> " + (n === 1 ? "allenamento" : "allenamenti") + " nello storico") : "Ancora nessun allenamento fatto");
  }).catch(function () {
    setStatus("warn", "Non riesco a leggere i dati. Hai eseguito <b>schema10.sql</b>?");
  });
}

function riempiTendine() {
  var opts = PERSONE.map(function (p) {
    return '<option value="' + p.id + '">' + esc(nomeBreve(p.name)) + "</option>";
  }).join("");
  $("fPers").innerHTML = '<option value="">Tutta la famiglia</option>' + opts;
  $("fPers").value = FILTRO;
  $("edP").innerHTML = '<option value="">Nessuno in particolare</option>' + opts;
  $("miP").innerHTML = '<option value="">Nessuno in particolare</option>' + opts;
}

function progFiltrati() {
  return PROG.filter(function (p) { return !FILTRO || p.person_id === FILTRO; });
}
function sesFiltrate() {
  return SES.filter(function (s) { return !FILTRO || s.person_id === FILTRO; });
}
function misureDi(pid) {
  return MISURE.filter(function (m) { return m.person_id === pid; })
    .slice().sort(function (a, b) { return a.day < b.day ? -1 : (a.day > b.day ? 1 : 0); });
}

/* ---------- viste ---------- */

var NOMI_VISTA = { prog: "vProg", stor: "vStor", prg: "vPrg", peso: "vPeso" };

function render() {
  for (var v in NOMI_VISTA) $(NOMI_VISTA[v]).hidden = (v !== VISTA);
  if (VISTA === "prog") renderProg();
  if (VISTA === "stor") renderStor();
  if (VISTA === "prg") renderPrg();
  if (VISTA === "peso") renderCorpo();
}

function renderProg() {
  var lista = progFiltrati();
  if (!lista.length) {
    $("vProg").innerHTML = '<div class="empty"><div class="emo">🏋️</div>'
      + "<h3>Nessun programma</h3>"
      + "<p>Un programma è una scheda: un nome, la persona a cui è intestata, e gli esercizi in ordine. "
      + "Poi la avvii e ti dice passo passo cosa fare, col cronometro.</p>"
      + '<button class="btn" onclick="apriEditor(null)">Crea il primo</button></div>';
    return;
  }
  var h = '<div class="progs">';
  lista.forEach(function (p) {
    var ult = ultimaSessione(p.id);
    var es = p.exercises;
    h += '<div class="pcard"><div class="nfo">'
      + "<h3>" + esc(p.name) + "</h3>"
      + '<div class="who">' + esc(nomePersona(p.person_id)) + "</div>"
      + '<div class="cnt">' + es.length + (es.length === 1 ? " esercizio" : " esercizi")
      + (p.note ? " · " + esc(p.note) : "") + "</div>"
      + '<div class="exl">'
      + es.slice(0, 4).map(function (e, i) {
          return "<span>" + (i + 1) + ". " + esc(e.n) + (e.s ? " · " + esc(e.s) : "") + "</span>";
        }).join("")
      + (es.length > 4 ? '<span style="opacity:.65">e altri ' + (es.length - 4) + "…</span>" : "")
      + "</div>"
      + '<div class="last">' + (ult
          ? "Ultima volta <b>" + esc(fmtGiorno(ult.day)) + "</b>"
            + (ult.duration_sec ? " · " + esc(fmtDurata(ult.duration_sec)) : "")
          : "Mai fatto") + "</div>"
      + "</div>"
      + '<div class="act">'
      + '<button class="btn" onclick="avvia(\'' + p.id + '\')">Avvia</button>'
      + '<button class="btn-ghost" onclick="apriEditor(\'' + p.id + '\')">Modifica</button>'
      + "</div></div>";
  });
  $("vProg").innerHTML = h + "</div>";
}

function ultimaSessione(progId) {
  for (var i = 0; i < SES.length; i++) if (SES[i].program_id === progId) return SES[i];
  return null;
}

function renderStor() {
  var lista = sesFiltrate();
  if (!lista.length) {
    $("vStor").innerHTML = '<div class="empty"><div class="emo">📋</div>'
      + "<h3>Nessun allenamento fatto</h3>"
      + "<p>Qui finisce una riga ogni volta che completi un programma, con quanto è durato, i carichi e le tue note.</p></div>";
    return;
  }
  var h = '<div class="card"><div style="overflow-x:auto"><table class="tbl"><thead><tr>'
    + "<th>Giorno</th><th>Programma</th><th class=\"hidem\">Chi</th>"
    + '<th class="num">Durata</th><th class="num">Peso</th><th class="num hidem">Δ</th><th class="hidem">Note</th>'
    + "</tr></thead><tbody>";
  lista.forEach(function (s) {
    var d = (s.weight_before != null && s.weight_after != null)
      ? Math.round((Number(s.weight_after) - Number(s.weight_before)) * 10) / 10 : null;
    h += '<tr onclick="apriSessione(\'' + s.id + '\')">'
      + '<td class="d">' + esc(fmtGiorno(s.day)) + "</td>"
      + "<td>" + esc(s.program_name || "—")
      + (s.completed ? "" : ' <span class="badge part">interrotto</span>') + "</td>"
      + '<td class="hidem">' + esc(nomePersona(s.person_id)) + "</td>"
      + '<td class="num">' + esc(fmtDurata(s.duration_sec)) + "</td>"
      + '<td class="num">' + esc(fmtPeso(s.weight_before)) + "</td>"
      + '<td class="num hidem">' + (d == null ? "—"
          : '<span class="dlt ' + (d < 0 ? "giu" : (d > 0 ? "su" : "")) + '">'
            + (d > 0 ? "+" : "") + String(d).replace(".", ",") + "</span>") + "</td>"
      + '<td class="n hidem">' + esc((s.notes || "").slice(0, 90)) + ((s.notes || "").length > 90 ? "…" : "") + "</td>"
      + "</tr>";
  });
  $("vStor").innerHTML = h + "</tbody></table></div></div>";
}

/* =====================================================================
   I GRAFICI
   Disegnati a mano in SVG: nessuna libreria da scaricare, nessun peso
   in piu' sul telefono, e seguono il tema come tutto il resto.

   Una funzione sola per tutti i grafici della pagina. Prima ce n'era
   una per il peso; il secondo grafico sarebbe stato un copia-incolla,
   e il terzo la fine.
   ===================================================================== */

/* serie: [{ pts:[{t:millisecondi, v:numero, tip:testo}], cls, ptCls, area }]
   opt:   { dec, unit, min0 } */
function graficoLinee(serie, opt) {
  opt = opt || {};
  var dec = opt.dec == null ? 1 : opt.dec;
  var W = 720, H = 300, ml = 50, mr = 16, mt = 16, mb = 34;
  var iw = W - ml - mr, ih = H - mt - mb;

  var vals = [], ts = [];
  serie.forEach(function (s) {
    s.pts.forEach(function (p) { vals.push(p.v); ts.push(p.t); });
  });
  if (!vals.length) return "";

  var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
  if (opt.min0) lo = 0;
  if (hi - lo < 1e-9) { var m = hi; lo = m - Math.max(1, Math.abs(m) * 0.05); hi = m + Math.max(1, Math.abs(m) * 0.05); }
  var pad = (hi - lo) * 0.15;
  lo -= pad; hi += pad;
  if (opt.min0 && lo < 0) lo = 0;

  var t0 = Math.min.apply(null, ts), t1 = Math.max.apply(null, ts);
  var span = Math.max(1, t1 - t0);
  var unico = (t1 === t0);

  function X(t) { return unico ? ml + iw / 2 : ml + ((t - t0) / span) * iw; }
  function Y(v) { return mt + ih - ((v - lo) / (hi - lo)) * ih; }

  var s = '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" role="img" aria-label="Grafico">';

  for (var i = 0; i <= 4; i++) {
    var v = lo + (hi - lo) * (i / 4), y = Y(v);
    s += '<line class="grid" x1="' + ml + '" y1="' + y.toFixed(1) + '" x2="' + (W - mr) + '" y2="' + y.toFixed(1) + '"/>';
    s += '<text class="lbl" x="' + (ml - 8) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end">'
      + esc(opt.fmtY ? opt.fmtY(v) : fmtN(v, dec)) + "</text>";
  }

  serie.forEach(function (se) {
    var pts = se.pts.slice().sort(function (a, b) { return a.t - b.t; });
    if (!pts.length) return;
    var d = pts.map(function (p, i) { return (i ? "L" : "M") + X(p.t).toFixed(1) + " " + Y(p.v).toFixed(1); }).join(" ");
    if (se.area && pts.length > 1) {
      s += '<path class="ar" d="' + d + " L" + X(pts[pts.length - 1].t).toFixed(1) + " " + (mt + ih)
        + " L" + X(pts[0].t).toFixed(1) + " " + (mt + ih) + ' Z"/>';
    }
    if (pts.length > 1) s += '<path class="' + (se.cls || "ln") + '" d="' + d + '"/>';
    pts.forEach(function (p) {
      s += '<circle class="' + (se.ptCls || "pt") + '" cx="' + X(p.t).toFixed(1) + '" cy="' + Y(p.v).toFixed(1)
        + '" r="4.2"><title>' + esc(p.tip || "") + "</title></circle>";
    });
  });

  /* Le date in basso: solo la prima e l'ultima, altrimenti si accavallano.
     Formattate dall'oggetto Date e non passando per toISOString, che
     lavora in UTC: alle date italiane toglieva un giorno per mezza
     giornata all'anno, e sarebbe stato un errore difficile da vedere. */
  s += '<text class="lbl" x="' + ml + '" y="' + (H - 10) + '">' + esc(fmtDataObj(new Date(t0))) + "</text>";
  if (!unico) {
    s += '<text class="lbl" x="' + (W - mr) + '" y="' + (H - 10) + '" text-anchor="end">'
      + esc(fmtDataObj(new Date(t1))) + "</text>";
  }
  return s + "</svg>";
}

/* =====================================================================
   I PROGRESSI
   Due domande diverse: "quanto sto durando" (l'allenamento intero) e
   "sto alzando piu' di prima" (il singolo esercizio). Sono due grafici,
   non uno.
   ===================================================================== */

var PRG_EX = "";
var PRG_MET = "kg";

/* Tutti gli esercizi che compaiono nello storico, con i loro numeri.
   Non li prendo dai programmi ma dagli allenamenti fatti: un esercizio
   che hai tolto dalla scheda il mese scorso ha comunque una storia, e
   buttarla via sarebbe la cosa piu' stupida che questa pagina possa fare. */
function storiaEsercizi() {
  var mappa = {};
  sesFiltrate().forEach(function (s) {
    var passi = Array.isArray(s.steps) ? s.steps : [];
    passi.forEach(function (p) {
      var n = String(p.n || "").trim();
      if (!n) return;
      if (!mappa[n]) mappa[n] = [];
      mappa[n].push({
        t: dataDa(s.day).getTime(), day: s.day,
        kg: p.kg == null ? null : Number(p.kg),
        vel: p.vel == null ? null : Number(p.vel),
        sec: p.sec == null ? null : Number(p.sec),
        serie: p.serie == null ? null : Number(p.serie)
      });
    });
  });
  return mappa;
}

function renderPrg() {
  var mappa = storiaEsercizi();
  var nomi = Object.keys(mappa).sort(function (a, b) { return mappa[b].length - mappa[a].length; });
  var durate = sesFiltrate().filter(function (s) { return s.duration_sec; });

  if (!nomi.length && !durate.length) {
    $("vPrg").innerHTML = '<div class="empty"><div class="emo">📈</div>'
      + "<h3>Ancora niente da confrontare</h3>"
      + "<p>I progressi si costruiscono da soli: ogni volta che ti alleni resta il tempo di ogni esercizio, "
      + "i chili che hai usato e la velocità del tapis. Dopo due allenamenti qui c'è già una linea.</p></div>";
    return;
  }

  var h = "";

  /* ---- quanto durano gli allenamenti ---- */
  if (durate.length) {
    var pts = durate.map(function (s) {
      return {
        t: dataDa(s.day).getTime(), v: s.duration_sec / 60,
        tip: fmtGiornoLungo(s.day) + " · " + (s.program_name || "") + " · " + fmtDurata(s.duration_sec)
      };
    });
    h += '<div class="sect">Quanto durano gli allenamenti</div>'
      + '<div class="card" style="padding:16px 12px 12px">'
      + graficoLinee([{ pts: pts, cls: "ln", ptCls: "pt", area: true }], { dec: 0, min0: true })
      + "</div>"
      + '<div class="nota">In minuti, dall\'inizio alla fine: dentro ci sono anche i recuperi e il fiato ripreso.</div>';
  }

  /* ---- esercizio per esercizio ---- */
  if (nomi.length) {
    if (nomi.indexOf(PRG_EX) < 0) PRG_EX = nomi[0];
    var storia = mappa[PRG_EX] || [];

    /* Quali metriche hanno davvero dei numeri: mostrare un pulsante
       "Velocità" per gli stacchi con manubri sarebbe una bugia. */
    var disp = [];
    if (storia.some(function (x) { return x.kg != null; })) disp.push(["kg", "Il peso"]);
    if (storia.some(function (x) { return x.vel != null; })) disp.push(["vel", "La velocità"]);
    if (storia.some(function (x) { return x.sec; })) disp.push(["sec", "Il tempo"]);
    if (!disp.length) disp.push(["sec", "Il tempo"]);
    if (!disp.some(function (d) { return d[0] === PRG_MET; })) PRG_MET = disp[0][0];

    h += '<div class="sect">Esercizio per esercizio</div>'
      + '<select class="fsel" id="prgEx" style="width:100%;margin-bottom:12px">'
      + nomi.map(function (n) {
          return '<option value="' + esc(n) + '"' + (n === PRG_EX ? " selected" : "") + ">"
            + esc(n) + " · " + mappa[n].length + (mappa[n].length === 1 ? " volta" : " volte") + "</option>";
        }).join("")
      + "</select>"
      + '<div class="picks">'
      + disp.map(function (d) {
          return '<button class="pick' + (d[0] === PRG_MET ? " on" : "") + '" data-m="' + d[0] + '">' + esc(d[1]) + "</button>";
        }).join("")
      + "</div>";

    var campo = PRG_MET;
    var punti = storia.filter(function (x) {
        if (x[campo] == null) return false;
        return campo === "sec" ? !!x.sec : true;   /* un tempo di zero secondi non è un dato */
      })
      .map(function (x) {
        var v = campo === "sec" ? x.sec / 60 : x[campo];
        var etichetta = campo === "kg" ? fmtPeso(x.kg)
          : campo === "vel" ? ("velocità " + x.vel)
          : fmtDurata(x.sec);
        return { t: x.t, v: v, tip: fmtGiornoLungo(x.day) + " · " + etichetta };
      });

    if (punti.length) {
      var primo = punti[0].v, ultimo = punti[punti.length - 1].v;
      var delta = Math.round((ultimo - primo) * 10) / 10;
      var etU = campo === "kg" ? " kg" : (campo === "sec" ? " min" : "");
      var titolo = campo === "kg" ? "il carico" : (campo === "vel" ? "la velocità" : "il tempo");
      h += '<div class="stats">'
        + '<div class="stat1"><b>' + esc(fmtN(ultimo, campo === "vel" ? 0 : 1)) + esc(etU) + "</b><span>l'ultima volta</span></div>"
        + '<div class="stat1"><b>' + esc(fmtN(Math.max.apply(null, punti.map(function (p) { return p.v; })), campo === "vel" ? 0 : 1)) + esc(etU) + "</b><span>il massimo</span></div>"
        + '<div class="stat1"><b>' + (delta > 0 ? "+" : "") + esc(fmtN(delta, 1)) + esc(etU) + "</b><span>dalla prima volta</span></div>"
        + '<div class="stat1"><b>' + storia.length + "</b><span>" + (storia.length === 1 ? "volta" : "volte") + "</span></div>"
        + "</div>"
        + '<div class="card" style="padding:16px 12px 12px">'
        + graficoLinee([{ pts: punti, cls: "ln", ptCls: "pt", area: true }], { dec: campo === "vel" ? 0 : 1, min0: campo !== "kg" })
        + "</div>"
        + '<div class="nota">Come è cambiato ' + esc(titolo) + " di «" + esc(PRG_EX) + "» nel tempo.</div>";
    } else {
      h += '<div class="card" style="padding:24px"><p style="color:var(--ink-soft);font-size:14px;line-height:1.6">'
        + "Per questo esercizio non hai ancora segnato niente da mettere su un grafico. "
        + "La prossima volta, prima di avviarlo, scrivi il peso o la velocità.</p></div>";
    }
  }

  $("vPrg").innerHTML = h;

  if ($("prgEx")) {
    $("prgEx").addEventListener("change", function () { PRG_EX = this.value; renderPrg(); });
  }
  $("vPrg").querySelectorAll(".pick").forEach(function (b) {
    b.addEventListener("click", function () { PRG_MET = b.dataset.m; renderPrg(); });
  });
}

/* =====================================================================
   IL CORPO
   La bilancia nuova legge cinque cose invece di una. Il peso da solo
   racconta meno della meta' della storia: due chili in meno possono
   essere due chili di grasso o due chili d'acqua, e sono due notizie
   molto diverse.
   ===================================================================== */

var MET = "peso";
var METRICHE = {
  peso:    { et: "Il peso",           u: "kg", dec: 1 },
  grasso:  { et: "La massa grassa",   u: "%",  dec: 1 },
  muscolo: { et: "La massa muscolare", u: "",  dec: 1 },
  osso:    { et: "La massa ossea",    u: "kg", dec: 2 },
  acqua:   { et: "L'acqua",           u: "%",  dec: 1 },
  bmi:     { et: "Il BMI",            u: "",   dec: 1 }
};

/* Il corpo e' di una persona sola: un grafico che mescola il peso di
   due persone diverse non vuol dire niente. Se non hai scelto nessuno
   e c'e' una persona sola con delle pesate, prendo quella. */
function personaCorpo() {
  if (FILTRO) return FILTRO;
  var ids = {};
  MISURE.forEach(function (m) { if (m.person_id) ids[m.person_id] = 1; });
  var k = Object.keys(ids);
  return k.length === 1 ? k[0] : "";
}

function valoreMetrica(m, met, altezza) {
  if (met === "peso") return m.weight == null ? null : Number(m.weight);
  if (met === "grasso") return m.fat_pct == null ? null : Number(m.fat_pct);
  if (met === "osso") return m.bone_kg == null ? null : Number(m.bone_kg);
  if (met === "acqua") return m.water_pct == null ? null : Number(m.water_pct);
  if (met === "muscolo") return m.muscle_kg != null ? Number(m.muscle_kg) : (m.muscle_pct != null ? Number(m.muscle_pct) : null);
  if (met === "bmi") {
    if (m.weight == null || !altezza) return null;
    var h = Number(altezza) / 100;
    return Math.round((Number(m.weight) / (h * h)) * 10) / 10;
  }
  return null;
}
function unitaMuscolo(lista) {
  return lista.some(function (m) { return m.muscle_kg != null; }) ? "kg" : "%";
}

function classeBMI(b) {
  if (b == null) return null;
  if (b < 18.5) return { et: "sottopeso", col: "#5B8AA6" };
  if (b < 25) return { et: "normopeso", col: "#7FB069" };
  if (b < 30) return { et: "sovrappeso", col: "#C49A4A" };
  return { et: "obesità", col: "#9A5440" };
}

function renderCorpo() {
  var pid = personaCorpo();

  if (!pid) {
    var chi = PERSONE.map(function (p) {
      var mm = misureDi(p.id);
      var ul = mm.length ? mm[mm.length - 1] : null;
      return '<div class="stat1"><b>' + esc(ul ? fmtPeso(ul.weight) : "—") + "</b><span>"
        + esc(nomeBreve(p.name)) + (ul ? " · " + esc(fmtGiorno(ul.day)) : " · nessuna pesata") + "</span></div>";
    }).join("");
    $("vPeso").innerHTML = '<div class="sect">Il corpo<button class="btn" onclick="apriMisura(null)">Aggiungi una pesata</button></div>'
      + (chi ? '<div class="stats">' + chi + "</div>" : "")
      + '<div class="card" style="padding:26px 24px"><p style="font-size:14.5px;color:var(--ink-soft);line-height:1.65">'
      + "Scegli una persona nella tendina in alto: il grafico del corpo è di una persona sola, "
      + "perché mescolare il peso di due persone diverse non direbbe niente.</p></div>";
    return;
  }

  var pers = personaDi(pid);
  var lista = misureDi(pid);
  var altezza = pers && pers.height_cm ? Number(pers.height_cm) : null;

  var testaAltezza = '<button class="btn-ghost" id="btnH" style="margin-left:auto">'
    + (altezza ? "Altezza " + esc(fmtN(altezza, 0)) + " cm" : "Scrivi l'altezza") + "</button>";
  var h = '<div class="sect">Il corpo di ' + esc(nomeBreve(pers ? pers.name : "")) + testaAltezza
    + '<button class="btn" id="btnMis" style="margin-left:0">Aggiungi una pesata</button></div>';

  if (!lista.length) {
    $("vPeso").innerHTML = h + '<div class="empty"><div class="emo">⚖️</div>'
      + "<h3>Nessuna pesata</h3>"
      + "<p>Sali sulla bilancia e scrivi quello che ti dice: peso, massa grassa, massa muscolare, "
      + "massa ossea e acqua. Da due pesate in poi qui c'è una linea.</p>"
      + '<button class="btn" onclick="apriMisura(null)">La prima pesata</button></div>';
    legaCorpo();
    return;
  }

  var ult = lista[lista.length - 1];
  var pri = lista[0];
  var bmi = valoreMetrica(ult, "bmi", altezza);
  var cl = classeBMI(bmi);
  var uM = unitaMuscolo(lista);

  function delta(met) {
    var a = valoreMetrica(pri, met, altezza), b = valoreMetrica(ult, met, altezza);
    if (a == null || b == null || lista.length < 2) return "";
    var d = Math.round((b - a) * 10) / 10;
    if (!d) return "";
    return ' <em class="' + (d < 0 ? "dlt giu" : "dlt su") + '">' + (d > 0 ? "+" : "") + fmtN(d, 1) + "</em>";
  }

  h += '<div class="stats">'
    + '<div class="stat1"><b>' + esc(fmtPeso(ult.weight)) + delta("peso") + "</b><span>l'ultimo peso · " + esc(fmtGiorno(ult.day)) + "</span></div>"
    + '<div class="stat1"><b>' + (bmi == null ? "—" : esc(fmtN(bmi, 1))) + "</b><span>BMI"
      + (cl ? " · " + esc(cl.et) : (altezza ? "" : " · manca l'altezza")) + "</span></div>"
    + '<div class="stat1"><b>' + (ult.fat_pct == null ? "—" : esc(fmtN(ult.fat_pct, 1)) + "%") + delta("grasso") + "</b><span>massa grassa</span></div>"
    + '<div class="stat1"><b>' + (valoreMetrica(ult, "muscolo") == null ? "—" : esc(fmtN(valoreMetrica(ult, "muscolo"), 1)) + " " + uM)
      + delta("muscolo") + "</b><span>massa muscolare</span></div>"
    + '<div class="stat1"><b>' + lista.length + "</b><span>" + (lista.length === 1 ? "pesata" : "pesate") + "</span></div>"
    + "</div>";

  /* ---- la fascia del BMI ---- */
  if (bmi != null) {
    var lo = 15, hi = 40;
    var pos = Math.max(0, Math.min(100, ((bmi - lo) / (hi - lo)) * 100));
    h += '<div class="card" style="padding:18px 20px 14px;margin-bottom:16px">'
      + '<div style="font-size:11.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--ink-soft)">Dove cade il BMI</div>'
      + '<div class="bmi-bar">'
      + '<i style="flex:' + (18.5 - lo) + ';background:#5B8AA6"></i>'
      + '<i style="flex:' + (25 - 18.5) + ';background:#7FB069"></i>'
      + '<i style="flex:' + (30 - 25) + ';background:#C49A4A"></i>'
      + '<i style="flex:' + (hi - 30) + ';background:#9A5440"></i>'
      + "</div>"
      + '<div class="bmi-mark"><span style="left:' + pos.toFixed(1) + '%">' + esc(fmtN(bmi, 1)) + "<br>" + esc(cl.et) + "</span></div>"
      + '<div class="bmi-sc"><span>sotto&nbsp;18,5</span><span>18,5–25</span><span>25–30</span><span>oltre&nbsp;30</span></div>'
      + '<p style="font-size:12.5px;color:var(--ink-soft);line-height:1.6;margin-top:14px">'
      + "Il BMI è solo peso diviso altezza al quadrato: non sa distinguere un chilo di muscolo da un chilo di grasso, "
      + "e su chi si allena tende a esagerare. La massa grassa, che la bilancia ti dice, è una misura più onesta.</p>"
      + "</div>";
  }

  /* ---- il grafico ---- */
  var metDisp = [["peso", "Il peso"]];
  if (lista.some(function (m) { return m.fat_pct != null; })) metDisp.push(["grasso", "La massa grassa"]);
  if (lista.some(function (m) { return m.muscle_kg != null || m.muscle_pct != null; })) metDisp.push(["muscolo", "La massa muscolare"]);
  if (lista.some(function (m) { return m.bone_kg != null; })) metDisp.push(["osso", "La massa ossea"]);
  if (lista.some(function (m) { return m.water_pct != null; })) metDisp.push(["acqua", "L'acqua"]);
  if (altezza) metDisp.push(["bmi", "Il BMI"]);
  if (!metDisp.some(function (m) { return m[0] === MET; })) MET = "peso";

  h += '<div class="picks">'
    + metDisp.map(function (m) {
        return '<button class="pick' + (m[0] === MET ? " on" : "") + '" data-m="' + m[0] + '">' + esc(m[1]) + "</button>";
      }).join("")
    + "</div>";

  var conf = METRICHE[MET];
  var unita = MET === "muscolo" ? uM : conf.u;
  var punti = lista.map(function (m) {
    var v = valoreMetrica(m, MET, altezza);
    if (v == null) return null;
    return { t: dataDa(m.day).getTime(), v: v, tip: fmtGiornoLungo(m.day) + " · " + fmtN(v, conf.dec) + (unita ? " " + unita : "") };
  }).filter(Boolean);

  if (punti.length) {
    h += '<div class="card" style="padding:16px 12px 12px">'
      + graficoLinee([{ pts: punti, cls: "ln", ptCls: "pt", area: true }], { dec: conf.dec })
      + "</div>"
      + '<div class="nota">' + esc(conf.et) + (unita ? " in " + esc(unita) : "") + ", pesata dopo pesata.</div>";
  }

  /* ---- l'elenco ---- */
  h += '<div class="sect">Tutte le pesate</div>'
    + '<div class="card"><div style="overflow-x:auto"><table class="tbl"><thead><tr>'
    + '<th>Giorno</th><th class="num">Peso</th><th class="num">Grasso</th><th class="num hidem">Muscolo</th>'
    + '<th class="num hidem">Osso</th><th class="num hidem">Acqua</th><th class="num">BMI</th>'
    + "</tr></thead><tbody>";
  lista.slice().reverse().forEach(function (m) {
    var b = valoreMetrica(m, "bmi", altezza);
    h += '<tr onclick="apriMisura(\'' + m.id + '\')">'
      + '<td class="d">' + esc(fmtGiorno(m.day)) + (m.note ? '<div class="n">' + esc(m.note) + "</div>" : "") + "</td>"
      + '<td class="num">' + esc(fmtPeso(m.weight)) + "</td>"
      + '<td class="num">' + (m.fat_pct == null ? "—" : esc(fmtN(m.fat_pct, 1)) + "%") + "</td>"
      + '<td class="num hidem">' + (valoreMetrica(m, "muscolo") == null ? "—" : esc(fmtN(valoreMetrica(m, "muscolo"), 1)) + " " + esc(uM)) + "</td>"
      + '<td class="num hidem">' + (m.bone_kg == null ? "—" : esc(fmtN(m.bone_kg, 2)) + " kg") + "</td>"
      + '<td class="num hidem">' + (m.water_pct == null ? "—" : esc(fmtN(m.water_pct, 1)) + "%") + "</td>"
      + '<td class="num">' + (b == null ? "—" : esc(fmtN(b, 1))) + "</td>"
      + "</tr>";
  });
  h += "</tbody></table></div></div>";

  $("vPeso").innerHTML = h;
  legaCorpo();
  $("vPeso").querySelectorAll(".pick").forEach(function (b) {
    b.addEventListener("click", function () { MET = b.dataset.m; renderCorpo(); });
  });
}

function legaCorpo() {
  if ($("btnMis")) $("btnMis").addEventListener("click", function () { apriMisura(null); });
  if ($("btnH")) $("btnH").addEventListener("click", chiediAltezza);
}

/* L'altezza sta sulla persona perche' e' l'unica cosa che non cambia:
   chiederla a ogni pesata sarebbe una piccola offesa. */
function chiediAltezza() {
  var pid = personaCorpo();
  if (!pid) return;
  var p = personaDi(pid);
  var v = prompt("L'altezza di " + nomeBreve(p ? p.name : "") + ", in centimetri:", p && p.height_cm ? String(p.height_cm) : "");
  if (v === null) return;
  var n = num(v);
  if (v.trim() && (n == null || n < 80 || n > 250)) { toast("Un'altezza in centimetri, fra 80 e 250."); return; }
  guard(sb.from("people").update({ height_cm: v.trim() ? n : null }).eq("id", pid), "altezza").then(function () {
    toast(v.trim() ? "Altezza salvata" : "Altezza tolta");
    load();
  });
}

/* =====================================================================
   L'EDITOR DEL PROGRAMMA
   ===================================================================== */

var EDIT = null;   /* il programma in modifica, null se nuovo */

function apriEditor(id) {
  EDIT = id ? PROG.filter(function (p) { return p.id === id; })[0] : null;
  $("edTitle").textContent = EDIT ? "Modifica il programma" : "Nuovo programma";
  $("edN").value = EDIT ? EDIT.name : "";
  $("edX").value = EDIT ? (EDIT.note || "") : "";
  $("edP").value = EDIT ? (EDIT.person_id || "") : (FILTRO || "");
  $("edDel").hidden = !EDIT;
  $("edCopy").hidden = !EDIT;

  $("edEx").innerHTML = "";
  var es = EDIT ? EDIT.exercises : [];
  if (!es.length) es = [{ n: "", s: "", r: "", note: "" }, { n: "", s: "", r: "", note: "" }, { n: "", s: "", r: "", note: "" }];
  es.forEach(function (e) { rigaEs(e); });

  $("edModal").hidden = false;
}

function rigaEs(e) {
  e = e || { n: "", s: "", r: "", note: "" };
  var box = document.createElement("div");

  var d = document.createElement("div");
  d.className = "exrow";
  d.innerHTML = '<span class="nn"></span>'
    + '<input class="ia" type="text" placeholder="Nome dell\'esercizio" value="' + esc(e.n) + '">'
    + '<input class="ib" type="text" placeholder="3x12" value="' + esc(e.s) + '">'
    + '<input class="ic" type="text" placeholder="recupero 1\'" value="' + esc(e.r) + '">'
    + '<button class="del" title="Togli">✕</button>';

  var hint = document.createElement("div");
  hint.className = "exhint";

  box.appendChild(d);
  box.appendChild(hint);

  function aggiorna() {
    var inp = d.querySelectorAll("input");
    var nome = inp[0].value.trim();
    if (!nome && !inp[1].value.trim()) { hint.textContent = ""; return; }
    var piano = analizzaSerie(inp[1].value);
    var rec = analizzaRecupero(inp[2].value);
    var pezzi = ["<b>" + esc(piano.testo) + "</b>"];
    if (rec) pezzi.push(piano.serie > 1 ? ("recupero automatico di " + mmss(rec)) : ("recupero di " + mmss(rec) + " a portata di pulsante"));
    pezzi.push(eCardio(nome) ? "ti chiederò la velocità" : "ti chiederò il peso");
    hint.innerHTML = pezzi.join(" · ");
  }
  d.querySelectorAll("input").forEach(function (i) { i.addEventListener("input", aggiorna); });
  d.querySelector(".del").addEventListener("click", function () { box.remove(); numeraEs(); });

  $("edEx").appendChild(box);
  aggiorna();
  numeraEs();
}
function numeraEs() {
  var r = $("edEx").querySelectorAll(".exrow");
  for (var i = 0; i < r.length; i++) r[i].querySelector(".nn").textContent = (i + 1) + ".";
}
function raccogliEs() {
  var out = [];
  var r = $("edEx").querySelectorAll(".exrow");
  for (var i = 0; i < r.length; i++) {
    var inp = r[i].querySelectorAll("input");
    var n = inp[0].value.trim();
    if (!n) continue;   /* le righe rimaste vuote non sono un errore: si ignorano */
    out.push({ n: n, s: inp[1].value.trim(), r: inp[2].value.trim(), note: "" });
  }
  return out;
}

function salvaProg() {
  var nome = $("edN").value.trim();
  var es = raccogliEs();
  if (!nome) { toast("Dai un nome al programma."); $("edN").focus(); return; }
  if (!es.length) { toast("Serve almeno un esercizio."); return; }

  var dati = {
    name: nome,
    note: $("edX").value.trim() || null,
    person_id: $("edP").value || null,
    exercises: es,
    updated_at: new Date().toISOString()
  };

  var btn = $("edSave"); btn.disabled = true; btn.textContent = "Salvo…";
  var q = EDIT
    ? sb.from("workout_programs").update(dati).eq("id", EDIT.id)
    : sb.from("workout_programs").insert(Object.assign({ pos: PROG.length + 1 }, dati));

  guard(q, "salva programma").then(function () {
    btn.disabled = false; btn.textContent = "Salva";
    $("edModal").hidden = true;
    toast(EDIT ? "Programma aggiornato" : "Programma creato");
    load();
  }).catch(function () { btn.disabled = false; btn.textContent = "Salva"; });
}

function eliminaProg() {
  if (!EDIT) return;
  var n = SES.filter(function (s) { return s.program_id === EDIT.id; }).length;
  var msg = "Elimino «" + EDIT.name + "»?";
  if (n) msg += "\n\nGli " + n + " allenamenti già fatti restano nello storico: perdono solo il collegamento alla scheda.";
  if (!confirm(msg)) return;
  guard(sb.from("workout_programs").delete().eq("id", EDIT.id), "elimina programma").then(function () {
    $("edModal").hidden = true;
    toast("Programma eliminato");
    load();
  });
}

/* Duplicare serve davvero: le schede di casa si somigliano, e riscrivere
   sette esercizi per la stessa palestra sarebbe una punizione. */
function duplicaProg() {
  if (!EDIT) return;
  var dati = {
    name: $("edN").value.trim() + " (copia)",
    note: $("edX").value.trim() || null,
    person_id: $("edP").value || null,
    exercises: raccogliEs(),
    pos: PROG.length + 1
  };
  guard(sb.from("workout_programs").insert(dati), "duplica").then(function () {
    $("edModal").hidden = true;
    toast("Copia creata: ora cambiale nome e intestazione");
    load();
  });
}

/* =====================================================================
   IL SUONO
   Un fischio corto quando finisce un tempo. Niente file da scaricare:
   e' un oscillatore, tre righe. L'audio si puo' creare solo dopo che
   hai toccato qualcosa (lo impongono i browser), quindi lo accendo al
   primo "Avvia" e da li' in poi c'e'.
   ===================================================================== */

var AUDIO = null;
function sbloccaAudio() {
  try {
    if (!AUDIO) AUDIO = new (window.AudioContext || window.webkitAudioContext)();
    if (AUDIO.state === "suspended") AUDIO.resume();
  } catch (e) { AUDIO = null; }
}
function bip(freq, durata, vol) {
  try {
    if (!AUDIO) return;
    var o = AUDIO.createOscillator(), g = AUDIO.createGain();
    o.type = "sine"; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, AUDIO.currentTime);
    g.gain.exponentialRampToValueAtTime(vol || 0.25, AUDIO.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, AUDIO.currentTime + durata);
    o.connect(g); g.connect(AUDIO.destination);
    o.start(); o.stop(AUDIO.currentTime + durata + 0.02);
  } catch (e) { }
}
function vibra(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { } }

function suonoFine() { bip(880, 0.18); setTimeout(function () { bip(1180, 0.22); }, 190); vibra([120, 70, 160]); }
function suonoRiposo() { bip(660, 0.14); vibra(90); }
function suonoConto() { bip(760, 0.07, 0.16); }

/* =====================================================================
   L'ESECUZIONE
   Una macchina a stati piccola:

     attesa  → stai per cominciare: qui scrivi i chili o la velocità
     corsa   → il cronometro gira (a scendere o a salire)
     riposo  → il recupero fra una serie e l'altra, parte da solo
     fatto   → l'esercizio è chiuso, si va al prossimo

   Tutto quello che si vede sullo schermo lo decide dipingi(), che
   guarda solo lo stato. Nessun pezzo di interfaccia viene toccato da
   qualche altra parte: e' l'unico modo perche' dopo dieci modifiche il
   pulsante dica ancora la verita' su cosa fa.
   ===================================================================== */

var RUN = null;   /* { prog, passo, w1, t0, dati[], completo } */
var ST = null;    /* { fase, piano, serie, base, acc, pausa, restTot, restBase, mostraAltro } */
var TICK = null;

function avvia(id) {
  var p = PROG.filter(function (x) { return x.id === id; })[0];
  if (!p || !p.exercises.length) { toast("Questo programma non ha esercizi."); return; }
  RUN = {
    prog: p, passo: 0, w1: null, t0: null, completo: false,
    dati: p.exercises.map(function () { return { sec: 0, serie: 0, kg: null, vel: null, fatto: false }; })
  };
  $("runTitle").textContent = p.name;
  $("runW1").value = "";
  $("runW2").value = "";
  $("runNotes").value = "";
  $("runClock").hidden = true;
  faseRun("pre");
  $("runModal").hidden = false;
  setTimeout(function () { $("runW1").focus(); }, 120);
}

function faseRun(f) {
  $("runPre").hidden = f !== "pre";
  $("runGo").hidden = f !== "go";
  $("runEnd").hidden = f !== "end";
  $("runClock").hidden = (f === "pre");
  tieniSveglio(f === "go");
  if (f === "go") tickOn(); else tickOff();
}

function tickOn() { if (!TICK) TICK = setInterval(tick, 200); }
function tickOff() { if (TICK) { clearInterval(TICK); TICK = null; } }

/* ---------- che cosa e' successo l'ultima volta ----------
   Prima di una serie la domanda vera non e' "quanti chili?" ma "quanti
   chili avevo messo l'altra volta?". Questa la trova, e la scrive
   sotto al campo. */
function ultimoUso(nome) {
  var n = String(nome || "").trim().toLowerCase();
  for (var i = 0; i < SES.length; i++) {
    if (FILTRO && SES[i].person_id !== FILTRO) continue;
    var passi = Array.isArray(SES[i].steps) ? SES[i].steps : [];
    for (var k = 0; k < passi.length; k++) {
      if (String(passi[k].n || "").trim().toLowerCase() !== n) continue;
      if (passi[k].kg != null || passi[k].vel != null || passi[k].sec) {
        return { kg: passi[k].kg, vel: passi[k].vel, sec: passi[k].sec, day: SES[i].day };
      }
    }
  }
  return null;
}

function esCorrente() { return RUN.prog.exercises[RUN.passo]; }
function datiCorrenti() { return RUN.dati[RUN.passo]; }

function iniziaEsercizio(i) {
  RUN.passo = i;
  var e = esCorrente();
  ST = {
    fase: "attesa", piano: analizzaSerie(e.s), serie: (datiCorrenti().serie || 0) + 1,
    base: 0, acc: 0, pausa: false, restTot: 0, restBase: 0, mostraAltro: false
  };
  if (ST.serie > ST.piano.serie) ST.serie = ST.piano.serie;
  /* Se torni indietro su un esercizio gia' chiuso, lo ritrovi chiuso, col
     suo tempo. Ripartire in automatico dall'ultima serie sarebbe un modo
     silenzioso di sporcare un dato gia' buono. */
  if (datiCorrenti().fatto) ST.fase = "fatto";

  /* i parametri, con quello che c'era l'ultima volta gia' scritto */
  var d = datiCorrenti();
  var ult = ultimoUso(e.n);
  if (d.kg == null && ult && ult.kg != null) d.kg = Number(ult.kg);
  if (d.vel == null && ult && ult.vel != null) d.vel = Number(ult.vel);

  $("runKg").value = d.kg == null ? "" : String(d.kg).replace(".", ",");
  disegnaVelocita(d.vel);

  var hintKg = ult && ult.kg != null ? "L'ultima volta: <b>" + esc(fmtPeso(ult.kg)) + "</b> · " + esc(fmtGiorno(ult.day)) : "Lascia vuoto se non ci sono pesi.";
  var hintVel = ult && ult.vel != null ? "L'ultima volta: <b>velocità " + esc(String(ult.vel)) + "</b> · " + esc(fmtGiorno(ult.day)) : "";
  $("runKgHint").innerHTML = hintKg;
  $("runVelHint").innerHTML = hintVel;

  dipingi();
}

function disegnaVelocita(sel) {
  var h = "";
  for (var v = 1; v <= 10; v++) h += '<button type="button" data-v="' + v + '"' + (Number(sel) === v ? ' class="on"' : "") + ">" + v + "</button>";
  $("runVel").innerHTML = h;
  $("runVel").querySelectorAll("button").forEach(function (b) {
    b.addEventListener("click", function () {
      var v = +b.dataset.v;
      var d = datiCorrenti();
      d.vel = (d.vel === v) ? null : v;   /* ripremere lo stesso numero lo toglie */
      disegnaVelocita(d.vel);
    });
  });
}

function leggiParametri() {
  var d = datiCorrenti();
  var k = num($("runKg").value);
  d.kg = (k != null && k > 0) ? Math.round(k * 10) / 10 : null;
  /* la velocita' e' gia' dentro d.vel: la scrivono i pulsanti */
}

/* quanti secondi sono passati nella serie in corso */
function trascorsi() {
  if (!ST) return 0;
  return ST.acc + (ST.pausa || !ST.base ? 0 : (Date.now() - ST.base) / 1000);
}

function tick() {
  if (!RUN || !ST) return;
  if (RUN.t0) $("runClock").textContent = mmss((Date.now() - RUN.t0) / 1000);

  if (ST.fase === "corsa") {
    var el = trascorsi();
    if (ST.piano.tipo === "tempo" && ST.piano.sec) {
      var rim = ST.piano.sec - el;
      if (rim <= 0) { finiSerie(); return; }
      if (rim <= 3.2 && Math.ceil(rim) !== ST.ultimoConto) { ST.ultimoConto = Math.ceil(rim); suonoConto(); }
    }
    dipingiDial();
  } else if (ST.fase === "riposo") {
    if (ST.restTot - (Date.now() - ST.restBase) / 1000 <= 0) { fineRiposo(); return; }
    dipingiDial();
  }
}

/* ---------- il disegno ---------- */

function dipingi() {
  var es = RUN.prog.exercises, i = RUN.passo, e = es[i], d = RUN.dati[i], p = ST.piano;

  $("runPos").textContent = "Esercizio " + (i + 1) + " di " + es.length;
  $("runName").textContent = e.n;
  $("runSet").textContent = e.s || "—";
  $("runSetBox").hidden = !e.s;
  var rec = analizzaRecupero(e.r);
  $("runRec").textContent = e.r ? (e.r.indexOf("recupero") >= 0 ? e.r : "recupero " + e.r) : "";
  $("runRec").hidden = !e.r;

  /* i parametri si vedono solo prima di partire: mentre il cronometro
     gira lo schermo deve avere una cosa sola grande, non un modulo */
  var inAttesa = (ST.fase === "attesa");
  var cardio = eCardio(e.n);
  $("runParams").hidden = !inAttesa;
  $("runVelBox").hidden = !(cardio || ST.mostraAltro);
  $("runKgBox").hidden = !(!cardio || ST.mostraAltro);
  $("runAltro").hidden = ST.mostraAltro;
  $("runAltro").textContent = cardio ? "…e anche i chili che porti" : "…e anche una velocità";

  /* i tre pulsanti */
  var main = $("runMain"), sx = $("runPrev"), dx = $("runSkip");
  if (ST.fase === "attesa") {
    main.textContent = p.serie > 1 ? ("Avvia la serie " + ST.serie) : (p.tipo === "tempo" ? "Avvia " + mmss(p.sec) : "Avvia");
    sx.textContent = "Indietro"; sx.hidden = (i === 0 && ST.serie === 1);
    dx.textContent = "Salta"; dx.hidden = false;
  } else if (ST.fase === "corsa") {
    main.textContent = p.tipo === "tempo" ? "Ho finito prima" : "Fatto";
    sx.textContent = ST.pausa ? "Riprendi" : "Pausa"; sx.hidden = false;
    dx.textContent = "Salta"; dx.hidden = false;
  } else if (ST.fase === "riposo") {
    main.textContent = "Vai adesso";
    sx.textContent = "+30″"; sx.hidden = false;
    dx.hidden = true;
  } else {
    main.textContent = (i === es.length - 1) ? "Ho finito l'allenamento" : "Procedi al successivo";
    sx.textContent = "Rifai una serie"; sx.hidden = false;
    /* Il recupero scritto sulla scheda vale anche fra un esercizio e il
       prossimo, non solo fra le serie: qui è un'offerta, non un obbligo. */
    var recF = analizzaRecupero(e.r);
    dx.hidden = !(recF && i < es.length - 1);
    if (!dx.hidden) dx.textContent = "Recupero " + mmss(recF);
  }

  /* la barra: quanti esercizi sono chiusi */
  var chiusi = 0;
  RUN.dati.forEach(function (x) { if (x.fatto) chiusi++; });
  $("runProg").style.width = Math.round((chiusi / es.length) * 100) + "%";

  $("runList").innerHTML = es.map(function (x, k) {
    var dd = RUN.dati[k];
    var cl = dd.fatto ? "done" : (k === i ? "now" : "");
    var coda = dd.sec ? mmss(dd.sec) : "";
    if (dd.kg != null) coda += (coda ? " · " : "") + fmtN(dd.kg, 1) + " kg";
    if (dd.vel != null) coda += (coda ? " · " : "") + "vel " + dd.vel;
    return '<div class="' + cl + '"><span>' + (dd.fatto ? "✓" : (k + 1) + ".") + '</span><span class="nm">'
      + esc(x.n) + (x.s ? " · " + esc(x.s) : "") + '</span><span class="tm">' + esc(coda) + "</span></div>";
  }).join("");

  dipingiDial();
}

function dipingiDial() {
  var p = ST.piano, dial = $("runDial"), arco = $("runArc"), C = 553;
  var frazione = 1, testo = "0:00", sotto = "";

  if (ST.fase === "attesa") {
    testo = p.tipo === "tempo" ? mmss(p.sec) : "0:00";
    sotto = p.serie > 1 ? ("serie " + ST.serie + " di " + p.serie) : (p.tipo === "tempo" ? "a scendere" : "pronto");
    frazione = 1;
  } else if (ST.fase === "corsa") {
    var el = trascorsi();
    if (p.tipo === "tempo" && p.sec) {
      testo = mmss(Math.max(0, p.sec - el));
      frazione = Math.max(0, 1 - el / p.sec);
      sotto = p.serie > 1 ? ("serie " + ST.serie + " di " + p.serie) : "manca";
    } else {
      testo = mmss(el);
      frazione = 1 - ((el % 60) / 60);   /* un giro al minuto: si vede che gira */
      sotto = p.serie > 1 ? ("serie " + ST.serie + " di " + p.serie) : "in corso";
    }
    if (ST.pausa) sotto = "in pausa";
  } else if (ST.fase === "riposo") {
    var rim = Math.max(0, ST.restTot - (Date.now() - ST.restBase) / 1000);
    testo = mmss(rim);
    frazione = ST.restTot ? rim / ST.restTot : 0;
    sotto = "recupero";
  } else {
    testo = mmss(datiCorrenti().sec);
    sotto = "fatto";
    frazione = 1;
  }

  $("runTime").textContent = testo;
  $("runSub").textContent = sotto;
  arco.style.strokeDashoffset = String(C * (1 - Math.max(0, Math.min(1, frazione))));
  dial.className = "dial" + (ST.fase === "riposo" ? " rest" : "") + (ST.pausa ? " pausa" : "");
}

/* ---------- i comandi ---------- */

function premiMain() {
  if (!RUN || !ST) return;
  sbloccaAudio();

  if (ST.fase === "attesa") {
    leggiParametri();
    ST.base = Date.now(); ST.acc = 0; ST.pausa = false; ST.ultimoConto = null;
    ST.fase = "corsa";
    dipingi();
  } else if (ST.fase === "corsa") {
    finiSerie();
  } else if (ST.fase === "riposo") {
    fineRiposo();
  } else {
    passoAvanti();
  }
}

function premiSinistra() {
  if (!RUN || !ST) return;
  if (ST.fase === "corsa") {
    if (ST.pausa) { ST.base = Date.now(); ST.pausa = false; }
    else { ST.acc = trascorsi(); ST.pausa = true; }
    dipingi();
  } else if (ST.fase === "riposo") {
    ST.restTot += 30;
    dipingi();
  } else if (ST.fase === "fatto") {
    /* "Rifai": una serie in piu' di quello che c'era scritto. Capita, e
       l'app non deve fare la maestra. */
    datiCorrenti().fatto = false;
    ST.fase = "attesa"; ST.serie = (datiCorrenti().serie || 0) + 1; ST.acc = 0; ST.pausa = false;
    dipingi();
  } else {
    if (ST.serie > 1) { ST.serie--; dipingi(); }
    else if (RUN.passo > 0) iniziaEsercizio(RUN.passo - 1);
  }
}

function premiDestra() {
  if (!RUN || !ST) return;
  if (ST.fase === "fatto") {
    var rec = analizzaRecupero(esCorrente().r);
    if (rec) { sbloccaAudio(); avviaRiposo(rec, "avanti"); }
    return;
  }
  if (ST.fase === "corsa") { datiCorrenti().sec += Math.round(trascorsi()); }
  ST.pausa = false;
  passoAvanti(true);
}

function finiSerie() {
  var d = datiCorrenti(), p = ST.piano;
  d.sec += Math.round(trascorsi());
  d.serie = ST.serie;
  ST.acc = 0; ST.pausa = false; ST.base = 0;
  suonoFine();
  leggiParametri();

  if (ST.serie < p.serie) {
    var rec = analizzaRecupero(esCorrente().r);
    ST.serie++;
    if (rec) { avviaRiposo(rec); return; }
    ST.fase = "attesa";
  } else {
    d.fatto = true;
    ST.fase = "fatto";
  }
  dipingi();
}

function avviaRiposo(sec, dopo) {
  ST.fase = "riposo"; ST.restTot = sec; ST.restBase = Date.now();
  ST.dopo = dopo || "serie";
  dipingi();
}
function fineRiposo() {
  suonoRiposo();
  if (ST.dopo === "avanti") { passoAvanti(); return; }
  ST.fase = "attesa"; ST.acc = 0; ST.pausa = false; ST.base = 0;
  dipingi();
}

function passoAvanti(saltato) {
  var es = RUN.prog.exercises;
  if (!saltato) datiCorrenti().fatto = true;
  if (RUN.passo < es.length - 1) {
    iniziaEsercizio(RUN.passo + 1);
    var b = $("runGo"); if (b && b.scrollIntoView) b.scrollIntoView({ block: "start" });
  } else {
    var tutti = RUN.dati.every(function (d) { return d.fatto; });
    fineRun(tutti);
  }
}

function fineRun(completo) {
  RUN.completo = !!completo;
  tickOff();
  tieniSveglio(false);
  $("runW1b").value = RUN.w1 == null ? "" : String(RUN.w1).replace(".", ",");
  $("runEndTx").textContent = completo
    ? "Finito. Ripesati e scrivi due righe: fra sei mesi saranno l'unica parte che riaprirai davvero."
    : "L'allenamento si è fermato a metà. Lo salvo lo stesso, segnato come interrotto: un allenamento fatto a metà è comunque successo.";
  $("runRiep").innerHTML = riepilogo();
  faseRun("end");
}

function riepilogo() {
  var es = RUN.prog.exercises;
  var tot = RUN.t0 ? Math.round((Date.now() - RUN.t0) / 1000) : 0;
  var lavoro = 0;
  RUN.dati.forEach(function (d) { lavoro += d.sec || 0; });

  var h = '<div class="riep">'
    + "<div><b>Durata</b><span class=\"tm\"><b>" + esc(fmtDurata(tot)) + "</b></span></div>"
    + "<div><span>di cui sotto sforzo</span><span class=\"tm\">" + esc(fmtDurata(lavoro)) + "</span></div>";
  es.forEach(function (e, i) {
    var d = RUN.dati[i];
    var coda = d.sec ? mmss(d.sec) : "—";
    if (d.kg != null) coda += " · " + fmtN(d.kg, 1) + " kg";
    if (d.vel != null) coda += " · vel " + d.vel;
    h += "<div" + (d.fatto ? "" : ' style="opacity:.5"') + '><span class="nm">' + (d.fatto ? "✓ " : "· ")
      + esc(e.n) + '</span><span class="tm">' + esc(coda) + "</span></div>";
  });
  return h + "</div>";
}

function salvaSessione() {
  var es = RUN.prog.exercises;
  var w1 = leggiPeso($("runW1b").value);
  var dati = {
    program_id: RUN.prog.id,
    person_id: RUN.prog.person_id || null,
    program_name: RUN.prog.name,
    day: oggiISO(),
    weight_before: w1,
    weight_after: leggiPeso($("runW2").value),
    notes: $("runNotes").value.trim() || null,
    completed: !!RUN.completo,
    duration_sec: RUN.t0 ? Math.round((Date.now() - RUN.t0) / 1000) : null,
    steps: es.map(function (e, i) {
      var d = RUN.dati[i];
      return {
        n: e.n, s: e.s, r: e.r, fatto: !!d.fatto,
        sec: d.sec || 0, serie: d.serie || 0,
        kg: d.kg == null ? null : d.kg,
        vel: d.vel == null ? null : d.vel
      };
    })
  };
  var pid = dati.person_id;

  var btn = $("runSave"); btn.disabled = true; btn.textContent = "Salvo…";
  guard(sb.from("workout_sessions").insert(dati), "salva allenamento").then(function () {
    /* Il peso segnato prima di allenarsi e' una pesata a tutti gli
       effetti: finisce anche nel grafico del corpo. Se pero' quel giorno
       ti eri gia' pesato per bene, quella riga la lascio stare: la sua
       ha dentro anche la massa grassa, e sarebbe uno scambio in perdita. */
    var gia = MISURE.some(function (m) { return m.day === dati.day && m.person_id === pid; });
    if (w1 == null || gia) return null;
    /* Se questa seconda scrittura fallisce non deve trascinarsi dietro la
       prima: l'allenamento è già al sicuro, e dire "non salvato" a chi ha
       appena finito di sudare sarebbe la bugia peggiore. */
    return Promise.resolve(sb.from("body_measurements").insert({
      person_id: pid, day: dati.day, weight: w1, note: "dal peso segnato prima dell'allenamento"
    })).catch(function () { return null; });
  }).then(function () {
    btn.disabled = false; btn.textContent = "Salva l'allenamento";
    $("runModal").hidden = true;
    RUN = null; ST = null;
    toast("Allenamento salvato");
    load();
  }).catch(function () { btn.disabled = false; btn.textContent = "Salva l'allenamento"; });
}

function chiudiRun() {
  if (!RUN) { $("runModal").hidden = true; return; }
  /* Se sta gia' compilando la scheda finale, chiudere butta via il lavoro:
     va chiesto. Se non ha ancora cominciato, non c'e' niente da perdere. */
  if (!$("runGo").hidden) {
    if (!confirm("Interrompo l'allenamento?\n\nPosso salvarlo com'è, segnato come interrotto.")) return;
    if (ST && ST.fase === "corsa") datiCorrenti().sec += Math.round(trascorsi());
    fineRun(false);
    return;
  }
  if (!$("runEnd").hidden) {
    if (!confirm("Esco senza salvare? L'allenamento appena fatto non finirà nello storico.")) return;
  }
  tickOff();
  tieniSveglio(false);
  $("runModal").hidden = true;
  RUN = null; ST = null;
}

/* =====================================================================
   UN ALLENAMENTO FATTO
   ===================================================================== */

var SESEDIT = null;

function apriSessione(id) {
  var s = SES.filter(function (x) { return x.id === id; })[0];
  if (!s) return;
  SESEDIT = s;
  $("sesTitle").textContent = s.program_name || "Allenamento";
  var passi = Array.isArray(s.steps) ? s.steps : [];
  var h = '<p style="font-size:13px;color:var(--ink-soft);margin-bottom:16px">'
    + esc(fmtGiornoLungo(s.day)) + " · " + esc(nomePersona(s.person_id))
    + (s.duration_sec ? " · " + esc(fmtDurata(s.duration_sec)) : "")
    + (s.completed ? "" : ' · <span class="badge part">interrotto</span>') + "</p>"
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">'
    + '<div class="fld"><label>Peso prima</label><div class="kg"><input type="number" inputmode="decimal" step="0.1" id="sW1" value="'
      + (s.weight_before == null ? "" : s.weight_before) + '"><span>kg</span></div></div>'
    + '<div class="fld"><label>Peso dopo</label><div class="kg"><input type="number" inputmode="decimal" step="0.1" id="sW2" value="'
      + (s.weight_after == null ? "" : s.weight_after) + '"><span>kg</span></div></div>'
    + "</div>"
    + '<div class="fld"><label>Note</label><textarea id="sNo" rows="4">' + esc(s.notes || "") + "</textarea></div>";

  if (passi.length) {
    h += '<label style="display:block;font-size:11.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--ink-soft);margin:6px 0 8px">Gli esercizi di quel giorno</label>'
      + '<div class="riep" style="margin-bottom:0">'
      + passi.map(function (p) {
          var coda = p.sec ? mmss(p.sec) : "";
          if (p.serie) coda += (coda ? " · " : "") + p.serie + (p.serie === 1 ? " serie" : " serie");
          if (p.kg != null) coda += (coda ? " · " : "") + fmtN(p.kg, 1) + " kg";
          if (p.vel != null) coda += (coda ? " · " : "") + "vel " + p.vel;
          return "<div" + (p.fatto ? "" : ' style="opacity:.5"') + '><span class="nm">' + (p.fatto ? "✓ " : "· ")
            + esc(p.n) + (p.s ? " · " + esc(p.s) : "") + '</span><span class="tm">' + esc(coda) + "</span></div>";
        }).join("")
      + "</div>";
  }
  $("sesBody").innerHTML = h;
  $("sesModal").hidden = false;
}

function salvaSesEdit() {
  if (!SESEDIT) return;
  var dati = {
    weight_before: leggiPeso($("sW1").value),
    weight_after: leggiPeso($("sW2").value),
    notes: $("sNo").value.trim() || null
  };
  guard(sb.from("workout_sessions").update(dati).eq("id", SESEDIT.id), "aggiorna allenamento").then(function () {
    $("sesModal").hidden = true;
    toast("Salvato");
    load();
  });
}
function eliminaSes() {
  if (!SESEDIT) return;
  if (!confirm("Elimino l'allenamento del " + fmtGiornoLungo(SESEDIT.day) + "?")) return;
  guard(sb.from("workout_sessions").delete().eq("id", SESEDIT.id), "elimina allenamento").then(function () {
    $("sesModal").hidden = true;
    toast("Eliminato");
    load();
  });
}

/* =====================================================================
   UNA PESATA
   ===================================================================== */

var MISEDIT = null;
var MIU = "kg";     /* l'unita' della massa muscolare, come la scrive la tua bilancia */

function apriMisura(id) {
  MISEDIT = id ? MISURE.filter(function (m) { return m.id === id; })[0] : null;
  var m = MISEDIT;
  $("misTitle").textContent = m ? "Modifica la pesata" : "Una pesata";
  $("miD").value = m ? String(m.day).slice(0, 10) : oggiISO();
  $("miP").value = m ? (m.person_id || "") : (personaCorpo() || FILTRO || (PERSONE[0] ? PERSONE[0].id : ""));
  $("miW").value = m && m.weight != null ? m.weight : "";
  $("miF").value = m && m.fat_pct != null ? m.fat_pct : "";
  $("miA").value = m && m.water_pct != null ? m.water_pct : "";
  $("miO").value = m && m.bone_kg != null ? m.bone_kg : "";
  $("miN").value = m && m.note ? m.note : "";

  MIU = (m && m.muscle_pct != null && m.muscle_kg == null) ? "%" : "kg";
  $("miMU").textContent = MIU;
  $("miM").value = m ? (m.muscle_kg != null ? m.muscle_kg : (m.muscle_pct != null ? m.muscle_pct : "")) : "";

  $("misDel").hidden = !m;
  $("misModal").hidden = false;
  setTimeout(function () { $("miW").focus(); }, 120);
}

function salvaMisura() {
  var w = leggiPeso($("miW").value);
  if (w == null) { toast("Il peso serve: è l'unica cosa obbligatoria."); $("miW").focus(); return; }
  var mus = num($("miM").value);
  var dati = {
    person_id: $("miP").value || null,
    day: $("miD").value || oggiISO(),
    weight: w,
    fat_pct: num($("miF").value),
    water_pct: num($("miA").value),
    bone_kg: num($("miO").value),
    muscle_kg: MIU === "kg" ? mus : null,
    muscle_pct: MIU === "%" ? mus : null,
    note: $("miN").value.trim() || null
  };
  var btn = $("misSave"); btn.disabled = true; btn.textContent = "Salvo…";
  var q = MISEDIT
    ? sb.from("body_measurements").update(dati).eq("id", MISEDIT.id)
    : sb.from("body_measurements").insert(dati);
  guard(q, "salva pesata").then(function () {
    btn.disabled = false; btn.textContent = "Salva";
    $("misModal").hidden = true;
    toast(MISEDIT ? "Pesata aggiornata" : "Pesata salvata");
    load();
  }).catch(function () { btn.disabled = false; btn.textContent = "Salva"; });
}

function eliminaMisura() {
  if (!MISEDIT) return;
  if (!confirm("Elimino la pesata del " + fmtGiornoLungo(MISEDIT.day) + "?")) return;
  guard(sb.from("body_measurements").delete().eq("id", MISEDIT.id), "elimina pesata").then(function () {
    $("misModal").hidden = true;
    toast("Eliminata");
    load();
  });
}

/* =====================================================================
   AVVIO
   ===================================================================== */

$("top").innerHTML = toolHeader("L'allenamento", "Le schede di casa, passo passo");

document.querySelectorAll(".tabs button").forEach(function (b) {
  b.addEventListener("click", function () {
    document.querySelectorAll(".tabs button").forEach(function (x) { x.classList.remove("on"); });
    b.classList.add("on");
    VISTA = b.dataset.v;
    render();
  });
});

$("fPers").addEventListener("change", function () { FILTRO = this.value; render(); });
$("newBtn").addEventListener("click", function () { apriEditor(null); });

$("edClose").addEventListener("click", function () { $("edModal").hidden = true; });
$("edCancel").addEventListener("click", function () { $("edModal").hidden = true; });
$("edAdd").addEventListener("click", function () { rigaEs(); });
$("edSave").addEventListener("click", salvaProg);
$("edDel").addEventListener("click", eliminaProg);
$("edCopy").addEventListener("click", duplicaProg);

$("runClose").addEventListener("click", chiudiRun);
$("runStart").addEventListener("click", function () {
  sbloccaAudio();
  RUN.w1 = leggiPeso($("runW1").value);
  RUN.t0 = Date.now();
  faseRun("go");
  iniziaEsercizio(0);
});
$("runMain").addEventListener("click", premiMain);
$("runPrev").addEventListener("click", premiSinistra);
$("runSkip").addEventListener("click", premiDestra);
$("runSave").addEventListener("click", salvaSessione);
$("runAltro").addEventListener("click", function () { ST.mostraAltro = true; dipingi(); });
$("kgGiu").addEventListener("click", function () { passoKg(-1); });
$("kgSu").addEventListener("click", function () { passoKg(1); });

/* I manubri di casa vanno di mezzo chilo o di chilo: i pulsanti fanno
   quello che faresti tu, senza tastiera, con le mani sudate. */
function passoKg(v) {
  var n = num($("runKg").value) || 0;
  n = Math.max(0, Math.round((n + v * 0.5) * 10) / 10);
  $("runKg").value = n ? String(n).replace(".", ",") : "";
  leggiParametri();
}

$("sesClose").addEventListener("click", function () { $("sesModal").hidden = true; });
$("sesDone").addEventListener("click", function () { $("sesModal").hidden = true; });
$("sesSave").addEventListener("click", salvaSesEdit);
$("sesDel").addEventListener("click", eliminaSes);

$("misClose").addEventListener("click", function () { $("misModal").hidden = true; });
$("misCancel").addEventListener("click", function () { $("misModal").hidden = true; });
$("misSave").addEventListener("click", salvaMisura);
$("misDel").addEventListener("click", eliminaMisura);
$("miMU").addEventListener("click", function () {
  MIU = MIU === "kg" ? "%" : "kg";
  $("miMU").textContent = MIU;
});

/* Lo schermo che si spegne a metà serie è una seccatura vera: finché
   l'allenamento è in corso, il telefono resta sveglio. Se il browser non
   sa fare questa cosa, pazienza: non è un motivo per non partire. */
var wake = null;
function tieniSveglio(on) {
  try {
    if (on && navigator.wakeLock && !wake) {
      navigator.wakeLock.request("screen").then(function (w) { wake = w; }).catch(function () { });
    } else if (!on && wake) { wake.release(); wake = null; }
  } catch (e) { }
}
document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "visible" && RUN && !$("runGo").hidden) {
    tieniSveglio(true);
    /* Il telefono in tasca ferma i timer del browser, ma non il tempo:
       i conti sono tutti su Date.now(), quindi al ritorno il cronometro
       e' gia' giusto. Basta ridipingere. */
    if (ST) dipingi();
  }
});

requireAuth().then(function () { load(); });

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(function () { });
