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
- **I nostri viaggi** · i luoghi sulla mappa, le tratte, le spese divise,
  i biglietti e il diario della sera
- **L'allenamento** · il diario di ogni giorno (cosa mangi, cosa bruci,
  quanto pesi), le schede di casa un esercizio alla volta, e il grafico
  di come va

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
viaggi.html/.js       settimo strumento, il diario di viaggio
allenamento.html/.js  ottavo strumento, gli allenamenti
diario.js             il diario della giornata e l'andamento, dentro l'allenamento
estratto.js           il lettore di estratti conto
bordi.js              trova i bordi del foglio nelle foto
firma.js              il tratto della firma, a spessore variabile
salva_i_file.py       scarica i PDF e le scansioni sul tuo computer
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
7. `database/schema7.sql` · le firme
8. `database/schema8.sql` · i viaggi, e le percentuali che calcolano il
   prezzo di rivendita dei libri
9. `database/schema9.sql` · gli allenamenti, con le tre schede di Stefano
   gia' dentro
10. `database/schema10.sql` · i tempi e i carichi degli esercizi, e la
    bilancia: peso, massa grassa, massa muscolare, massa ossea e acqua.
    Non tocca le schede che hai gia' scritto
11. `database/schema11.sql` · il diario della giornata: i pasti, le
    attivita' con le calorie, e il totale di ogni giorno. Non tocca
    niente di quello che c'e' gia'

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

## Le ultime novità

### Il prezzo di rivendita si calcola da solo

Le percentuali c'erano nel disegno del database fin dall'inizio, ma non le
aveva mai scritte nessuno: il campo "prezzo rivendita" restava un campo
vuoto da riempire a mano, libro per libro, decidendo ogni volta quanto vale
un «buono» rispetto a un «ottimo». Duecento libri e duecento decisioni, mai
uguali fra loro.

Adesso scegli la condizione, scrivi il prezzo di copertina, e il prezzo di
rivendita compare da solo. Sotto il campo una riga spiega il conto: *«con
"ottimo" resta il 50% di 20,00 €, cioè 10,00 €»*. Non è un numero calato
dall'alto: si vede da dove viene.

Le percentuali di partenza ricalcano la scala di Vinted (nuovo con
cartellino, nuovo senza, ottimo, buono, discreto), con due gradini in più in
fondo perché i libri dei bambini si rovinano davvero e «discreto» non basta
a descrivere una copertina staccata:

| Condizione | Resta | Un libro da 20 € |
|---|---|---|
| nuovo | 70% | 14,00 € |
| ottimo | 50% | 10,00 € |
| buono | 40% | 8,00 € |
| discreto | 28% | 5,50 € |
| rovinato | 15% | 3,00 € |
| rotto | 0% | — |

La percentuale è **quanto resta**, non quanto si sconta. Sono numeri
prudenti: sui libri per ragazzi usati, su Vinted, superare la metà del
prezzo di copertina succede raramente.

**Sotto i 3 euro non propone niente.** Invece di suggerire di vendere a 1,80
un libro che costa 2,90 di spedizione e mezz'ora fra foto e messaggi, dice
che non conviene e suggerisce di regalarlo. Un consiglio che fa perdere
tempo è peggio di nessun consiglio.

**Il calcolo propone, non impone.** Se scrivi tu un prezzo, quello resta:
il riquadro cambia colore, ti dice che il tuo è più alto o più basso di
quello calcolato, e ti offre un collegamento per tornare al suggerito.
Un'edizione fuori catalogo o un libro firmato valgono più di qualunque
percentuale, e il programma non può saperlo. Aprendo un libro già salvato
il prezzo non viene mai toccato: sarebbe sgradevole che consultare una
scheda la cambiasse.

L'annuncio per Vinted usa il prezzo calcolato quando quello scritto manca,
così non ti tocca completarlo a mano dentro l'app.

**Se vuoi cambiare le percentuali** stanno su Supabase, nella tabella
`settings`, alla riga `discounts`. Insieme a queste tre voci:

- `minimo` · sotto questa cifra la vendita non viene proposta
- `arrotonda` · a mezzo euro; metti `1` per l'euro intero, `0` per non arrotondare
- `attivo` · `false` spegne il calcolo senza perdere le percentuali impostate

### I nostri viaggi

Il settimo strumento. Non è un'agenda di viaggio e non è un contapassi:
è il posto dove un viaggio resta dopo che è finito.

**La mappa.** Ogni luogo è un pin col colore della sua categoria: soggiorni,
tour, musei, parchi, ristoranti, ma anche le cose che servono davvero e che
nessuno segna mai, come la farmacia aperta fino alle dieci e il bancomat che
accetta le carte estere. I luoghi visitati hanno la spunta verde, quelli
ancora da vedere restano scuri: si capisce a colpo d'occhio cosa manca.

