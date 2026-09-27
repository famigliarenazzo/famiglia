/* =====================================================================
   IL DIARIO DELLA GIORNATA
   Quello che mangi, quello che bruci, quanto pesi. Giorno per giorno.

   Le idee dietro a tutto:

   · la giornata e' divisa nei sei momenti in cui mangi davvero:
     colazione, merenda del mattino, pranzo, merenda del pomeriggio,
     cena, dopo cena;

   · ogni cosa mangiata e' una riga con porzione e calorie, scritte
     "indicativamente": l'app aiuta con una tabella di cibi comuni e
     ricordando quello che hai scritto le volte prima, ma l'ultima
     parola sulle calorie e' sempre la tua;

   · le calorie bruciate sono una stima onesta: MET x peso x ore. Il
     MET e' quanto un'attivita' costa rispetto allo stare seduti
     (Compendium of Physical Activities). Il peso e' l'ultimo che hai
     segnato. Venti minuti di tapis a 6 km/h per 78 kg fanno circa
     130 kcal, e l'app te lo scrive mentre corri;

   · gli allenamenti fatti col cronometro finiscono nel diario da soli,
     esercizio per esercizio, con le loro calorie.
   ===================================================================== */

var PASTI = [
  { k: "colazione",          et: "Colazione",               ico: "☕" },
  { k: "merenda_mattina",    et: "Merenda del mattino",     ico: "🍎" },
  { k: "pranzo",             et: "Pranzo",                  ico: "🍝" },
  { k: "merenda_pomeriggio", et: "Merenda del pomeriggio",  ico: "🥪" },
  { k: "cena",               et: "Cena",                    ico: "🍽️" },
  { k: "dopocena",           et: "Dopo cena",               ico: "🌙" }
];
function pastoDi(k) {
  for (var i = 0; i < PASTI.length; i++) if (PASTI[i].k === k) return PASTI[i];
  return PASTI[0];
}

var GIORNI_SETT = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];

/* ---------- i cibi comuni ----------
   Calorie ogni 100 g (o 100 ml), e la porzione tipica. Valori medi
   da tabelle di composizione italiane: servono a partire da un numero
   sensato, non a fare la dieta al grammo. Chi scrive "pasta" e "80 g"
   si trova 282 kcal gia' scritte, e le corregge se vuole. */
var CIBI = [
  // colazione e dolci
  ["Caffè espresso", 2, 30, "una tazzina"],
  ["Cappuccino", 50, 150, "una tazza"],
  ["Latte intero", 64, 200, "una tazza"],
  ["Latte parzialmente scremato", 46, 200, "una tazza"],
  ["Latte scremato", 36, 200, "una tazza"],
  ["Latte vegetale (soia/avena)", 40, 200, "una tazza"],
  ["Yogurt bianco intero", 66, 125, "un vasetto"],
  ["Yogurt greco 0%", 57, 150, "un vasetto"],
  ["Yogurt alla frutta", 95, 125, "un vasetto"],
  ["Fette biscottate", 408, 20, "2 fette"],
  ["Biscotti secchi", 416, 30, "4 biscotti"],
  ["Biscotti frollini", 470, 30, "3 biscotti"],
  ["Cornetto / brioche", 410, 50, "uno"],
  ["Cereali (corn flakes)", 361, 30, "una ciotola"],
  ["Muesli", 370, 40, "una ciotola"],
  ["Fiocchi d'avena", 372, 40, "una ciotola"],
  ["Zucchero", 392, 5, "un cucchiaino"],
  ["Miele", 304, 10, "un cucchiaino"],
  ["Marmellata", 222, 20, "un cucchiaio"],
  ["Crema di nocciole", 539, 15, "un cucchiaio"],
  ["Burro", 717, 10, "una noce"],
  ["Spremuta d'arancia", 33, 200, "un bicchiere"],
  ["Succo di frutta", 45, 200, "un bicchiere"],
  ["Torta / dolce", 380, 80, "una fetta"],
  ["Tiramisù", 300, 120, "una porzione"],
  ["Gelato", 216, 100, "una coppetta"],
  ["Cioccolato fondente", 546, 20, "2 quadretti"],
  ["Cioccolato al latte", 545, 20, "2 quadretti"],
  // pane e cereali
  ["Pane", 275, 50, "2 fette"],
  ["Pane integrale", 243, 50, "2 fette"],
  ["Crackers", 428, 25, "un pacchetto"],
  ["Grissini", 410, 20, "4 grissini"],
  ["Taralli", 480, 30, "una manciata"],
  ["Focaccia", 300, 100, "un pezzo"],
  ["Piadina", 300, 100, "una piadina"],
  ["Pasta (cruda)", 353, 80, "un piatto"],
  ["Pasta integrale (cruda)", 340, 80, "un piatto"],
  ["Riso (crudo)", 332, 80, "un piatto"],
  ["Pasta al pomodoro (cotta)", 150, 300, "un piatto"],
  ["Pasta al ragù (cotta)", 180, 300, "un piatto"],
  ["Risotto (cotto)", 160, 300, "un piatto"],
  ["Lasagne", 160, 300, "una porzione"],
  ["Insalata di riso", 170, 250, "un piatto"],
  ["Pizza margherita", 270, 300, "una pizza"],
  ["Pizza al taglio", 270, 150, "un trancio"],
  ["Toast prosciutto e formaggio", 270, 120, "uno"],
  ["Tramezzino", 250, 100, "uno"],
  ["Minestrone", 45, 300, "un piatto"],
  // secondi
  ["Petto di pollo", 110, 150, "una porzione"],
  ["Carne di manzo magra", 130, 150, "una porzione"],
  ["Hamburger di manzo", 250, 120, "uno"],
  ["Carne di maiale (lonza)", 150, 150, "una porzione"],
  ["Salmone", 185, 150, "una porzione"],
  ["Merluzzo / pesce bianco", 75, 150, "una porzione"],
  ["Tonno sott'olio (sgocciolato)", 192, 80, "una scatoletta"],
  ["Tonno al naturale", 103, 80, "una scatoletta"],
  ["Uovo", 128, 60, "un uovo"],
  ["Frittata", 190, 120, "una porzione"],
  ["Prosciutto crudo", 250, 50, "4 fette"],
  ["Prosciutto cotto", 180, 50, "3 fette"],
  ["Bresaola", 151, 50, "una porzione"],
  ["Salame", 425, 30, "5 fette"],
  ["Mozzarella", 253, 125, "una mozzarella"],
  ["Parmigiano", 392, 10, "un cucchiaio"],
  ["Formaggio stagionato", 390, 50, "una porzione"],
  ["Ricotta", 146, 100, "una porzione"],
  ["Legumi cotti (ceci, lenticchie, fagioli)", 115, 150, "una porzione"],
  // contorni e frutta
  ["Insalata verde", 20, 100, "una ciotola"],
  ["Verdure cotte", 25, 200, "una porzione"],
  ["Verdure grigliate (con olio)", 60, 200, "una porzione"],
  ["Pomodori", 18, 150, "una porzione"],
  ["Patate", 77, 200, "una porzione"],
  ["Patate al forno", 150, 200, "una porzione"],
  ["Patatine fritte", 300, 100, "una porzione"],
  ["Patatine in busta", 540, 30, "un sacchetto piccolo"],
  ["Olio extravergine", 899, 10, "un cucchiaio"],
  ["Mela", 53, 150, "una mela"],
  ["Pera", 57, 150, "una pera"],
  ["Banana", 89, 120, "una banana"],
  ["Arancia", 47, 150, "un'arancia"],
  ["Frutta fresca", 50, 150, "un frutto"],
  ["Frutta secca (noci, mandorle)", 600, 30, "una manciata"],
  // da bere
  ["Vino", 85, 125, "un bicchiere"],
  ["Birra", 43, 330, "una bottiglia"],
  ["Spritz", 80, 200, "un bicchiere"],
  ["Bibita zuccherata", 42, 330, "una lattina"]
].map(function (c) { return { name: c[0], k100: c[1], g: c[2], portion: c[3] }; });

