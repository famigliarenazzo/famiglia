/* =====================================================================
   I NOSTRI VIAGGI
   Un viaggio e' una riga sola nella tabella trips: le colonne in chiaro
   servono all'elenco, tutto il resto (giorni, luoghi, spostamenti,
   spese, documenti, checklist) sta nel campo `dati`, in jsonb.
   ===================================================================== */

/* ---------------- il registro delle icone ---------------- */
var ICONS = {
  volo:      { label: "Volo", color: "#3E6FD8", fill: true, svg: '<path d="M21 15.5v-1.8l-8-4.4V4a1.5 1.5 0 0 0-3 0v5.3L2 13.7v1.8l8-2v3.8l-2 1.4v1.5l3.5-1 3.5 1v-1.5l-2-1.4v-3.8z"/>' },
  auto:      { label: "Auto", color: "#E4A014", svg: '<path d="M6 11l1.3-3.3A2 2 0 0 1 9.2 6.5h5.6a2 2 0 0 1 1.9 1.2L18 11"/><path d="M4 11h16v4.5a1 1 0 0 1-1 1h-1.3a1 1 0 0 1-1-1V15H7.3v.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><circle cx="7.6" cy="13" r="1"/><circle cx="16.4" cy="13" r="1"/>' },
  treno:     { label: "Treno", color: "#1F9E77", svg: '<rect x="6" y="4" width="12" height="12.5" rx="2.5"/><path d="M6 11.5h12"/><circle cx="9" cy="14" r=".7"/><circle cx="15" cy="14" r=".7"/><path d="M8.5 16.5 6.5 20M15.5 16.5 17.5 20"/>' },
  autobus:   { label: "Autobus", color: "#C2185B", svg: '<rect x="5" y="4" width="14" height="12.5" rx="2.5"/><path d="M5 11.5h14M9 4v7.5"/><circle cx="8.5" cy="19" r="1.3"/><circle cx="15.5" cy="19" r="1.3"/>' },
  traghetto: { label: "Traghetto", color: "#0EA5A5", svg: '<path d="M4.5 15l1.2-4h12.6l1.2 4M7 11V7.5h10V11M10.5 7.5V5h3v2.5M3 19c1.2 0 1.8-1 3-1s1.8 1 3 1 1.8-1 3-1 1.8 1 3 1 1.8-1 3-1"/>' },
  piedi:     { label: "A piedi", color: "#64748B", svg: '<circle cx="13" cy="4.5" r="1.6"/><path d="M11.5 8.5 9 11l1.5 3M12 8l2.5 2 2 1M11 14l-2 6M13.5 12l1.5 8"/>' },
  soggiorno: { label: "Soggiorno", color: "#8B5CF6", tipo: "stay", svg: '<path d="M3 8v10M3 12.5h18V18M21 18v-3a2.5 2.5 0 0 0-2.5-2.5H9V15"/><circle cx="7" cy="10.5" r="1.6"/>' },
  tour:      { label: "Tour", color: "#F97316", svg: '<path d="M6 21V4M6 4h11l-2 3 2 3H6"/>' },
  museo:     { label: "Musei", color: "#B45309", svg: '<path d="M12 3l8 4H4zM5 10v7M9.5 10v7M14.5 10v7M19 10v7M3.5 20.5h17"/>' },
  parco:     { label: "Parchi", color: "#16A34A", svg: '<path d="M12 22v-5M8.5 17a4 4 0 0 1-1.4-7.75A4.5 4.5 0 0 1 16 8.2a3.5 3.5 0 0 1-.7 8.8z"/>' },
  "parco-nazionale": { label: "Parco nazionale", color: "#15803D", svg: '<path d="M3 20h18L14.5 8l-3 5.2-2.2-2.4zM11.5 13.2 15 20"/>' },
  ristorante:{ label: "Ristorante", color: "#DC2626", svg: '<path d="M6 3v6a2 2 0 0 0 4 0V3M8 9v12M16 3c-1.4 1-2 3-2 5s.6 3 2 3v10"/>' },
  colazione: { label: "Colazione", color: "#A16207", svg: '<path d="M4 9h13v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM17 10h2a2 2 0 0 1 0 4h-2M8 3c-.5.8-.5 1.7 0 2.5M12 3c-.5.8-.5 1.7 0 2.5"/>' },
  shopping:  { label: "Shopping", color: "#DB2777", svg: '<path d="M6 8h12l-1 12H7zM9 8V6a3 3 0 0 1 6 0v2"/>' },
  evento:    { label: "Eventi", color: "#7C3AED", svg: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8 3v4M16 3v4"/><path d="M12 12l1 2 2.2.3-1.6 1.5.4 2.2-2-1.1-2 1.1.4-2.2L8.8 14.3l2.2-.3z"/>' },
  bambini:   { label: "Bambini", color: "#0EA5E9", svg: '<circle cx="12" cy="5" r="2"/><path d="M12 8v6M8.5 11h7M9 21l3-7 3 7"/>' },
  atm:       { label: "ATM", color: "#059669", svg: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M3 10h18M7 15h4"/>' },
  lavanderia:{ label: "Lavanderia", color: "#2563EB", svg: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M5 8h14"/><circle cx="12" cy="14" r="4"/><path d="M7.2 5.5h.01M10 5.5h.01"/>' },
  parcheggio:{ label: "Parcheggio", color: "#1D4ED8", svg: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M9 17V8h3.6a2.5 2.5 0 0 1 0 5H9"/>' },
  farmacia:  { label: "Farmacia", color: "#E11D48", svg: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M12 8v8M8 12h8"/>' },
  luogo:     { label: "Luogo", color: "#475569", svg: '<circle cx="12" cy="10" r="2.6"/><path d="M12 21c4-5 7-8 7-11a7 7 0 1 0-14 0c0 3 3 6 7 11z"/>' },
  check:     { label: "", color: "#fff", svg: '<path d="M20 6 9 17l-5-5"/>' }
};
var TRASPORTI = ["volo", "auto", "treno", "autobus", "traghetto", "piedi"];
var LUOGHI = ["soggiorno", "tour", "museo", "parco", "parco-nazionale", "ristorante", "colazione", "shopping", "evento", "bambini", "atm", "lavanderia", "parcheggio", "farmacia", "luogo"];
var SU_STRADA = ["auto", "autobus"];
var CAT_SPESA = ["Volo", "Treno", "Auto / carburante", "Trasporti locali", "Hotel", "Appartamento", "Visti e documenti", "Assicurazione", "Cibo", "Attrazioni", "Shopping", "Altro"];
var TIPI_DOC = ["Volo", "Treno", "Hotel", "Appartamento", "Visto", "Noleggio", "Biglietto", "Altro"];

function ico(name, size, color) {
  var i = ICONS[name] || ICONS.luogo;
  var base = 'width="' + size + '" height="' + size + '" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"';
  return i.fill
    ? '<svg ' + base + ' fill="' + color + '" stroke="none">' + i.svg + '</svg>'
    : '<svg ' + base + ' fill="none" stroke="' + color + '" stroke-width="1.9">' + i.svg + '</svg>';
}
function isStay(c) { return (ICONS[c] || {}).tipo === "stay"; }

/* ---------------- utilita' ---------------- */
var uid = function () { return Math.random().toString(36).slice(2, 10); };
var oggi = function () { return new Date().toISOString().slice(0, 10); };
function dataBreve(iso) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });
}
function dataLunga(iso) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}
function num(x) { var n = parseFloat(String(x == null ? "" : x).replace(",", ".")); return isNaN(n) ? 0 : n; }

/* Distanza in linea d'aria, per i mezzi che non seguono le strade. */
function haversine(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return 0;
  var R = 6371, r = function (x) { return x * Math.PI / 180; };
  var dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng);
  var h = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.pow(Math.sin(dLng / 2), 2);
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}
/* Un arco al posto della retta: due tratte fra gli stessi luoghi non si
   sovrappongono, e il volo si riconosce dalla curva. */
