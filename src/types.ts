export interface TonerLevels {
  black: number;
  cyan: number | null;
  magenta: number | null;
  yellow: number | null;
}

export interface PaperCounters {
  total: number;
  a4Total: number;
  a3Total: number;
  monoTotal: number;
  colorTotal: number;
}

export interface ErrorLog {
  code: string;
  description: string;
  dateTime: string;
  severity: "critical" | "warning" | "info";
}

export interface KyoceraReport {
  id: string;
  reportDate: string;
  printerModel: string;
  serialNumber: string;
  tonerLevels: TonerLevels;
  counters: PaperCounters;
  errorLogs: ErrorLog[];
  savedToDrive: boolean;
  driveFilePath?: string;
}

export interface DriveAccount {
  connected: boolean;
  email: string;
  folderName: string;
}

export interface MaintenanceAction {
  code: string;
  title: string;
  steps: string[];
  toolsNeeded: string[];
}

export const KYOCERA_REPAIR_GUIDE: Record<string, MaintenanceAction> = {
  C3100: {
    code: "C3100",
    title: "Errore del motore di ventilazione fusore",
    steps: [
      "Spegnere il dispositivo ed attendere almeno 15 minuti per consentire il raffreddamento.",
      "Verificare la presenza di polvere o frammenti di carta vicino alla ventola posteriore e rimuoverli.",
      "Controllare la connessione del cablaggio all'unità del fuser.",
      "Riavviare la stampante. Se l'errore persiste, potrebbe essere necessario sostituire l'unità ventilatore."
    ],
    toolsNeeded: ["Panno antistatico", "Cacciavite a stella (se ispezione interna)"]
  },
  J1100: {
    code: "J1100",
    title: "Inceppamento carta nel cassetto 1",
    steps: [
      "Estrarre completamente il Cassetto 1.",
      "Rimuovere delicatamente la carta inceppata con entrambe le mani per evitare strappi.",
      "Pulire i rulli di prelievo della carta con un panno soffice leggermente inumidito con alcol isopropilico.",
      "Assicurarsi che le guide della carta nel cassetto siano regolate sulla dimensione corretta (A4 o A3).",
      "Reinserire il cassetto e chiudere saldamente."
    ],
    toolsNeeded: ["Alcol Isopropilico", "Panno in microfibra"]
  },
  J3102: {
    code: "J3102",
    title: "Inceppamento nell'unità duplex (Fronte/Retro)",
    steps: [
      "Aprire lo sportello laterale destro della stampante Kyocera.",
      "Rilasciare le leve verdi di blocco della carta duplex.",
      "Rimuovere con delicatezza i fogli allineandoli lungo la direzione di scorrimento.",
      "Controllare se ci sono piccoli strappi di carta o residui e rimuoverli con attenzione.",
      "Richiudere lo sportello laterale premendo fino allo scatto."
    ],
    toolsNeeded: ["Pinzette a punta tonda", "Torcia tascabile"]
  },
  C2000: {
    code: "C2000",
    title: "Errore del motore di azionamento principale",
    steps: [
      "Scollegare il cavo di alimentazione a muro per 5 minuti per resettare i condensatori della scheda.",
      "Rimuovere l'unità di smaltimento del toner esausto e reinserirla per verificare il corretto posizionamento.",
      "Verificare che i toner siano inseriti correttamente e non vi siano ingranaggi bloccati.",
      "Ricollegare e accendere. Se l'errore riappare, il motore principale richiede assistenza tecnica."
    ],
    toolsNeeded: ["Guanti protettivi"]
  },
  F000: {
    code: "F000",
    title: "Errore di comunicazione del pannello di controllo",
    steps: [
      "Spegnere e riaccendere la stampante con l'interruttore principale.",
      "Controllare il corretto inserimento dei cavi del pannello se è presente un display orientabile esterno.",
      "Eseguire un aggiornamento firmware del dispositivo se consentito o chiamare l'amministratore di sistema."
    ],
    toolsNeeded: ["Nessuno specifico"]
  }
};
