# Taccuino dell'Eroe

Scheda personaggio gratuita per **Nimble** (il GdR tattico di Nimble Co.), pensata per il telefono.
Funziona offline, non richiede account e i personaggi restano **solo sul tuo dispositivo**.

Si usa in due modi:

- **App Android (APK)**: una vera app, installabile dal telefono.
- **Sito installabile (PWA)**: funziona anche su iPhone e sul computer.

---

## Scarica l'app Android

1. Dal telefono apri la pagina dell'ultima versione:
   **https://github.com/danielecioli1999-wq/Taccuino-eroe/releases/tag/apk-latest**
2. Tocca **Taccuino-dell-Eroe.apk** per scaricarlo.
3. Aprilo: Android chiede di consentire l'installazione da questa fonte, consenti.
   Se Play Protect avvisa che l'app non è verificata, scegli *Installa comunque* (è normale per le app
   non pubblicate sul Play Store).

Gli aggiornamenti si installano **sopra** la versione precedente, senza disinstallare e senza perdere i personaggi.

## Usa il sito (iPhone, computer o Android)

Se la pubblicazione con GitHub Pages è attiva, l'app è all'indirizzo
`https://danielecioli1999-wq.github.io/Taccuino-eroe/`.

- **Android (Chrome)**: menu (tre puntini) → *Installa app*.
- **iPhone (Safari)**: Condividi → *Aggiungi alla schermata Home*.

Crea i personaggi **dopo** l'installazione e apri sempre l'app dall'icona.

---

## Cosa fa

- **Scheda**: caratteristiche, abilità, salvezze, Defense, velocità, lingue, ancestry e background.
- **Combat**: PF, Ferite, Dadi Vita, azioni, reazioni, scontro e round, danni e cure, condizioni, riposi
  (Catch Breath, Make Camp, Safe Rest) e attacchi calcolati dall'equipaggiamento.
- **Usi delle abilità**: ogni abilità con usi limitati (1/turno, 1/round, 1/scontro, per Safe Rest) si segna
  con un tocco e si ripristina da sola; ogni voce ha la **descrizione a scomparsa** del manuale.
- **Classe**: scelte di classe, sottoclasse, level up guidato e avanzamento fino al livello 20. Le descrizioni
  delle abilità si possono **fissare** nelle altre schede (Scheda, Combat, Zaino).
- **Zaino**: catalogo dell'equipaggiamento con ricerca e filtri, quantità, scalatura opzionale del costo dalle
  monete, danno delle armi modificabile, conteggio degli slot attivabile e disattivabile.
- **Nuovo eroe**: scelta della classe, della ancestry, del background e del **livello di partenza** (1–20).
- **Lingua**: interfaccia in **italiano** o **inglese** (Altro → Lingua / Language). I testi delle regole restano
  in inglese, come nel manuale.
- **Backup**: esporta tutti i personaggi in un file (o copia il backup come testo) e importali su un altro dispositivo.

## Classi disponibili

| Classe | Sottoclassi |
| --- | --- |
| **Commander** | Bulwark, Phalanx, Vanguard, Arena, Siege Breaker, Spellblade |
| **Berserker** | Mountainheart, Red Mist, Titan's Grip, Burning Rage, Muscle Mage |
| **Shadowmancer** | Pact of the Red Dragon, Abyssal Depths, Void, Endless Swarm, High Celestial, Reaver |
| **Cheat** | Silent Blade, Scoundrel, Serpent, Gambler, Honorseeker |

Altre classi verranno aggiunte man mano che arrivano i manuali.

## Backup e dati

I dati stanno solo sul dispositivo. L'app Android e il sito installato hanno **dati separati**: per spostare i
personaggi da uno all'altro usa *Altro → Esporta tutto* (oppure *Copia backup*) e poi *Importa file*
(oppure *Incolla backup*) nell'altra app.

## Aggiornare l'app (per chi gestisce il repository)

1. In `sw.js` aumenta il numero di `VERSION` (per esempio `taccuino-v9` → `taccuino-v10`).
2. Carica i file nel repository (*Add file* → *Upload files*): quelli con lo stesso nome vengono sostituiti.
3. La build dell'APK parte da sola (scheda *Actions*, circa 2 minuti) e sostituisce il file nella Release `apk-latest`.

Una guida passo passo più dettagliata è nel file `LEGGIMI.txt`.

## Struttura del progetto

| File | Contenuto |
| --- | --- |
| `index.html`, `style.css`, `manifest.webmanifest`, `sw.js` | pagina, stile, installazione e funzionamento offline |
| `data-core.js` | regole comuni: caratteristiche, abilità, ancestry, background, equipaggiamento, incantesimi |
| `data-commander.js`, `data-berserker.js`, `data-shadowmancer.js`, `data-cheat.js` | una classe per file |
| `engine.js` | calcoli: statistiche derivate, usi, danni, riposi, level up |
| `ui-core.js`, `ui-views.js`, `ui-actions.js` | interfaccia |
| `i18n.js`, `i18n-en.js` | lingua italiano/inglese |
| `.github/workflows/apk.yml`, `apk/` | compilazione automatica dell'APK Android |

Non c'è nessuna fase di compilazione per il sito: sono file JavaScript semplici.

---

## Licenza e crediti

*Taccuino dell'Eroe* is an independent product published under the **Nimble 3rd Party Creator License**.
Nimble TTRPG © Nimble Co. Il progetto non è un prodotto ufficiale Nimble né è approvato da Nimble Co.

I testi delle regole, delle classi e degli oggetti sono tratti dai manuali Nimble e usati secondo la
[Nimble 3rd Party Creator License v2.0](https://nimblerpg.com/creators). Se ti piace Nimble, sostieni il gioco
acquistando i manuali ufficiali su [nimblerpg.com](https://nimblerpg.com).

This work includes material taken from the System Reference Document 5.1 ("SRD 5.1") by Wizards of the Coast LLC,
available at <https://dnd.wizards.com/resources/systems-reference-document>. The SRD 5.1 is licensed under the
Creative Commons Attribution 4.0 International License, available at
<https://creativecommons.org/licenses/by/4.0/legalcode>.