function curva(a, b, ampio) {
  var dx = b.lat - a.lat, dy = b.lng - a.lng, d = Math.hypot(dx, dy) || 1;
  var off = (ampio ? 0.16 : 0.05) * d;
  var cx = (a.lat + b.lat) / 2 + (-dy / d) * off, cy = (a.lng + b.lng) / 2 + (dx / d) * off;
  var pts = [];
  for (var t = 0; t <= 1.0001; t += 0.05) {
    var u = 1 - t;
    pts.push([u * u * a.lat + 2 * u * t * cx + t * t * b.lat, u * u * a.lng + 2 * u * t * cy + t * t * b.lng]);
  }
  return pts;
}

/* ---------------- stato ---------------- */
var trips = [], trip = null, tab = "panoramica";
var mappa = null, strato = null, cacheRotte = {}, pickMode = null;

/* Il documento jsonb, con i suoi elenchi sempre presenti: cosi' il resto
   del programma non deve mai chiedersi se un campo esiste. */
function vuoto(d) {
  d = d || {};
  ["giorni", "luoghi", "spostamenti", "spese", "documenti", "checklist"].forEach(function (k) {
    if (!Array.isArray(d[k])) d[k] = [];
  });
  return d;
}
function viaggiatori(t) {
  var v = t.viaggiatori;
  if (typeof v === "string") { try { v = JSON.parse(v); } catch (e) { v = null; } }
  return Array.isArray(v) && v.length ? v : ["Io", "Lei"];
}
function tripKm(t) { return vuoto(t.dati).spostamenti.reduce(function (s, x) { return s + num(x.km); }, 0); }
function tripSpeso(t) { return vuoto(t.dati).spese.reduce(function (s, x) { return s + num(x.importo); }, 0); }

$("top").innerHTML = toolHeader("I nostri viaggi", "");

/* ---------------- salvataggio ---------------- */
/* Salva il viaggio aperto. Il documento e' uno, quindi il salvataggio e'
   uno: non c'e' modo che meta' modifica arrivi e meta' no. */
var salvaTimer = null;
function salva(subito) {
  if (!trip) return Promise.resolve();
  clearTimeout(salvaTimer);
  var fai = function () {
    return guard(sb.from("trips").update({
      titolo: trip.titolo, destinazione: trip.destinazione, inizio: trip.inizio || null,
      fine: trip.fine || null, budget: trip.budget, stato: trip.stato,
      viaggiatori: viaggiatori(trip), copertina: trip.copertina || null,
      dati: trip.dati, updated_at: new Date().toISOString()
    }).eq("id", trip.id), "salva viaggio");
  };
  if (subito) return fai();
  return new Promise(function (res) { salvaTimer = setTimeout(function () { fai().then(res); }, 600); });
}

/* ---------------- avvio ---------------- */
requireAuth().then(function () {
  setStatus("", "Carico…");
  return guard(sb.from("trips").select("*").order("inizio", { ascending: false }), "elenco viaggi");
}).then(function (rows) {
  trips = (rows || []).map(function (t) { t.dati = vuoto(t.dati); return t; });
  home();
}).catch(function () { });

/* ============================ HOME ============================ */
function home() {
  trip = null;
  $("top").innerHTML = toolHeader("I nostri viaggi", trips.length ? trips.length + (trips.length === 1 ? " viaggio" : " viaggi") : "");
  var kmTot = trips.reduce(function (s, t) { return s + tripKm(t); }, 0);

  var h = '<div class="bar">'
    + '<div class="search"><span class="mag">🔎</span><input type="text" id="q" placeholder="Cerca un viaggio…"></div>'
    + '<button class="btn" id="nuovo">+ Nuovo viaggio</button>'
    + '</div>';

  if (kmTot) h += '<p style="color:var(--on-bg-soft);font-size:13.5px;margin:-6px 0 16px">'
    + '<b style="color:var(--brass-text)">' + kmTot.toLocaleString("it-IT") + '</b> km percorsi in tutto.</p>';

  h += '<div class="trips" id="lista"></div>';
  $("wrap").innerHTML = h;
  $("nuovo").addEventListener("click", function () { apriNuovo(null); });
  $("q").addEventListener("input", function () { disegnaLista(this.value); });
  disegnaLista("");
  setStatus("ok", "Pronto");
}

function disegnaLista(q) {
  q = (q || "").trim().toLowerCase();
  var els = trips.filter(function (t) {
    if (!q) return true;
    return (t.titolo + " " + (t.destinazione || "")).toLowerCase().indexOf(q) >= 0;
  });
  if (!els.length) {
    $("lista").innerHTML = '<div class="empty"><div class="emo">🧭</div>'
      + '<h3>' + (q ? "Nessun viaggio trovato" : "Nessun viaggio, per ora") + '</h3>'
      + '<p>' + (q ? "Prova con un'altra parola." : "Il primo si aggiunge dal pulsante qui sopra. Poi si riempie strada facendo: i luoghi, le tratte, le spese, il diario della sera.") + '</p></div>';
    return;
  }
  $("lista").innerHTML = els.map(function (t) {
    var d = vuoto(t.dati);
    var cls = t.stato === "in corso" ? "corso" : (t.stato === "concluso" ? "chiuso" : "");
    return '<div class="tcard" data-id="' + t.id + '">'
      + '<div class="cov">'
      + (t.copertina ? '<img src="' + esc(t.copertina) + '" alt="">' : '<div class="ph">🗺️</div>')
      + '<span class="st ' + cls + '">' + esc(t.stato) + '</span>'
      + '</div>'
      + '<div class="nfo">'
      + '<h3>' + esc(t.titolo) + '</h3>'
      + (t.destinazione ? '<div class="dest">' + esc(t.destinazione) + '</div>' : '')
      + '<div class="when">' + dataBreve(t.inizio) + ' → ' + dataBreve(t.fine) + '</div>'
      + '<div class="num">'
      + '<div><b>' + d.luoghi.length + '</b>luoghi</div>'
      + '<div><b>' + tripKm(t).toLocaleString("it-IT") + '</b>km</div>'
      + '<div><b>' + Math.round(tripSpeso(t)) + ' €</b>spesi</div>'
      + '</div></div></div>';
  }).join("");
  Array.prototype.forEach.call(document.querySelectorAll(".tcard"), function (el) {
    el.addEventListener("click", function () { apri(el.getAttribute("data-id")); });
  });
}

