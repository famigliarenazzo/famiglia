/* =====================================================================
   FAMIGLIA CATENAZZO RENÒ · libreria comune
   Configurazione, connessione a Supabase, login, utilità condivise.
   ===================================================================== */

var SUPABASE_URL = "https://tqqoxvfbstgcwbututfl.supabase.co";

/* La chiave. Vanno bene entrambi i tipi:
   - legacy "anon"  → inizia con  eyJ...            (consigliata: nessun intoppo)
   - nuova publishable → inizia con sb_publishable_ (gestita qui sotto)

   Le chiavi nuove non sono JWT e Supabase le rifiuta se arrivano
   nell'intestazione "Authorization: Bearer". La libreria però le mette
   proprio lì finché non si è fatto l'accesso, e il login fallisce.
   Il correttivo qui sotto toglie quell'intestazione quando non serve. */
var SUPABASE_KEY = "sb_publishable_yxM_xFHwyHO_dmIWxKNs2g_qEzqdvPf";

var KEY_IS_JWT = /^ey/.test(SUPABASE_KEY);

/* Correttivo per le chiavi publishable: intercetta le chiamate e rimuove
   l'intestazione Authorization quando contiene la chiave anziché un JWT
   di sessione. Con le chiavi legacy non viene applicato nulla. */
var rawFetch = window.fetch.bind(window);
function patchedFetch(input, init) {
  try {
    var url = typeof input === "string" ? input : (input && input.url) || "";
    if (url.indexOf(SUPABASE_URL) === 0) {
      var h = new Headers((init && init.headers) || (input && input.headers) || {});
      var auth = h.get("Authorization") || "";
      /* Un JWT di sessione ha tre parti separate da punto e inizia per "ey".
         Se al posto suo c'è la chiave publishable, l'intestazione va tolta. */
      if (auth && auth.indexOf("Bearer sb_") === 0) {
        h.delete("Authorization");
        init = Object.assign({}, init, { headers: h });
        if (typeof input !== "string") {
          input = new Request(input, { headers: h });
        }
      }
    }
  } catch (e) { /* in caso di dubbio si prosegue senza toccare nulla */ }
  return rawFetch(input, init);
}

var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, storage: window.localStorage },
  global: KEY_IS_JWT ? {} : { fetch: patchedFetch }
});

/* ---------- utilità ---------- */
function $(id) { return document.getElementById(id); }
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function toast(msg, ms) {
  var t = $("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("on");
  clearTimeout(toast._t);
  toast._t = setTimeout(function () { t.classList.remove("on"); }, ms || 2600);
}
function fmtEur(n) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n || 0);
}
var MESI = ["", "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
var MESI_BREVI = ["", "Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

/* ---------- tema ---------- */
function applyTheme() {
  var t = "";
  try { t = localStorage.getItem("famigliaTheme") || ""; } catch (e) { }
  if (t) document.documentElement.setAttribute("data-theme", t);
  else document.documentElement.removeAttribute("data-theme");
}
function toggleTheme() {
  var cur = document.documentElement.getAttribute("data-theme");
  var next = cur === "light" ? "" : "light";
  try { localStorage.setItem("famigliaTheme", next); } catch (e) { }
  applyTheme();
}
applyTheme();

/* ---------- sessione ---------- */
var currentUser = null;

/* Protegge una pagina: se non c'è sessione rimanda al portale.
   Restituisce una promise che si risolve con l'utente. */
function requireAuth() {
  return sb.auth.getSession().then(function (r) {
    var s = r.data.session;
    if (!s) { location.href = "index.html"; return Promise.reject("no-session"); }
    currentUser = s.user;
    return s.user;
  });
}
function signOut() {
  return sb.auth.signOut().then(function () { location.href = "index.html"; });
}

/* ---------- intestazione comune degli strumenti ---------- */
function toolHeader(title, subtitle) {
  return '<a class="back" href="index.html" title="Torna al portale">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>'
    + '</a>'
    + '<div class="ttl"><h1>' + esc(title) + '</h1>'
    + (subtitle ? '<span class="sub" id="hdrSub">' + esc(subtitle) + '</span>' : '<span class="sub" id="hdrSub"></span>')
    + '</div>';
}

/* ---------- stato di rete ---------- */
function setStatus(kind, html) {
  var el = $("status");
  if (!el) return;
  el.className = "status" + (kind ? " " + kind : "");
  el.innerHTML = '<span class="dot"></span><span>' + html + "</span>";
}

/* ---------- helper Supabase ---------- */
/* Esegue una query e gestisce l'errore in modo uniforme. */
function guard(promise, ctx) {
  return promise.then(function (r) {
    if (r.error) throw r.error;
    return r.data;
  }).catch(function (e) {
    console.error(ctx || "supabase", e);
    toast("Errore: " + (e.message || "operazione non riuscita"));
    throw e;
  });
}

/* Comprime un'immagine prima del caricamento (le foto sono il vincolo
   di spazio del piano gratuito: 1 GB). */
function compressImage(file, maxSide, quality) {
  maxSide = maxSide || 1200; quality = quality || 0.72;
  return new Promise(function (res, rej) {
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function () {
      var w = img.width, h = img.height, sc = Math.min(1, maxSide / Math.max(w, h));
      var c = document.createElement("canvas");
      c.width = Math.round(w * sc); c.height = Math.round(h * sc);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob(function (b) { b ? res(b) : rej(new Error("compressione fallita")); }, "image/jpeg", quality);
    };
    img.onerror = function () { URL.revokeObjectURL(url); rej(new Error("immagine non leggibile")); };
    img.src = url;
  });
}

/* Carica una foto nello storage e restituisce l'URL pubblico. */
function uploadPhoto(bucket, file) {
  return compressImage(file).then(function (blob) {
    var name = Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ".jpg";
    return sb.storage.from(bucket).upload(name, blob, { contentType: "image/jpeg", upsert: false })
      .then(function (r) {
        if (r.error) throw r.error;
        return sb.storage.from(bucket).getPublicUrl(name).data.publicUrl;
      });
  });
}
