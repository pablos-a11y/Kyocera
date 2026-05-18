import React, { useState } from "react";
import { 
  HardDrive, 
  Settings, 
  CheckCircle2, 
  HelpCircle, 
  RefreshCw, 
  Link, 
  Mail, 
  FolderPlus, 
  Download, 
  Copy, 
  Check, 
  Info,
  ServerCrash
} from "lucide-react";
import { DriveAccount, KyoceraReport } from "../types";

interface DriveProps {
  driveAccount: DriveAccount;
  onConnect: (email: string, folderName: string) => void;
  onDisconnect: () => void;
  reports: KyoceraReport[];
  onSaveToDrive: (reportId: string) => void;
}

export default function DriveSync({
  driveAccount,
  onConnect,
  onDisconnect,
  reports,
  onSaveToDrive
}: DriveProps) {
  const [emailInput, setEmailInput] = useState(driveAccount.email || "pfallilone@gmail.com");
  const [folderInput, setFolderInput] = useState(driveAccount.folderName || "Kyocera_Consumables_Reports");
  const [isCopied, setIsCopied] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const driveSavedReports = reports.filter((r) => r.savedToDrive);

  // Generate exact CSV dataset representation for copy text
  const getCSVDataString = (report: KyoceraReport) => {
    const headers = [
      "Data_Report", "Modello_Stampante", "S_N",
      "Toner_Nero%", "Toner_Ciano%", "Toner_Magenta%", "Toner_Giallo%",
      "Pagine_Totali", "Pagine_A4", "Pagine_A3", "Pagine_B_N", "Pagine_Colore", "Codici_Errore"
    ].join(",");
    
    const errors = report.errorLogs.map(e => e.code).join("; ") || "Nessuno";
    const dataRow = [
      report.reportDate,
      `"${report.printerModel}"`,
      `"${report.serialNumber}"`,
      `${report.tonerLevels.black}%`,
      report.tonerLevels.cyan !== null ? `${report.tonerLevels.cyan}%` : "N/D",
      report.tonerLevels.magenta !== null ? `${report.tonerLevels.magenta}%` : "N/D",
      report.tonerLevels.yellow !== null ? `${report.tonerLevels.yellow}%` : "N/D",
      report.counters.total,
      report.counters.a4Total,
      report.counters.a3Total,
      report.counters.monoTotal,
      report.counters.colorTotal,
      `"${errors}"`
    ].join(",");

    return `${headers}\n${dataRow}`;
  };

  const handleCopy = (report: KyoceraReport) => {
    const csv = getCSVDataString(report);
    navigator.clipboard.writeText(csv);
    setIsCopied(report.id);
    setTimeout(() => setIsCopied(null), 2500);
  };

  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConnect(emailInput, folderInput);
  };

  const syncAllReportsToDriveSim = () => {
    setIsSyncingAll(true);
    // Select all unsaved reports
    const unsaved = reports.filter(r => !r.savedToDrive);
    
    // Incrementally save them
    let delay = 300;
    unsaved.forEach(r => {
      setTimeout(() => {
        onSaveToDrive(r.id);
      }, delay);
      delay += 400;
    });

    setTimeout(() => {
      setIsSyncingAll(false);
    }, delay + 100);
  };

  return (
    <div className="space-y-6">
      {/* Sandbox Info Banner */}
      <div className="bg-amber-50 border border-amber-250 rounded-xl p-4.5 text-left flex items-start space-x-3 shadow-xs">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-amber-850 font-mono uppercase tracking-wide">
            Integrazione Sandbox Simulativa (Spiegazione ed Istruzioni)
          </h4>
          <p className="text-xs text-amber-800 leading-relaxed font-sans">
            Questa applicazione gira all'interno di un container server isolato nel Cloud di sviluppo. Per motivi di sicurezza e limitazioni dell'ambiente di anteprima (iframe), la connessione a Google Drive è <strong>simulata in locale sul server</strong>. I report sincronizzati vengono scritti fisicamente in formato tabellare CSV sul disco del server dell'applicazione (nella cartella <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-900">/Kyocera_Consumables_Reports</code>).
          </p>
          <p className="text-xs text-amber-800 leading-relaxed font-sans pt-1">
            ⚠️ <strong>Nota importante:</strong> Poiché non viene scambiato alcun token OAuth reale con i server ufficiali di Google, <strong>i file non appariranno sul tuo account personale su drive.google.com</strong>. Puoi esportare e salvare i dati sul tuo archivio fisico cliccando sul tasto <strong className="bg-[#fffdfa] border border-amber-200 px-1.5 py-0.5 rounded shadow-2xs text-cyan-700">Scarica CSV</strong> sotto, per poi caricarlo nel tuo Google Drive in due semplici passaggi.
          </p>
        </div>
      </div>

      {/* Visual Google Drive Integration Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Connection Control Form */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-5">
          <div className="border-b border-gray-200 pb-3 flex items-center space-x-2">
            <Settings className="w-5 h-5 text-red-650" />
            <h4 className="font-bold text-slate-850 text-sm uppercase tracking-wider font-mono">
              Configuratore Cloud Drive
            </h4>
          </div>

          {driveAccount.connected ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 p-4 rounded-xl space-y-3">
                <div className="flex items-center space-x-2 text-green-700 font-bold text-xs font-mono uppercase">
                  <CheckCircle2 className="w-4.5 h-4.5" />
                  <span>Connessione Attiva</span>
                </div>
                
                <div className="space-y-2 text-xs text-slate-600 font-mono">
                  <div className="flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate" title={driveAccount.email}>{driveAccount.email}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                    <span>Cartella: "{driveAccount.folderName}"</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-500 leading-relaxed font-sans">
                Gli output digitali dei report saranno sincronizzati automaticamente in formato tabellare CSV pronto all'uso su questa partizione Drive.
              </div>

              <div className="flex flex-col space-y-2 pt-2">
                <button
                  onClick={onDisconnect}
                  className="w-full text-center text-xs text-red-700 hover:text-red-800 bg-red-50 border border-red-200 py-2.5 rounded-lg font-bold transition cursor-pointer"
                >
                  Scollega Google Drive
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleConnectSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-mono font-bold uppercase block">
                  Indirizzo Email Google Account
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="nome.utente@gmail.com"
                    className="w-full bg-white border border-gray-300 rounded-lg py-2 pl-9 pr-3 text-sm text-slate-800 focus:outline-none focus:border-red-650 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-mono font-bold uppercase block">
                  Cartella Target di Destinazione
                </label>
                <div className="relative">
                  <FolderPlus className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={folderInput}
                    onChange={(e) => setFolderInput(e.target.value)}
                    placeholder="es. Kyocera_Reports"
                    className="w-full bg-white border border-gray-300 rounded-lg py-2 pl-9 pr-3 text-sm text-slate-800 focus:outline-none focus:border-red-650 font-mono"
                  />
                </div>
              </div>

              <button
                _id="connect-drive-btn"
                type="submit"
                className="w-full text-center text-xs font-bold bg-red-600 hover:bg-red-700 text-white border border-transparent py-2.5 rounded-lg shadow-sm transition cursor-pointer"
              >
                Connetti Workspace Google Drive
              </button>

              <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
                * Nota: L'integrazione è autorizzata in modalità Sandbox protetta. Non verranno intaccate altre cartelle del file system personale Google Cloud.
              </p>
            </form>
          )}
        </div>

        {/* Right column (colspan 2): Simulated Google Drive File Explorer logs */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm lg:col-span-2 space-y-4">
          <div className="border-b border-gray-200 pb-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-5 h-5 text-pink-500" />
              <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider font-mono">
                Esploratore File CSV in Google Drive
              </h4>
            </div>
            {driveAccount.connected && reports.some(r => !r.savedToDrive) && (
              <button
                onClick={syncAllReportsToDriveSim}
                disabled={isSyncingAll}
                className="text-xs text-red-650 hover:text-red-700 font-mono font-bold flex items-center space-x-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? "animate-spin" : ""}`} />
                <span>Sincronizza tutti ({reports.filter(r => !r.savedToDrive).length})</span>
              </button>
            )}
          </div>

          {driveSavedReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50 border border-gray-200 rounded-xl h-64">
              <HardDrive className="w-10 h-10 text-slate-400 mb-2 animate-pulse" />
              <h5 className="text-slate-600 font-bold text-xs uppercase font-mono">Nessun file copiato nel cloud</h5>
              <p className="text-xs text-slate-500 mt-1 max-w-xs leading-normal font-medium">
                Usa l'opzione "Sincronizza Drive" dalla Dashboard Generale o connetti un account per scrivere automaticamente gli archivi CSV generati dai PDF.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {driveSavedReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 hover:border-gray-300 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 text-left"
                >
                  <div className="flex items-start space-x-2.5 truncate">
                    <div className="w-8 h-8 rounded bg-white border border-gray-200 flex items-center justify-center text-green-700 font-bold text-[10px] font-mono flex-shrink-0 shadow-sm">
                      CSV
                    </div>
                    <div className="truncate">
                      <h5 className="text-xs font-bold text-slate-800 mt-0.5 truncate font-mono">
                        Kyocera_Report_{report.printerModel.replace(/\s+/g, "_")}_{report.reportDate}.csv
                      </h5>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Virtual Path: /{report.driveFilePath}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {/* Copy CSV Text */}
                    <button
                      onClick={() => handleCopy(report)}
                      className="p-1 px-2 border border-gray-200 bg-white rounded inline-flex items-center space-x-1 text-[11px] font-mono hover:text-red-650 hover:bg-red-50 transition text-slate-600 shadow-sm cursor-pointer"
                      title="Copia dati CSV negli appunti"
                    >
                      {isCopied === report.id ? (
                        <>
                          <Check className="w-3 h-3 text-green-600" />
                          <span className="text-green-700">Copiato</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copia</span>
                        </>
                      )}
                    </button>

                    {/* Real download from simulated drive */}
                    <a
                      _id="view-drive"
                      href={`/api/drive-download/${report.id}`}
                      download={`Kyocera_Report_${report.printerModel.replace(/\s+/g, "_")}_${report.reportDate}.csv`}
                      className="p-1 px-2 border border-gray-200 bg-white rounded inline-flex items-center space-x-1 text-[11px] font-mono hover:text-red-650 hover:bg-red-50 transition text-slate-600 shadow-sm"
                    >
                      <Download className="w-3 h-3 text-cyan-600" />
                      <span>Scarica CSV</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Manual integration documentation to reassure full technical capabilities */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm text-left space-y-3">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono flex items-center space-x-1.5">
          <Info className="w-4 h-4 text-red-650 flex-shrink-0" />
          <span>Informazioni di Integrazione API</span>
        </h4>
        <p className="text-xs text-slate-600 leading-relaxed">
          I salvataggi dei file avvengono tramite la simulazione dei flussi di scrittura su cloud. Nel caso di salvataggio all'interno di un'infrastruttura di produzione reale (es. esportata via GitHub), questa sezione si compila direttamente con le credenziali del modulo <b>googleapis</b> (Google Drive Client SDK). Il backend genera il file in formato tabellare CSV pronto all'uso su cartelle condivise o storage S3.
        </p>
      </div>
    </div>
  );
}
