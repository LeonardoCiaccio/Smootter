# Progetto — Idea di Base

> **Nome:** Smootter _(`smootter.com` — `manifest.json`: name/description/icons)_

## Concetto

Estensione browser che **crea tool al bisogno**, sfruttando una **LLM scelta dall'utente**, tramite il **provider** che l'utente preferisce.

## Punti Fermi

- **Multi-provider LLM:** l'utente sceglie modello e provider.
- **Tool on-demand:** i tool vengono generati/attivati quando servono.
- **Storage:** uso intensivo del DB del browser.
- **Cross-browser:** Chrome (Manifest V3) e Firefox.

## Come Funziona

- **Tool comuni pre-inclusi:** riassunto articolo e simili (nulla di innovativo, è la base).
- **Innovazione — tool su richiesta:** l'utente ha un bisogno (es. "salvare segnalibri con descrizione, ordinati") e l'estensione **crea il tool al volo**.
- **Come Tampermonkey, ma meglio:** invece di scrivere uno script, l'utente descrive il bisogno a parole. La LLM genera il tool.
- **Zero conoscenze di programmazione richieste:** l'utente non scrive codice, lo descrive e basta.

## Pilastri Tecnici

1. **Eventi del browser:** i tool si agganciano a qualsiasi evento (caricamento pagina, download, navigazione, ecc.) e vi iniettano processi personalizzati.
2. **Scheduling:** i tool possono girare su pianificazione, non solo su azione dell'utente.
3. **Database:** stato e dati raccolti persistono nel DB del browser.

## Flusso di Co-Design (conversazionale)

1. L'utente descrive il bisogno (es. _"un tool per scaricare i video da tutti i siti"_).
2. La LLM **negozia**: dichiara cosa è fattibile e i limiti (es. _"posso, ma non tutti i siti sono uguali"_).
3. La LLM chiede **come vuole l'interfaccia**; l'utente la descrive a parole.
4. La LLM **costruisce UI e logica** e posiziona il punto di aggancio (es. lettura al caricamento pagina).
5. L'utente clicca il pulsante → si apre la sua interfaccia con dentro il risultato (es. tutti i file multimediali della pagina).

### Esempi

- Tool che si aggancia al **caricamento pagina** e registra tutti i file scaricati, con opzioni.
- Tool **"scarica media"**: raccoglie i file multimediali della pagina e li mostra nell'interfaccia descritta dall'utente.

## Posizionamento

- Estensione **neutra**: nasce con 4 tool comuni. Cosa costruisce l'utente è responsabilità dell'utente (modello Tampermonkey — piattaforma, non contenuto).

## Principio Architetturale

- **Niente `eval`, niente `<script>` iniettato a mano, niente interprete fatto in casa.** Il codice generato dall'LLM (o scritto dall'utente) gira tramite **`chrome.userScripts`**, l'API che Chrome ha creato apposta per gli userscript manager (Tampermonkey, Violentmonkey) — verificato: è una delle due sole eccezioni esplicite alla policy anti-remote-code del Web Store (l'altra è la Debugger API).
- Il codice del tool passa **verbatim** (`js: [{ code: '...' }]`), senza manipolazioni, esattamente come lo genera l'LLM o lo scrive l'utente — noi non lo vettiamo, come Tampermonkey non vetta gli script dei suoi utenti.
- Gira nel mondo isolato `USER_SCRIPT` (CSP della pagina non si applica, privilegi dell'estensione non sono raggiungibili). Comunica indietro con l'estensione solo tramite `runtime.onUserScriptMessage`/`onUserScriptConnect` — canale separato e dedicato, tenuto distinto da quello interno perché è un livello di fiducia diverso.
- **Costo reale**: l'utente deve attivare manualmente "Allow User Scripts" per la nostra estensione (`chrome://extensions`) — non è automatizzabile, è un gate anti-abuso di Chrome. Va comunicato chiaramente in UI finché non è attivo.
- **Responsabilità**: coerente col modello Tampermonkey — cosa fa il tool è responsabilità di chi lo ha creato (utente + LLM che ha scelto), non nostra.

## Doppio Livello (massima copertura)

- **No-code:** l'utente descrive a parole, la LLM genera il tool.
- **Code:** l'utente apre il tool generato e ne modifica il codice, oppure lo scrive da zero.
- Copertura totale: dal non-programmatore allo smanettone.

## Innovazione (il punto vero)

- **Costo zero all'uso:** l'LLM lavora **una sola volta**, alla creazione del tool. Poi il tool è codice che gira gratis per sempre. I concorrenti chiamano l'LLM ad ogni uso → paghi sempre. Qui no.
  - _L'LLM è il fabbro, non l'operaio: forgia l'attrezzo e se ne va._
- **Integrazione nativa nel browser:** ogni tool può avere icona nella palette, voce nel menu contestuale, scope per dominio. Il tool **diventa parte del browser**, non una risposta in chat.
- **Nessun lock-in mascherato:** modello e provider davvero a scelta. Niente feature che ti forzano sul loro modello per bruciare crediti.
- **Focus chirurgico:** non è "un'AI generica nel browser". È una **fabbrica di strumenti** progettata solo per costruire cose _dentro_ il browser. Fa una cosa sola, benissimo.

## Confronto

- **Tampermonkey:** fa cose simili ma serve programmare, UX dispersiva, nessuna LLM, nessuna scelta.
- **Assistenti AI (Sider/Monica/Merlin):** a pagamento, chiamano l'LLM ad ogni uso, tool chiusi, lock-in mascherato sul loro modello.

## Valore

- Niente più "installa una nuova estensione per ogni piccola esigenza".
- Un unico contenitore che si estende da solo, on-demand, su misura dell'utente.
- La sensazione di un assistente reale e semplice, progettato per aiutarti col browser.

## Dettagli

_(da definire — l'utente spiegherà a breve)_