/* ---------------- nuovo / modifica viaggio ---------------- */
var nvEdit = null;
function apriNuovo(t) {
  nvEdit = t;
  $("nvTitle").textContent = t ? "Modifica il viaggio" : "Nuovo viaggio";
  var v = t ? viaggiatori(t) : ["Io", ""];
  $("nvT").value = t ? t.titolo : "";
  $("nvD").value = t ? (t.destinazione || "") : "";
  $("nvI").value = t ? (t.inizio || "") : oggi();
  $("nvF").value = t ? (t.fine || "") : oggi();
  $("nvB").value = t && t.budget ? t.budget : "";
  $("nvS").value = t ? t.stato : "in programma";
  $("nvV1").value = v[0] || "Io";
  $("nvV2").value = v[1] || "";
  $("nvDel").hidden = !t;
  $("nvModal").hidden = false;
}
$("nvClose").addEventListener("click", function () { $("nvModal").hidden = true; });
$("nvCancel").addEventListener("click", function () { $("nvModal").hidden = true; });
$("nvSave").addEventListener("click", function () {
  var t = $("nvT").value.trim();
  if (!t) { toast("Il titolo serve"); return; }
  var rec = {
    titolo: t, destinazione: $("nvD").value.trim() || null,
    inizio: $("nvI").value || null, fine: $("nvF").value || null,
    budget: num($("nvB").value) || null, stato: $("nvS").value,
    viaggiatori: [$("nvV1").value.trim() || "Io", $("nvV2").value.trim() || "Lei"]
  };
  if (nvEdit) {
    Object.assign(nvEdit, rec);
    guard(sb.from("trips").update(rec).eq("id", nvEdit.id), "modifica viaggio").then(function () {
      $("nvModal").hidden = true; toast("Salvato");
      if (trip) vista(); else disegnaLista($("q") ? $("q").value : "");
    });
  } else {
    rec.dati = vuoto({});
    guard(sb.from("trips").insert(rec).select().single(), "nuovo viaggio").then(function (r) {
      r.dati = vuoto(r.dati); trips.unshift(r);
      $("nvModal").hidden = true; apri(r.id);
    });
  }
});
$("nvDel").addEventListener("click", function () {
  if (!nvEdit) return;
  if (!confirm("Eliminare «" + nvEdit.titolo + "» e tutto quello che contiene?")) return;
  var id = nvEdit.id;
  guard(sb.from("trips").delete().eq("id", id), "elimina viaggio").then(function () {
    trips = trips.filter(function (x) { return x.id !== id; });
    $("nvModal").hidden = true; toast("Eliminato"); home();
  });
});

/* ============================ IL VIAGGIO ============================ */
function apri(id) {
  trip = trips.filter(function (t) { return t.id === id; })[0];
  if (!trip) return home();
  trip.dati = vuoto(trip.dati);
  tab = "panoramica";
  vista();
}

function vista() {
  var d = trip.dati;
  $("top").innerHTML = '<button class="back" id="indietro" title="Torna ai viaggi">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>'
    + '<div class="ttl"><h1>' + esc(trip.titolo) + '</h1>'
    + '<span class="sub">' + esc(trip.destinazione || "") + (trip.inizio ? " · " + dataBreve(trip.inizio) + " → " + dataBreve(trip.fine) : "") + '</span></div>'
    + '<button class="btn-ghost" id="modTrip">Modifica</button>';
  $("indietro").addEventListener("click", home);
  $("modTrip").addEventListener("click", function () { apriNuovo(trip); });

  var TABS = [
    ["panoramica", "Panoramica"], ["mappa", "Mappa"], ["itinerario", "Itinerario"],
    ["diario", "Diario"], ["spese", "Spese"], ["documenti", "Documenti"], ["valigia", "Valigia"]
  ];
  var h = '<div class="tabs">' + TABS.map(function (t) {
    return '<button data-t="' + t[0] + '"' + (tab === t[0] ? ' class="on"' : '') + '>' + t[1] + '</button>';
  }).join("") + '</div><div id="corpo"></div>';
  $("wrap").innerHTML = h;
  Array.prototype.forEach.call(document.querySelectorAll(".tabs button"), function (b) {
    b.addEventListener("click", function () { tab = b.getAttribute("data-t"); vista(); });
  });

  ({ panoramica: vPanoramica, mappa: vMappa, itinerario: vItinerario, diario: vDiario,
     spese: vSpese, documenti: vDocumenti, valigia: vValigia }[tab] || vPanoramica)();
}

/* ---------------- panoramica ---------------- */
function vPanoramica() {
  var d = trip.dati, speso = tripSpeso(trip), bud = num(trip.budget);
  var visti = d.luoghi.filter(function (l) { return l.visto; }).length;
  var fatti = d.checklist.filter(function (c) { return c.fatto; }).length;

  var h = '<div class="panel"><div class="stats">'
    + '<div><b>' + tripKm(trip).toLocaleString("it-IT") + '</b><span>km</span></div>'
    + '<div><b>' + visti + '/' + d.luoghi.length + '</b><span>luoghi visti</span></div>'
    + '<div><b>' + d.giorni.length + '</b><span>giorni</span></div>'
    + '<div><b>' + fmtEur(speso) + '</b><span>speso</span></div>'
    + '</div></div>';

  if (bud) {
    var pc = Math.min(100, speso / bud * 100);
    h += '<div class="panel"><div class="bud">'
      + '<div class="lbl"><span>Budget</span><b>' + fmtEur(speso) + ' di ' + fmtEur(bud) + '</b></div>'
      + '<div class="track"><div class="fill' + (speso > bud ? ' over' : '') + '" style="width:' + pc + '%"></div></div>'
      + '<div class="lbl" style="margin-top:7px;font-size:12px"><span>' + Math.round(pc) + '% usato</span>'
      + '<span>' + (speso > bud ? "sforato di " + fmtEur(speso - bud) : "restano " + fmtEur(bud - speso)) + '</span></div>'
      + '</div></div>';
  }

  h += '<div class="mapbox" id="map"></div>';

  var pross = d.giorni.slice().sort(function (a, b) { return (a.data || "") < (b.data || "") ? -1 : 1; });
  if (pross.length) {
    h += '<div class="panel"><h3>I giorni</h3>' + pross.map(function (g, i) {
      var sp = d.spostamenti.filter(function (s) { return s.giornoId === g.id; }).length;
      return '<div class="row" data-g="' + g.id + '">'
        + '<div class="ico" style="background:var(--brass);color:var(--on-brass);font-family:var(--disp);font-weight:700">' + (i + 1) + '</div>'
        + '<div class="txt"><div class="t">' + esc(g.titolo || dataLunga(g.data)) + '</div>'
        + '<div class="s">' + dataBreve(g.data) + (sp ? " · " + sp + " tratt" + (sp === 1 ? "a" : "e") : "") + (g.diario ? " · con diario" : "") + '</div></div>'
        + '</div>';
    }).join("") + '</div>';
  }

  $("corpo").innerHTML = h;
  Array.prototype.forEach.call(document.querySelectorAll("[data-g]"), function (el) {
    el.addEventListener("click", function () { tab = "diario"; vista(); });
  });
  disegnaMappa(d.luoghi, d.spostamenti);
}

