/* =====================================================================
   IL NOSTRO RICETTARIO
   Ricette, menù della settimana, lista della spesa, catalogo prodotti.
   ===================================================================== */

var recipes = [], menu = [], shopping = [], cats = [], prods = [];
var viewMode = "cards", fPortata = "", fStagione = "", favOnly = false;
try { viewMode = localStorage.getItem("ricView") || "cards"; } catch (e) { }

var PORTATE = [
  { k: "colazione", l: "Colazione", e: "☕" }, { k: "pranzo", l: "Pranzo", e: "🍝" },
  { k: "cena", l: "Cena", e: "🌙" }, { k: "dolce", l: "Dolce", e: "🍰" },
  { k: "antipasto", l: "Antipasto", e: "🥗" }, { k: "contorno", l: "Contorno", e: "🥦" },
  { k: "aperitivo", l: "Aperitivo", e: "🥂" }
];
var STAGIONI = [
  { k: "sempre", l: "Sempre", e: "🕐" }, { k: "primavera", l: "Primavera", e: "🌸" },
  { k: "estate", l: "Estate", e: "🌊" }, { k: "autunno", l: "Autunno", e: "🍂" },
  { k: "inverno", l: "Inverno", e: "❄️" }
];
var UNITA = ["", "g", "kg", "ml", "l", "q.b.", "pz", "cucchiai", "cucchiaini", "tazze", "spicchi", "foglie", "pizzico"];
var GIORNI = [
  { k: "lun", l: "Lunedì" }, { k: "mar", l: "Martedì" }, { k: "mer", l: "Mercoledì" },
  { k: "gio", l: "Giovedì" }, { k: "ven", l: "Venerdì" }, { k: "sab", l: "Sabato" }, { k: "dom", l: "Domenica" }
];
var PASTI = [{ k: "pranzo", l: "☀️ Pranzo" }, { k: "cena", l: "🌙 Cena" }];

function porOf(k) { return PORTATE.filter(function (p) { return p.k === k; })[0] || null; }
function staOf(k) { return STAGIONI.filter(function (s) { return s.k === k; })[0] || null; }

/* --- Piu portate e piu stagioni per piatto ---
   Prima ogni piatto poteva avere una sola portata e una sola stagione.
   I pancake pero sono colazione e insieme dolce. Ora sono elenchi.
   Queste due funzioni leggono sia il nuovo formato (elenco) sia il
   vecchio (valore singolo), cosi le ricette gia salvate continuano a
   funzionare senza conversioni. */
function porList(r) {
  if (r && Array.isArray(r.portate) && r.portate.length) return r.portate;
  if (r && r.portata) return [r.portata];
  return [];
}
function staList(r) {
  if (r && Array.isArray(r.stagioni) && r.stagioni.length) return r.stagioni;
  if (r && r.stagione) return [r.stagione];
  return [];
}
/* Le etichette da mostrare */
function porOfList(r) { return porList(r).map(porOf).filter(Boolean); }
function staOfList(r) { return staList(r).map(staOf).filter(Boolean); }

/* Disegna un gruppo di caselle da spuntare (piu scelte) */
function chipGroup(elId, options, selected) {
  var el = $(elId);
  if (!el) return;
  selected = selected || [];
  el.innerHTML = options.map(function (o) {
    var on = selected.indexOf(o.k) >= 0;
    return '<button type="button" class="chipsel' + (on ? ' on' : '') + '" data-k="' + o.k + '">'
      + o.e + " " + esc(o.l) + "</button>";
  }).join("");
  el.querySelectorAll(".chipsel").forEach(function (b) {
    b.addEventListener("click", function () { b.classList.toggle("on"); });
  });
}
function chipGroupValue(elId) {
  var el = $(elId);
  if (!el) return [];
  return [].slice.call(el.querySelectorAll(".chipsel.on")).map(function (b) { return b.getAttribute("data-k"); });
}

function catOf(id) { return cats.filter(function (c) { return c.id === id; })[0] || null; }
function uid() { return Math.random().toString(36).slice(2, 10); }

/* ---------- numeri ---------- */
function qtyNum(q) {
  if (q == null || q === "") return null;
  var n = parseFloat(String(q).replace(",", "."));
  return isNaN(n) ? null : n;
}
function fmtQty(n) {
  if (n == null) return "";
  return String(Math.round(n * 100) / 100).replace(".", ",");
}
function tempo(r) { return (parseInt(r.prep) || 0) + (parseInt(r.cook) || 0); }
function ings(r) { return Array.isArray(r.ingredients) ? r.ingredients : []; }

$("top").innerHTML = toolHeader("Il nostro ricettario", "");

/* ==================================================================
   SCHEDE
   ================================================================== */
var PAGES = [["tRic", "pRic"], ["tMen", "pMen"], ["tSpe", "pSpe"], ["tCat", "pCat"]];
function showPage(tab) {
  PAGES.forEach(function (p) {
    var on = p[0] === tab;
    $(p[0]).classList.toggle("on", on);
    $(p[1]).hidden = !on;
  });
  if (tab === "tMen") drawMenu();
  if (tab === "tSpe") drawShop();
  if (tab === "tCat") drawCatalog();
}
PAGES.forEach(function (p) {
  $(p[0]).addEventListener("click", function () { showPage(p[0]); });
});

/* ==================================================================
   RICETTE
   ================================================================== */
function matches(r, q) {
  if (!q) return { hit: true, ing: null };
  q = q.toLowerCase();
  if ((r.name || "").toLowerCase().indexOf(q) >= 0) return { hit: true, ing: null };
  var f = ings(r).filter(function (i) { return (i.name || "").toLowerCase().indexOf(q) >= 0; })[0];
  return f ? { hit: true, ing: f.name } : { hit: false, ing: null };
}
function hl(t, q) {
  if (!q) return esc(t);
  var i = String(t).toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return esc(t);
  return esc(t.slice(0, i)) + "<mark>" + esc(t.slice(i, i + q.length)) + "</mark>" + esc(t.slice(i + q.length));
}
function recRows() {
  var q = $("q").value.trim();
  return recipes.filter(function (r) {
    if (favOnly && !r.fav) return false;
    /* Basta che il piatto abbia QUELLA portata fra le sue. */
    if (fPortata && porList(r).indexOf(fPortata) < 0) return false;
    if (fStagione) {
      var ss = staList(r);
      /* "Sempre" vale tutto l'anno: compare anche filtrando una stagione. */
      if (fStagione === "sempre") {
        if (ss.indexOf("sempre") < 0) return false;
      } else if (ss.indexOf(fStagione) < 0 && ss.indexOf("sempre") < 0) return false;
    }
    return matches(r, q).hit;
  }).sort(function (a, b) {
    return (a.name || "").toLowerCase() < (b.name || "").toLowerCase() ? -1 : 1;
  });
}
var POT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 11h18"/><path d="M5 11V7a7 7 0 0114 0v4"/><path d="M4 11h16v2a8 8 0 01-16 0z"/></svg>';
var ST_ON = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>';
var ST_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>';

