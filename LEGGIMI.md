# Famiglia Catenazzo Renò

Tre strumenti di casa in un sito solo, privato, accessibile con password
solo da te e da tua moglie, sincronizzato fra i due telefoni.

- **Il nostro ricettario** · ricette, menù della settimana, lista della spesa, catalogo prodotti
- **La mia biblioteca** · i libri dei bambini, chi li ha letti, prestiti
- **Le spese di casa** · legge l'estratto conto della banca e divide le spese

Tutto gratuito: il sito su hosting statico, i dati su Supabase (piano gratuito).

---

## Cosa c'è nel pacchetto

```
index.html            il portale con il login
ricettario.html/.js   primo strumento
biblioteca.html       secondo strumento
spese.html/.js        terzo strumento
estratto.js           il lettore di estratti conto
famiglia.css/.js      stile e funzioni comuni
sw.js                 funzionamento offline
manifest.webmanifest  installazione sul telefono
icon-*.png            icone dell'app
icona-sorgente.svg    l'icona modificabile, se un giorno vorrai cambiarla

database/             gli schemi SQL, da eseguire in ordine
.github/workflows/    il ping che tiene sveglio il database
```

---

## Installazione, dall'inizio

### 1. Il database (una volta sola)

Su supabase.com, nel tuo progetto, apri **SQL Editor** ed esegui i tre file
**in quest'ordine**:

1. `database/schema.sql` · crea le tabelle, le protezioni, il catalogo dei
   264 prodotti con la stagionalità e circa 130 regole per le spese
2. `database/schema2.sql` · adatta la biblioteca ai tuoi dati reali
3. `database/schema3.sql` · le regole che imparano, per le spese

### 2. Chi può entrare

**Authentication → Users → Add user**, con **Auto Confirm** acceso.
Crea l'utenza tua e quella di tua moglie.

Poi **Authentication → Providers → Email**: spegni **Enable signups**.
Così nessun altro può registrarsi.

### 3. Le chiavi

In `famiglia.js`, in cima, ci sono già indirizzo e chiave del tuo progetto.

La chiave è *pubblicabile*: non è un segreto e da sola non dà accesso a
niente. A proteggere i dati sono le regole del database, che pretendono un
utente autenticato.

### 4. Il sito online

Carica tutti i file (non le cartelle `database/` e `.github/`) sul tuo
hosting: GitHub Pages, Cloudflare Pages, Netlify, uno vale l'altro.

Deve stare su **https**, altrimenti login e installazione non funzionano.

### 5. Il database che non si addormenta

Supabase sospende i progetti gratuiti dopo 7 giorni di inattività.
Il file `.github/workflows/keepalive.yml` lo interroga ogni 3 giorni.

Nel repository GitHub: **Settings → Secrets and variables → Actions**,
aggiungi due segreti:

- `SUPABASE_URL` → l'indirizzo del progetto
- `SUPABASE_KEY` → la chiave pubblicabile

Poi in **Actions** accendi il flusso di lavoro.

### 6. Sul telefono

Apri il sito con Safari, tocca **Condividi**, poi **Aggiungi alla schermata
Home**. L'app compare tra le altre, a tutto schermo, con la sua icona.
Su Android, Chrome propone l'installazione da solo.

---

## I primi passi con i dati

**Biblioteca.** Tocca **📥** e scegli `biblioteca.json`. Fallo dal computer:
le 202 copertine pesano circa 9 MB e dalla rete mobile ci mette parecchio.
Reimportare lo stesso file non crea doppioni.

**Ricettario.** Parte vuoto: le ricette del vecchio ricettario stavano nella
memoria del telefono, non nel file, quindi non c'è nulla da importare. Il
catalogo dei 264 prodotti c'è già.

**Spese.** Carica il PDF dell'estratto conto. Se la banca dà anche il CSV,
quello è ancora più affidabile.

---

## Come funzionano

### Ricettario
Quattro schede. Nelle **ricette**, dentro una scheda, puoi cambiare le
porzioni e tutte le quantità si ricalcolano, spuntare gli ingredienti mentre
cucini, e usare la **modalità cucina**, che mostra un passo alla volta e
tiene lo schermo acceso.

Il **menù** assegna le ricette ai sette giorni, pranzo e cena.

La **spesa** è una lista sola alimentata da tre parti: dal menù (somma gli
ingredienti della settimana: se la pasta serve in due ricette da 320 g, in
lista trovi 640 g), dal catalogo, e da quello che scrivi a mano. Ogni voce
mostra da dove viene. Rigenerando la lista, le voci spuntate restano
spuntate e quelle aggiunte a mano non vengono toccate.

Il **catalogo** ha i 264 prodotti con i mesi in cui si trovano. Frutta e
verdura fuori stagione restano sbiadite ma cliccabili. Puoi aggiungere
prodotti nuovi e correggere quelli catalogati male.

### Biblioteca
Tre viste: lo **scaffale** (i libri in piedi, ognuno col colore del suo
dorso, l'altezza proporzionale alle pagine), le copertine, l'elenco.

Nella scheda di ogni libro i cinque lettori sono pulsanti: un tocco e segni
chi l'ha letto, con la data. Filtri per proprietaria, genere, età, e stato.

### Spese
Carichi il PDF e i movimenti vengono riconosciuti. **Il file non viene
caricato da nessuna parte**: viene letto dentro il browser, sul tuo
dispositivo. Nel database finiscono solo data, descrizione e importo, dopo
che li hai confermati.

Il lettore non è scritto su misura per una banca: riconosce il formato dal
file, qualunque sia la disposizione delle colonne.

**Le categorie imparano.** Parti con circa 130 regole già pronte. Quello che
non riconosce lo classifichi tu una volta sola: la correzione diventa una
regola, si applica subito agli altri movimenti simili dello stesso estratto
conto e vale per i mesi successivi.

Reimportare lo stesso estratto conto non crea doppioni.

---

## Se qualcosa non va

**Il PDF non viene letto.**
Se l'estratto conto è una scansione (una fotografia della pagina, non testo),
non c'è testo da leggere e nessun programma può ricavarne i movimenti.
Scarica dalla banca il CSV, che lo strumento accetta ugualmente.

**Le modifiche non si vedono.**
Il sito tiene una copia in memoria per funzionare offline. Dopo aver caricato
file nuovi ricarica la pagina; se serve, chiudi e riapri l'app.

**Il login non funziona.**
Controlla che l'utenza esista in Authentication → Users e risulti confermata.
Il sito deve stare su https.

**Il database sembra spento.**
Se il progetto è rimasto fermo più di una settimana e il ping non era attivo,
Supabase lo sospende: rientra nel pannello e riattivalo.

---

## Lo spazio gratuito

Il vincolo vero è **1 GB** di database. Le foto sono la cosa che pesa: le
comprimo prima di salvarle (circa 40 KB l'una), quindi c'è spazio per
migliaia di libri e ricette. I movimenti bancari sono testo e non pesano
quasi nulla.