L'indirizzo lo cerchi scrivendolo, e le coordinate arrivano da sole.

**Le tratte.** Ogni spostamento ha un mezzo, e ogni mezzo ha la sua linea: il
volo è un arco punteggiato, il treno un tratteggio lungo, l'auto una linea
piena. Le tratte in auto **seguono le strade vere**, non la linea d'aria:
i chilometri che leggi sono quelli che farai. Se il servizio delle mappe non
risponde, ripiega sull'arco invece di lasciare la mappa vuota.

I km si calcolano da soli, ma se ne scrivi uno a mano quello resta: il
calcolo automatico non lo sovrascrive più.

**Le spese.** Ogni spesa dice chi ha pagato, e il riquadro in cima mostra il
totale, la ripartizione per categoria e quella per persona.

Non c'è nessun conto da pareggiare: è tutto in famiglia, i soldi escono dallo
stesso cassetto. Sapere chi ha pagato serve a un'altra cosa: ritrovare la
spesa sull'estratto conto giusto quando, mesi dopo, controlli le spese di casa
e ti chiedi cos'era quell'addebito di 340 € a Osaka.

Se metti un budget, la barra ti dice quanto ne resta, e diventa rossa se lo
sfori.

**I biglietti.** Carte d'imbarco, voucher, visti, contratti di noleggio.
Stanno nell'**archivio privato**, come i referti: un voucher d'albergo ha
dentro nome, cognome e numero di prenotazione, e non ha senso lasciarlo in
un magazzino pubblico. Ogni volta che ne apri uno il collegamento viene
creato al momento e scade dopo un'ora.

Ogni documento si può agganciare a un luogo: il voucher dell'hotel sta sotto
l'hotel, e lo ritrovi quando ti serve invece che rovistando in un elenco.

**Il diario.** Un giorno alla volta, la sera. Fra dieci anni sarà l'unica
parte che riaprirai davvero: i chilometri e le spese interessano mentre il
viaggio è in corso, il resto no.

**Chi viaggia.** Non due caselle fisse ma un elenco: Stefano e Ilaria sono
già scritti quando crei un viaggio nuovo, ma si tolgono con un tocco e se ne
aggiungono quanti servono. Le bambine, i nonni, gli amici.

Se togli qualcuno che aveva spese a suo nome il programma te lo dice prima:
quelle spese restano nel totale, ma senza un nome accanto. Sparire in
silenzio sarebbe peggio.

**Le liste, e quelle che tornano ogni volta.** La valigia non è più un elenco
unico: sono liste separate, ognuna col suo nome. Una per i vestiti, una per i
documenti, una per la farmacia, una per la macchina fotografica.

Quando ne crei una puoi segnarla **ricorrente**. Da quel momento diventa un
modello di casa, e ogni viaggio nuovo se la ritrova dentro, già pronta da
spuntare. La farmacia da viaggio si scrive una volta sola.

Le liste dentro un viaggio sono **copie** del modello, non collegamenti:
spuntare «passaporti» per il Giappone non lo spunta anche per la Puglia, e
togliere una voce qui non la toglie a tutti. Quando invece una modifica deve
valere per sempre c'è un pulsante apposta, dentro la lista, che riporta le
voci nel modello. È una scelta esplicita, non un effetto collaterale.

Dal pulsante **«Le liste ricorrenti»** vedi tutti i modelli, ne aggiungi uno a
un viaggio in corso, o ne togli uno dal giro. Toglierlo non cancella niente:
le liste già copiate restano dove sono, diventano liste normali.

**E il portale te lo dice.** Sulla card dei viaggi non c'è il numero dei
viaggi, che non serve a nessuno: c'è «mancano 12 giorni», oppure «in
viaggio» se siete via. La stessa idea dei documenti di casa: l'informazione
utile è quella che ti risparmia di entrare a cercarla.

**Il salvataggio settimanale include i viaggi** e lo script `salva_i_file.py`
scarica anche le foto: non c'è niente di nuovo da configurare.

---

### L'allenamento

L'ottavo strumento. Non e' un contapassi e non e' un personal trainer:
e' il foglio della palestra, ma che cronometra e che si ricorda tutto.

**I programmi.** Un programma e' una scheda: un nome, la persona a cui e'
intestata, e gli esercizi in ordine, ognuno con serie e ripetizioni come
stanno scritte sul foglio (3x12, 20 reps, 10 min) e il recupero. Le tre
schede di Stefano sono gia' dentro. Ne crei altre quando vuoi, intestate
a chiunque: le persone sono le stesse della cartella clinica, non un
secondo elenco da tenere allineato a mano.