function drawRecipes() {
  var q = $("q").value.trim();
  $("sW").className = "search" + (q ? " has" : "");
  var list = recRows();
  var filt = q || fPortata || fStagione || favOnly;
  $("cnt").innerHTML = filt ? ("<b>" + list.length + "</b> di " + recipes.length)
    : (recipes.length ? ("<b>" + recipes.length + "</b> ricette") : "");
  $("nRic").textContent = recipes.length;
  $("fFav").classList.toggle("on", favOnly);
  $("vG").classList.toggle("on", viewMode === "cards");
  $("vL").classList.toggle("on", viewMode === "table");

  var h = $("host");
  if (!recipes.length) {
    h.className = "";
    h.innerHTML = '<div class="empty"><div class="emo">🍲</div><h3>Il ricettario è vuoto</h3>'
      + "<p>Aggiungi la prima ricetta di casa.</p>"
      + '<button class="btn" onclick="document.getElementById(\'addBtn\').click()">＋ Ricetta</button></div>';
    return;
  }
  if (!list.length) {
    h.className = "";
    h.innerHTML = '<div class="empty"><div class="emo">🔍</div><h3>Nessun risultato</h3><p>Nessuna ricetta con questi filtri.</p></div>';
    return;
  }

  if (viewMode === "table") {
    h.className = "";
    h.innerHTML = '<div class="tbl">' + list.map(function (r) {
      var th = r.photo ? '<span class="th"><img src="' + esc(r.photo) + '" alt="" loading="lazy"></span>'
        : '<span class="th">' + POT + "</span>";
      var p = porOfList(r), s = staOfList(r), t = tempo(r), sub = [];
      if (r.fav) sub.push("⭐");
      p.forEach(function (x) { sub.push(x.e + " " + x.l); });
      s.forEach(function (x) { sub.push(x.e + " " + x.l); });
      if (t) sub.push("⏱ " + t + " min");
      sub.push(ings(r).length + " ingr.");
      return '<div class="trow" data-id="' + r.id + '">' + th
        + '<div><div class="tn">' + hl(r.name || "Senza nome", q) + "</div>"
        + '<div class="ts"><span>' + sub.join("</span><span>") + "</span></div></div></div>";
    }).join("") + "</div>";
  } else {
    h.className = "grid";
    h.innerHTML = list.map(function (r) {
      var p = porOfList(r), s = staOfList(r);
      var tags = (p.length || s.length) ? '<div class="tags">'
        + p.map(function (x) { return "<span>" + x.e + "</span>"; }).join("")
        + s.map(function (x) { return "<span>" + x.e + "</span>"; }).join("") + "</div>" : "";
      var fav = '<button class="fav' + (r.fav ? " on" : "") + '" data-fav>' + (r.fav ? ST_ON : ST_OFF) + "</button>";
      var ph = r.photo ? '<img src="' + esc(r.photo) + '" alt="" loading="lazy">' : '<span class="nop">' + POT + "</span>";
      return '<div class="rc" data-id="' + r.id + '"><div class="ph">' + ph + fav + tags + "</div>"
        + '<div class="nm">' + hl(r.name || "Senza nome", q) + "</div></div>";
    }).join("");
  }
  h.querySelectorAll("[data-id]").forEach(function (el) {
    var id = el.getAttribute("data-id");
    var f = el.querySelector("[data-fav]");
    if (f) f.addEventListener("click", function (e) { e.stopPropagation(); toggleFav(id); });
    el.addEventListener("click", function () { openRec(id); });
  });
}
function toggleFav(id) {
  var r = recipes.filter(function (x) { return x.id === id; })[0];
  if (!r) return;
  r.fav = !r.fav;
  drawRecipes();
  if (viewingId === id) paintFav(r);
  sb.from("recipes").update({ fav: r.fav }).eq("id", id).then(function (res) {
    if (res.error) { toast("Errore nel salvare"); r.fav = !r.fav; drawRecipes(); }
  });
}

