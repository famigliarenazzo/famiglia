# Famiglia Catenazzo Renò

Spazio web privato di casa. Tre strumenti: ricettario (con lista della spesa),
biblioteca, spese di casa.

Nessuno può vedere i contenuti senza aver fatto l'accesso.

---

## Cosa c'è in questa cartella

| File | A cosa serve |
|---|---|
| `schema.sql` | Crea il database. Si esegue una volta sola. |
| `index.html` | Il portale con l'accesso e i tre pulsanti. |
| `famiglia.css` | Grafica comune a tutte le pagine. |
| `famiglia.js` | Connessione al database, accesso, utilità comuni. |
| `sw.js`, `manifest.webmanifest`, `icon-*.png` | Servono a installare l'app sull'iPhone. |
| `.github/workflows/keepalive.yml` | Tiene sveglio il database (vedi sotto). |

---

## Passo 1 · Creare il database

1. Vai sul pannello Supabase, apri il progetto.
2. Nella barra a sinistra scegli **SQL Editor**.
3. Apri `schema.sql`, copia **tutto** il contenuto e incollalo nell'editor.
4. Premi **Run** (o Ctrl+Invio).

Deve rispondere *Success*. Se lo esegui due volte non succede nulla di male:
è scritto per non creare doppioni.

Cosa ha creato:

- Le tabelle di ricette, menù, lista spesa, catalogo prodotti, libri e spese.
- **Il catalogo alimentare completo**: 17 categorie e 264 prodotti, con la
  stagionalità mese per mese di frutta e verdura (presa dalla lista spesa che
  usavi prima).
- 12 categorie di spesa e circa 130 regole già pronte per riconoscere i
  movimenti dell'estratto conto (supermercati, benzinai, utenze, assicurazioni…).
- **La protezione**: senza accesso, il database non restituisce niente a nessuno.

---

## Passo 2 · Creare gli accessi

Il sito non ha registrazione: gli utenti li crei tu, così nessun estraneo
può iscriversi.

1. Sul pannello Supabase: **Authentication** → **Users** → **Add user** →
   **Create new user**.
2. Metti la tua email e una password. **Spunta "Auto Confirm User"**,
   altrimenti l'accesso resta bloccato in attesa di una conferma via email.
3. Ripeti per l'utente di tua moglie.

Consiglio: sempre in **Authentication → Sign In / Providers**, disattiva
**Allow new users to sign up**. Così, anche se qualcuno trovasse il link,
non potrebbe crearsi un accesso da solo.

---

## Passo 3 · Pubblicare il sito

Carica i file di questa cartella su un hosting statico con HTTPS
(GitHub Pages, Cloudflare Pages, Netlify: tutti gratuiti).

Su GitHub Pages: crea il repository, carica i file nella root,
poi **Settings → Pages → Source: main / root**.

Nota: la chiave che sta dentro `famiglia.js` è **pubblica per progettazione**,
non è un segreto. La protezione la fanno le regole del database, che senza
accesso non lasciano passare un solo dato. Il repository può quindi essere
pubblico senza problemi.

---

## Passo 4 · Tenere sveglio il database

Sul piano gratuito, Supabase mette in pausa i progetti dopo **7 giorni senza
traffico**. Una settimana senza aprire l'app capita (una vacanza, un periodo
pieno), e riattivare a mano è una seccatura.

Il file `.github/workflows/keepalive.yml` risolve: fa una chiamata banale al
database ogni 3 giorni, e il progetto non si addormenta mai. È gratis.

Per attivarlo, nel repository su GitHub:

1. **Settings → Secrets and variables → Actions → New repository secret**.
2. Crea `SUPABASE_URL` con valore `https://tqqoxvfbstgcwbututfl.supabase.co`
3. Crea `SUPABASE_KEY` con valore della chiave publishable
   (`sb_publishable_...`, la stessa che sta in `famiglia.js`).
4. Vai nella scheda **Actions**, apri *Supabase keep-alive* e premi
   **Run workflow** per provarlo subito.

Se il repository non ha attività per 60 giorni, GitHub sospende le azioni
programmate e manda un'email: basta rientrare e riattivarle con un clic.

---

## Passo 5 · Installare sull'iPhone

1. Apri il sito in **Safari** (su iOS solo Safari installa le app web).
2. Tasto Condividi → **Aggiungi a schermata Home**.
3. Si apre a schermo intero dall'icona. L'accesso resta memorizzato:
   la password non va rimessa tutte le volte.

Ripeti sull'altro iPhone.

---

## Spazio disponibile (piano gratuito)

| Risorsa | Limite | Nota |
|---|---|---|
| Database | 500 MB | Testo puro: non lo esaurirai mai. |
| Foto | **1 GB** | È questo il vincolo vero. |
| Traffico | 5 GB al mese | Ampio per due persone. |

Le foto vengono ridotte e compresse automaticamente prima del caricamento
(lato lungo massimo 1200 px, qualità 72%): una foto pesa circa 150-300 KB.
Con 1 GB ci stanno migliaia di immagini tra ricette e copertine.

---

## Aggiornamenti futuri

Modificando i file, incrementare `VERSION` in `sw.js` (es. `famiglia-v2`)
e ricaricare: al secondo avvio l'app installata si aggiorna da sola.