Il pulsante **Duplica** copia una scheda per un'altra persona. Le schede
di casa si somigliano, e riscrivere sette esercizi sarebbe una punizione.

**Il cronometro capisce da solo cosa sei.** Quello che scrivi nella
colonna "serie / rip." non e' un dato, e' una frase scritta a mano. L'app
la legge e decide:

- `10 min`, `45"`, `3x30"` · **conto alla rovescia**. Parte, scende, e
  negli ultimi tre secondi fa tre bip. Non devi guardarlo.
- `4x12`, `20 reps`, `4x max` · **cronometro che sale da zero**, e lo
  fermi tu quando hai finito le ripetizioni. Nessuno ti mette fretta:
  serve solo a sapere, fra sei mesi, quanto ci mettevi.

Mentre scrivi la scheda, sotto a ogni riga c'e' scritto come verra'
cronometrata. Se sbaglia lo vedi li', non a meta' serie.

Quando le serie sono piu' d'una (`3x30"`), fra l'una e l'altra il
**recupero parte da solo**, letto dalla colonna del recupero, e a zero
suona. Alla fine di un esercizio il recupero c'e' lo stesso, ma su un
pulsante: e' un'offerta, non un obbligo.

**Il peso e la velocita'.** Prima di far partire ogni esercizio l'app
chiede una cosa sola, quella giusta:

- se il nome sa di macchina (tapis, cyclette, vogatore, ellittica...)
  chiede la **velocita', da 1 a 10**, con dieci pulsanti grossi;
- per tutto il resto chiede il **peso in chili**, con il piu' e il meno
  da mezzo chilo, perche' con le mani sudate la tastiera e' un nemico.

Nessuno dei due e' obbligatorio: gli elastici, la corda e le flessioni
non hanno chili, e va benissimo lasciare vuoto. Se l'app sbaglia a
indovinare, sotto c'e' sempre *«…e anche l'altro»*.

Sotto al campo trovi scritto **quanto avevi messo l'ultima volta**, ed e'
gia' precompilato. Perche' la domanda vera, davanti ai manubri, non e'
mai "quanti chili?" ma "quanti chili avevo messo l'altra volta?".

**L'esecuzione.** Vedi **un esercizio alla volta**, scritto grande, con
il quadrante nel mezzo. Sotto, l'elenco di tutti gli altri con i tempi
gia' fatti, cosi' sai sempre quanto manca. In alto a destra un orologio
dice da quanto sei li'.

Il telefono **resta sveglio** finche' ti alleni. Se lo metti in tasca e
lo riprendi, il cronometro e' gia' giusto: i conti sono sull'orologio di
sistema, non sui battiti del browser.

Se ti fermi a meta' e chiudi, l'allenamento non sparisce: viene salvato
segnato come **interrotto**. Un allenamento fatto a meta' e' comunque
successo, e cancellarlo sarebbe raccontarsi una bugia.

**Lo storico.** Una riga per allenamento, con quanto e' durato. Toccando
una riga la riapri: i pesi, le note, e gli esercizi **come erano quel
giorno**, ognuno col suo tempo, i suoi chili e la sua velocita'. Se fra
sei mesi cambi la scheda, lo storico continua a dire cosa avevi fatto
davvero. Un archivio che cambia quando cambi il presente non e' un
archivio.

**I progressi.** Due domande diverse, e quindi due grafici. Il primo dice
quanto durano gli allenamenti. Il secondo lo scegli tu, esercizio per
esercizio: come sale il carico degli stacchi, come cresce la velocita'
del tapis, come cala il tempo di un circuito. Gli esercizi vengono dagli
allenamenti *fatti*, non dalle schede: uno che hai tolto dalla scheda il
mese scorso ha comunque una storia, e buttarla via sarebbe la cosa piu'
stupida che questa pagina possa fare.

**Il corpo.** La bilancia nuova legge cinque cose, e le vuole tutte:
peso, massa grassa, massa muscolare, massa ossea e acqua. Ogni volta che
sali, una riga. Solo il peso e' obbligatorio: se un giorno la bilancia
dice meno cose, la riga resta buona lo stesso. La massa muscolare la
scrivi in chili o in percentuale, come te la da' la tua bilancia: c'e' un
pulsantino che cambia unita', perche' 55 puo' essere 55 kg o 55%, e su un
corpo umano sono due frasi entrambe credibili.

Scrivi l'altezza una volta sola (sta sulla persona, non sulla pesata:
chiederla ogni volta sarebbe una piccola offesa) e compare il **BMI**,
con la fascia colorata e dove cadi. Con una nota onesta accanto: il BMI
e' solo peso diviso altezza al quadrato, non sa distinguere un chilo di
muscolo da un chilo di grasso, e su chi si allena tende a esagerare. La
massa grassa, che la bilancia ti dice, e' una misura migliore.