/* ---------- scheda ricetta ---------- */
var viewingId = null, scale = 1, pivot = null, checked = {};
function paintFav(r) {
  var b = $("rvFav");
  b.textContent = r.fav ? "★" : "☆";
  b.style.color = r.fav ? "#D9A62E" : "";
}
function baseServ(r) { var s = parseInt(r.servings); return s > 0 ? s : null; }
function firstScalable(list) {
  for (var i = 0; i < list.length; i++) {
    var n = qtyNum(list[i].qty);
    if (n != null && n > 0) return list[i].id;
  }
  return null;
}
function openRec(id) {
  var r = recipes.filter(function (x) { return x.id === id; })[0];
  if (!r) return;
  viewingId = id; scale = 1; checked = {};
  pivot = firstScalable(ings(r));
  $("rvT").textContent = r.name || "Ricetta";
  paintFav(r);
  drawRec(r);
  $("rvModal").hidden = false;
}
function drawRec(r) {
  var h = "";
  if (r.photo) h += '<img class="rv-ph" src="' + esc(r.photo) + '" alt="">';

  var chips = "";
  var p = porOfList(r), s = staOfList(r);
  p.forEach(function (x) { chips += '<span class="chip">' + x.e + " " + x.l + "</span>"; });
  s.forEach(function (x) { chips += '<span class="chip">' + x.e + " " + x.l + "</span>"; });
  if (parseInt(r.prep)) chips += '<span class="chip">⏱ ' + parseInt(r.prep) + " min prep.</span>";
  if (parseInt(r.cook)) chips += '<span class="chip">🔥 ' + parseInt(r.cook) + " min cottura</span>";
  if (chips) h += '<div class="chips">' + chips + "</div>";

  var list = ings(r);
  if (list.length) {
    h += '<div class="sec-h">Ingredienti</div><div class="scaler">';
    var b = baseServ(r);
    if (b) {
      var cur = Math.max(1, Math.round(b * scale));
      h += '<div class="serv"><span class="lb">Porzioni</span>'
        + '<button id="sMin">−</button><span class="v" id="sVal">' + cur + "</span>"
        + '<button id="sPlu">+</button>'
        + (scale !== 1 ? '<button id="sRst" style="width:auto;padding:0 10px;font-size:12px">azzera</button>' : "")
        + "</div>";
    }
    h += list.map(function (i) {
      var base = qtyNum(i.qty), done = checked[i.id] ? " done" : "";
      if (base == null) {
        return '<div class="ing' + done + '" data-i="' + i.id + '"><span class="nm">' + esc(i.name || "") + "</span>"
          + '<span class="u">' + esc(i.qty || i.unit || "q.b.") + "</span></div>";
      }
      return '<div class="ing' + done + '" data-i="' + i.id + '"><span class="nm">' + esc(i.name || "") + "</span>"
        + '<input type="text" inputmode="decimal" data-q="' + i.id + '" value="' + fmtQty(base * scale) + '">'
        + '<span class="u">' + esc(i.unit || "") + "</span></div>";
    }).join("");
    h += '<div class="note">Cambia una quantità o le porzioni: tutto si ricalcola in proporzione. '
      + "Tocca il nome di un ingrediente per spuntarlo mentre cucini.</div></div>";
  }

  if (r.proc) h += '<div class="sec-h">Procedimento</div><div class="proc">' + esc(r.proc) + "</div>";
  if (r.notes) h += '<div class="sec-h">Note</div><div class="proc">' + esc(r.notes) + "</div>";
  $("rvB").innerHTML = h;

  /* spunta ingredienti */
  $("rvB").querySelectorAll(".ing .nm").forEach(function (nm) {
    nm.addEventListener("click", function () {
      var it = nm.parentNode, id = it.getAttribute("data-i");
      checked[id] = !checked[id];
      it.classList.toggle("done", !!checked[id]);
    });
  });
  /* scalatore */
  var bs = baseServ(r);
  if (bs) {
    if ($("sMin")) $("sMin").addEventListener("click", function () {
      var c = Math.max(1, Math.round(bs * scale) - 1); scale = c / bs; drawRec(r);
    });
    if ($("sPlu")) $("sPlu").addEventListener("click", function () {
      var c = Math.round(bs * scale) + 1; scale = c / bs; drawRec(r);
    });
    if ($("sRst")) $("sRst").addEventListener("click", function () { scale = 1; drawRec(r); });
  }
  $("rvB").querySelectorAll("[data-q]").forEach(function (inp) {
    inp.addEventListener("change", function () {
      var id = inp.getAttribute("data-q");
      var it = ings(r).filter(function (x) { return x.id === id; })[0];
      var base = qtyNum(it && it.qty), now = qtyNum(inp.value);
      if (base == null || base <= 0 || now == null || now <= 0) { drawRec(r); return; }
      scale = now / base;
      drawRec(r);
    });
  });
}
$("rvX").addEventListener("click", function () { $("rvModal").hidden = true; });
$("rvModal").addEventListener("click", function (e) { if (e.target === $("rvModal")) $("rvModal").hidden = true; });
$("rvFav").addEventListener("click", function () { if (viewingId) toggleFav(viewingId); });
$("rvEdit").addEventListener("click", function () {
  var id = viewingId; $("rvModal").hidden = true; openForm(id);
});
$("rvDel").addEventListener("click", function () {
  if (!viewingId) return;
  var r = recipes.filter(function (x) { return x.id === viewingId; })[0];
  delTarget = { kind: "recipe", id: viewingId };
  $("dlN").textContent = "«" + (r ? r.name : "") + "» verrà tolta dal ricettario.";
  $("rvModal").hidden = true;
  $("dlModal").hidden = false;
});

/* ---------- condivisione ---------- */
function recText(r) {
  var L = ["🍲 " + (r.name || "Ricetta")];
  var p = porOfList(r), s = staOfList(r), tag = [];
  p.forEach(function (x) { tag.push(x.e + " " + x.l); });
  s.forEach(function (x) { tag.push(x.e + " " + x.l); });
  if (tag.length) L.push(tag.join(" · "));
  var t = [];
  if (parseInt(r.prep)) t.push("Prep " + parseInt(r.prep) + " min");
  if (parseInt(r.cook)) t.push("Cottura " + parseInt(r.cook) + " min");
  if (parseInt(r.servings)) t.push(parseInt(r.servings) + " porzioni");
  if (t.length) L.push("⏱ " + t.join(" · "));
  var li = ings(r).filter(function (i) { return i.name; });
  if (li.length) {
    L.push("", "INGREDIENTI");
    li.forEach(function (i) {
      var q = ((i.qty || "") + " " + (i.unit || "")).trim();
      L.push("• " + i.name + (q ? " — " + q : ""));
    });
  }
  if (r.proc) L.push("", "PROCEDIMENTO", r.proc);
  if (r.notes) L.push("", "NOTE", r.notes);
  L.push("", "— dal nostro ricettario 📖");
  return L.join("\n");
}
function share(title, text) {
  if (navigator.share) navigator.share({ title: title, text: text }).catch(function () { });
  else if (navigator.clipboard) navigator.clipboard.writeText(text)
    .then(function () { toast("Copiato, pronto da incollare"); })
    .catch(function () { toast("Copia non riuscita"); });
  else toast("Condivisione non supportata");
}
$("rvShare").addEventListener("click", function () {
  var r = recipes.filter(function (x) { return x.id === viewingId; })[0];
  if (r) share(r.name, recText(r));
});

/* ---------- modalità cucina ---------- */
var ckSteps = [], ckI = 0, wake = null;
function wakeOn() {
  if ("wakeLock" in navigator) navigator.wakeLock.request("screen")
    .then(function (w) { wake = w; }).catch(function () { });
}
function wakeOff() { if (wake) { wake.release().catch(function () { }); wake = null; } }
document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "visible" && !$("ckModal").hidden) wakeOn();
});
$("rvCook").addEventListener("click", function () {
  var r = recipes.filter(function (x) { return x.id === viewingId; })[0];
  if (!r) return;
  ckSteps = (r.proc || "").split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean);
  if (!ckSteps.length) { toast("Serve il procedimento per la modalità cucina"); return; }
  ckI = 0;
  $("ckT").textContent = r.name || "In cucina";
  $("ckH").textContent = ("wakeLock" in navigator) ? "Lo schermo resta acceso mentre cucini" : "Buona cucina!";
  drawCook();
  $("rvModal").hidden = true;
  $("ckModal").hidden = false;
  wakeOn();
});
function drawCook() {
  $("ckP").innerHTML = ckSteps.map(function (_, i) { return '<span class="' + (i <= ckI ? "on" : "") + '"></span>'; }).join("");
  $("ckL").textContent = "Passo " + (ckI + 1) + " di " + ckSteps.length;
  $("ckTx").textContent = ckSteps[ckI];
  $("ckPrev").style.visibility = ckI === 0 ? "hidden" : "visible";
  $("ckNext").textContent = ckI === ckSteps.length - 1 ? "Finito 🎉" : "Avanti →";
}
function ckClose() { $("ckModal").hidden = true; wakeOff(); }
$("ckPrev").addEventListener("click", function () { if (ckI > 0) { ckI--; drawCook(); } });
$("ckNext").addEventListener("click", function () {
  if (ckI < ckSteps.length - 1) { ckI++; drawCook(); }
  else { ckClose(); toast("Buon appetito! 🍽️"); }
});
$("ckX").addEventListener("click", ckClose);

