/* =====================================================================
   L'ALLENAMENTO
   I programmi di casa, l'esecuzione passo passo, lo storico e il peso.

   Tre idee dietro a tutto:
   · il programma e' una scheda intestata a una persona, e le persone
     sono gia' quelle della cartella clinica;
   · mentre ti alleni vedi UN esercizio alla volta, grande, e un
     pulsante solo che conta;
   · quando finisci resta una riga nello storico, con il peso prima e
     dopo e due righe di note. Quella riga non cambia piu', nemmeno se
     un giorno riscrivi la scheda.
   ===================================================================== */

var PERSONE = [];
var PROG = [];
var SES = [];
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

/* Il peso si scrive come viene: 78,4 oppure 78.4. */
function leggiPeso(v) {
  var s = String(v == null ? "" : v).trim().replace(",", ".");
  if (!s) return null;
  var n = parseFloat(s);
  return isFinite(n) && n > 0 ? Math.round(n * 10) / 10 : null;
}
function fmtPeso(n) {
  if (n == null || n === "") return "—";
  return new Intl.NumberFormat("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Number(n)) + " kg";
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
function fmtGiornoLungo(iso) {
  if (!iso) return "—";
  var d = dataDa(iso);
  return d.getDate() + " " + MESI[d.getMonth() + 1].toLowerCase() + " " + d.getFullYear();
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

/* ---------- caricamento ---------- */

function load() {
  setStatus("", "Carico…");
  return Promise.all([
    guard(sb.from("people").select("id,name,pos").order("pos"), "persone"),
    guard(sb.from("workout_programs").select("*").eq("archived", false).order("pos").order("created_at"), "programmi"),
    guard(sb.from("workout_sessions").select("*").order("day", { ascending: false }).order("created_at", { ascending: false }), "allenamenti")
  ]).then(function (r) {
    PERSONE = r[0] || [];
    PROG = (r[1] || []).map(function (p) { p.exercises = normEs(p.exercises); return p; });
    SES = r[2] || [];
    riempiTendine();
    render();
    var n = SES.length;
    setStatus("ok", n ? ("<b>" + n + "</b> " + (n === 1 ? "allenamento" : "allenamenti") + " nello storico") : "Ancora nessun allenamento fatto");
  }).catch(function () {
    setStatus("warn", "Non riesco a leggere i dati. Hai eseguito <b>schema9.sql</b>?");
  });
}

function riempiTendine() {
  var opts = PERSONE.map(function (p) {
    return '<option value="' + p.id + '">' + esc(nomeBreve(p.name)) + "</option>";
  }).join("");
  $("fPers").innerHTML = '<option value="">Tutta la famiglia</option>' + opts;
  $("fPers").value = FILTRO;
  $("edP").innerHTML = '<option value="">Nessuno in particolare</option>' + opts;
}

function progFiltrati() {
  return PROG.filter(function (p) { return !FILTRO || p.person_id === FILTRO; });
}
function sesFiltrate() {
  return SES.filter(function (s) { return !FILTRO || s.person_id === FILTRO; });
}

/* ---------- viste ---------- */

function render() {
  ["prog", "stor", "peso"].forEach(function (v) {
    $("v" + v.charAt(0).toUpperCase() + v.slice(1)).hidden = (v !== VISTA);
  });
  if (VISTA === "prog") renderProg();
  if (VISTA === "stor") renderStor();
  if (VISTA === "peso") renderPeso();
}

function renderProg() {
  var lista = progFiltrati();
  if (!lista.length) {
    $("vProg").innerHTML = '<div class="empty"><div class="emo">🏋️</div>'
      + "<h3>Nessun programma</h3>"
      + "<p>Un programma è una scheda: un nome, la persona a cui è intestata, e gli esercizi in ordine. "
      + "Poi la avvii e ti dice passo passo cosa fare.</p>"
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
          ? "Ultima volta <b>" + esc(fmtGiorno(ult.day)) + "</b>" + (ult.weight_before ? " · " + esc(fmtPeso(ult.weight_before)) : "")
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
      + "<p>Qui finisce una riga ogni volta che completi un programma, con il peso prima e dopo e le tue note.</p></div>";
    return;
  }
  var h = '<div class="card"><div style="overflow-x:auto"><table class="tbl"><thead><tr>'
    + "<th>Giorno</th><th>Programma</th><th class=\"hidem\">Chi</th>"
    + '<th class="num">Prima</th><th class="num">Dopo</th><th class="num hidem">Δ</th><th class="hidem">Note</th>'
    + "</tr></thead><tbody>";
  lista.forEach(function (s) {
    var d = (s.weight_before != null && s.weight_after != null)
      ? Math.round((Number(s.weight_after) - Number(s.weight_before)) * 10) / 10 : null;
    h += '<tr onclick="apriSessione(\'' + s.id + '\')">'
      + '<td class="d">' + esc(fmtGiorno(s.day)) + "</td>"
      + "<td>" + esc(s.program_name || "—")
      + (s.completed ? "" : ' <span class="badge part">interrotto</span>') + "</td>"
      + '<td class="hidem">' + esc(nomePersona(s.person_id)) + "</td>"
      + '<td class="num">' + esc(fmtPeso(s.weight_before)) + "</td>"
      + '<td class="num">' + esc(fmtPeso(s.weight_after)) + "</td>"
      + '<td class="num hidem">' + (d == null ? "—"
          : '<span class="dlt ' + (d < 0 ? "giu" : (d > 0 ? "su" : "")) + '">'
            + (d > 0 ? "+" : "") + String(d).replace(".", ",") + "</span>") + "</td>"
      + '<td class="n hidem">' + esc((s.notes || "").slice(0, 90)) + ((s.notes || "").length > 90 ? "…" : "") + "</td>"
      + "</tr>";
  });
  $("vStor").innerHTML = h + "</tbody></table></div></div>";
}

/* ---------- il peso ---------- */

function renderPeso() {
  /* Un punto per allenamento: il peso di partenza, che e' quello
     confrontabile (dopo un'ora di fatica il peso e' sempre piu' basso,
     ed e' acqua, non grasso: metterli sulla stessa linea direbbe una
     bugia). Il peso di fine c'e', ma come cerchietto a parte. */
  var lista = sesFiltrate().filter(function (s) { return s.weight_before != null || s.weight_after != null; })
    .slice().sort(function (a, b) { return a.day < b.day ? -1 : (a.day > b.day ? 1 : 0); });

  if (!lista.length) {
    $("vPeso").innerHTML = '<div class="empty"><div class="emo">⚖️</div>'
      + "<h3>Nessun peso registrato</h3>"
      + "<p>Il grafico si costruisce da solo con i pesi che segni prima di ogni allenamento.</p></div>";
    return;
  }

  var pt = lista.filter(function (s) { return s.weight_before != null; });
  var primo = pt.length ? Number(pt[0].weight_before) : null;
  var ultimo = pt.length ? Number(pt[pt.length - 1].weight_before) : null;
  var diff = (primo != null && ultimo != null) ? Math.round((ultimo - primo) * 10) / 10 : null;
  var tutti = pt.map(function (s) { return Number(s.weight_before); });
  var minimo = tutti.length ? Math.min.apply(null, tutti) : null;

  var h = '<div class="stats">'
    + '<div class="stat1"><b>' + esc(fmtPeso(ultimo)) + "</b><span>ultimo peso · " + esc(fmtGiorno(pt.length ? pt[pt.length - 1].day : null)) + "</span></div>"
    + '<div class="stat1"><b>' + (diff == null ? "—" : (diff > 0 ? "+" : "") + String(diff).replace(".", ",") + " kg")
      + "</b><span>dall'inizio</span></div>"
    + '<div class="stat1"><b>' + esc(fmtPeso(minimo)) + "</b><span>il più basso</span></div>"
    + '<div class="stat1"><b>' + lista.length + "</b><span>" + (lista.length === 1 ? "pesata" : "pesate") + "</span></div>"
    + "</div>";

  h += '<div class="card" style="padding:16px 12px 12px">' + graficoPeso(lista) + "</div>"
    + '<div class="legend">'
    + '<span><i style="background:var(--brass)"></i>peso prima dell\'allenamento</span>'
    + '<span><i style="border:1.6px solid var(--rust)"></i>peso alla fine</span>'
    + "</div>";

  $("vPeso").innerHTML = h;
}

/* Il grafico e' disegnato a mano in SVG: nessuna libreria da scaricare,
   nessun peso in piu' sul telefono, e segue il tema come tutto il resto. */
function graficoPeso(lista) {
  var W = 720, H = 300, ml = 46, mr = 14, mt = 16, mb = 34;
  var iw = W - ml - mr, ih = H - mt - mb;

  var vals = [];
  lista.forEach(function (s) {
    if (s.weight_before != null) vals.push(Number(s.weight_before));
    if (s.weight_after != null) vals.push(Number(s.weight_after));
  });
  var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
  if (hi - lo < 2) { var m = (hi + lo) / 2; lo = m - 1; hi = m + 1; }
  var pad = (hi - lo) * 0.15; lo -= pad; hi += pad;

  var t0 = dataDa(lista[0].day).getTime();
  var t1 = dataDa(lista[lista.length - 1].day).getTime();
  var span = Math.max(1, t1 - t0);

  function X(iso) { return lista.length === 1 ? ml + iw / 2 : ml + ((dataDa(iso).getTime() - t0) / span) * iw; }
  function Y(v) { return mt + ih - ((v - lo) / (hi - lo)) * ih; }

  var s = '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" role="img" aria-label="Andamento del peso">';

  /* le righe orizzontali e i kg a sinistra */
  for (var i = 0; i <= 4; i++) {
    var v = lo + (hi - lo) * (i / 4), y = Y(v);
    s += '<line class="grid" x1="' + ml + '" y1="' + y.toFixed(1) + '" x2="' + (W - mr) + '" y2="' + y.toFixed(1) + '"/>';
    s += '<text class="lbl" x="' + (ml - 8) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end">' + v.toFixed(1).replace(".", ",") + "</text>";
  }

  var pt = lista.filter(function (x) { return x.weight_before != null; });
  if (pt.length) {
    var d = pt.map(function (x, i) { return (i ? "L" : "M") + X(x.day).toFixed(1) + " " + Y(Number(x.weight_before)).toFixed(1); }).join(" ");
    var area = d + " L" + X(pt[pt.length - 1].day).toFixed(1) + " " + (mt + ih) + " L" + X(pt[0].day).toFixed(1) + " " + (mt + ih) + " Z";
    s += '<path class="ar" d="' + area + '"/>';
    s += '<path class="ln" d="' + d + '"/>';
    pt.forEach(function (x) {
      s += '<circle class="pt" cx="' + X(x.day).toFixed(1) + '" cy="' + Y(Number(x.weight_before)).toFixed(1) + '" r="4.5"><title>'
        + esc(fmtGiornoLungo(x.day)) + " · " + esc(fmtPeso(x.weight_before)) + "</title></circle>";
    });
  }
  lista.forEach(function (x) {
    if (x.weight_after == null) return;
    s += '<circle class="pt2" cx="' + X(x.day).toFixed(1) + '" cy="' + Y(Number(x.weight_after)).toFixed(1) + '" r="3.4"><title>'
      + esc(fmtGiornoLungo(x.day)) + " · fine " + esc(fmtPeso(x.weight_after)) + "</title></circle>";
  });

  /* le date in basso: solo la prima e l'ultima, altrimenti si accavallano */
  s += '<text class="lbl" x="' + ml + '" y="' + (H - 10) + '">' + esc(fmtGiornoLungo(lista[0].day)) + "</text>";
  if (lista.length > 1) {
    s += '<text class="lbl" x="' + (W - mr) + '" y="' + (H - 10) + '" text-anchor="end">' + esc(fmtGiornoLungo(lista[lista.length - 1].day)) + "</text>";
  }
  return s + "</svg>";
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
  var d = document.createElement("div");
  d.className = "exrow";
  d.innerHTML = '<span class="nn"></span>'
    + '<input class="ia" type="text" placeholder="Nome dell\'esercizio" value="' + esc(e.n) + '">'
    + '<input class="ib" type="text" placeholder="3x12" value="' + esc(e.s) + '">'
    + '<input class="ic" type="text" placeholder="recupero 1\'" value="' + esc(e.r) + '">'
    + '<button class="del" title="Togli">✕</button>';
  d.querySelector(".del").addEventListener("click", function () { d.remove(); numeraEs(); });
  $("edEx").appendChild(d);
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
   L'ESECUZIONE
   ===================================================================== */

var RUN = null;   /* { prog, passo, fatti[], w1 } */

function avvia(id) {
  var p = PROG.filter(function (x) { return x.id === id; })[0];
  if (!p || !p.exercises.length) { toast("Questo programma non ha esercizi."); return; }
  RUN = { prog: p, passo: 0, fatti: [], w1: null };
  $("runTitle").textContent = p.name;
  $("runW1").value = "";
  $("runW2").value = "";
  $("runNotes").value = "";
  faseRun("pre");
  $("runModal").hidden = false;
  setTimeout(function () { $("runW1").focus(); }, 120);
}

function faseRun(f) {
  $("runPre").hidden = f !== "pre";
  $("runGo").hidden = f !== "go";
  $("runEnd").hidden = f !== "end";
  tieniSveglio(f === "go");
}

function mostraPasso() {
  var es = RUN.prog.exercises, i = RUN.passo, e = es[i];
  $("runPos").textContent = "Esercizio " + (i + 1) + " di " + es.length;
  $("runName").textContent = e.n;
  $("runSet").textContent = e.s || "—";
  $("runSetBox").hidden = !e.s;
  $("runRec").textContent = e.r || "";
  $("runRec").hidden = !e.r;
  $("runNote").textContent = e.note || "";
  $("runNote").hidden = !e.note;
  $("runProg").style.width = Math.round((i / es.length) * 100) + "%";
  $("runPrev").hidden = i === 0;
  $("runNext").textContent = (i === es.length - 1) ? "Ho finito" : "Procedi al successivo";

  $("runList").innerHTML = es.map(function (x, k) {
    var cl = k < i ? "done" : (k === i ? "now" : "");
    return '<div class="' + cl + '"><span>' + (k < i ? "✓" : (k + 1) + ".") + "</span><span>"
      + esc(x.n) + (x.s ? " · " + esc(x.s) : "") + "</span></div>";
  }).join("");
}

function passoAvanti() {
  var es = RUN.prog.exercises;
  RUN.fatti[RUN.passo] = true;
  if (RUN.passo < es.length - 1) {
    RUN.passo++;
    mostraPasso();
    /* Il pannello scorre in cima: l'esercizio nuovo deve essere la prima
       cosa che vedi, non qualcosa da cercare. */
    var b = $("runGo"); if (b && b.scrollIntoView) b.scrollIntoView({ block: "start" });
  } else {
    fineRun(true);
  }
}
function passoIndietro() {
  if (RUN.passo > 0) { RUN.passo--; mostraPasso(); }
}

function fineRun(completo) {
  RUN.completo = !!completo;
  $("runW1b").value = RUN.w1 == null ? "" : String(RUN.w1).replace(".", ",");
  $("runEndTx").textContent = completo
    ? "Finito. Ripesati e scrivi due righe: fra sei mesi saranno l'unica parte che riaprirai davvero."
    : "L'allenamento si è fermato a metà. Lo salvo lo stesso, segnato come interrotto: un allenamento fatto a metà è comunque successo.";
  faseRun("end");
  setTimeout(function () { $("runW2").focus(); }, 120);
}

function salvaSessione() {
  var es = RUN.prog.exercises;
  var dati = {
    program_id: RUN.prog.id,
    person_id: RUN.prog.person_id || null,
    program_name: RUN.prog.name,
    day: oggiISO(),
    weight_before: leggiPeso($("runW1b").value),
    weight_after: leggiPeso($("runW2").value),
    notes: $("runNotes").value.trim() || null,
    completed: !!RUN.completo,
    steps: es.map(function (e, i) {
      return { n: e.n, s: e.s, r: e.r, fatto: RUN.completo ? true : !!RUN.fatti[i] };
    })
  };
  var btn = $("runSave"); btn.disabled = true; btn.textContent = "Salvo…";
  guard(sb.from("workout_sessions").insert(dati), "salva allenamento").then(function () {
    btn.disabled = false; btn.textContent = "Salva l'allenamento";
    $("runModal").hidden = true;
    RUN = null;
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
    fineRun(false);
    return;
  }
  if (!$("runEnd").hidden) {
    if (!confirm("Esco senza salvare? L'allenamento appena fatto non finirà nello storico.")) return;
  }
  $("runModal").hidden = true;
  RUN = null;
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
    + (s.completed ? "" : ' · <span class="badge part">interrotto</span>') + "</p>"
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">'
    + '<div class="fld"><label>Peso prima</label><div class="kg"><input type="number" inputmode="decimal" step="0.1" id="sW1" value="'
      + (s.weight_before == null ? "" : s.weight_before) + '"><span>kg</span></div></div>'
    + '<div class="fld"><label>Peso dopo</label><div class="kg"><input type="number" inputmode="decimal" step="0.1" id="sW2" value="'
      + (s.weight_after == null ? "" : s.weight_after) + '"><span>kg</span></div></div>'
    + "</div>"
    + '<div class="fld"><label>Note</label><textarea id="sNo" rows="5">' + esc(s.notes || "") + "</textarea></div>";

  if (passi.length) {
    h += '<label style="display:block;font-size:11.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--ink-soft);margin:6px 0 8px">Gli esercizi di quel giorno</label>'
      + '<div style="font-size:13.5px;line-height:1.8;color:var(--ink-soft)">'
      + passi.map(function (p, i) {
          return "<div" + (p.fatto ? "" : ' style="opacity:.5"') + ">" + (p.fatto ? "✓ " : "· ")
            + esc(p.n) + (p.s ? " · " + esc(p.s) : "") + "</div>";
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
  RUN.w1 = leggiPeso($("runW1").value);
  faseRun("go");
  mostraPasso();
});
$("runNext").addEventListener("click", passoAvanti);
$("runPrev").addEventListener("click", passoIndietro);
$("runSave").addEventListener("click", salvaSessione);

$("sesClose").addEventListener("click", function () { $("sesModal").hidden = true; });
$("sesDone").addEventListener("click", function () { $("sesModal").hidden = true; });
$("sesSave").addEventListener("click", salvaSesEdit);
$("sesDel").addEventListener("click", eliminaSes);

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
  if (document.visibilityState === "visible" && RUN && !$("runGo").hidden) tieniSveglio(true);
});

requireAuth().then(function () { load(); });

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(function () { });