/* ---------- le attivita' ----------
   MET dal Compendium of Physical Activities, arrotondati. Il nome
   si riconosce con una regola, come gia' fa il cronometro per capire
   se chiedere la velocita' o i chili. */
var ATTIVITA = [
  [/(tapis|tappeto|treadmill)/, "Tapis roulant", 4.3],
  [/(corsa|corri|running|jogging)/, "Corsa", 8.3],
  [/(camminata veloce|passo svelto|nordic)/, "Camminata veloce", 4.3],
  [/(camminat|passeggiat|cammino)/, "Camminata", 3.5],
  [/(cyclette|bike|spinning)/, "Cyclette", 6.8],
  [/(bici|cicl)/, "Bicicletta", 7.5],
  [/(ellittic)/, "Ellittica", 5.0],
  [/(vogatore|rower|remoergometro)/, "Vogatore", 7.0],
  [/(stepper|climber|scale\b|scala\b)/, "Stepper / scale", 8.8],
  [/(nuoto|piscina|nuotat)/, "Nuoto", 6.0],
  [/(corda)/, "Salto della corda", 11.0],
  [/(burpee|hiit|tabata|circuito|crossfit)/, "Circuito / HIIT", 8.0],
  [/(jumping|saltell)/, "Jumping jack", 7.7],
  [/(squat|affond|lunge|stacc|panca|press|curl|rematore|manubri|bilanciere|pesi|kettlebell|alzate|tirate|trazion|dip)/, "Pesi", 5.0],
  [/(flession|piegament|addominal|crunch|plank|isometric|ponte|glute|calisthenic|corpo libero)/, "Corpo libero", 3.8],
  [/(elastic)/, "Elastici", 3.5],
  [/(yoga)/, "Yoga", 2.5],
  [/(pilates)/, "Pilates", 3.0],
  [/(stretching|allungament|mobilit)/, "Stretching", 2.3],
  [/(padel)/, "Padel", 6.0],
  [/(tennis)/, "Tennis", 7.3],
  [/(calcio|calcetto)/, "Calcio", 7.0],
  [/(ballo|danza|zumba)/, "Ballo", 5.0],
  [/(escursion|trekking|montagna)/, "Escursionismo", 6.0],
  [/(giardin|orto)/, "Giardinaggio", 3.8],
  [/(pulizie|faccende)/, "Pulizie di casa", 3.3]
];
var ATTIVITA_RAPIDE = ["Tapis roulant", "Camminata", "Corsa", "Cyclette", "Bicicletta", "Pesi", "Nuoto", "Yoga"];

/* Il tapis e' l'unico dove la velocita' cambia tutto: 3 km/h e 10 km/h
   sono una passeggiata e una corsa. La velocita' da 1 a 10 che il
   cronometro chiede la leggo come km/h, che e' quello che mostrano
   quasi tutti i tapis di casa. */
function metTapis(v) {
  if (v == null || !v) return 4.3;
  if (v <= 3) return 2.8;
  if (v <= 4) return 3.0;
  if (v <= 5) return 3.5;
  if (v <= 5.9) return 4.3;
  if (v <= 6.5) return 5.0;
  if (v <= 7.5) return 6.5;
  if (v <= 8.5) return 8.3;
  if (v <= 9.5) return 9.0;
  if (v <= 10.5) return 9.8;
  return 11.0;
}