/* ---------------- la mappa ---------------- */
function disegnaMappa(pins, linee) {
  var box = $("map");
  if (!box || !window.L) return;
  if (mappa) { try { mappa.remove(); } catch (e) { } mappa = null; }
  mappa = L.map(box, { zoomControl: false }).setView([41.9, 12.5], 4);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
    { attribution: "© OpenStreetMap © CARTO", subdomains: "abcd", maxZoom: 20 }).addTo(mappa);
  L.control.zoom({ position: "bottomright" }).addTo(mappa);
  strato = L.layerGroup().addTo(mappa);
  mappa.on("click", function (e) {
    if (!pickMode) return;
    pickMode({ lat: +e.latlng.lat.toFixed(5), lng: +e.latlng.lng.toFixed(5) });
  });

  var bounds = [];
  (pins || []).filter(function (p) { return p.lat != null; }).forEach(function (p) {
    bounds.push([p.lat, p.lng]);
    var cat = ICONS[p.categoria] || ICONS.luogo;
    var bg = p.visto ? cat.color : "#0f1c22", gl = p.visto ? "#fff" : cat.color;
    var icon = L.divIcon({
      className: "", iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -16],
      html: '<div class="pin" style="background:' + bg + ';border-color:' + cat.color + '">'
        + ico(p.categoria || "luogo", 17, gl)
        + (p.visto ? '<span class="ck">' + ico("check", 9, "#fff") + '</span>' : '')
        + '</div>'
    });
    L.marker([p.lat, p.lng], { icon: icon }).addTo(strato)
      .bindPopup('<b>' + esc(p.nome) + '</b><br><span style="color:' + cat.color + '">' + cat.label + '</span>'
        + (p.indirizzo ? '<br>' + esc(p.indirizzo) : ''));
  });

  var byId = {};
  (pins || []).forEach(function (p) { byId[p.id] = p; });
  var tratte = (linee || []).map(function (s) {
    return { id: s.id, a: byId[s.daId], b: byId[s.aId], mezzo: s.mezzo };
  }).filter(function (s) { return s.a && s.b && s.a.lat != null && s.b.lat != null; });
  tratte.forEach(function (s) { bounds.push([s.a.lat, s.a.lng]); bounds.push([s.b.lat, s.b.lng]); });

  if (bounds.length === 1) mappa.setView(bounds[0], 12);
  else if (bounds.length > 1) mappa.fitBounds(bounds, { padding: [45, 45] });

  /* Le tratte in auto seguono le strade vere, chieste a OSRM. Se il
     servizio non risponde si ripiega sull'arco: meglio una linea
     approssimata che una mappa vuota. */
  tratte.reduce(function (p, s) {
    return p.then(function () {
      return geometria(s.a, s.b, s.mezzo).then(function (g) {
        var c = (ICONS[s.mezzo] || ICONS.luogo).color;
        var stile = {
          auto: { weight: 5, opacity: .95 }, autobus: { weight: 5, opacity: .95 },
          volo: { weight: 2.5, opacity: .85, dashArray: "2 9" },
          treno: { weight: 3.5, opacity: .9, dashArray: "10 6" },
          traghetto: { weight: 3, opacity: .85, dashArray: "6 8" },
          piedi: { weight: 3, opacity: .8, dashArray: "1 7" }
        }[s.mezzo] || { weight: 3, opacity: .7, dashArray: "4 6" };
        stile.color = c; stile.lineCap = "round";
        L.polyline(g.coords, stile).addTo(strato)
          .bindPopup(((ICONS[s.mezzo] || {}).label || "Tratta") + " · " + g.km + " km");
        /* I km calcolati sulla strada vera valgono piu' di quelli in
           linea d'aria: se non li hai scritti a mano, li prendo io. */
        if (g.strada) {
          var sp = trip.dati.spostamenti.filter(function (x) { return x.id === s.id; })[0];
          if (sp && !sp.kmManuale && num(sp.km) !== g.km) { sp.km = g.km; salva(); }
        }
      });
    });
  }, Promise.resolve());
}

function geometria(a, b, mezzo) {
  var key = mezzo + ":" + a.lat + "," + a.lng + ";" + b.lat + "," + b.lng;
  if (cacheRotte[key]) return Promise.resolve(cacheRotte[key]);
  var fallback = function () {
    var out = { coords: curva(a, b, mezzo === "volo"), km: haversine(a, b), strada: false };
    cacheRotte[key] = out; return out;
  };
  if (SU_STRADA.indexOf(mezzo) < 0) return Promise.resolve(fallback());
  return fetch("https://router.project-osrm.org/route/v1/driving/" + a.lng + "," + a.lat + ";" + b.lng + "," + b.lat + "?overview=full&geometries=geojson")
    .then(function (r) { return r.json(); })
    .then(function (j) {
      if (!j.routes || !j.routes[0]) return fallback();
      var out = {
        coords: j.routes[0].geometry.coordinates.map(function (c) { return [c[1], c[0]]; }),
        km: Math.round(j.routes[0].distance / 1000), strada: true
      };
      cacheRotte[key] = out; return out;
    })
    .catch(fallback);
}

/* ---------------- mappa e luoghi ---------------- */
function vMappa() {
  var d = trip.dati;
  var h = '<div class="bar"><button class="btn" id="addLuogo">+ Aggiungi luogo</button>'
    + '<span class="count" style="margin-left:auto"><b>' + d.luoghi.length + '</b> luoghi</span></div>'
    + '<div class="mapbox" id="map"></div>';

  var gruppi = {};
  d.luoghi.forEach(function (l) { (gruppi[l.categoria] = gruppi[l.categoria] || []).push(l); });
  var ordine = LUOGHI.filter(function (k) { return gruppi[k]; });
  if (!ordine.length) {
    h += '<div class="empty"><div class="emo">📍</div><h3>Ancora nessun luogo</h3>'
      + '<p>Cerca un indirizzo o tocca la mappa: da qui nascono le tratte, i km e il resto.</p></div>';
  } else {
    ordine.forEach(function (k) {
      var c = ICONS[k];
      h += '<div class="panel"><h3><span style="display:inline-flex;align-items:center;gap:8px">'
        + ico(k, 16, c.color) + c.label + '</span><span style="font-weight:400;font-size:12.5px;color:var(--ink-soft)">'
        + gruppi[k].length + '</span></h3>'
        + gruppi[k].map(function (l) {
          return '<div class="row" data-l="' + l.id + '">'
            + '<div class="ico" style="background:' + c.color + '22">' + ico(k, 18, c.color) + '</div>'
            + '<div class="txt"><div class="t">' + esc(l.nome) + (l.visto ? ' ✓' : '') + '</div>'
            + '<div class="s">' + esc([l.indirizzo, l.orari, l.prezzo].filter(Boolean).join(" · ") || "—") + '</div></div>'
            + (l.voto ? '<div class="val">' + "★".repeat(l.voto) + '</div>' : '')
            + '</div>';
        }).join("") + '</div>';
    });
  }
  $("corpo").innerHTML = h;
  $("addLuogo").addEventListener("click", function () { apriLuogo(null); });
  Array.prototype.forEach.call(document.querySelectorAll("[data-l]"), function (el) {
    el.addEventListener("click", function () {
      var l = d.luoghi.filter(function (x) { return x.id === el.getAttribute("data-l"); })[0];
      apriLuogo(l);
    });
  });
  disegnaMappa(d.luoghi, d.spostamenti);
}

var lgEdit = null, lgCat = "luogo", lgVoto = 0;
function apriLuogo(l) {
  lgEdit = l;
  lgCat = l ? (l.categoria || "luogo") : "luogo";
  lgVoto = l ? (l.voto || 0) : 0;
  $("lgTitle").textContent = l ? "Modifica il luogo" : "Nuovo luogo";
  $("lgN").value = l ? l.nome : "";
  $("lgQ").value = ""; $("lgRes").innerHTML = "";
  $("lgLat").value = l && l.lat != null ? l.lat : "";
  $("lgLng").value = l && l.lng != null ? l.lng : "";
  $("lgA").value = l ? (l.indirizzo || "") : "";
  $("lgO").value = l ? (l.orari || "") : "";
  $("lgP").value = l ? (l.prezzo || "") : "";
  $("lgCi").value = l ? (l.checkin || "") : "";
  $("lgCo").value = l ? (l.checkout || "") : "";
  $("lgEx").value = l ? (l.infoExtra || "") : "";
  $("lgNo").value = l ? (l.note || "") : "";
  $("lgSeen").checked = l ? !!l.visto : false;
  $("lgDel").hidden = !l;
  disegnaCat(); disegnaStelle(); modoStay();
  $("lgModal").hidden = false;
}
function disegnaCat() {
  $("lgCat").innerHTML = LUOGHI.map(function (k) {
    var c = ICONS[k], on = lgCat === k;
    return '<button data-k="' + k + '" style="border-color:' + c.color + (on ? '' : '55')
      + ';background:' + (on ? c.color : 'transparent') + ';color:' + (on ? '#fff' : c.color) + '">'
      + ico(k, 15, on ? "#fff" : c.color) + c.label + '</button>';
  }).join("");
  Array.prototype.forEach.call($("lgCat").querySelectorAll("button"), function (b) {
    b.addEventListener("click", function () { lgCat = b.getAttribute("data-k"); disegnaCat(); modoStay(); });
  });
}
/* Un albergo non ha orari d'apertura e un museo non ha il check-out:
   i campi cambiano insieme alla categoria. */