/* ---------- modulo ricetta ---------- */
var editId = null, newPhoto = null;
(function () {
  /* Nel modulo, portate e stagioni sono caselle da spuntare: puoi
     sceglierne piu di una. I filtri in alto restano a scelta singola. */
  $("fPor").innerHTML = '<option value="">Tutte le portate</option>'
    + PORTATE.map(function (p) { return '<option value="' + p.k + '">' + p.e + " " + p.l + "</option>"; }).join("");
  $("fSta").innerHTML = '<option value="">Tutte le stagioni</option>'
    + STAGIONI.map(function (s) { return '<option value="' + s.k + '">' + s.e + " " + s.l + "</option>"; }).join("");
})();
function ingRow(i) {
  i = i || { id: uid(), name: "", qty: "", unit: "" };
  var d = document.createElement("div");
  d.className = "irow";
  d.setAttribute("data-id", i.id);
  d.innerHTML = '<input type="text" class="in" placeholder="Ingrediente" value="' + esc(i.name || "") + '">'
    + '<input type="text" class="iq" inputmode="decimal" placeholder="Qtà" value="' + esc(i.qty || "") + '">'
    + '<select class="iu">' + UNITA.map(function (u) {
      return '<option value="' + u + '"' + (u === (i.unit || "") ? " selected" : "") + ">" + (u || "—") + "</option>";
    }).join("") + "</select>"
    + '<button class="rm" title="Togli">✕</button>';
  d.querySelector(".rm").addEventListener("click", function () { d.remove(); });
  return d;
}
$("fIngAdd").addEventListener("click", function () {
  $("fIng").appendChild(ingRow());
  var rows = $("fIng").querySelectorAll(".in");
  rows[rows.length - 1].focus();
});
function collectIngs() {
  var out = [];
  $("fIng").querySelectorAll(".irow").forEach(function (r) {
    var n = r.querySelector(".in").value.trim();
    if (!n) return;
    out.push({
      id: r.getAttribute("data-id"),
      name: n,
      qty: r.querySelector(".iq").value.trim(),
      unit: r.querySelector(".iu").value
    });
  });
  return out;
}
function setPhoto(url) {
  if (url) {
    $("fPhImg").src = url; $("fPhImg").hidden = false;
    $("fPhP").hidden = true; $("fPhDel").hidden = false;
  } else {
    $("fPhImg").removeAttribute("src"); $("fPhImg").hidden = true;
    $("fPhP").hidden = false; $("fPhDel").hidden = true;
  }
}
$("fPhBox").addEventListener("click", function () { $("fPh").click(); });
$("fPhDel").addEventListener("click", function (e) { e.stopPropagation(); newPhoto = ""; setPhoto(null); });
$("fPh").addEventListener("change", function () {
  var f = this.files && this.files[0];
  this.value = "";
  if (!f) return;
  toast("Comprimo la foto…");
  compressImage(f, 1100, 0.72).then(function (b) {
    var fr = new FileReader();
    fr.onload = function () { newPhoto = fr.result; setPhoto(fr.result); };
    fr.readAsDataURL(b);
  }).catch(function () { toast("Immagine non leggibile"); });
});

function openForm(id) {
  editId = id || null; newPhoto = null;
  var r = id ? recipes.filter(function (x) { return x.id === id; })[0] : null;
  $("fT").textContent = id ? "Modifica ricetta" : "Aggiungi ricetta";
  $("fN").value = r ? (r.name || "") : "";
  chipGroup("fPo", PORTATE,  r ? porList(r) : []);
  chipGroup("fSt", STAGIONI, r ? staList(r) : []);
  $("fPr").value = r ? (r.prep || "") : "";
  $("fCo").value = r ? (r.cook || "") : "";
  $("fSe").value = r ? (r.servings || "") : "";
  $("fPc").value = r ? (r.proc || "") : "";
  $("fNo").value = r ? (r.notes || "") : "";
  setPhoto(r && r.photo ? r.photo : null);
  $("fIng").innerHTML = "";
  var li = r ? ings(r) : [];
  if (!li.length) li = [{ id: uid(), name: "", qty: "", unit: "" }, { id: uid(), name: "", qty: "", unit: "" }];
  li.forEach(function (i) { $("fIng").appendChild(ingRow(i)); });
  $("fModal").hidden = false;
  setTimeout(function () { $("fN").focus(); }, 60);
}
function closeForm() { $("fModal").hidden = true; editId = null; newPhoto = null; }
$("addBtn").addEventListener("click", function () { openForm(null); });
$("fX").addEventListener("click", closeForm);
$("fCanc").addEventListener("click", closeForm);
$("fModal").addEventListener("click", function (e) { if (e.target === $("fModal")) closeForm(); });

$("fSave").addEventListener("click", function () {
  var name = $("fN").value.trim();
  if (!name) { toast("Il nome serve"); $("fN").focus(); return; }
  var data = {
    name: name,
    /* i nuovi elenchi */
    portate:  chipGroupValue("fPo"),
    stagioni: chipGroupValue("fSt"),
    /* le vecchie colonne le tengo allineate al primo valore, cosi se
       apri il database dal pannello di Supabase trovi ancora qualcosa
       di sensato e nulla si rompe. */
    portata:  chipGroupValue("fPo")[0]  || null,
    stagione: chipGroupValue("fSt")[0] || null,
    prep: $("fPr").value.trim() || null,
    cook: $("fCo").value.trim() || null,
    servings: $("fSe").value.trim() || null,
    proc: $("fPc").value.trim() || null,
    notes: $("fNo").value.trim() || null,
    ingredients: collectIngs()
  };
  if (newPhoto !== null) data.photo = newPhoto || null;

  var b = $("fSave");
  b.disabled = true; b.textContent = "Salvo…";
  var op = editId ? sb.from("recipes").update(data).eq("id", editId) : sb.from("recipes").insert(data);
  op.then(function (r) {
    b.disabled = false; b.textContent = "Salva";
    if (r.error) { console.error(r.error); toast("Errore: " + r.error.message); return; }
    var wasEdit = !!editId;
    closeForm();
    loadRecipes().then(function () { drawRecipes(); toast(wasEdit ? "Ricetta aggiornata" : "Ricetta aggiunta"); });
  });
});