function stimaMet(nome, vel) {
  var n = String(nome || "").toLowerCase();
  for (var i = 0; i < ATTIVITA.length; i++) {
    if (ATTIVITA[i][0].test(n)) {
      var met = ATTIVITA[i][2];
      if (i === 0 && vel) met = metTapis(vel);
      return { met: met, tipo: ATTIVITA[i][1], noto: true };
    }
  }
  return { met: 4.0, tipo: "attività moderata", noto: false };
}

/* Il peso da usare per la stima: quello del giorno, se c'e';
   altrimenti l'ultimo segnato prima; altrimenti il primo dopo. */
function pesoPer(pid, day) {
  var lista = pid ? misureDi(pid) : [];
  var prima = null, dopo = null;
  for (var i = 0; i < lista.length; i++) {
    if (lista[i].weight == null) continue;
    if (lista[i].day <= day) prima = lista[i];
    else if (!dopo) dopo = lista[i];
  }
  var m = prima || dopo;
  return m ? Number(m.weight) : null;
}
var PESO_STD = 70;

function kcalDa(met, kg, minuti) {
  if (!met || !minuti) return 0;
  return Math.round(met * (kg || PESO_STD) * (minuti / 60));
}

/* Le calorie di un esercizio del cronometro: nome, secondi, velocita'. */
function kcalEsercizio(nome, sec, vel, kg) {
  if (!sec) return 0;
  return kcalDa(stimaMet(nome, vel).met, kg, sec / 60);
}

function fmtKcal(n) {
  if (n == null || !isFinite(n)) return "—";
  return new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0 }).format(Math.round(n)) + " kcal";
}
function fmtK(n) {
  return new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0 }).format(Math.round(n || 0));
}

/* Due righe: sopra "oggi" / "ieri" / l'anno, sotto il giorno per esteso.
   Su una riga sola, sul telefono, "domenica 27 settembre" veniva tagliato. */