function modoStay() {
  $("lgStay").hidden = !isStay(lgCat);
  $("lgOP").hidden = isStay(lgCat);
}
function disegnaStelle() {
  $("lgV").innerHTML = [1, 2, 3, 4, 5].map(function (n) {
    return '<button data-n="' + n + '"' + (n <= lgVoto ? ' class="on"' : '') + '>★</button>';
  }).join("");
  Array.prototype.forEach.call($("lgV").querySelectorAll("button"), function (b) {
    b.addEventListener("click", function () {
      var n = +b.getAttribute("data-n");
      lgVoto = (lgVoto === n ? 0 : n); disegnaStelle();
    });
  });
}
/* Nominatim: un indirizzo scritto diventa due coordinate. Un colpo solo
   per ricerca, come chiede la loro policy d'uso. */
$("lgGeo").addEventListener("click", function () {
  var q = $("lgQ").value.trim();
  if (!q) return;
  $("lgRes").innerHTML = '<div style="padding:9px 2px;font-size:13px;color:var(--ink-soft)">Cerco…</div>';
  fetch("https://nominatim.openstreetmap.org/search?format=json&limit=5&q=" + encodeURIComponent(q))
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (!res.length) { $("lgRes").innerHTML = '<div style="padding:9px 2px;font-size:13px;color:var(--ink-soft)">Niente. Prova con meno parole, o metti le coordinate a mano.</div>'; return; }
      $("lgRes").innerHTML = '<div class="geo-res">' + res.map(function (r, i) {
        return '<button data-i="' + i + '">' + esc(r.display_name) + '</button>';
      }).join("") + '</div>';
      Array.prototype.forEach.call($("lgRes").querySelectorAll("button"), function (b) {
        b.addEventListener("click", function () {
          var r = res[+b.getAttribute("data-i")];
          $("lgLat").value = (+r.lat).toFixed(5);
          $("lgLng").value = (+r.lon).toFixed(5);
          if (!$("lgA").value) $("lgA").value = r.display_name.split(",").slice(0, 3).join(",").trim();
          if (!$("lgN").value) $("lgN").value = r.display_name.split(",")[0];
          $("lgRes").innerHTML = '<div style="padding:9px 2px;font-size:13px;color:#7FB069">Posizione trovata.</div>';
        });
      });
    })
    .catch(function () { $("lgRes").innerHTML = '<div style="padding:9px 2px;font-size:13px;color:var(--rust)">Ricerca non riuscita.</div>'; });
});
$("lgClose").addEventListener("click", function () { $("lgModal").hidden = true; });
$("lgCancel").addEventListener("click", function () { $("lgModal").hidden = true; });
$("lgSave").addEventListener("click", function () {
  var n = $("lgN").value.trim();
  if (!n) { toast("Il nome serve"); return; }
  var rec = {
    id: lgEdit ? lgEdit.id : uid(), nome: n, categoria: lgCat,
    lat: $("lgLat").value ? num($("lgLat").value) : null,
    lng: $("lgLng").value ? num($("lgLng").value) : null,
    indirizzo: $("lgA").value.trim(), orari: $("lgO").value.trim(), prezzo: $("lgP").value.trim(),
    checkin: $("lgCi").value.trim(), checkout: $("lgCo").value.trim(), infoExtra: $("lgEx").value.trim(),
    note: $("lgNo").value.trim(), visto: $("lgSeen").checked, voto: lgVoto
  };
  var L = trip.dati.luoghi;
  if (lgEdit) { var i = L.findIndex(function (x) { return x.id === lgEdit.id; }); L[i] = rec; }
  else L.push(rec);
  salva(true).then(function () { $("lgModal").hidden = true; toast("Salvato"); vista(); });
});
$("lgDel").addEventListener("click", function () {
  if (!lgEdit) return;
  var id = lgEdit.id, d = trip.dati;
  var usato = d.spostamenti.filter(function (s) { return s.daId === id || s.aId === id; }).length;
  if (usato && !confirm("Questo luogo compare in " + usato + " tratt" + (usato === 1 ? "a" : "e") + ", che verranno eliminate. Procedo?")) return;
  d.luoghi = d.luoghi.filter(function (x) { return x.id !== id; });
  d.spostamenti = d.spostamenti.filter(function (s) { return s.daId !== id && s.aId !== id; });
  d.documenti.forEach(function (x) { if (x.luogoId === id) x.luogoId = null; });
  salva(true).then(function () { $("lgModal").hidden = true; toast("Eliminato"); vista(); });
});

/* ---------------- itinerario ---------------- */
function vItinerario() {
  var d = trip.dati;
  var giorni = d.giorni.slice().sort(function (a, b) { return (a.data || "") < (b.data || "") ? -1 : 1; });
  var byId = {}; d.luoghi.forEach(function (l) { byId[l.id] = l; });

  var h = '<div class="bar">'
    + '<button class="btn" id="addSp">+ Tratta</button>'
    + '<button class="btn-ghost" id="addG">+ Giorno</button>'
    + '<button class="btn-ghost" id="exp" style="margin-left:auto">Copia l\'itinerario</button>'
    + '</div>';

  if (!giorni.length) {
    h += '<div class="empty"><div class="emo">🧳</div><h3>Nessun giorno</h3>'
      + '<p>Aggiungi i giorni del viaggio: le tratte si appendono a quelli, e i km si sommano da soli.</p></div>';
  }

  giorni.forEach(function (g, i) {
    var sp = d.spostamenti.filter(function (s) { return s.giornoId === g.id; });
    sp.sort(function (a, b) { return (a.ora || "") < (b.ora || "") ? -1 : 1; });
    var km = sp.reduce(function (s, x) { return s + num(x.km); }, 0);
    h += '<div class="panel"><div class="day">'
      + '<div class="day-h"><div class="n">' + (i + 1) + '</div>'
      + '<div class="ti"><b>' + esc(g.titolo || dataLunga(g.data)) + '</b>'
      + '<span>' + dataBreve(g.data) + (km ? " · " + km.toLocaleString("it-IT") + " km" : "") + '</span></div></div>'
      + '<div class="day-b">'
      + (sp.length ? sp.map(function (s) {
          var c = (ICONS[s.mezzo] || ICONS.luogo).color;
          var a = byId[s.daId], b = byId[s.aId];
          return '<div class="leg" data-sp="' + s.id + '" style="cursor:pointer">'
            + '<span style="flex-shrink:0">' + ico(s.mezzo, 17, c) + '</span>'
            + '<span class="ln" style="background:' + c + '"></span>'
            + '<span class="d">' + esc((a ? a.nome : "?") + " → " + (b ? b.nome : "?"))
            + ' <s>' + (s.ora ? s.ora + " · " : "") + (num(s.km) ? num(s.km).toLocaleString("it-IT") + " km" : "") + (s.note ? " · " + esc(s.note) : "") + '</s></span></div>';
        }).join("") : '<div style="font-size:13px;color:var(--ink-soft);padding:4px 0">Nessuno spostamento questo giorno.</div>')
      + '</div></div></div>';
  });

  $("corpo").innerHTML = h;
  $("addSp").addEventListener("click", function () { apriSpost(null); });
  $("addG").addEventListener("click", function () { apriGiorno(null); });
  $("exp").addEventListener("click", esportaItinerario);
  Array.prototype.forEach.call(document.querySelectorAll("[data-sp]"), function (el) {
    el.addEventListener("click", function () {
      var s = d.spostamenti.filter(function (x) { return x.id === el.getAttribute("data-sp"); })[0];
      apriSpost(s);
    });
  });
}