/* ---------- filtri ---------- */
$("q").addEventListener("input", drawRecipes);
$("qC").addEventListener("click", function () { $("q").value = ""; drawRecipes(); $("q").focus(); });
$("fPor").addEventListener("change", function () { fPortata = this.value; drawRecipes(); });
$("fSta").addEventListener("change", function () { fStagione = this.value; drawRecipes(); });
$("fFav").addEventListener("click", function () { favOnly = !favOnly; drawRecipes(); });
function setView(m) { viewMode = m; try { localStorage.setItem("ricView", m); } catch (e) { } drawRecipes(); }
$("vG").addEventListener("click", function () { setView("cards"); });
$("vL").addEventListener("click", function () { setView("table"); });
$("lucky").addEventListener("click", function () {
  var l = recRows();
  if (!l.length) { toast("Nessuna ricetta tra cui pescare"); return; }
  openRec(l[Math.floor(Math.random() * l.length)].id);
  toast("🎲 Che ne dici di questa?");
});

/* ==================================================================
   MENÙ DELLA SETTIMANA
   ================================================================== */
function menuOf(day, slot) {
  return menu.filter(function (m) { return m.day === day && m.slot === slot; })
    .sort(function (a, b) { return (a.pos || 0) - (b.pos || 0); });
}
function todayKey() { return ["dom", "lun", "mar", "mer", "gio", "ven", "sab"][new Date().getDay()]; }
function drawMenu() {
  $("nMen").textContent = menu.length;
  var tk = todayKey();
  $("menBody").innerHTML = GIORNI.map(function (d) {
    var slots = PASTI.map(function (s) {
      var chips = menuOf(d.k, s.k).map(function (m) {
        var r = recipes.filter(function (x) { return x.id === m.recipe_id; })[0];
        if (!r) return "";
        return '<span class="mchip"><span class="n" data-open="' + r.id + '">' + esc(r.name) + "</span>"
          + '<button class="x" data-rm="' + m.id + '">✕</button></span>';
      }).join("");
      return '<div class="mslot"><span class="lb">' + s.l + '</span><div class="mchips">' + chips
        + '<button class="madd" data-add="' + d.k + "|" + s.k + '">+</button></div></div>';
    }).join("");
    return '<div class="mday"><div class="mday-h">' + d.l
      + (d.k === tk ? '<span class="today">Oggi</span>' : "") + "</div>" + slots + "</div>";
  }).join("");

  $("menBody").querySelectorAll("[data-add]").forEach(function (b) {
    b.addEventListener("click", function () {
      var p = b.getAttribute("data-add").split("|");
      openPick(p[0], p[1]);
    });
  });
  $("menBody").querySelectorAll("[data-rm]").forEach(function (b) {
    b.addEventListener("click", function () {
      var id = b.getAttribute("data-rm");
      menu = menu.filter(function (m) { return m.id !== id; });
      drawMenu();
      sb.from("menu_slots").delete().eq("id", id).then(function (r) {
        if (r.error) { toast("Errore"); loadMenu().then(drawMenu); }
      });
    });
  });
  $("menBody").querySelectorAll("[data-open]").forEach(function (el) {
    el.addEventListener("click", function () { openRec(el.getAttribute("data-open")); });
  });
}
$("menClr").addEventListener("click", function () {
  if (!menu.length) { toast("Il menù è già vuoto"); return; }
  var ids = menu.map(function (m) { return m.id; });
  menu = []; drawMenu();
  sb.from("menu_slots").delete().in("id", ids).then(function () { toast("Settimana svuotata"); });
});
$("menShop").addEventListener("click", function () {
  if (!menu.length) { toast("Il menù è vuoto: assegna qualche ricetta"); return; }
  genFromMenu().then(function () { showPage("tSpe"); });
});

/* scelta ricetta */
var pkTarget = null;
function openPick(day, slot) {
  if (!recipes.length) { toast("Aggiungi prima qualche ricetta"); return; }
  pkTarget = { day: day, slot: slot };
  var d = GIORNI.filter(function (x) { return x.k === day; })[0];
  var s = PASTI.filter(function (x) { return x.k === slot; })[0];
  $("pkT").textContent = d.l + " · " + s.l.replace(/^\S+\s/, "");
  $("pkQ").value = "";
  drawPick();
  $("pkModal").hidden = false;
  setTimeout(function () { $("pkQ").focus(); }, 60);
}
function drawPick() {
  var q = $("pkQ").value.trim().toLowerCase();
  var l = recipes.slice().sort(function (a, b) {
    return (a.name || "").toLowerCase() < (b.name || "").toLowerCase() ? -1 : 1;
  }).filter(function (r) { return !q || (r.name || "").toLowerCase().indexOf(q) >= 0; });
  $("pkL").innerHTML = l.length ? l.map(function (r) {
    var th = r.photo ? '<span class="th"><img src="' + esc(r.photo) + '" alt=""></span>' : '<span class="th">' + POT + "</span>";
    var p = porOfList(r), s = staOfList(r), sub = [];
    p.forEach(function (x) { sub.push(x.e + " " + x.l); });
    s.forEach(function (x) { sub.push(x.e + " " + x.l); });
    return '<div class="pick-row" data-p="' + r.id + '">' + th
      + '<div><div class="n">' + esc(r.name) + "</div>"
      + (sub.length ? '<div class="s">' + sub.join(" · ") + "</div>" : "") + "</div></div>";
  }).join("") : '<div style="text-align:center;color:var(--ink-soft);padding:24px;font-size:14px">Nessuna ricetta trovata.</div>';

  $("pkL").querySelectorAll("[data-p]").forEach(function (row) {
    row.addEventListener("click", function () {
      if (!pkTarget) return;
      var rid = row.getAttribute("data-p");
      var pos = menuOf(pkTarget.day, pkTarget.slot).length;
      var rec = { day: pkTarget.day, slot: pkTarget.slot, recipe_id: rid, pos: pos };
      $("pkModal").hidden = true;
      sb.from("menu_slots").insert(rec).select().then(function (r) {
        if (r.error) { toast("Errore: " + r.error.message); return; }
        menu.push(r.data[0]);
        drawMenu();
      });
    });
  });
}
$("pkQ").addEventListener("input", drawPick);
$("pkX").addEventListener("click", function () { $("pkModal").hidden = true; });
$("pkModal").addEventListener("click", function (e) { if (e.target === $("pkModal")) $("pkModal").hidden = true; });

