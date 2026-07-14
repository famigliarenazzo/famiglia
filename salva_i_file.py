#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SALVA I FILE  ·  Famiglia Catenazzo Renò
=========================================

Il salvataggio automatico su GitHub copia le TABELLE: le ricette, i libri,
i movimenti, le schede cliniche, l'elenco dei documenti. Cioè il testo.

NON copia i FILE: i PDF dei referti, le scansioni, le firme, le copertine.
Quelli esistono in una copia sola, dentro Supabase. Se un giorno il
progetto si rompe o l'account sparisce, le ricette le riprendi dal
salvataggio; un referto del 2026, fra dieci anni, no.

Questo script scarica tutto in una cartella tua, in un colpo solo.

COME SI USA
-----------
    python3 salva_i_file.py

La prima volta chiede le credenziali e le ricorda (in un file accanto a
questo, che NON va messo su GitHub: vedi la nota in fondo).

Dalla seconda volta in poi scarica solo quello che è cambiato, quindi ci
mette pochi secondi.

COSA SERVE
----------
Python 3 (sul Mac c'è già) e la libreria requests:

    pip3 install requests
"""

import os
import sys
import json
import getpass
from pathlib import Path

try:
    import requests
except ImportError:
    print("Manca la libreria 'requests'. Installala così:\n")
    print("    pip3 install requests\n")
    sys.exit(1)


QUI = Path(__file__).resolve().parent
CONFIG = QUI / ".salva_i_file.json"       # le credenziali
STATO = QUI / ".salva_i_file_stato.json"  # cosa ho gia scaricato

BUCKET_PRIVATO = "privati"
BUCKET_PUBBLICO = "pubblici"   # le copertine dei libri, se il bucket esiste


# ----------------------------------------------------------------------
#  Le credenziali
# ----------------------------------------------------------------------

def chiedi_credenziali():
    print()
    print("=" * 68)
    print("  PRIMA VOLTA: mi servono due cose dal pannello di Supabase")
    print("=" * 68)
    print()
    print("  Apri  https://supabase.com/dashboard  →  il tuo progetto")
    print("        →  Settings  →  API")
    print()
    print("  1. Project URL      (assomiglia a https://xxxx.supabase.co)")
    print("  2. service_role key (la chiave LUNGA, sotto 'Project API keys',")
    print("                       quella marcata 'secret')")
    print()
    print("  ATTENZIONE: la service_role e' una chiave da amministratore.")
    print("  Chi ce l'ha puo' leggere e cancellare TUTTO, senza password.")
    print("  Serve qui perche' i referti stanno in un archivio privato e")
    print("  con la chiave normale non si aprono.")
    print()
    print("  La salvo in un file accanto a questo script, sul tuo computer.")
    print("  Non finisce su GitHub (vedi la nota in fondo al file).")
    print()

    url = input("  Project URL: ").strip().rstrip("/")
    if not url.startswith("http"):
        url = "https://" + url

    # getpass: la chiave non compare a schermo mentre la incolli
    key = getpass.getpass("  service_role key (non si vede mentre incolli): ").strip()

    if not url or not key:
        print("\n  Mancano dei dati. Riprova.")
        sys.exit(1)

    CONFIG.write_text(json.dumps({"url": url, "key": key}, indent=2))
    # solo il proprietario puo' leggerla
    os.chmod(CONFIG, 0o600)
    print("\n  Credenziali salvate. La prossima volta non te le richiedo.\n")
    return url, key


def credenziali():
    # le variabili d'ambiente hanno la precedenza: comodo se preferisci
    # non tenere la chiave su disco
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if url and key:
        return url.rstrip("/"), key

    if CONFIG.exists():
        d = json.loads(CONFIG.read_text())
        return d["url"].rstrip("/"), d["key"]

    return chiedi_credenziali()


# ----------------------------------------------------------------------
#  Parlare con Supabase
# ----------------------------------------------------------------------

class Archivio:
    def __init__(self, url, key):
        self.url = url
        self.s = requests.Session()
        self.s.headers.update({
            "apikey": key,
            "Authorization": "Bearer " + key,
        })

    def elenca(self, bucket, cartella="", dentro=0):
        """Tutti i file di un bucket, scendendo nelle sottocartelle."""
        if dentro > 6:      # una rete di sicurezza contro i cicli
            return []

        # Supabase vuole il prefisso CON la barra finale: chiedendo
        # "referti" invece di "referti/" risponde con una lista vuota, e il
        # salvataggio finisce senza errori e senza file. Era il bug per cui
        # la cartella restava vuota nonostante i referti ci fossero.
        prefisso = (cartella + "/") if cartella else ""

        r = self.s.post(
            f"{self.url}/storage/v1/object/list/{bucket}",
            json={
                "prefix": prefisso,
                "limit": 1000,
                "offset": 0,
                "sortBy": {"column": "name", "order": "asc"},
            },
            timeout=30,
        )
        if r.status_code == 400 and "not found" in r.text.lower():
            return []          # il bucket non esiste: pazienza
        r.raise_for_status()

        trovati = []
        for v in r.json():
            nome = v.get("name")
            if not nome:
                continue
            percorso = f"{cartella}/{nome}" if cartella else nome

            # Supabase segnala le cartelle con id nullo
            if v.get("id") is None:
                trovati += self.elenca(bucket, percorso, dentro + 1)
            else:
                meta = v.get("metadata") or {}
                trovati.append({
                    "path": percorso,
                    "size": meta.get("size", 0),
                    # se il file viene sostituito, cambia: e' cosi' che
                    # capisco cosa riscaricare e cosa saltare
                    "tag": v.get("updated_at") or meta.get("eTag") or "",
                })
        return trovati

    def scarica(self, bucket, percorso):
        r = self.s.get(
            f"{self.url}/storage/v1/object/{bucket}/{percorso}",
            timeout=120,
        )
        r.raise_for_status()
        return r.content


# ----------------------------------------------------------------------
#  Il lavoro
# ----------------------------------------------------------------------

def leggibile(n):
    for u in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.0f} {u}" if u == "B" else f"{n:.1f} {u}"
        n /= 1024
    return f"{n:.1f} TB"


def main():
    print()
    print("  SALVA I FILE  ·  Famiglia Catenazzo Renò")
    print("  " + "-" * 42)

    url, key = credenziali()
    arch = Archivio(url, key)

    dove = QUI / "backup_file"
    dove.mkdir(exist_ok=True)

    stato = {}
    if STATO.exists():
        try:
            stato = json.loads(STATO.read_text())
        except Exception:
            stato = {}

    totale_nuovi = 0
    totale_byte = 0
    totale_saltati = 0
    errori = []

    for bucket in (BUCKET_PRIVATO, BUCKET_PUBBLICO):
        try:
            files = arch.elenca(bucket)
        except requests.HTTPError as e:
            if e.response is not None and e.response.status_code in (400, 404):
                continue          # bucket inesistente: non e' un errore
            print(f"\n  Non riesco a leggere l'archivio «{bucket}»: {e}")
            sys.exit(1)
        except requests.RequestException as e:
            print(f"\n  Problema di rete: {e}")
            sys.exit(1)

        if not files:
            if bucket == BUCKET_PRIVATO:
                print(f"\n  L'archivio «{bucket}» risulta VUOTO.")
                print("  Se invece sai che ci sono dei file, quasi sempre e' la chiave:")
                print("  con la chiave 'anon' l'archivio privato risulta vuoto invece di")
                print("  dare errore. Controlla di aver usato la 'service_role' (secret).")
            continue

        print(f"\n  Archivio «{bucket}»: {len(files)} file")

        for f in files:
            chiave = f"{bucket}/{f['path']}"
            dest = dove / bucket / f["path"]

            # gia' scaricato e non cambiato: lo salto.
            # E' per questo che dalla seconda volta ci mette pochi secondi.
            if stato.get(chiave) == f["tag"] and dest.exists():
                totale_saltati += 1
                continue

            dest.parent.mkdir(parents=True, exist_ok=True)
            try:
                dati = arch.scarica(bucket, f["path"])
            except Exception as e:
                errori.append((chiave, str(e)))
                print(f"    ✗ {f['path']}  ({e})")
                continue

            dest.write_bytes(dati)
            stato[chiave] = f["tag"]
            totale_nuovi += 1
            totale_byte += len(dati)
            print(f"    ↓ {f['path']}  ({leggibile(len(dati))})")

    STATO.write_text(json.dumps(stato, indent=2))

    print()
    print("  " + "-" * 42)
    if totale_nuovi:
        print(f"  Scaricati {totale_nuovi} file  ({leggibile(totale_byte)})")
    if totale_saltati:
        print(f"  Gia' aggiornati, saltati: {totale_saltati}")
    if not totale_nuovi and not totale_saltati:
        print("  Non ho trovato nessun file da salvare.")
    if errori:
        print(f"\n  ATTENZIONE: {len(errori)} file non scaricati:")
        for c, e in errori[:10]:
            print(f"    · {c}")
        print("\n  Riprova: i file gia' presi non vengono riscaricati.")

    print(f"\n  I file sono in:  {dove}")
    print()
    print("  Copiali su un disco esterno o una chiavetta. Un archivio che")
    print("  vive in un posto solo non e' un archivio: e' un'attesa.")
    print()

    if errori:
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n  Interrotto. I file gia' scaricati restano dove sono.\n")
        sys.exit(1)


# ======================================================================
#  NOTA IMPORTANTE SULLA CHIAVE
#
#  Questo script crea due file nascosti accanto a se':
#
#      .salva_i_file.json         le credenziali
#      .salva_i_file_stato.json   cosa ha gia' scaricato
#
#  Il primo contiene la service_role key, che e' una chiave da
#  amministratore: chi ce l'ha entra in tutto il database senza password.
#
#  Nel .gitignore del progetto c'e' gia' la riga che li esclude, quindi non
#  finiscono su GitHub. Ma se copi questa cartella da qualche parte,
#  ricordati che quel file c'e'.
#
#  Se preferisci non tenere la chiave su disco, cancella .salva_i_file.json
#  e passala ogni volta cosi':
#
#      SUPABASE_URL="https://xxxx.supabase.co" \
#      SUPABASE_SERVICE_KEY="eyJhb..." \
#      python3 salva_i_file.py
#
# ======================================================================