function esportaItinerario() {
  var d = trip.dati, byId = {};
  d.luoghi.forEach(function (l) { byId[l.id] = l; });
  var L = [trip.titolo, trip.destinazione || "", dataLunga(trip.inizio) + " → " + dataLunga(trip.fine), ""];
  d.giorni.slice().sort(function (a, b) { return (a.data || "") < (b.data || "") ? -1 : 1; })
    .forEach(function (g, i) {
      L.push("Giorno " + (i + 1) + " · " + dataBreve(g.data) + (g.titolo ? " · " + g.titolo : ""));
      d.spostamenti.filter(function (s) { return s.giornoId === g.id; })
        .sort(function (a, b) { return (a.ora || "") < (b.ora || "") ? -1 : 1; })
        .forEach(function (s) {
          L.push("  " + (s.ora ? s.ora + "  " : "") + ((ICONS[s.mezzo] || {}).label || "") + ": "
            + ((byId[s.daId] || {}).nome || "?") + " → " + ((byId[s.aId] || {}).nome || "?")
            + (num(s.km) ? " (" + num(s.km) + " km)" : ""));
        });
      if (g.diario) L.push("  " + g.diario);
      L.push("");
    });
  var txt = L.join("\n");
  if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { toast("Itinerario copiato"); });
  else toast("Copia non disponibile");
}

var spEdit = null, spMezzo = "auto";
function apriSpost(s) {
  var d = trip.dati;
  if (!d.luoghi.length) { toast("Prima servono almeno due luoghi"); return; }
  spEdit = s; spMezzo = s ? s.mezzo : "auto";
  $("spTitle").textContent = s ? "Modifica la tratta" : "Nuova tratta";
  var opz = d.luoghi.map(function (l) { return '<option value="' + l.id + '">' + esc(l.nome) + '</option>'; }).join("");
  $("spDa").innerHTML = opz; $("spA").innerHTML = opz;
  $("spG").innerHTML = '<option value="">— nessun giorno —</option>' + d.giorni.slice()
    .sort(function (a, b) { return (a.data || "") < (b.data || "") ? -1 : 1; })
    .map(function (g, i) { return '<option value="' + g.id + '">Giorno ' + (i + 1) + " · " + dataBreve(g.data) + '</option>'; }).join("");
  $("spDa").value = s ? s.daId : d.luoghi[0].id;
  $("spA").value = s ? s.aId : (d.luoghi[1] || d.luoghi[0]).id;
  $("spG").value = s ? (s.giornoId || "") : (d.giorni[0] ? d.giorni[0].id : "");
  $("spO").value = s ? (s.ora || "") : "";
  $("spKm").value = s && s.kmManuale ? s.km : "";
  $("spNo").value = s ? (s.note || "") : "";
  $("spDel").hidden = !s;
  disegnaMezzi();
  $("spModal").hidden = false;
}
function disegnaMezzi() {
  $("spMz").innerHTML = TRASPORTI.map(function (k) {
    var c = ICONS[k], on = spMezzo === k;
    return '<button data-k="' + k + '" style="border-color:' + c.color + (on ? '' : '55')
      + ';background:' + (on ? c.color : 'transparent') + ';color:' + (on ? '#fff' : c.color) + '">'
      + ico(k, 15, on ? "#fff" : c.color) + c.label + '</button>';
  }).join("");
  Array.prototype.forEach.call($("spMz").querySelectorAll("button"), function (b) {
    b.addEventListener("click", function () { spMezzo = b.getAttribute("data-k"); disegnaMezzi(); });
  });
}
$("spClose").addEventListener("click", function () { $("spModal").hidden = true; });
$("spCancel").addEventListener("click", function () { $("spModal").hidden = true; });
$("spSave").addEventListener("click", function () {
  var da = $("spDa").value, a = $("spA").value;
  if (da === a) { toast("Partenza e arrivo coincidono"); return; }
  var kmScritto = $("spKm").value.trim();
  var byId = {}; trip.dati.luoghi.forEach(function (l) { byId[l.id] = l; });
  var rec = {
    id: spEdit ? spEdit.id : uid(), daId: da, aId: a, mezzo: spMezzo,
    giornoId: $("spG").value || null, ora: $("spO").value.trim(), note: $("spNo").value.trim(),
    /* Se scrivi tu i km, restano i tuoi: la mappa non li sovrascrive. */
    kmManuale: !!kmScritto,
    km: kmScritto ? num(kmScritto) : haversine(byId[da], byId[a])
  };
  var S = trip.dati.spostamenti;
  if (spEdit) { var i = S.findIndex(function (x) { return x.id === spEdit.id; }); S[i] = rec; }
  else S.push(rec);
  salva(true).then(function () { $("spModal").hidden = true; toast("Salvato"); vista(); });
});
$("spDel").addEventListener("click", function () {
  if (!spEdit) return;
  trip.dati.spostamenti = trip.dati.spostamenti.filter(function (x) { return x.id !== spEdit.id; });
  salva(true).then(function () { $("spModal").hidden = true; toast("Eliminata"); vista(); });
});

/* ---------------- diario ---------------- */
function vDiario() {
  var d = trip.dati;
  var giorni = d.giorni.slice().sort(function (a, b) { return (a.data || "") < (b.data || "") ? -1 : 1; });
  var h = '<div class="bar"><button class="btn" id="addG2">+ Giorno</button></div>';
  if (!giorni.length) {
    h += '<div class="empty"><div class="emo">📖</div><h3>Il diario e\' vuoto</h3>'
      + '<p>Un giorno alla volta, la sera. Fra dieci anni sara\' l\'unica parte che riaprirai.</p></div>';
  }
  giorni.forEach(function (g, i) {
    h += '<div class="panel"><div class="day">'
      + '<div class="day-h" data-gg="' + g.id + '"><div class="n">' + (i + 1) + '</div>'
      + '<div class="ti"><b>' + esc(g.titolo || dataLunga(g.data)) + '</b><span>' + dataLunga(g.data) + '</span></div>'
      + '<span style="color:var(--ink-soft);font-size:13px">Modifica</span></div>'
      + '<div class="day-b"><div class="diario">' + (g.diario ? esc(g.diario) : '<i style="opacity:.6">Non ancora scritto.</i>') + '</div></div>'
      + '</div></div>';
  });
  $("corpo").innerHTML = h;
  $("addG2").addEventListener("click", function () { apriGiorno(null); });
  Array.prototype.forEach.call(document.querySelectorAll("[data-gg]"), function (el) {
    el.addEventListener("click", function () {
      apriGiorno(d.giorni.filter(function (x) { return x.id === el.getAttribute("data-gg"); })[0]);
    });
  });
}