/* ==================================================================
   LISTA DELLA SPESA  (menù + catalogo + a mano)
   ================================================================== */
function shKey(n, u) { return (n || "").trim().toLowerCase() + "|" + (u || "").trim().toLowerCase(); }

/* Somma gli ingredienti di tutte le ricette della settimana.
   Stesso ingrediente con stessa unità: le quantità si sommano. */
function aggregate() {
  var map = {}, order = [];
  menu.forEach(function (m) {
    var r = recipes.filter(function (x) { return x.id === m.recipe_id; })[0];
    if (!r) return;
    ings(r).forEach(function (i) {
      if (!i.name) return;
      var u = (i.unit || "").trim(), k = shKey(i.name, u), n = qtyNum(i.qty);
      if (!map[k]) {
        map[k] = { name: i.name.trim(), unit: u, num: n, txt: n == null ? String(i.qty || "").trim() : null };
        order.push(k);
      } else if (n != null) {
        map[k].num = (map[k].num || 0) + n;
      }
    });
  });
  return order.map(function (k) { return map[k]; });
}
function genFromMenu() {
  var agg = aggregate();
  if (!agg.length) { toast("Il menù non ha ingredienti"); return Promise.resolve(); }

  /* Conservo lo spuntato e tutto ciò che non viene dal menù. */
  var wasDone = {};
  shopping.forEach(function (i) { if (i.done) wasDone[shKey(i.name, i.unit)] = true; });
  var keep = shopping.filter(function (i) { return i.source !== "menu"; });
  var kill = shopping.filter(function (i) { return i.source === "menu"; }).map(function (i) { return i.id; });

  var rows = agg.map(function (a) {
    return {
      name: a.name,
      qty: a.num != null ? fmtQty(a.num) : (a.txt || null),
      unit: a.unit || null,
      done: !!wasDone[shKey(a.name, a.unit)],
      source: "menu"
    };
  });

  setStatus("", "Genero la lista…");
  var p = kill.length ? sb.from("shopping_items").delete().in("id", kill) : Promise.resolve({});
  return p.then(function () {
    return sb.from("shopping_items").insert(rows).select();
  }).then(function (r) {
    if (r.error) throw r.error;
    shopping = keep.concat(r.data);
    drawShop();
    toast("Lista generata dal menù");
    setStatus("ok", "Pronto");
  }).catch(function (e) {
    console.error(e); toast("Errore: " + e.message);
    setStatus("warn", "Errore");
  });
}
$("spGen").addEventListener("click", function () {
  if (!menu.length) { toast("Prima componi il menù della settimana"); return; }
  genFromMenu();
});
$("spCat").addEventListener("click", function () { showPage("tCat"); });

function drawShop() {
  $("nSpe").textContent = shopping.filter(function (i) { return !i.done; }).length;
  var h = $("spBody");
  if (!shopping.length) {
    h.innerHTML = '<div class="empty"><div class="emo">🛒</div><h3>La lista è vuota</h3>'
      + "<p>Aggiungi a mano qui sopra, oppure prendi i prodotti dal catalogo, "
      + "oppure genera la lista dal menù della settimana.</p></div>";
    return;
  }
  var todo = shopping.filter(function (i) { return !i.done; });
  var done = shopping.filter(function (i) { return i.done; });
  function row(i) {
    var src = i.source === "menu" ? "📅" : (i.source === "catalogo" ? "📖" : "");
    return '<div class="srow' + (i.done ? " done" : "") + '" data-s="' + i.id + '">'
      + '<button class="sck" data-ck>✓</button>'
      + '<input class="sn" value="' + esc(i.name || "") + '">'
      + '<input class="sq" inputmode="decimal" value="' + esc(i.qty || "") + '" placeholder="—">'
      + '<span class="u">' + esc(i.unit || "") + ' <span class="src">' + src + "</span></span>"
      + '<button class="x" data-x>✕</button></div>';
  }
  h.innerHTML = '<div class="sp-list">'
    + (todo.length ? '<div class="sp-h">Da comprare · ' + todo.length + "</div>" + todo.map(row).join("") : "")
    + (done.length ? '<div class="sp-h">Fatto · ' + done.length + "</div>" + done.map(row).join("") : "")
    + "</div>";

  h.querySelectorAll(".srow").forEach(function (r) {
    var id = r.getAttribute("data-s");
    var it = shopping.filter(function (x) { return x.id === id; })[0];
    if (!it) return;
    r.querySelector("[data-ck]").addEventListener("click", function () {
      it.done = !it.done;
      drawShop();
      sb.from("shopping_items").update({ done: it.done }).eq("id", id);
    });
    r.querySelector("[data-x]").addEventListener("click", function () {
      shopping = shopping.filter(function (x) { return x.id !== id; });
      drawShop();
      sb.from("shopping_items").delete().eq("id", id);
    });
    r.querySelector(".sn").addEventListener("change", function () {
      it.name = this.value.trim();
      sb.from("shopping_items").update({ name: it.name }).eq("id", id);
    });
    r.querySelector(".sq").addEventListener("change", function () {
      it.qty = this.value.trim();
      sb.from("shopping_items").update({ qty: it.qty }).eq("id", id);
    });
  });
}
function addShop(name, qty, unit, source, product_id) {
  var row = {
    name: name, qty: qty || null, unit: unit || null,
    done: false, source: source || "manuale", product_id: product_id || null
  };
  return sb.from("shopping_items").insert(row).select().then(function (r) {
    if (r.error) { toast("Errore: " + r.error.message); return null; }
    shopping.push(r.data[0]);
    drawShop();
    return r.data[0];
  });
}
$("spAdd").addEventListener("click", function () {
  var n = $("spN").value.trim();
  if (!n) { $("spN").focus(); return; }
  addShop(n, $("spQ").value.trim(), "", "manuale").then(function () {
    $("spN").value = ""; $("spQ").value = ""; $("spN").focus();
  });
});
["spN", "spQ"].forEach(function (id) {
  $(id).addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); $("spAdd").click(); }
  });
});
$("spShare").addEventListener("click", function () {
  if (!shopping.length) { toast("La lista è vuota"); return; }
  var todo = shopping.filter(function (i) { return !i.done; });
  var items = todo.length ? todo : shopping;
  var txt = "🛒 Lista della spesa\n" + items.map(function (i) {
    var q = ((i.qty || "") + " " + (i.unit || "")).trim();
    return "• " + i.name + (q ? " — " + q : "");
  }).join("\n");
  share("Lista della spesa", txt);
});
$("spDone").addEventListener("click", function () {
  var ids = shopping.filter(function (i) { return i.done; }).map(function (i) { return i.id; });
  if (!ids.length) { toast("Niente da togliere"); return; }
  shopping = shopping.filter(function (i) { return !i.done; });
  drawShop();
  sb.from("shopping_items").delete().in("id", ids).then(function () { toast("Tolti " + ids.length + " elementi"); });
});
$("spAll").addEventListener("click", function () {
  if (!shopping.length) { toast("La lista è già vuota"); return; }
  var ids = shopping.map(function (i) { return i.id; });
  shopping = [];
  drawShop();
  sb.from("shopping_items").delete().in("id", ids).then(function () { toast("Lista svuotata"); });
});

