# Famiglia Catenazzo Renò

Tre strumenti di casa in un sito solo, privato, accessibile con password
solo da te e da tua moglie, sincronizzato fra i due telefoni.

- **Il nostro ricettario** · ricette, menù della settimana, lista della spesa, catalogo prodotti
- **La mia biblioteca** · i libri dei bambini, chi li ha letti, prestiti
- **Le spese di casa** · legge l'estratto conto della banca e divide le spese
- **La cartella clinica** · le schede di famiglia e i referti degli esami
- **Lo scanner** · fotografa un documento e lo trasforma in un PDF diritto
- **I documenti di casa** · contratti, garanzie, assicurazioni e le scadenze
  delle auto, con l'avviso prima che scadano

Tutto gratuito: il sito su hosting statico, i dati su Supabase (piano gratuito).

---

## Cosa c'è nel pacchetto

```
index.html            il portale con il login
ricettario.html/.js   primo strumento
biblioteca.html       secondo strumento
spese.html/.js        terzo strumento
clinica.html          quarto strumento, la cartella clinica
scanner.html          quinto strumento, lo scanner
documenti.html        sesto strumento, i documenti di casa
estratto.js           il lettore di estratti conto
bordi.js              trova i bordi del foglio nelle foto
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
4. `database/schema4.sql` · le portate multiple, la cartella clinica, lo
   scanner, e l'archivio privato dei file. Crea anche le cinque schede
   di famiglia. Se lo esegui due volte non duplica niente.
5. `database/schema5.sql` · le note sui movimenti, i nomi personalizzati e
   gli esercenti
6. `database/schema6.sql` · i documenti di casa e le auto

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

## Le novità

### Ricettario: più portate e più stagioni

Un piatto non è più costretto a essere una cosa sola. I pancake possono
essere insieme colazione e dolce, e li ritrovi filtrando per entrambe.
Nel modulo, portate e stagioni sono caselle da spuntare.

Le ricette già salvate non si toccano: il valore che avevano viene portato
dentro il nuovo elenco.

### Biblioteca: condividere e vendere

Nella scheda di ogni libro ci sono tre pulsanti:

- **Condividi** apre il pannello del telefono, per mandare la scheda a chi vuoi
- **Copia scheda** mette il testo negli appunti
- **Annuncio Vinted** prepara il testo dell'annuncio già scritto, con titolo,
  descrizione, condizioni e prezzo di rivendita. Vinted non permette di
  ricevere annunci da fuori, quindi il testo va incollato a mano: apri l'app,
  tieni premuto, incolla.

### Spese: l'estratto conto di Banca Sella

Prima non riconosceva nessun movimento. C'erano due difetti.

Il primo: Sella scrive le date come `01 04 26`, con gli spazi, e il programma
cercava solo le barre (`01/04/26`). Nessuna data riconosciuta, nessun movimento.

Il secondo, più insidioso: in questo estratto conto il saldo finisce nella
stessa colonna delle entrate. Il programma, che cercava il saldo "a naso"
guardando la colonna più a destra, avrebbe buttato via i bonifici in entrata
scambiandoli per saldi. Gli stipendi sarebbero spariti.

Adesso le colonne non si indovinano: si leggono le intestazioni scritte nel
PDF (*Uscite*, *Entrate*), e il segno viene da lì.

E c'è una verifica: la banca dichiara i totali del periodo, quindi il
programma somma i movimenti che ha trovato e li confronta. Se tornano, te lo
dice. Se non tornano, te lo dice lo stesso, invece di lasciarti credere che
sia tutto a posto. Sul tuo estratto conto di giugno trova **77 movimenti** e
i conti quadrano al centesimo.

### Cartella clinica

Le cinque schede ci sono già. Ogni scheda tiene gruppo sanguigno, allergie,
intolleranze, terapie, patologie, vaccinazioni, esenzioni, medico, contatto
d'emergenza, codice fiscale, tessera sanitaria, foto e note.

Per ogni persona archivi gli esami: nome, data, tipo, dove, il documento
(PDF o foto) e le note. Dalla tabella lo apri in anteprima, lo stampi, lo
condividi.

**I referti sono dati sanitari, e stanno in un archivio privato.** Le
copertine dei libri stanno in un archivio pubblico, e va benissimo così:
chi conosce l'indirizzo di una copertina la vede, e non è un problema. Per i
referti delle bambine sì. Ogni volta che apri un file, il collegamento viene
creato al momento e scade dopo un'ora: senza aver fatto l'accesso non si apre
niente, nemmeno conoscendo l'indirizzo esatto.

Quando condividi un referto viene mandato il **file**, non il collegamento:
il collegamento scadrebbe dopo un'ora e chi lo riceve si troverebbe una
pagina morta.

### Scanner

Fotografi un documento e **i bordi del foglio vengono trovati da soli**,
come fa iScanner: prima gli angoli partivano ai lati della foto e andavano
trascinati a mano ogni volta.

Il programma cerca il contorno del foglio partendo dal centro e guardando
verso l'esterno. Se non trova niente di convincente **si arrende** e lascia i
bordi della foto, invece di tagliare male il documento: in quel caso sposti
gli angoli a mano, o tocchi «Ritrova i bordi» per farglieli ricercare.

Poi: raddrizzatura, quattro filtri, riordino delle pagine, e il PDF.

Le scansioni ora **si salvano** (prima ricaricando la pagina si perdeva
tutto). Se vuoi, il testo viene letto e il documento diventa cercabile per
parola. La lettura avviene sul tuo telefono, il documento non va da nessuna
parte.

E c'è una scorciatoia: quando salvi una scansione puoi mandarla **direttamente
nella cartella clinica** di una persona. Fotografi il referto in farmacia e
lo trovi già archiviato al posto giusto.

### Spese: gli esercenti, le note, i nomi

Tocca il nome di un movimento e si apre la sua scheda. Da lì puoi:

- **rinominarlo**: "Pos Carrefour 2117 Rivalta di To Carta N. \*\*\*\*\* 228" diventa
  "Spesa settimanale". La descrizione originale della banca non viene toccata:
  resta lì sotto, se un giorno serve un riscontro.
- **dargli un esercente**: è il nome sotto cui accorpare i movimenti. Il
  Carrefour di Rivalta e quello di Nichelino sono lo stesso Carrefour.
- **scriverci una nota**: "regalo per il compleanno di Aurora".

L'esercente il programma prova a indovinarlo da solo: sul tuo estratto Fineco
riconosce Carrefour, Amazon, Satispay, Naturasì, Octopus, American Express e
un'altra cinquantina di nomi, accorpando le varianti senza che tu faccia
niente. Dove non è ragionevolmente sicuro **non indovina**: lascia il
movimento senza esercente, invece di accorpare a caso spese che non c'entrano
niente. Le farmacie, per esempio, restano volutamente distinte: la Comunale di
Orbassano non è la F20 di Bruino.

Quando correggi un esercente a mano, se lasci la spunta la correzione vale
anche per gli altri movimenti simili e per quelli che arriveranno.

In alto, il riquadro delle statistiche ha due linguette: **per tipologia**
(come prima) e **per esercente**. Tocca una barra per filtrare i movimenti.

### Spese: eliminare davvero

C'è ora un pulsante **Elimina…** accanto a «Estratto conto»: cancella in blocco
tutti i movimenti, oppure solo quelli di un estratto conto caricato, oppure solo
quelli di un mese. Cancellarli a uno a uno dopo una prova andata storta era un
supplizio.

Prima l'eliminazione singola aveva un difetto: la riga spariva dallo schermo e
la cancellazione partiva, ma **nessuno controllava se fosse andata a buon fine**.
Se il database la rifiutava, l'errore finiva nel nulla e il movimento riappariva
al primo aggiornamento della pagina. Adesso la risposta viene attesa: se
qualcosa non va, il movimento torna al suo posto e te lo dico, invece di
lasciarti credere che sia sparito.

### Spese: Fineco

Funziona anche l'estratto conto Fineco, che è impaginato in modo diverso da
Sella: le date con i punti (`05.01.26`), la descrizione a destra dell'importo
invece che a sinistra, e soprattutto gli importi allineati a destra.

Quest'ultima è la parte delicata. Le intestazioni *Uscite* ed *Entrate* sono
allineate a sinistra, ma i numeri sotto sono allineati a destra: confrontare
un numero con la sua intestazione non funziona, e i giroconti in entrata
sarebbero finiti tutti fra le uscite. Adesso il confine fra le due colonne
viene ricavato dai numeri stessi.

Sul tuo estratto trova **167 movimenti**, e la verifica è persino più severa
di quella di Sella: partendo dal saldo iniziale (2.571,66 €) e applicando
tutti i movimenti trovati si arriva al centesimo al saldo finale dichiarato
(2.150,77 €). Se anche un solo movimento avesse il segno sbagliato, non
tornerebbe.

C'era un secondo problema, che faceva sì che i movimenti si vedessero
nell'anteprima ma non venissero salvati. Nel tuo trimestre ci sono **due
ricariche Satispay identiche lo stesso giorno**, stesso importo: sono due
movimenti veri e distinti, ma per il programma avevano la stessa impronta. Il
database rifiutava l'intero blocco di cinquanta movimenti, e l'errore spariva
in un avviso momentaneo. Ora le impronte numerano le ripetizioni, e se un
salvataggio fallisce il programma si ferma e lo dice, invece di proseguire
fingendo che sia andato tutto bene.

### I documenti di casa

Il punto di questa sezione non è archiviare: è **ricordare**. Un contratto
sepolto in un database è inutile quanto uno sepolto in un cassetto. Quello che
serve è sapere che la revisione scade fra tre settimane senza doverselo
chiedere.

Ogni documento (contratto, garanzia, assicurazione, bolletta, passaporto) può
avere una **scadenza** e un **preavviso**: sette giorni, quindici, trenta,
sessanta, novanta. Quando la scadenza entra nel preavviso, il documento sale in
cima alla pagina, colorato secondo l'urgenza: verde se manca tempo, ottone se si
avvicina, arancione se manca meno di una settimana, rosso se è già scaduto.

E soprattutto **il portale te lo dice**. Sulla card dei documenti compare
"3 in scadenza" o, in rosso, "⚠️ 1 scaduto". Non devi entrare per accorgertene:
è tutto il senso della sezione.

Il preavviso si sceglie in base alla cosa. Trenta giorni vanno bene per il
bollo. Per il passaporto di una bambina metti novanta: rinnovarlo richiede
tempo e code, e accorgersene a due settimane dalla partenza non serve.

### Le auto e le loro scadenze

Le auto si aggiungono con nome, targa, marca, modello, chilometri.

Le scadenze dell'auto (assicurazione, bollo, revisione, tagliando) **non sono
una lista a parte**: sono documenti come gli altri, con un'etichetta che dice a
quale auto appartengono. Così lo scadenzario è uno solo, e non due che
rischiano di dire cose diverse. Aprendo un'auto vedi tutte le sue scadenze in
ordine, dalla più vicina.

### Scanner: archiviare dove serve

Salvando una scansione, ora scegli **dove finisce**:

- solo fra le scansioni, come prima
- **fra i documenti di casa**, con tipo, auto e scadenza: fotografi il
  certificato di revisione in officina, metti la data, e fra un anno il portale
  te lo ricorda
- nella cartella clinica di una persona

È una scelta sola, non due caselle: non si può chiedere per sbaglio di
archiviare la stessa scansione in due posti. Il file resta uno, non viene
duplicato.

---

## Il salvataggio: una cosa da sapere

Il salvataggio settimanale copia **le tabelle**, cioè i testi: le ricette, i
libri, le spese, le schede cliniche, l'elenco dei documenti.

**Non copia i file**: i PDF dei referti e delle scansioni. Sono nell'archivio
di Supabase e il salvataggio automatico non li porta via.

Per quelli, ogni tanto scaricali a mano dal pannello di Supabase
(**Storage → privati → Download**) e tienili su un disco o su una chiavetta.
Le copertine dei libri sono la stessa cosa, ma quelle si possono rifare; un
referto del 2026, fra dieci anni, no.

---

## Se qualcosa non va

**Il PDF non viene letto.**
Se l'estratto conto è una scansione (una fotografia della pagina, non testo),
non c'è testo da leggere e nessun programma può ricavarne i movimenti.
Scarica dalla banca il CSV, che lo strumento accetta ugualmente.

**I movimenti ci sono, ma i conti non tornano.**
Il programma te lo dice da solo: confronta la sua somma con i totali che la
banca dichiara. Se non coincidono, controlla i movimenti prima di salvarli;
è probabile che una riga sia stata letta male.

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

## Il salvataggio dei dati (importante)

Il piano gratuito di Supabase **non fa backup**. Se il progetto venisse
cancellato per sbaglio o si corrompesse, perderesti tutto: i libri con le
copertine, le ricette, gli anni di spese.

Per questo c'è `.github/workflows/backup.yml`: ogni domenica scarica una
copia di tutti i dati e la conserva dentro GitHub, dove resta al sicuro
anche se Supabase sparisse. Usa gli stessi due segreti del ping, quindi non
devi configurare nulla di nuovo: basta che il flusso di lavoro sia acceso in
**Actions**.

Le copie restano disponibili per 90 giorni. Le scarichi da **Actions →
Salvataggio dei dati → l'ultima esecuzione → dati-famiglia**.

Puoi anche lanciarlo a mano quando vuoi (il pulsante **Run workflow**), per
esempio prima di fare qualche modifica importante.

---

## Vale la pena passare al piano a pagamento?

Il piano Pro costa **25 dollari al mese**, circa 270 euro l'anno. Per un
sito di famiglia **non serve**, e i numeri lo dicono chiaramente:

- database da 8 GB, ma tu ne usi 9 MB
- 100.000 utenti al mese, ma siete in due
- 100 GB di spazio file e 250 GB di traffico, che non sfiori nemmeno

Le uniche due cose sensate che offrirebbe sono la fine della pausa per
inattività e i backup automatici. Ma **le hai già risolte entrambe gratis**,
con il ping ogni 3 giorni e il salvataggio settimanale qui sopra.

L'unico motivo per cui varrebbe la pena pagare sarebbe se un giorno i dati
diventassero così importanti da non tollerare nemmeno un'ora di disservizio.
Per un ricettario e una biblioteca di famiglia, non è il caso.

---

## Lo spazio gratuito

Il limite del piano gratuito è **500 MB** di database. (Attenzione: il
pannello mostra anche "1 GB di disco", ma è un'altra cosa: la soglia che
conta è quella dei dati, 500 MB.)

Con i 202 libri importati sei intorno ai **9 MB**, cioè meno del 2%. Le
copertine sono quasi tutto quel peso; le comprimo prima di salvarle, circa
40-90 KB l'una. Le spese bancarie sono testo puro e non pesano quasi nulla,
qualche decimo di MB all'anno.

Per saturare i 500 MB servirebbero migliaia di ricette con foto. Non è un
limite che rischi di toccare.

**Se un giorno lo superassi, non ti arriverebbe nessuna bolletta**: non hai
dato la carta, quindi non possono addebitarti niente. Il database
passerebbe in sola lettura, cioè potresti consultare tutto ma non
aggiungere. Supabase avvisa per email già quando ti avvicini alla soglia,
e per sbloccare basta ridurre i dati (gratis) oppure passare al piano a
pagamento.

**Il rischio vero non è lo spazio, è la pausa.** Dopo 7 giorni di
inattività Supabase sospende i progetti gratuiti: per questo c'è il ping
automatico ogni 3 giorni. Verifica di averlo acceso davvero (punto 5),
altrimenti un mese di vacanza e trovi il database addormentato.