var gnEdit = null;
function apriGiorno(g) {
  gnEdit = g;
  $("gnTitle").textContent = g ? "Il giorno" : "Nuovo giorno";
  $("gnD").value = g ? (g.data || "") : (trip.inizio || oggi());
  $("gnT").value = g ? (g.titolo || "") : "";
  $("gnX").value = g ? (g.diario || "") : "";
  $("gnDel").hidden = !g;
  $("gnModal").hidden = false;
}
$("gnClose").addEventListener("click", function () { $("gnModal").hidden = true; });
$("gnCancel").addEventListener("click", function () { $("gnModal").hidden = true; });
$("gnSave").addEventListener("click", function () {
  var rec = {
    id: gnEdit ? gnEdit.id : uid(), data: $("gnD").value || oggi(),
    titolo: $("gnT").value.trim(), diario: $("gnX").value
  };
  var G = trip.dati.giorni;
  if (gnEdit) { var i = G.findIndex(function (x) { return x.id === gnEdit.id; }); G[i] = rec; }
  else G.push(rec);
  salva(true).then(function () { $("gnModal").hidden = true; toast("Salvato"); vista(); });
});
$("gnDel").addEventListener("click", function () {
  if (!gnEdit) return;
  var id = gnEdit.id, d = trip.dati;
  d.giorni = d.giorni.filter(function (x) { return x.id !== id; });
  d.spostamenti.forEach(function (s) { if (s.giornoId === id) s.giornoId = null; });
  salva(true).then(function () { $("gnModal").hidden = true; toast("Eliminato"); vista(); });
});

/* ---------------- spese ---------------- */
function vSpese() {
  var d = trip.dati, v = viaggiatori(trip);
  var tot = tripSpeso(trip);
  /* Chi ha anticipato quanto, e quanto deve dare l'altro perche' i conti
     tornino. La divisione e' a meta': e' un viaggio, non un condominio. */
  var perUno = {}; v.forEach(function (n) { perUno[n] = 0; });
  d.spese.forEach(function (s) { if (perUno[s.pagatoDa] != null) perUno[s.pagatoDa] += num(s.importo); });
  var quota = tot / (v.length || 1);

  var perCat = {};
  d.spese.forEach(function (s) { perCat[s.categoria || "Altro"] = (perCat[s.categoria || "Altro"] || 0) + num(s.importo); });
  var cats = Object.keys(perCat).sort(function (a, b) { return perCat[b] - perCat[a]; });

  var h = '<div class="bar"><button class="btn" id="addSs">+ Spesa</button>'
    + '<span class="count" style="margin-left:auto">Totale <b>' + fmtEur(tot) + '</b></span></div>';

  if (v.length === 2 && tot) {
    var a = v[0], b = v[1], diff = perUno[a] - quota;
    h += '<div class="panel"><div class="bud">'
      + '<div class="lbl"><span>' + esc(a) + ' ha anticipato</span><b>' + fmtEur(perUno[a]) + '</b></div>'
      + '<div class="lbl" style="margin-top:5px"><span>' + esc(b) + ' ha anticipato</span><b>' + fmtEur(perUno[b]) + '</b></div>'
      + '<div class="lbl" style="margin-top:11px;padding-top:11px;border-top:1px solid var(--paper-edge)">'
      + '<span>Per pareggiare</span><b style="color:var(--rust)">'
      + (Math.abs(diff) < 0.01 ? "siete pari" : esc(diff > 0 ? b : a) + " deve " + fmtEur(Math.abs(diff)) + " a " + esc(diff > 0 ? a : b))
      + '</b></div></div></div>';
  }

  if (cats.length) {
    h += '<div class="panel"><h3>Per categoria</h3>' + cats.map(function (c) {
      var pc = Math.round(perCat[c] / tot * 100);
      return '<div class="row" style="cursor:default">'
        + '<div class="txt"><div class="t">' + esc(c) + '</div>'
        + '<div class="s"><span style="display:inline-block;height:5px;border-radius:3px;background:var(--brass);width:' + Math.max(3, pc * 1.6) + 'px;vertical-align:middle;margin-right:7px"></span>' + pc + '%</div></div>'
        + '<div class="val">' + fmtEur(perCat[c]) + '</div></div>';
    }).join("") + '</div>';
  }

  var spese = d.spese.slice().sort(function (a, b) { return (a.data || "") > (b.data || "") ? -1 : 1; });
  if (!spese.length) {
    h += '<div class="empty"><div class="emo">💶</div><h3>Nessuna spesa</h3><p>Il budget del viaggio si riempie qui.</p></div>';
  } else {
    h += '<div class="panel"><h3>Tutte le spese</h3>' + spese.map(function (s) {
      return '<div class="row" data-ss="' + s.id + '">'
        + '<div class="txt"><div class="t">' + esc(s.descrizione) + '</div>'
        + '<div class="s">' + dataBreve(s.data) + ' · ' + esc(s.categoria || "Altro") + ' · pagato da ' + esc(s.pagatoDa || "—") + '</div></div>'
        + '<div class="val">' + fmtEur(num(s.importo)) + '</div></div>';
    }).join("") + '</div>';
  }

  $("corpo").innerHTML = h;
  $("addSs").addEventListener("click", function () { apriSpesa(null); });
  Array.prototype.forEach.call(document.querySelectorAll("[data-ss]"), function (el) {
    el.addEventListener("click", function () {
      apriSpesa(d.spese.filter(function (x) { return x.id === el.getAttribute("data-ss"); })[0]);
    });
  });
}

var ssEdit = null;
function apriSpesa(s) {
  ssEdit = s;
  $("ssTitle").textContent = s ? "Modifica la spesa" : "Nuova spesa";
  $("ssC").innerHTML = CAT_SPESA.map(function (c) { return '<option>' + c + '</option>'; }).join("");
  $("ssP").innerHTML = viaggiatori(trip).map(function (n) { return '<option>' + esc(n) + '</option>'; }).join("");
  $("ssD").value = s ? s.descrizione : "";
  $("ssI").value = s ? s.importo : "";
  $("ssDt").value = s ? (s.data || oggi()) : oggi();
  $("ssC").value = s ? (s.categoria || "Altro") : "Altro";
  $("ssP").value = s ? s.pagatoDa : viaggiatori(trip)[0];
  $("ssDel").hidden = !s;
  $("ssModal").hidden = false;
}
$("ssClose").addEventListener("click", function () { $("ssModal").hidden = true; });
$("ssCancel").addEventListener("click", function () { $("ssModal").hidden = true; });
$("ssSave").addEventListener("click", function () {
  var d = $("ssD").value.trim();
  if (!d) { toast("La descrizione serve"); return; }
  var rec = {
    id: ssEdit ? ssEdit.id : uid(), descrizione: d, importo: num($("ssI").value),
    data: $("ssDt").value || oggi(), categoria: $("ssC").value, pagatoDa: $("ssP").value
  };
  var S = trip.dati.spese;
  if (ssEdit) { var i = S.findIndex(function (x) { return x.id === ssEdit.id; }); S[i] = rec; }
  else S.push(rec);
  salva(true).then(function () { $("ssModal").hidden = true; toast("Salvata"); vista(); });
});
$("ssDel").addEventListener("click", function () {
  if (!ssEdit) return;
  trip.dati.spese = trip.dati.spese.filter(function (x) { return x.id !== ssEdit.id; });
  salva(true).then(function () { $("ssModal").hidden = true; toast("Eliminata"); vista(); });
});