/* ==================================================================
   CATALOGO PRODOTTI
   ================================================================== */
var curMonth = new Date().getMonth() + 1, openCats = {};
function inShop(name) {
  name = (name || "").trim().toLowerCase();
  return shopping.some(function (i) { return (i.name || "").trim().toLowerCase() === name; });
}
function drawMonthBar() {
  var b = [{ m: 0, l: "Tutto l'anno" }].concat(MESI.slice(1).map(function (l, i) { return { m: i + 1, l: l }; }));
  $("monthBar").innerHTML = b.map(function (x) {
    return '<button data-m="' + x.m + '" class="' + (x.m === curMonth ? "on" : "") + '">' + x.l + "</button>";
  }).join("");
  $("monthBar").querySelectorAll("[data-m]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      curMonth = parseInt(btn.getAttribute("data-m"), 10);
      drawCatalog();
      /* riporto il mese scelto al centro, se il browser lo permette */
      var nb = $("monthBar").querySelector('[data-m="' + curMonth + '"]');
      if (nb && nb.scrollIntoView) {
        try { nb.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" }); } catch (e) { }
      }
    });
  });
}
function drawCatalog() {
  drawMonthBar();
  var q = $("cq").value.trim().toLowerCase();
  $("cW").className = "search" + (q ? " has" : "");

  $("catBody").innerHTML = cats.map(function (c) {
    var list = prods.filter(function (p) {
      if (p.category_id !== c.id) return false;
      if (q && (p.name || "").toLowerCase().indexOf(q) < 0) return false;
      return true;
    }).sort(function (a, b) { return a.name < b.name ? -1 : 1; });
    if (!list.length) return "";

    /* Con la ricerca attiva apro tutto, così i risultati si vedono. */
    var open = q ? true : !!openCats[c.id];
    var body = list.map(function (p) {
      var m = p.months || [];
      /* fuori stagione: sbiadito, ma resta cliccabile */
      var off = (c.seasonal && curMonth > 0 && m.length && m.indexOf(curMonth) < 0) ? " off" : "";
      var inl = inShop(p.name) ? " in" : "";
      return '<span class="prod' + off + inl + '" data-p="' + p.id + '">'
        + '<span class="pn">' + esc(p.name) + "</span>"
        + '<span class="ed" data-ed="' + p.id + '" title="Modifica">✏️</span></span>';
    }).join("");

    var note = "";
    if (c.seasonal) {
      var n = list.filter(function (p) {
        var m = p.months || [];
        return !m.length || curMonth === 0 || m.indexOf(curMonth) >= 0;
      }).length;
      note = '<div class="season-note">' + (curMonth === 0 ? "Tutti i mesi"
        : "Di stagione a " + MESI[curMonth].toLowerCase() + ": <b>" + n + "</b> su " + list.length) + "</div>";
    }
    return '<div class="cat' + (open ? " open" : "") + '" data-c="' + c.id + '">'
      + '<div class="cat-h" data-h="' + c.id + '">'
      + '<span class="ic">' + (c.icon || "📦") + "</span>"
      + '<span class="n">' + esc(c.name) + "</span>"
      + '<span class="c">' + list.length + "</span>"
      + '<svg class="ch" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path d="m6 9 6 6 6-6"/></svg>'
      + "</div><div class=\"cat-b\">" + note + '<div class="prods">' + body + "</div></div></div>";
  }).join("") || '<div class="empty"><div class="emo">🔍</div><h3>Nessun prodotto</h3><p>Nessun prodotto con questo nome.</p></div>';

  $("catBody").querySelectorAll("[data-h]").forEach(function (h) {
    h.addEventListener("click", function () {
      var id = h.getAttribute("data-h");
      openCats[id] = !openCats[id];
      h.parentNode.classList.toggle("open", openCats[id]);
    });
  });
  /* tocco sul prodotto: entra o esce dalla lista della spesa */
  $("catBody").querySelectorAll("[data-p]").forEach(function (el) {
    el.querySelector(".pn").addEventListener("click", function (e) {
      e.stopPropagation();
      var p = prods.filter(function (x) { return x.id === el.getAttribute("data-p"); })[0];
      if (!p) return;
      var ex = shopping.filter(function (i) {
        return (i.name || "").trim().toLowerCase() === p.name.trim().toLowerCase();
      })[0];
      if (ex) {
        shopping = shopping.filter(function (i) { return i.id !== ex.id; });
        el.classList.remove("in");
        $("nSpe").textContent = shopping.filter(function (i) { return !i.done; }).length;
        sb.from("shopping_items").delete().eq("id", ex.id);
        toast(p.name + " tolto dalla lista");
      } else {
        el.classList.add("in");
        addShop(p.name, "", "", "catalogo", p.id).then(function () {
          toast(p.name + " nella lista 🛒");
        });
      }
    });
  });
  /* matita: modifica il prodotto */
  $("catBody").querySelectorAll("[data-ed]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.stopPropagation();
      openProd(el.getAttribute("data-ed"));
    });
  });
}
$("cq").addEventListener("input", drawCatalog);
$("cqC").addEventListener("click", function () { $("cq").value = ""; drawCatalog(); $("cq").focus(); });

/* ---------- prodotto: aggiungi / modifica ---------- */
var prodId = null, prodMonths = [];
function drawProdMonths() {
  $("prM").innerHTML = MESI.slice(1).map(function (l, i) {
    var m = i + 1;
    return '<button data-pm="' + m + '" class="' + (prodMonths.indexOf(m) >= 0 ? "on" : "") + '">'
      + MESI_BREVI[m] + "</button>";
  }).join("");
  $("prM").querySelectorAll("[data-pm]").forEach(function (b) {
    b.addEventListener("click", function () {
      var m = parseInt(b.getAttribute("data-pm"), 10);
      var i = prodMonths.indexOf(m);
      if (i >= 0) prodMonths.splice(i, 1); else prodMonths.push(m);
      prodMonths.sort(function (a, b) { return a - b; });
      drawProdMonths();
    });
  });
}
$("prMall").addEventListener("click", function () {
  prodMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; drawProdMonths();
});
$("prMnone").addEventListener("click", function () { prodMonths = []; drawProdMonths(); });