function giornoTitolo(iso) {
  var d = dataDa(iso);
  var rel = fmtGiorno(iso);
  var lungo = GIORNI_SETT[d.getDay()] + " " + d.getDate() + " " + MESI[d.getMonth() + 1].toLowerCase();
  var sopra = (rel === "oggi" || rel === "ieri") ? rel : String(d.getFullYear());
  return "<small>" + esc(sopra) + "</small>" + esc(lungo);
}
function spostaGiorno(iso, n) {
  var d = dataDa(iso);
  d.setDate(d.getDate() + n);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

/* =====================================================================
   LO STATO
   ===================================================================== */

var DIA_DAY = oggiISO();
var DIA = null;          /* { key, food:[], act:[] } del giorno mostrato */
var DIA_LOADING = null;
var FAV = {};            /* person_id -> [ {name, portion, grams, kcal, uses} ] */
var AND_GG = 30;
var AND_DATI = null;     /* { key, righe:[] } */

function chiaveDia(pid, day) { return pid + "|" + day; }

/* Il diario e' di una persona sola, come il corpo. */
function personaDiario() {
  if (FILTRO) return FILTRO;
  return PERSONE.length === 1 ? PERSONE[0].id : "";
}

function sceltaPersona(dove, frase) {
  $(dove).innerHTML = '<div class="card" style="padding:26px 22px;text-align:center">'
    + '<p style="font-size:14.5px;color:var(--ink-soft);line-height:1.6;margin-bottom:16px">' + frase + "</p>"
    + '<div class="picks" style="justify-content:center;margin:0">'
    + PERSONE.map(function (p) {
        return '<button class="pick pick-in" data-p="' + p.id + '">' + esc(nomeBreve(p.name)) + "</button>";
      }).join("")
    + "</div></div>";
  $(dove).querySelectorAll("[data-p]").forEach(function (b) {
    b.addEventListener("click", function () { impostaFiltro(b.dataset.p); });
  });
}

/* =====================================================================
   LA GIORNATA
   ===================================================================== */

function renderDiario() {
  var pid = personaDiario();
  if (!pid) {
    sceltaPersona("vDia", "Il diario è di una persona sola. Di chi è?");
    return;
  }
  var key = chiaveDia(pid, DIA_DAY);
  if (!DIA || DIA.key !== key) {
    if (DIA_LOADING !== key) caricaGiorno(pid, DIA_DAY);
    if (!DIA || DIA.key.split("|")[0] !== pid) {
      $("vDia").innerHTML = testaGiorno() + '<div class="card" style="padding:30px;text-align:center;color:var(--ink-soft)">Carico la giornata…</div>';
      legaTestaGiorno();
      return;
    }
  }
  disegnaGiorno(pid);
}

function caricaGiorno(pid, day) {
  var key = chiaveDia(pid, day);
  DIA_LOADING = key;
  var qs = [
    guard(sb.from("food_entries").select("*").eq("person_id", pid).eq("day", day).order("created_at"), "pasti"),
    guard(sb.from("activity_entries").select("*").eq("person_id", pid).eq("day", day).order("created_at"), "attività")
  ];
  if (!FAV[pid]) {
    qs.push(Promise.resolve(sb.from("food_favorites").select("name,portion,grams,kcal,uses")
      .eq("person_id", pid).order("uses", { ascending: false }).limit(400))
      .then(function (r) { return r && !r.error ? r.data : []; }, function () { return []; }));
  }
  Promise.all(qs).then(function (r) {
    if (DIA_LOADING !== key) return;           /* nel frattempo hai cambiato giorno */
    DIA_LOADING = null;
    DIA = { key: key, food: r[0] || [], act: r[1] || [] };
    if (r.length > 2) FAV[pid] = r[2] || [];
    if (VISTA === "diario") renderDiario();
  }).catch(function () {
    DIA_LOADING = null;
    $("vDia").innerHTML = '<div class="empty"><div class="emo">🍽️</div><h3>Il diario non risponde</h3>'
      + "<p>Probabilmente manca l'ultimo aggiornamento del database: esegui <b>schema11.sql</b> nel SQL Editor di Supabase.</p></div>";
  });
}

function testaGiorno() {
  var oggi = oggiISO();
  return '<div class="daynav">'
    + '<button class="dn-btn" id="dPrev" aria-label="Giorno prima">‹</button>'
    + '<label class="dn-day"><span>' + giornoTitolo(DIA_DAY) + '</span>'
    + '<input type="date" id="dPick" value="' + DIA_DAY + '" max="' + oggi + '"></label>'
    + '<button class="dn-btn" id="dNext" aria-label="Giorno dopo"' + (DIA_DAY >= oggi ? " disabled" : "") + ">›</button>"
    + (DIA_DAY !== oggi ? '<button class="pick" id="dOggi" style="margin-left:4px">Oggi</button>' : "")
    + "</div>";
}
function legaTestaGiorno() {
  $("dPrev").addEventListener("click", function () { vaiAlGiorno(spostaGiorno(DIA_DAY, -1)); });
  $("dNext").addEventListener("click", function () { if (DIA_DAY < oggiISO()) vaiAlGiorno(spostaGiorno(DIA_DAY, 1)); });
  $("dPick").addEventListener("change", function () { if (this.value) vaiAlGiorno(this.value); });
  if ($("dOggi")) $("dOggi").addEventListener("click", function () { vaiAlGiorno(oggiISO()); });
}
function vaiAlGiorno(iso) {
  DIA_DAY = iso > oggiISO() ? oggiISO() : iso;
  renderDiario();
}

function disegnaGiorno(pid) {
  var food = DIA.food, act = DIA.act;
  var entrate = 0, uscite = 0;
  food.forEach(function (f) { entrate += Number(f.kcal) || 0; });
  act.forEach(function (a) { uscite += Number(a.kcal) || 0; });
  var bil = entrate - uscite;

  var pesata = misureDi(pid).filter(function (m) { return m.day === DIA_DAY; })[0];
  var pesoRif = pesoPer(pid, DIA_DAY);

  var h = testaGiorno();

  h += '<div class="stats">'
    + '<div class="stat1"><b>' + fmtK(entrate) + "</b><span>kcal assunte</span></div>"
    + '<div class="stat1"><b>' + fmtK(uscite) + "</b><span>kcal bruciate con l'attività</span></div>"
    + '<div class="stat1"><b>' + (bil > 0 ? "+" : "") + fmtK(bil) + "</b><span>la differenza</span></div>"
    + '<div class="stat1 tap" id="dPeso"><b>' + (pesata ? esc(fmtPeso(pesata.weight)) : "—") + "</b><span>"
      + (pesata ? "il peso di oggi · tocca per cambiare" : "tocca per segnare il peso") + "</span></div>"
    + "</div>";

  /* ---- i sei momenti ---- */
  h += '<div class="meals">';
  PASTI.forEach(function (p) {
    var righe = food.filter(function (f) { return f.meal === p.k; });
    var tot = 0; righe.forEach(function (f) { tot += Number(f.kcal) || 0; });
    h += '<div class="meal card">'
      + '<div class="meal-h"><span class="ico">' + p.ico + "</span><h3>" + esc(p.et) + "</h3>"
      + '<span class="tot">' + (righe.length ? fmtKcal(tot) : "") + "</span>"
      + '<button class="add" data-add="' + p.k + '" aria-label="Aggiungi a ' + esc(p.et) + '">+</button></div>';
    if (righe.length) {
      h += '<div class="meal-l">' + righe.map(function (f) {
        return '<div class="ri" data-f="' + f.id + '"><span class="nm">' + esc(f.name)
          + (f.portion || f.grams ? ' <em>' + esc([f.portion, f.grams ? fmtN(f.grams, 0) + " g" : ""].filter(Boolean).join(" · ")) + "</em>" : "")
          + '</span><span class="kc">' + (f.kcal == null ? "—" : fmtK(f.kcal)) + "</span></div>";
      }).join("") + "</div>";
    }
    h += "</div>";
  });
  h += "</div>";

  /* ---- l'attivita' ---- */
  var sesGiorno = SES.filter(function (s) { return s.person_id === pid && s.day === DIA_DAY; });
  var senzaKcal = sesGiorno.filter(function (s) {
    return !act.some(function (a) { return a.session_id === s.id; });
  });

  h += '<div class="sect">L\'attività<button class="btn" id="dAddAct">Aggiungi un\'attività</button></div>';
  senzaKcal.forEach(function (s) {
    h += '<div class="card banner"><span>Hai fatto <b>' + esc(s.program_name || "un allenamento") + "</b>"
      + (s.duration_sec ? " (" + esc(fmtDurata(s.duration_sec)) + ")" : "")
      + ": metto nel diario le calorie stimate esercizio per esercizio?</span>"
      + '<button class="btn" data-imp="' + s.id + '">Aggiungi</button></div>';
  });
  if (act.length) {
    h += '<div class="card"><div class="meal-l">' + act.map(function (a) {
      return '<div class="ri" data-a="' + a.id + '"><span class="nm">' + esc(a.name)
        + (a.minutes ? " <em>" + esc(fmtN(a.minutes, a.minutes % 1 ? 1 : 0)) + " min</em>" : "")
        + (a.session_id ? ' <span class="badge">cronometro</span>' : "")
        + '</span><span class="kc">' + (a.kcal == null ? "—" : fmtK(a.kcal)) + "</span></div>";
    }).join("") + "</div></div>";
  } else if (!senzaKcal.length) {
    h += '<div class="card" style="padding:18px 20px;font-size:13.5px;color:var(--ink-soft);line-height:1.6">'
      + "Nessuna attività segnata. Scrivi cosa hai fatto e per quanti minuti: le calorie le stimo io"
      + (pesoRif ? " sul tuo peso di " + esc(fmtPeso(pesoRif)) : ", ma senza un peso segnato uso 70 kg") + ".</div>";
  }

  h += '<div class="nota">Le calorie bruciate sono una stima (MET × peso × tempo) e contano solo l\'attività, '
    + "non quello che il corpo consuma da solo per vivere. Servono a confrontare un giorno con l'altro, non a fare i conti al grammo.</div>";

  $("vDia").innerHTML = h;
  legaTestaGiorno();

  $("dPeso").addEventListener("click", function () {
    apriMisura(pesata ? pesata.id : null, { day: DIA_DAY, person_id: pid });
  });
  $("vDia").querySelectorAll("[data-add]").forEach(function (b) {
    b.addEventListener("click", function () { apriCibo(null, b.dataset.add); });
  });
  $("vDia").querySelectorAll("[data-f]").forEach(function (r) {
    r.addEventListener("click", function () { apriCibo(r.dataset.f); });
  });
  $("vDia").querySelectorAll("[data-a]").forEach(function (r) {
    r.addEventListener("click", function () { apriAttivita(r.dataset.a); });
  });
  $("vDia").querySelectorAll("[data-imp]").forEach(function (b) {
    b.addEventListener("click", function () { importaSessione(b.dataset.imp, b); });
  });
  $("dAddAct").addEventListener("click", function () { apriAttivita(null); });
}

/* Dopo ogni modifica: rileggo il giorno e dimentico i totali, che
   sono cambiati. */
function ricaricaGiorno() {
  DIA = null;
  AND_DATI = null;
  renderDiario();
}

/* =====================================================================
   UNA COSA MANGIATA
   ===================================================================== */

var CIBOEDIT = null;
var CIBO_RIF = null;        /* { k100 } la base per ricalcolare dai grammi */
var CIBO_KCAL_MANO = false; /* le calorie le hai scritte tu: non le tocco piu' */

function trovaCibo(nome) {
  var n = String(nome || "").trim().toLowerCase();
  if (!n) return null;
  var pid = personaDiario();
  var fav = (FAV[pid] || []).filter(function (f) { return f.name.toLowerCase() === n; })[0];
  if (fav) return { tipo: "tuo", name: fav.name, portion: fav.portion, grams: fav.grams, kcal: fav.kcal,
    k100: (fav.grams && fav.kcal != null) ? (Number(fav.kcal) / Number(fav.grams)) * 100 : null };
  var c = CIBI.filter(function (x) { return x.name.toLowerCase() === n; })[0];
  if (c) return { tipo: "tabella", name: c.name, portion: c.portion, grams: c.g, kcal: Math.round(c.k100 * c.g / 100), k100: c.k100 };
  return null;
}

function riempiListaCibi() {
  var pid = personaDiario();
  var visti = {};
  var h = "";
  (FAV[pid] || []).forEach(function (f) {
    var k = f.name.toLowerCase();
    if (visti[k]) return; visti[k] = 1;
    h += '<option value="' + esc(f.name) + '">' + esc([f.portion, f.kcal != null ? fmtK(f.kcal) + " kcal" : ""].filter(Boolean).join(" · ")) + "</option>";
  });
  CIBI.forEach(function (c) {
    var k = c.name.toLowerCase();
    if (visti[k]) return; visti[k] = 1;
    h += '<option value="' + esc(c.name) + '">' + fmtK(c.k100) + " kcal/100 g</option>";
  });
  $("ciboLista").innerHTML = h;
}

function apriCibo(id, pasto) {
  CIBOEDIT = id ? DIA.food.filter(function (f) { return f.id === id; })[0] : null;
  var f = CIBOEDIT;
  riempiListaCibi();
  $("ciTitle").textContent = f ? "Modifica" : pastoDi(pasto).et;
  $("ciM").innerHTML = PASTI.map(function (p) { return '<option value="' + p.k + '">' + esc(p.et) + "</option>"; }).join("");
  $("ciM").value = f ? f.meal : pasto;
  $("ciN").value = f ? f.name : "";
  $("ciP").value = f && f.portion ? f.portion : "";
  $("ciG").value = f && f.grams != null ? f.grams : "";
  $("ciK").value = f && f.kcal != null ? f.kcal : "";
  CIBO_KCAL_MANO = false;
  CIBO_RIF = null;
  if (f && f.grams && f.kcal != null) CIBO_RIF = { k100: Number(f.kcal) / Number(f.grams) * 100 };
  $("ciHint").innerHTML = "";
  $("ciDel").hidden = !f;
  $("ciSaveMore").hidden = !!f;
  $("ciboModal").hidden = false;
  if (!f) setTimeout(function () { $("ciN").focus(); }, 120);
}

function ciboNomeCambiato() {
  var t = trovaCibo($("ciN").value);
  if (!t) { CIBO_RIF = null; $("ciHint").innerHTML = ""; return; }
  CIBO_RIF = t.k100 != null ? { k100: t.k100 } : null;
  if (!$("ciP").value.trim() || !CIBOEDIT) $("ciP").value = t.portion || "";
  if (!$("ciG").value.trim() || !CIBOEDIT) $("ciG").value = t.grams != null ? t.grams : "";
  if (!CIBO_KCAL_MANO || !$("ciK").value.trim()) { $("ciK").value = t.kcal != null ? Math.round(t.kcal) : ""; CIBO_KCAL_MANO = false; }
  $("ciHint").innerHTML = t.tipo === "tuo"
    ? "Come l'ultima volta che l'hai scritto."
    : "Dalla tabella: <b>" + fmtK(t.k100) + " kcal ogni 100 g</b>. Cambia i grammi e ricalcolo.";
}
function ciboGrammiCambiati() {
  var g = num($("ciG").value);
  if (!CIBO_RIF || g == null || CIBO_KCAL_MANO) return;
  $("ciK").value = Math.round(CIBO_RIF.k100 * g / 100);
}

function salvaCibo(ancora) {
  var pid = personaDiario();
  var nome = $("ciN").value.trim();
  if (!nome) { toast("Scrivi cosa hai mangiato."); $("ciN").focus(); return; }
  var dati = {
    person_id: pid,
    day: CIBOEDIT ? CIBOEDIT.day : DIA_DAY,
    meal: $("ciM").value,
    name: nome,
    portion: $("ciP").value.trim() || null,
    grams: num($("ciG").value),
    kcal: num($("ciK").value)
  };
  var q = CIBOEDIT
    ? sb.from("food_entries").update(dati).eq("id", CIBOEDIT.id)
    : sb.from("food_entries").insert(dati);
  guard(q, "salva cibo").then(function () {
    FAV[pid] = null;   /* la prossima volta rileggo i preferiti, con questo dentro */
    toast(CIBOEDIT ? "Aggiornato" : "Aggiunto a " + pastoDi(dati.meal).et.toLowerCase());
    if (ancora) {
      /* "Salva e aggiungi un altro": resto nello stesso pasto, campi puliti */
      $("ciN").value = ""; $("ciP").value = ""; $("ciG").value = ""; $("ciK").value = "";
      $("ciHint").innerHTML = ""; CIBO_RIF = null; CIBO_KCAL_MANO = false;
      $("ciN").focus();
    } else {
      $("ciboModal").hidden = true;
    }
    ricaricaGiorno();
  });
}
function eliminaCibo() {
  if (!CIBOEDIT) return;
  if (!confirm("Tolgo «" + CIBOEDIT.name + "» dal diario?")) return;
  guard(sb.from("food_entries").delete().eq("id", CIBOEDIT.id), "elimina cibo").then(function () {
    $("ciboModal").hidden = true;
    toast("Tolto");
    ricaricaGiorno();
  });
}

/* =====================================================================
   UN'ATTIVITA'
   ===================================================================== */

var ATTEDIT = null;
var ATT_KCAL_MANO = false;

function apriAttivita(id) {
  ATTEDIT = id ? DIA.act.filter(function (a) { return a.id === id; })[0] : null;
  var a = ATTEDIT;
  $("atTitle").textContent = a ? "Modifica l'attività" : "Un'attività";
  $("atN").value = a ? a.name : "";
  $("atMin").value = a && a.minutes != null ? a.minutes : "";
  $("atV").value = "";
  $("atK").value = a && a.kcal != null ? a.kcal : "";
  ATT_KCAL_MANO = false;
  $("atDel").hidden = !a;
  $("atQuick").innerHTML = ATTIVITA_RAPIDE.map(function (n) {
    return '<button type="button" class="pick pick-in" data-n="' + esc(n) + '">' + esc(n) + "</button>";
  }).join("");
  $("atQuick").querySelectorAll("[data-n]").forEach(function (b) {
    b.addEventListener("click", function () {
      $("atN").value = b.dataset.n; ATT_KCAL_MANO = false; attivitaCambiata();
      if (!$("atMin").value) $("atMin").focus();
    });
  });
  var visti = {}, opz = "";
  ATTIVITA.forEach(function (x) { if (!visti[x[1]]) { visti[x[1]] = 1; opz += '<option value="' + esc(x[1]) + '">'; } });
  $("atLista").innerHTML = opz;
  attivitaCambiata(true);
  $("attModal").hidden = false;
}

function attivitaCambiata(soloHint) {
  var nome = $("atN").value;
  var tapis = /(tapis|tappeto|treadmill)/i.test(nome);
  $("atVBox").hidden = !tapis;
  var vel = tapis ? num($("atV").value) : null;
  var min = num($("atMin").value);
  var pid = personaDiario();
  var kg = pesoPer(pid, ATTEDIT ? ATTEDIT.day : DIA_DAY);
  var m = stimaMet(nome, vel);
  var k = kcalDa(m.met, kg, min || 0);
  if (!soloHint && !ATT_KCAL_MANO) $("atK").value = min ? k : "";
  if (!nome.trim()) { $("atHint").innerHTML = ""; return; }
  $("atHint").innerHTML = (m.noto ? "" : "Non la conosco: la conto come un'attività moderata. ")
    + "MET <b>" + esc(fmtN(m.met, 1)) + "</b> × " + (kg ? esc(fmtPeso(kg)) : "70 kg (non hai un peso segnato)")
    + (min ? " × " + esc(fmtN(min, min % 1 ? 1 : 0)) + " min = <b>" + fmtKcal(k) + "</b>" : " · scrivi i minuti");
}

function salvaAttivita() {
  var pid = personaDiario();
  var nome = $("atN").value.trim();
  if (!nome) { toast("Scrivi che attività hai fatto."); $("atN").focus(); return; }
  var tapis = /(tapis|tappeto|treadmill)/i.test(nome);
  var dati = {
    person_id: pid,
    day: ATTEDIT ? ATTEDIT.day : DIA_DAY,
    name: nome,
    minutes: num($("atMin").value),
    kcal: num($("atK").value),
    met: stimaMet(nome, tapis ? num($("atV").value) : null).met
  };
  var q = ATTEDIT
    ? sb.from("activity_entries").update(dati).eq("id", ATTEDIT.id)
    : sb.from("activity_entries").insert(dati);
  guard(q, "salva attività").then(function () {
    $("attModal").hidden = true;
    toast(ATTEDIT ? "Aggiornata" : "Attività aggiunta");
    ricaricaGiorno();
  });
}
function eliminaAttivita() {
  if (!ATTEDIT) return;
  if (!confirm("Tolgo «" + ATTEDIT.name + "» dal diario?")) return;
  guard(sb.from("activity_entries").delete().eq("id", ATTEDIT.id), "elimina attività").then(function () {
    $("attModal").hidden = true;
    toast("Tolta");
    ricaricaGiorno();
  });
}

/* ---------- dagli allenamenti col cronometro ----------
   Una riga per ogni esercizio con del tempo dentro. Le usa sia il
   salvataggio a fine allenamento sia il pulsante "Aggiungi" per gli
   allenamenti fatti prima che il diario esistesse. */
function righeDaSessione(s, sessionId) {
  var passi = Array.isArray(s.steps) ? s.steps : [];
  var kg = s.weight_before != null ? Number(s.weight_before) : pesoPer(s.person_id, s.day);
  return passi.filter(function (p) { return p.sec > 0; }).map(function (p) {
    var m = stimaMet(p.n, p.vel);
    return {
      person_id: s.person_id || null,
      day: s.day,
      name: p.n + (p.vel != null ? " · vel " + p.vel : ""),
      minutes: Math.round((p.sec / 60) * 10) / 10,
      kcal: kcalDa(m.met, kg, p.sec / 60),
      met: m.met,
      session_id: sessionId
    };
  });
}

function importaSessione(id, btn) {
  var s = SES.filter(function (x) { return x.id === id; })[0];
  if (!s) return;
  var righe = righeDaSessione(s, s.id);
  if (!righe.length) {
    toast("Quell'allenamento non ha tempi registrati: aggiungi l'attività a mano.");
    return;
  }
  btn.disabled = true;
  guard(sb.from("activity_entries").insert(righe), "importa allenamento").then(function () {
    toast("Calorie dell'allenamento aggiunte");
    ricaricaGiorno();
  }).catch(function () { btn.disabled = false; });
}

/* =====================================================================
   L'ANDAMENTO
   Giorno dopo giorno: quante ne entrano, quante ne escono, e cosa
   dice la bilancia.
   ===================================================================== */

function renderAndamento() {
  var pid = personaDiario();
  if (!pid) {
    sceltaPersona("vAnd", "L'andamento è di una persona sola: le calorie di due persone sommate non dicono niente. Di chi?");
    return;
  }
  var dal = spostaGiorno(oggiISO(), -(AND_GG - 1));
  var key = pid + "|" + AND_GG;
  if (!AND_DATI || AND_DATI.key !== key) {
    $("vAnd").innerHTML = '<div class="card" style="padding:30px;text-align:center;color:var(--ink-soft)">Carico…</div>';
    guard(sb.from("daily_energy").select("*").eq("person_id", pid).gte("day", dal).order("day"), "andamento")
      .then(function (r) {
        AND_DATI = { key: key, righe: r || [] };
        if (VISTA === "andam") renderAndamento();
      }).catch(function () {
        $("vAnd").innerHTML = '<div class="empty"><div class="emo">📉</div><h3>Nessun dato</h3>'
          + "<p>Probabilmente manca l'ultimo aggiornamento del database: esegui <b>schema11.sql</b>.</p></div>";
      });
    return;
  }

  var perGiorno = {};
  AND_DATI.righe.forEach(function (r) { perGiorno[String(r.day).slice(0, 10)] = r; });
  var pesate = misureDi(pid).filter(function (m) { return m.day >= dal; });
  var pesoGiorno = {};
  pesate.forEach(function (m) { pesoGiorno[m.day] = m; });

  /* i giorni del periodo, dal piu' vecchio a oggi */
  var giorni = [];
  for (var i = AND_GG - 1; i >= 0; i--) giorni.push(spostaGiorno(oggiISO(), -i));

  var ptsIn = [], ptsOut = [], ptsPeso = [];
  var sIn = 0, sOut = 0, nReg = 0;
  giorni.forEach(function (g) {
    var r = perGiorno[g];
    var t = dataDa(g).getTime();
    if (r && Number(r.n_food) > 0) {
      ptsIn.push({ t: t, v: Number(r.kcal_in), tip: fmtGiornoLungo(g) + " · assunte " + fmtKcal(r.kcal_in) });
      sIn += Number(r.kcal_in); sOut += Number(r.kcal_out); nReg++;
    }
    if (r && Number(r.kcal_out) > 0) {
      ptsOut.push({ t: t, v: Number(r.kcal_out), tip: fmtGiornoLungo(g) + " · bruciate " + fmtKcal(r.kcal_out) });
    }
    if (pesoGiorno[g] && pesoGiorno[g].weight != null) {
      ptsPeso.push({ t: t, v: Number(pesoGiorno[g].weight), tip: fmtGiornoLungo(g) + " · " + fmtPeso(pesoGiorno[g].weight) });
    }
  });

  var h = '<div class="picks">'
    + [[7, "7 giorni"], [30, "30 giorni"], [90, "3 mesi"], [365, "Un anno"]].map(function (x) {
        return '<button class="pick' + (x[0] === AND_GG ? " on" : "") + '" data-gg="' + x[0] + '">' + x[1] + "</button>";
      }).join("")
    + "</div>";

  if (!nReg && !ptsOut.length && !ptsPeso.length) {
    $("vAnd").innerHTML = h + '<div class="empty"><div class="emo">📉</div><h3>Ancora niente in questo periodo</h3>'
      + "<p>Segna quello che mangi e l'attività nella scheda «La giornata»: qui si costruisce da solo il confronto giorno per giorno.</p></div>";
    legaAndamento();
    return;
  }

  var dPeso = ptsPeso.length > 1 ? Math.round((ptsPeso[ptsPeso.length - 1].v - ptsPeso[0].v) * 10) / 10 : null;
  h += '<div class="stats">'
    + '<div class="stat1"><b>' + (nReg ? fmtK(sIn / nReg) : "—") + "</b><span>kcal assunte, media al giorno</span></div>"
    + '<div class="stat1"><b>' + (nReg ? fmtK(sOut / nReg) : "—") + "</b><span>kcal bruciate, media al giorno</span></div>"
    + '<div class="stat1"><b>' + nReg + "</b><span>" + (nReg === 1 ? "giorno segnato" : "giorni segnati") + " su " + AND_GG + "</span></div>"
    + '<div class="stat1"><b>' + (ptsPeso.length ? esc(fmtPeso(ptsPeso[ptsPeso.length - 1].v)) : "—")
      + (dPeso ? ' <em class="dlt ' + (dPeso < 0 ? "giu" : "su") + '">' + (dPeso > 0 ? "+" : "") + esc(fmtN(dPeso, 1)) + "</em>" : "")
      + "</b><span>l'ultimo peso" + (dPeso != null ? ", e quanto è cambiato" : "") + "</span></div>"
    + "</div>";

  if (ptsIn.length || ptsOut.length) {
    var serie = [];
    if (ptsIn.length) serie.push({ pts: ptsIn, cls: "ln", ptCls: "pt", area: true });
    if (ptsOut.length) serie.push({ pts: ptsOut, cls: "ln2", ptCls: "pt2" });
    h += '<div class="sect">Le calorie, giorno per giorno</div>'
      + '<div class="card" style="padding:16px 12px 12px">' + graficoLinee(serie, { dec: 0, min0: true }) + "</div>"
      + '<div class="legend"><span><i style="background:var(--brass)"></i>assunte</span>'
      + '<span><i style="background:var(--rust)"></i>bruciate con l\'attività</span></div>';
  }
  if (ptsPeso.length) {
    h += '<div class="sect">Il peso</div>'
      + '<div class="card" style="padding:16px 12px 12px">' + graficoLinee([{ pts: ptsPeso, cls: "ln", ptCls: "pt", area: true }], { dec: 1 }) + "</div>";
  }

  /* ---- la tabella: i giorni piu' recenti in alto ---- */
  h += '<div class="sect">Giorno per giorno</div>'
    + '<div class="card"><div style="overflow-x:auto"><table class="tbl"><thead><tr>'
    + '<th>Giorno</th><th class="num">Assunte</th><th class="num">Bruciate</th><th class="num">Differenza</th><th class="num">Peso</th>'
    + "</tr></thead><tbody>";
  giorni.slice().reverse().forEach(function (g) {
    var r = perGiorno[g], m = pesoGiorno[g];
    if (!r && !m && g !== oggiISO()) return;     /* i giorni vuoti non occupano righe */
    var hasIn = r && Number(r.n_food) > 0;
    var inn = hasIn ? Number(r.kcal_in) : null;
    var out = r ? Number(r.kcal_out) : 0;
    var diff = hasIn ? inn - out : null;
    h += '<tr data-g="' + g + '">'
      + '<td class="d">' + esc(fmtGiorno(g)) + "</td>"
      + '<td class="num">' + (hasIn ? fmtK(inn) : "—") + "</td>"
      + '<td class="num">' + (out ? fmtK(out) : "—") + "</td>"
      + '<td class="num">' + (diff == null ? "—" : (diff > 0 ? "+" : "") + fmtK(diff)) + "</td>"
      + '<td class="num">' + (m ? esc(fmtPeso(m.weight)) : "—") + "</td>"
      + "</tr>";
  });
  h += "</tbody></table></div></div>"
    + '<div class="nota">Tocca un giorno per aprirlo. I giorni in cui non hai segnato niente da mangiare restano fuori dalle medie: '
    + "contarli come zero farebbe sembrare che hai digiunato.</div>";

  $("vAnd").innerHTML = h;
  legaAndamento();
}

function legaAndamento() {
  $("vAnd").querySelectorAll("[data-gg]").forEach(function (b) {
    b.addEventListener("click", function () { AND_GG = +b.dataset.gg; renderAndamento(); });
  });
  $("vAnd").querySelectorAll("tr[data-g]").forEach(function (tr) {
    tr.addEventListener("click", function () {
      DIA_DAY = tr.dataset.g;
      mostraVista("diario");
    });
  });
}

/* =====================================================================
   AVVIO
   ===================================================================== */

$("ciClose").addEventListener("click", function () { $("ciboModal").hidden = true; });
$("ciCancel").addEventListener("click", function () { $("ciboModal").hidden = true; });
$("ciSave").addEventListener("click", function () { salvaCibo(false); });
$("ciSaveMore").addEventListener("click", function () { salvaCibo(true); });
$("ciDel").addEventListener("click", eliminaCibo);
$("ciN").addEventListener("change", ciboNomeCambiato);
$("ciN").addEventListener("input", function () {
  /* scegliere dalla lista suggerita manda "input", non sempre "change" */
  if (trovaCibo(this.value)) ciboNomeCambiato();
});
$("ciG").addEventListener("input", ciboGrammiCambiati);
$("ciK").addEventListener("input", function () { CIBO_KCAL_MANO = !!this.value.trim(); });

$("atClose").addEventListener("click", function () { $("attModal").hidden = true; });
$("atCancel").addEventListener("click", function () { $("attModal").hidden = true; });
$("atSave").addEventListener("click", salvaAttivita);
$("atDel").addEventListener("click", eliminaAttivita);
["atN", "atMin", "atV"].forEach(function (id) {
  $(id).addEventListener("input", function () { attivitaCambiata(false); });
});
$("atK").addEventListener("input", function () { ATT_KCAL_MANO = !!this.value.trim(); });