Il grafico cambia metrica con un tocco: peso, grasso, muscolo, osso,
acqua, BMI. Il peso che segni prima di allenarti diventa una pesata da
solo, cosi' non devi scriverlo due volte -- ma se quel giorno ti eri gia'
pesato per bene, quella riga non viene toccata: la tua ha dentro anche la
massa grassa, e sarebbe uno scambio in perdita.

**La giornata.** E' la prima scheda che vedi. In alto il giorno, con le
frecce per andare avanti e indietro (toccando la data si apre il
calendario), e quattro numeri: calorie assunte, calorie bruciate con
l'attivita', la differenza, e il peso del giorno. Toccando il peso lo
segni, gia' con la data giusta.

Sotto, i sei momenti in cui mangi: **colazione, merenda del mattino,
pranzo, merenda del pomeriggio, cena, dopo cena**. Col **+** aggiungi
una cosa: cosa, porzione, grammi se li sai, calorie. Non serve sapere
le calorie a memoria: scrivendo il nome compare una lista, prima con i
cibi che hai gia' segnato (con porzione e calorie dell'ultima volta) e
poi con una tabella di un'ottantina di cibi comuni. Cambi i grammi e le
calorie si ricalcolano. Sono numeri indicativi, e l'ultima parola e'
tua: se scrivi le calorie a mano, l'app non le tocca piu'. *Salva e
aggiungi altro* resta nello stesso pasto, per quando la cena e' di
quattro cose.

Poi **l'attivita'**. Scegli (tapis roulant, camminata, bici, pesi...) e
scrivi i minuti: le calorie le stima l'app, e sotto ti fa vedere il
conto, per esempio *MET 5,0 × 79,2 kg × 20 min = 132 kcal*. Il MET e'
quanto un'attivita' costa rispetto allo stare seduti; il peso e'
l'ultimo che hai segnato. Per il tapis puoi dire anche la velocita', che
cambia molto il risultato.

Gli allenamenti fatti col cronometro **finiscono nel diario da soli**:
alla fine di ogni allenamento, una riga per esercizio con i minuti e le
calorie. E mentre ti alleni, sotto al quadrante c'e' scritto quante ne
hai bruciate in quell'esercizio e in tutto. Per gli allenamenti fatti
prima del diario compare un avviso con un pulsante: un tocco e le loro
calorie entrano.

Le calorie bruciate contano solo l'attivita', non quello che il corpo
consuma da solo per vivere: servono a confrontare un giorno con l'altro,
non a fare i conti al grammo.

**L'andamento.** Sette giorni, un mese, tre mesi o un anno: le calorie
assunte e bruciate giorno per giorno su un grafico, il peso su un altro,
e sotto una tabella con tutto insieme. Tocca un giorno e lo riapri. I
giorni in cui non hai segnato niente da mangiare restano fuori dalle
medie: contarli come zero farebbe sembrare che hai digiunato.

Il diario e l'andamento sono di una persona sola: la persona scelta in
alto resta scelta sul telefono, cosi' non devi sceglierla ogni volta.

**E il portale te lo dice.** Sulla card non c'e' il numero degli
allenamenti, che non serve a nessuno: c'e' «3 giorni fa». Dopo una
settimana diventa rosso.

---

## Il salvataggio: una cosa da sapere

Il salvataggio settimanale copia **le tabelle**, cioè i testi: le ricette, i
libri, le spese, le schede cliniche, l'elenco dei documenti.

**Non copia i file**: i PDF dei referti e delle scansioni. Sono nell'archivio
di Supabase e il salvataggio automatico non li porta via.

Per quelli c'è uno script che li scarica tutti in un colpo solo:

```
pip3 install requests      (solo la prima volta)
python3 salva_i_file.py
```

La prima volta chiede l'indirizzo del progetto e la chiave `service_role`
(le trovi su Supabase, in **Settings → API**) e le ricorda. Dalla seconda
volta in poi scarica **solo quello che è cambiato**, quindi ci mette pochi
secondi. I file finiscono nella cartella `backup_file`.

Poi copiali su un disco esterno o una chiavetta. Un archivio che vive in un
posto solo non è un archivio: è un'attesa.

**Sulla chiave:** la `service_role` è una chiave da amministratore, chi ce
l'ha entra in tutto il database senza password. Lo script la salva in un file
nascosto accanto a sé, che il `.gitignore` esclude: non finisce su GitHub. Se
preferisci non tenerla su disco, cancella `.salva_i_file.json` e passala ogni
volta a mano (le istruzioni sono in fondo allo script).

Le copertine dei libri si possono rifare; un referto del 2026, fra dieci anni,
no.

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