function openProd(id) {
  prodId = id || null;
  var p = id ? prods.filter(function (x) { return x.id === id; })[0] : null;
  $("prT").textContent = id ? "Modifica prodotto" : "Nuovo prodotto";
  $("prDel").hidden = !id;
  $("prN").value = p ? p.name : "";
  $("prC").innerHTML = cats.map(function (c) {
    return '<option value="' + c.id + '"' + (p && p.category_id === c.id ? " selected" : "") + ">"
      + (c.icon || "📦") + " " + esc(c.name) + "</option>";
  }).join("");
  prodMonths = p && p.months ? p.months.slice() : [];
  drawProdMonths();
  $("prModal").hidden = false;
  setTimeout(function () { $("prN").focus(); }, 60);
}
$("prodAdd").addEventListener("click", function () { openProd(null); });
$("prX").addEventListener("click", function () { $("prModal").hidden = true; });
$("prCanc").addEventListener("click", function () { $("prModal").hidden = true; });
$("prModal").addEventListener("click", function (e) { if (e.target === $("prModal")) $("prModal").hidden = true; });

$("prSave").addEventListener("click", function () {
  var n = $("prN").value.trim();
  if (!n) { toast("Il nome serve"); $("prN").focus(); return; }
  var data = { name: n, category_id: $("prC").value, months: prodMonths };
  var b = $("prSave");
  b.disabled = true; b.textContent = "Salvo…";
  var op = prodId ? sb.from("products").update(data).eq("id", prodId) : sb.from("products").insert(data);
  op.then(function (r) {
    b.disabled = false; b.textContent = "Salva";
    if (r.error) {
      /* nome già presente nella stessa categoria */
      if ((r.error.message || "").indexOf("duplicate") >= 0 || r.error.code === "23505") {
        toast("Questo prodotto esiste già in quella categoria");
      } else toast("Errore: " + r.error.message);
      return;
    }
    var wasEdit = !!prodId;
    $("prModal").hidden = true;
    /* la categoria appena usata resta aperta, così vedi il risultato */
    openCats[data.category_id] = true;
    loadCatalog().then(function () {
      drawCatalog();
      toast(wasEdit ? "Prodotto aggiornato" : "Prodotto aggiunto");
    });
  });
});
$("prDel").addEventListener("click", function () {
  if (!prodId) return;
  var p = prods.filter(function (x) { return x.id === prodId; })[0];
  delTarget = { kind: "product", id: prodId };
  $("dlN").textContent = "«" + (p ? p.name : "") + "» verrà tolto dal catalogo.";
  $("prModal").hidden = true;
  $("dlModal").hidden = false;
});

/* ==================================================================
   ELIMINAZIONE
   ================================================================== */
var delTarget = null;
$("dlNo").addEventListener("click", function () { $("dlModal").hidden = true; delTarget = null; });
$("dlYes").addEventListener("click", function () {
  if (!delTarget) return;
  var t = delTarget;
  $("dlModal").hidden = true;
  delTarget = null;

  if (t.kind === "recipe") {
    sb.from("recipes").delete().eq("id", t.id).then(function (r) {
      if (r.error) { toast("Errore: " + r.error.message); return; }
      /* il menù si pulisce da solo: cancellazione a catena nel database */
      return Promise.all([loadRecipes(), loadMenu()]).then(function () {
        drawRecipes(); drawMenu();
        toast("Ricetta eliminata");
      });
    });
  } else if (t.kind === "product") {
    sb.from("products").delete().eq("id", t.id).then(function (r) {
      if (r.error) { toast("Errore: " + r.error.message); return; }
      return loadCatalog().then(function () { drawCatalog(); toast("Prodotto eliminato"); });
    });
  }
});

document.addEventListener("keydown", function (e) {
  if (e.key !== "Escape") return;
  if (!$("dlModal").hidden) { $("dlModal").hidden = true; delTarget = null; }
  else if (!$("prModal").hidden) $("prModal").hidden = true;
  else if (!$("pkModal").hidden) $("pkModal").hidden = true;
  else if (!$("ckModal").hidden) ckClose();
  else if (!$("fModal").hidden) closeForm();
  else if (!$("rvModal").hidden) $("rvModal").hidden = true;
});

/* ==================================================================
   CARICAMENTO
   ================================================================== */
function loadRecipes() {
  return sb.from("recipes").select("*").order("name").then(function (r) {
    if (r.error) throw r.error;
    recipes = r.data;
  });
}
function loadMenu() {
  return sb.from("menu_slots").select("*").then(function (r) {
    if (r.error) throw r.error;
    menu = r.data;
  });
}
function loadShopping() {
  return sb.from("shopping_items").select("*").order("created_at").then(function (r) {
    if (r.error) throw r.error;
    shopping = r.data;
  });
}
function loadCatalog() {
  return sb.from("categories").select("*").order("pos").then(function (r) {
    if (r.error) throw r.error;
    cats = r.data;
    /* Il catalogo ha centinaia di prodotti: li prendo a pagine. */
    var all = [], from = 0, PAGE = 500;
    function page() {
      return sb.from("products").select("*").order("name").range(from, from + PAGE - 1).then(function (p) {
        if (p.error) throw p.error;
        all = all.concat(p.data);
        if (p.data.length === PAGE) { from += PAGE; return page(); }
        prods = all;
      });
    }
    return page();
  });
}

function boot() {
  setStatus("", "Carico…");
  return Promise.all([loadRecipes(), loadMenu(), loadShopping(), loadCatalog()])
    .then(function () {
      drawRecipes();
      $("nMen").textContent = menu.length;
      $("nSpe").textContent = shopping.filter(function (i) { return !i.done; }).length;
      setStatus("ok", recipes.length
        ? ("<b>" + recipes.length + "</b> ricette · <b>" + prods.length + "</b> prodotti a catalogo")
        : ("Ricettario vuoto · <b>" + prods.length + "</b> prodotti a catalogo"));
    })
    .catch(function (e) {
      console.error(e);
      setStatus("warn", "Errore: " + (e.message || "caricamento non riuscito"));
      $("host").innerHTML = '<div class="empty"><div class="emo">⚠️</div><h3>Non riesco a caricare</h3><p>'
        + esc(e.message || "Errore di connessione") + "</p></div>";
    });
}

requireAuth().then(boot);