/* ---------------- documenti ---------------- */
function vDocumenti() {
  var d = trip.dati, byId = {};
  d.luoghi.forEach(function (l) { byId[l.id] = l; });
  var h = '<div class="bar"><button class="btn" id="addDc">+ Documento</button>'
    + '<span class="count" style="margin-left:auto"><b>' + d.documenti.length + '</b> documenti</span></div>';
  if (!d.documenti.length) {
    h += '<div class="empty"><div class="emo">🎫</div><h3>Nessun documento</h3>'
      + '<p>Carte d\'imbarco, voucher, visti, noleggi. Stanno nell\'archivio privato: senza accesso non si aprono.</p></div>';
  } else {
    h += '<div class="panel">' + d.documenti.slice().sort(function (a, b) { return (a.data || "") < (b.data || "") ? -1 : 1; })
      .map(function (x) {
        var l = byId[x.luogoId];
        return '<div class="row" data-dc="' + x.id + '">'
          + '<div class="ico" style="background:var(--paper-soft)">📄</div>'
          + '<div class="txt"><div class="t">' + esc(x.titolo) + '</div>'
          + '<div class="s">' + esc([x.tipo, x.codice, x.data ? dataBreve(x.data) : "", l ? l.nome : ""].filter(Boolean).join(" · ")) + '</div></div>'
          + (x.path ? '<button class="btn-ghost" data-open="' + x.id + '" style="padding:7px 11px;font-size:12.5px">Apri</button>' : '')
          + '</div>';
      }).join("") + '</div>';
  }
  $("corpo").innerHTML = h;
  $("addDc").addEventListener("click", function () { apriDoc(null); });
  Array.prototype.forEach.call(document.querySelectorAll("[data-dc]"), function (el) {
    el.addEventListener("click", function (e) {
      if (e.target.closest("[data-open]")) return;
      apriDoc(d.documenti.filter(function (x) { return x.id === el.getAttribute("data-dc"); })[0]);
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-open]"), function (b) {
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      var x = d.documenti.filter(function (y) { return y.id === b.getAttribute("data-open"); })[0];
      apriFile(x);
    });
  });
}

/* Il collegamento viene creato al momento e scade dopo un'ora: e' lo
   stesso criterio dei referti. Un voucher ha dentro nome e cognome. */
function apriFile(x) {
  if (!x || !x.path) return;
  sb.storage.from("privati").createSignedUrl(x.path, 3600).then(function (r) {
    if (r.error || !r.data) { toast("File non raggiungibile"); return; }
    window.open(r.data.signedUrl, "_blank");
  });
}

var dcEdit = null, dcFile = null;
function apriDoc(x) {
  dcEdit = x; dcFile = null;
  $("dcTitle").textContent = x ? "Modifica il documento" : "Nuovo documento";
  $("dcTp").innerHTML = TIPI_DOC.map(function (t) { return '<option>' + t + '</option>'; }).join("");
  $("dcL").innerHTML = '<option value="">— nessun luogo —</option>'
    + trip.dati.luoghi.map(function (l) { return '<option value="' + l.id + '">' + esc(l.nome) + '</option>'; }).join("");
  $("dcT").value = x ? x.titolo : "";
  $("dcTp").value = x ? (x.tipo || "Altro") : "Volo";
  $("dcD").value = x ? (x.data || "") : "";
  $("dcC").value = x ? (x.codice || "") : "";
  $("dcL").value = x ? (x.luogoId || "") : "";
  $("dcN").value = x ? (x.note || "") : "";
  $("dcF").value = "";
  $("dcHas").textContent = x && x.path ? "C'e' gia' un file: " + (x.fileName || "allegato") + ". Sceglierne un altro lo sostituisce." : "";
  $("dcDel").hidden = !x;
  $("dcModal").hidden = false;
}
$("dcF").addEventListener("change", function () { dcFile = this.files[0] || null; });
$("dcClose").addEventListener("click", function () { $("dcModal").hidden = true; });
$("dcCancel").addEventListener("click", function () { $("dcModal").hidden = true; });
$("dcSave").addEventListener("click", function () {
  var t = $("dcT").value.trim();
  if (!t) { toast("Il titolo serve"); return; }
  var rec = {
    id: dcEdit ? dcEdit.id : uid(), titolo: t, tipo: $("dcTp").value,
    data: $("dcD").value || null, codice: $("dcC").value.trim(),
    luogoId: $("dcL").value || null, note: $("dcN").value.trim(),
    path: dcEdit ? (dcEdit.path || "") : "", fileName: dcEdit ? (dcEdit.fileName || "") : "", mime: dcEdit ? (dcEdit.mime || "") : ""
  };
  var p = Promise.resolve();
  if (dcFile) {
    var nome = "viaggi/" + trip.id + "/" + Date.now() + "-" + dcFile.name.replace(/[^\w.\-]/g, "_");
    $("dcSave").disabled = true;
    p = sb.storage.from("privati").upload(nome, dcFile, { contentType: dcFile.type, upsert: false })
      .then(function (r) {
        if (r.error) throw r.error;
        rec.path = nome; rec.fileName = dcFile.name; rec.mime = dcFile.type;
      });
  }
  p.then(function () {
    var D = trip.dati.documenti;
    if (dcEdit) { var i = D.findIndex(function (x) { return x.id === dcEdit.id; }); D[i] = rec; }
    else D.push(rec);
    return salva(true);
  }).then(function () {
    $("dcSave").disabled = false; $("dcModal").hidden = true; toast("Salvato"); vista();
  }).catch(function (e) {
    $("dcSave").disabled = false;
    toast("Caricamento non riuscito: " + (e.message || "riprova"));
  });
});
$("dcDel").addEventListener("click", function () {
  if (!dcEdit) return;
  var x = dcEdit;
  var p = x.path ? sb.storage.from("privati").remove([x.path]) : Promise.resolve();
  p.then(function () {
    trip.dati.documenti = trip.dati.documenti.filter(function (y) { return y.id !== x.id; });
    return salva(true);
  }).then(function () { $("dcModal").hidden = true; toast("Eliminato"); vista(); });
});

/* ---------------- valigia ---------------- */
function vValigia() {
  var d = trip.dati;
  var fatti = d.checklist.filter(function (c) { return c.fatto; }).length;
  var h = '<div class="bar" style="gap:8px">'
    + '<div class="search" style="flex:1"><input type="text" id="ckNew" placeholder="Cosa non devo dimenticare…" style="padding-left:14px"></div>'
    + '<button class="btn" id="ckAdd">Aggiungi</button></div>';
  if (d.checklist.length) {
    h += '<p style="color:var(--on-bg-soft);font-size:13.5px;margin:-6px 0 14px"><b style="color:var(--brass-text)">'
      + fatti + ' di ' + d.checklist.length + '</b> fatti.</p>';
    h += '<div class="panel">' + d.checklist.map(function (c) {
      return '<div class="ck-row' + (c.fatto ? ' done' : '') + '">'
        + '<div class="ck-box' + (c.fatto ? ' on' : '') + '" data-ck="' + c.id + '">' + (c.fatto ? ico("check", 13, "#fff") : "") + '</div>'
        + '<div class="tx">' + esc(c.testo) + '</div>'
        + '<button class="del" data-ckd="' + c.id + '">✕</button></div>';
    }).join("") + '</div>';
  } else {
    h += '<div class="empty"><div class="emo">✅</div><h3>Niente in lista</h3>'
      + '<p>Passaporti, adattatori, assicurazione, il caricabatterie che dimentichi sempre.</p></div>';
  }
  $("corpo").innerHTML = h;
  var aggiungi = function () {
    var t = $("ckNew").value.trim();
    if (!t) return;
    d.checklist.push({ id: uid(), testo: t, fatto: false });
    salva(true).then(vista);
  };
  $("ckAdd").addEventListener("click", aggiungi);
  $("ckNew").addEventListener("keydown", function (e) { if (e.key === "Enter") aggiungi(); });
  Array.prototype.forEach.call(document.querySelectorAll("[data-ck]"), function (el) {
    el.addEventListener("click", function () {
      var c = d.checklist.filter(function (x) { return x.id === el.getAttribute("data-ck"); })[0];
      c.fatto = !c.fatto;
      salva(true).then(vista);
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-ckd]"), function (el) {
    el.addEventListener("click", function () {
      d.checklist = d.checklist.filter(function (x) { return x.id !== el.getAttribute("data-ckd"); });
      salva(true).then(vista);
    });
  });
}
