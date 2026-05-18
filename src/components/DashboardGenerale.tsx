import { useState } from "react";
import { 
  Printer, 
  Layers, 
  AlertTriangle, 
  HardDrive, 
  Calendar, 
  CheckCircle2, 
  Trash2, 
  ExternalLink,
  Info,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  BarChart2,
  X,
  Droplets
} from "lucide-react";
import { 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { KyoceraReport, DriveAccount } from "../types";

// Helper function to format dates to DD/MM/YYYY
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const match = dateStr.trim().match(/^(\d{4})[-/](\d{2})[-/](\d{2})(.*)$/);
  if (match) {
    const [_, year, month, day, rest] = match;
    return `${day}/${month}/${year}${rest}`;
  }
  return dateStr;
}

interface DashboardProps {
  reports: KyoceraReport[];
  selectedReportId: string | null;
  onSelectReport: (id: string) => void;
  onDeleteReport: (id: string) => void;
  driveAccount: DriveAccount;
  onSaveToDrive: (reportId: string) => void;
}

export default function DashboardGenerale({
  reports,
  selectedReportId,
  onSelectReport,
  onDeleteReport,
  driveAccount,
  onSaveToDrive
}: DashboardProps) {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedKpiErrorIdx, setSelectedKpiErrorIdx] = useState<number>(0);
  const [reportIdToDelete, setReportIdToDelete] = useState<string | null>(null);
  const [showPaperTrend, setShowPaperTrend] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const activeReport = reports.find((r) => r.id === selectedReportId) || reports[reports.length - 1];

  if (!activeReport) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-gray-200 rounded-2xl h-96 shadow-sm">
        <Printer className="w-16 h-16 text-slate-400 mb-4 animate-pulse" />
        <h3 className="text-xl font-medium text-slate-800">Nessun report caricato</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-sm">
          Carica un file PDF di utilizzo Kyocera o seleziona un report simulato per visualizzare la dashboard interattiva.
        </p>
      </div>
    );
  }

  // Aggregate stats across history to show nice trends
  const latestFive = [...reports].sort((a,b) => b.reportDate.localeCompare(a.reportDate)).slice(0, 5);
  const totalPrintersInVol = new Set(reports.map(r => r.serialNumber)).size;
  const criticalErrorsCount = activeReport.errorLogs.filter(e => e.severity === "critical").length;

  const handleExportCSV = (report: KyoceraReport) => {
    // Generate CSV string
    const headers = [
      "Data_Report",
      "Modello_Stampante",
      "S_N",
      "Toner_Nero_Perc",
      "Toner_Ciano_Perc",
      "Toner_Magenta_Perc",
      "Toner_Giallo_Perc",
      "Pagine_Totali",
      "Pagine_A4",
      "Pagine_A3",
      "Pagine_B_N",
      "Pagine_Colore",
      "Codici_Errore"
    ];
    
    const errors = report.errorLogs.map(e => e.code).join("; ") || "Nessuno";
    const dataRow = [
      formatDate(report.reportDate),
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
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), dataRow.join(",")].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Kyocera_Report_${report.printerModel.replace(/\s+/g, "_")}_${report.reportDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSuccessMsg(`CSV scaricato con successo!`);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleExportCumulativeCSV = () => {
    if (reports.length === 0) return;

    // Use current date for filename
    const now = new Date().toISOString().split("T")[0];

    const headers = [
      "Data_Report",
      "Modello_Stampante",
      "S_N",
      "Toner_Nero_Perc",
      "Toner_Ciano_Perc",
      "Toner_Magenta_Perc",
      "Toner_Giallo_Perc",
      "Pagine_Totali",
      "Pagine_A4",
      "Pagine_A3",
      "Pagine_B_N",
      "Pagine_Colore",
      "Codici_Errore"
    ];

    const rows = reports.map(report => {
      const errors = report.errorLogs.map(e => e.code).join("; ") || "Nessuno";
      return [
        formatDate(report.reportDate),
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
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Kyocera_Cumulative_Report_${now}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSuccessMsg(`CSV Cumulativo (${reports.length} report) scaricato!`);
    setIsExportMenuOpen(false);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Visual KPI Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* KPI 1: Active Printer Model */}
        <div id="kpi-device" className="bg-white border border-gray-200 rounded-xl p-5 hover:border-red-650/40 shadow-sm transition truncate">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Dispositivo Attivo</span>
            <Printer className="w-5 h-5 text-red-650" />
          </div>
          <div className="mt-3">
            <h4 className="text-lg font-bold text-slate-900 leading-tight font-sans truncate">{activeReport.printerModel}</h4>
            <p className="text-xs text-slate-500 mt-1 font-mono">S/N: {activeReport.serialNumber || "Non rilevato"}</p>
          </div>
        </div>

        {/* KPI 2: Toner Summary */}
        <div id="kpi-toner" className="bg-white border border-gray-200 rounded-xl p-5 hover:border-yellow-650/40 shadow-sm transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Stato Consumabili</span>
            <TrendingUp className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="mt-3 space-y-2">
            {/* Grid layout for identical font-size toner indicators */}
            <div className="grid grid-cols-2 gap-2">
              {/* Black Toner (always exists) */}
              <div className="flex flex-col justify-center bg-slate-50 border border-gray-200 rounded-lg p-2 shadow-xs">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-600" />
                  <span>Nero (K)</span>
                </span>
                <span className="text-lg font-black text-slate-800 font-mono mt-1">
                  {activeReport.tonerLevels.black}%
                </span>
              </div>

              {activeReport.tonerLevels.cyan !== null ? (
                <>
                  {/* Cyan Code */}
                  <div className="flex flex-col justify-center bg-cyan-50/55 border border-cyan-200 rounded-lg p-2 shadow-xs">
                    <span className="text-[9px] text-cyan-700 font-bold uppercase tracking-wider font-mono flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span>Ciano (C)</span>
                    </span>
                    <span className="text-lg font-black text-cyan-900 font-mono mt-1">
                      {activeReport.tonerLevels.cyan}%
                    </span>
                  </div>

                  {/* Magenta Code */}
                  <div className="flex flex-col justify-center bg-pink-50/55 border border-pink-200 rounded-lg p-2 shadow-xs">
                    <span className="text-[9px] text-pink-700 font-bold uppercase tracking-wider font-mono flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                      <span>Magenta (M)</span>
                    </span>
                    <span className="text-lg font-black text-pink-900 font-mono mt-1">
                      {activeReport.tonerLevels.magenta}%
                    </span>
                  </div>

                  {/* Yellow Code */}
                  <div className="flex flex-col justify-center bg-yellow-50/55 border border-yellow-200 rounded-lg p-2 shadow-xs">
                    <span className="text-[9px] text-yellow-700 font-bold uppercase tracking-wider font-mono flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                      <span>Giallo (Y)</span>
                    </span>
                    <span className="text-lg font-black text-yellow-905 font-mono mt-1">
                      {activeReport.tonerLevels.yellow}%
                    </span>
                  </div>
                </>
              ) : (
                /* Fill the empty space when monochrome */
                <div className="flex flex-col justify-center bg-gray-50 border border-dashed border-gray-200 rounded-lg p-2 opacity-50 text-center items-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Modello Solo BK</span>
                  <span className="text-[10px] text-slate-500 font-mono mt-1">Monocromatico</span>
                </div>
              )}
            </div>

            {/* Short report date printed in enlarged font */}
            <div className="pt-2 border-t border-gray-150 flex items-center justify-between font-mono">
              <span className="font-medium text-slate-400 uppercase tracking-wider text-[10px]">Data Report:</span>
              <span className="font-extrabold text-xs md:text-sm text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{formatDate(activeReport.reportDate)}</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Paper Printed */}
        <div id="kpi-paper" className="bg-white border border-gray-200 rounded-xl p-5 hover:border-pink-600/40 shadow-sm transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Volume Stampe</span>
            <Layers className="w-5 h-5 text-pink-500" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {activeReport.counters.total.toLocaleString("it-IT")}
              </span>
              <span className="text-xs text-slate-500">fogli</span>
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-slate-500 font-mono">
              <span>A4: {activeReport.counters.a4Total.toLocaleString("it-IT")}</span>
              <span>A3: {activeReport.counters.a3Total.toLocaleString("it-IT")}</span>
            </div>
            {/* Short report date shown in enlarged font */}
            <div className="pt-2 mt-2 border-t border-gray-150 flex items-center justify-between font-mono">
              <span className="font-medium text-slate-400 uppercase tracking-wider text-[10px]">Data Report:</span>
              <span className="font-extrabold text-xs md:text-sm text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{formatDate(activeReport.reportDate)}</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Active Errors */}
        <div id="kpi-errors" className="bg-white border border-gray-200 rounded-xl p-5 hover:border-red-650/40 shadow-sm transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Stato Anomalie</span>
            <AlertTriangle className={`w-5 h-5 ${criticalErrorsCount > 0 ? "text-red-500 animate-bounce" : "text-emerald-500"}`} />
          </div>
          <div className="mt-3 space-y-2">
            {activeReport.errorLogs.length > 0 ? (
              <>
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Anomalie totali:</span>
                  <span className="font-bold text-slate-800">{activeReport.errorLogs.length}</span>
                </div>
                
                {/* Dropdown Menu to Select Anomaly */}
                <select
                  value={selectedKpiErrorIdx < activeReport.errorLogs.length ? selectedKpiErrorIdx : 0}
                  onChange={(e) => setSelectedKpiErrorIdx(Number(e.target.value))}
                  className="w-full text-xs font-mono bg-slate-50 border border-gray-200 rounded-lg p-1.5 text-slate-800 select-none outline-none focus:border-red-650 shadow-xs cursor-pointer"
                >
                  {activeReport.errorLogs.map((item, idx) => (
                    <option key={idx} value={idx}>
                      {item.code} ({item.severity === "critical" ? "Critico" : "Warning"})
                    </option>
                  ))}
                </select>

                {/* Selected Anomaly details rendered dynamically */}
                {(() => {
                  const idxToRender = selectedKpiErrorIdx < activeReport.errorLogs.length ? selectedKpiErrorIdx : 0;
                  const item = activeReport.errorLogs[idxToRender];
                  if (!item) return null;
                  const isCrit = item.severity === "critical";

                  return (
                    <div className={`p-2 border rounded text-[11px] font-sans space-y-1 mt-1 transition ${
                      isCrit ? "bg-red-50/50 border-red-200 text-red-800" : "bg-amber-50/50 border-amber-200 text-amber-800"
                    }`}>
                      <div className="flex items-center justify-between font-mono text-[9px] opacity-75">
                        <span className="font-semibold uppercase tracking-wider">
                          {isCrit ? "Critico 🔴" : "Warning ⚠️"}
                        </span>
                        <span>{formatDate(item.dateTime) || "Rapporto"}</span>
                      </div>
                      <h5 className="font-extrabold font-mono text-slate-800">{item.code}</h5>
                      <p className="leading-snug text-slate-600 line-clamp-2" title={item.description}>
                        {item.description}
                      </p>
                    </div>
                  );
                })()}
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-extrabold text-emerald-600 tracking-tight">0</span>
                  <span className="text-xs text-slate-400 font-mono">anomalie totali</span>
                </div>
                
                {/* Select disabled when there aren't any active errors */}
                <select
                  disabled
                  className="w-full text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg p-1.5 text-slate-400 outline-none cursor-not-allowed opacity-60"
                >
                  <option>Nessuna anomalia rilevata</option>
                </select>

                <p className="text-[10px] text-green-700 font-mono font-medium">
                  ✓ Dispositivo fully operativo.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Notification Bar */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-center space-x-2 text-sm transition animate-fadeIn shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Content Splitted Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* S/N Reports History Explorer */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm lg:col-span-1">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider font-mono">Elenchi Report Kyocera</h3>
              <p className="text-[11px] text-slate-500">Documenti analizzati e simulati</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPaperTrend(true)}
                className="flex items-center space-x-1 px-2 py-1 bg-pink-50 text-pink-650 hover:bg-pink-100 border border-pink-200 rounded-lg transition-all text-xs font-bold font-mono group"
                title="Visualizza trend consumo carta (A3/A4)"
              >
                <BarChart2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Trend Carta</span>
              </button>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono font-semibold">
                {reports.length}
              </span>
            </div>
          </div>

          <div className="divide-y divide-gray-150 max-h-[420px] overflow-y-auto">
            {reports.map((report) => {
              const isActive = report.id === activeReport.id;
              const hasCritical = report.errorLogs.some((e) => e.severity === "critical");
              return (
                <div
                  key={report.id}
                  onClick={() => onSelectReport(report.id)}
                  className={`p-3.5 transition cursor-pointer text-left block w-full relative group ${
                    isActive 
                      ? "bg-gray-100 border-l-4 border-red-650 text-slate-900 font-bold" 
                      : "bg-transparent text-slate-600 hover:bg-gray-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold font-mono tracking-tight flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-red-650 inline" />
                      <span className="text-slate-900">{formatDate(report.reportDate)}</span>
                    </span>
                    <div className="flex items-center space-x-2">
                      {report.savedToDrive && (
                        <span className="text-[10px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200 font-mono">
                          DRIVE
                        </span>
                      )}
                      {hasCritical && (
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" title="Anomalie critiche!" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReportIdToDelete(report.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 p-1 rounded hover:bg-gray-200 transition"
                        title="Elimina report"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h5 className={`text-sm font-semibold mt-1 truncate ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
                    {report.printerModel}
                  </h5>

                  <div className="flex items-center justify-between mt-2.5 text-[11px] text-slate-500 font-mono">
                    <span>BK: {report.tonerLevels.black}%</span>
                    <span>Tot: {report.counters.total.toLocaleString("it-IT")} pag</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Analysis Panel */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 lg:col-span-2 space-y-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4">
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                <span className="px-2.5 py-0.5 rounded bg-red-50 text-red-850 border border-red-200 text-xs font-mono font-bold uppercase tracking-wider">
                  Report Selezionato
                </span>
                <span className="text-base text-slate-900 font-extrabold bg-slate-100 px-2.5 py-1 rounded border border-gray-250 font-mono tracking-tight">{formatDate(activeReport.reportDate)}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-1.5">{activeReport.printerModel}</h3>
            </div>

            <div className="mt-3 sm:mt-0 flex space-x-2 relative">
              {/* Export Dropdown Menu */}
              <div className="relative">
                <button
                  id="export-csv-dropdown"
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  onBlur={() => setTimeout(() => setIsExportMenuOpen(false), 200)}
                  className="flex items-center space-x-1.5 text-xs font-semibold bg-white hover:bg-gray-50 text-slate-700 px-3 py-2 rounded-lg border border-gray-300 transition cursor-pointer shadow-sm group"
                >
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  <span>Esporta CSV</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isExportMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isExportMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="p-1.5 space-y-1">
                      <button
                        onClick={() => handleExportCSV(activeReport)}
                        className="w-full flex items-center space-x-2.5 px-3 py-2.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition text-left group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100">
                          <Printer className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span>Report Corrente</span>
                          <span className="text-[9px] text-slate-400 font-normal">S/N: {activeReport.serialNumber}</span>
                        </div>
                      </button>

                      <button
                        onClick={handleExportCumulativeCSV}
                        className="w-full flex items-center space-x-2.5 px-3 py-2.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition text-left group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span>Esporta Tutto (Cumulativo)</span>
                          <span className="text-[9px] text-slate-400 font-normal">{reports.length} report totali</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Automatic Drive Sync Save */}
              <button
                onClick={() => {
                  if (activeReport.savedToDrive) {
                    window.location.href = `/api/drive-download/${activeReport.id}`;
                    setSuccessMsg(`File CSV scaricato! Sincronizzato virtualmente sul container a: /${activeReport.driveFilePath}`);
                    setTimeout(() => setSuccessMsg(null), 5500);
                  } else {
                    onSaveToDrive(activeReport.id);
                    setSuccessMsg(`Sincronizzazione simulata completata! Il file CSV è stato salvato sul server in: "/${driveAccount.folderName || 'Kyocera_Consumables_Reports'}". Clicca nuovamente sul pulsante per scaricarlo subito sul tuo dispositivo!`);
                    setTimeout(() => setSuccessMsg(null), 8500);
                  }
                }}
                className={`flex items-center space-x-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition cursor-pointer ${
                  activeReport.savedToDrive
                    ? "bg-green-50 text-green-800 border-green-200 hover:bg-green-100"
                    : "bg-red-600 hover:bg-red-700 text-white border-transparent"
                }`}
                title={activeReport.savedToDrive ? "Scarica il file CSV salvato sul server" : "Sincronizza e scrivi CSV nel cloud simulato"}
              >
                <HardDrive className="w-4 h-4" />
                <span>{activeReport.savedToDrive ? "Scarica CSV Drive" : "Sincronizza Drive"}</span>
              </button>
            </div>
          </div>

          {/* Quick specs section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-xs text-slate-500 uppercase tracking-widest font-mono font-bold mb-3">Identificazione Hardware</h4>
              <table className="w-full text-xs text-slate-600 space-y-2">
                <tbody>
                  <tr className="border-b border-gray-200 py-1.5">
                    <td className="font-mono text-slate-400 py-1">Produttore</td>
                    <td className="text-right text-slate-800 font-semibold">Kyocera Document Sol.</td>
                  </tr>
                  <tr className="border-b border-gray-200 py-1.5">
                    <td className="font-mono text-slate-400 py-1">N. Serie (S/N)</td>
                    <td className="text-right text-slate-800 font-mono font-semibold">{activeReport.serialNumber || "N/A"}</td>
                  </tr>
                  <tr>
                    <td className="font-mono text-slate-400 py-1">Data Rilevamento</td>
                    <td className="text-right text-slate-900 font-mono font-bold text-sm bg-slate-50 px-2 py-1 rounded border border-slate-200 inline-block mt-0.5">{formatDate(activeReport.reportDate)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col justify-between">
              <div>
                <h4 className="text-xs text-slate-500 uppercase tracking-widest font-mono font-bold mb-3">Stato di Sincronizzazione</h4>
                {activeReport.savedToDrive ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-green-700 text-xs font-mono font-bold">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>CSV Registrato in Google Drive</span>
                    </div>
                    <p className="text-[11px] text-slate-700 font-mono leading-relaxed bg-white p-2 rounded truncate border border-gray-200 shadow-inner">
                      /{activeReport.driveFilePath}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs text-slate-600 font-sans">
                    <div className="flex items-center space-x-1.5 text-amber-600 font-semibold">
                      <Info className="w-4 h-4 flex-shrink-0" />
                      <span>Non sincronizzato nel cloud</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Sincronizza per copiare questo report automaticamente in formato tabellare CSV nella cartella Drive {driveAccount.connected ? `"${driveAccount.folderName}"` : "di lavoro"}.
                    </p>
                  </div>
                )}
              </div>

              {!activeReport.savedToDrive && (
                <button
                  onClick={() => onSaveToDrive(activeReport.id)}
                  className="mt-3 text-left text-xs text-red-650 hover:text-red-700 font-semibold inline-flex items-center space-x-1 cursor-pointer"
                >
                  <span>Configura salvataggio Drive</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Prompt warning & preview message */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono mb-2">Anteprima Tabella CSV Estratta</h4>
            <div className="overflow-x-auto max-w-full">
              <table className="w-full text-left border-collapse text-[11px] font-mono text-slate-800 bg-white border border-gray-200">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 border-b border-gray-200 select-all">
                    <th className="px-2.5 py-1.5 border-r border-gray-200">CAMP_TIPO</th>
                    <th className="px-2.5 py-1.5">VALORE ESTRATTO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 select-all">
                  <tr>
                    <td className="px-2.5 py-1 border-r border-gray-250 font-bold bg-slate-50">Data_Report</td>
                    <td className="px-2.5 py-1 text-red-650 font-bold">{formatDate(activeReport.reportDate)}</td>
                  </tr>
                  <tr>
                    <td className="px-2.5 py-1 border-r border-gray-250 font-bold bg-slate-50">Modello_Stampante</td>
                    <td className="px-2.5 py-1">{activeReport.printerModel}</td>
                  </tr>
                  <tr>
                    <td className="px-2.5 py-1 border-r border-gray-250 font-bold bg-slate-50">Toner_Nero (BK)</td>
                    <td className="px-2.5 py-1">{activeReport.tonerLevels.black}%</td>
                  </tr>
                  <tr>
                    <td className="px-2.5 py-1 border-r border-gray-250 font-bold bg-slate-50">Toner_C/M/Y</td>
                    <td className="px-2.5 py-1">
                      {activeReport.tonerLevels.cyan !== null 
                        ? `C:${activeReport.tonerLevels.cyan}% M:${activeReport.tonerLevels.magenta}% Y:${activeReport.tonerLevels.yellow}%` 
                        : "Bianco & Nero"
                      }
                    </td>
                  </tr>
                  <tr>
                    <td className="px-2.5 py-1 border-r border-gray-250 font-bold bg-slate-50">Pagine_Totali (A4+A3)</td>
                    <td className="px-2.5 py-1">{activeReport.counters.total.toLocaleString("it-IT")} (A4: {activeReport.counters.a4Total.toLocaleString("it-IT")}, A3: {activeReport.counters.a3Total.toLocaleString("it-IT")})</td>
                  </tr>
                  <tr>
                    <td className="px-2.5 py-1 border-r border-gray-250 font-bold bg-slate-50">Codici_Errore</td>
                    <td className="px-2.5 py-1 text-red-650 font-semibold">
                      {activeReport.errorLogs.map(e => e.code).join(", ") || "Nessuno (Stato Nominale)"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 italic font-mono">
              * Questo tracciato corrisponde alle specifiche necessarie per la mappatura dell'import su ERP e gestionali di inventario flotta.
            </p>
          </div>
        </div>
      </div>

      {/* Trend Paper Modal */}
      {showPaperTrend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-4xl w-full p-6 text-left flex flex-col h-[80vh] animate-slideInUp">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3 text-pink-600">
                <span className="p-2 bg-pink-50 rounded-xl text-pink-650">
                  <BarChart2 className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 font-sans">
                    Diagramma Cartesiano Trend Consumo Carta (A3/A4)
                  </h3>
                  <p className="text-xs text-slate-500 uppercase font-mono tracking-wider">
                    Andamento volumetrico su {reports.length} report caricati
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowPaperTrend(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 min-h-0 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={reports
                    .filter(r => r.serialNumber === activeReport?.serialNumber)
                    .sort((a, b) => a.reportDate.localeCompare(b.reportDate))
                    .map(r => ({
                      date: formatDate(r.reportDate), 
                      A4: r.counters.a4Total,
                      A3: r.counters.a3Total,
                    }))}
                  margin={{ top: 20, right: 30, left: 10, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                    domain={['auto', 'auto']}
                    label={{ value: 'Totale Pagine Stampate', angle: -90, position: 'insideLeft', offset: -5, fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: '1px solid #e2e8f0', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      fontSize: '11px',
                      fontFamily: 'monospace'
                    }}
                    formatter={(value: number) => [value.toLocaleString("it-IT"), ""]}
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="center" 
                    iconType="plainline"
                    wrapperStyle={{ paddingTop: '0px', paddingBottom: '30px', fontSize: '11px', fontWeight: '600' }}
                  />
                  <Line type="monotone" dataKey="A4" stroke="#166534" strokeWidth={3} dot={{ r: 4, fill: "#166534" }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="A3" stroke="#f472b6" strokeWidth={3} dot={{ r: 4, fill: "#f472b6" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Stampante Selezionata</span>
                <span className="text-xs font-bold text-slate-700 font-mono">{activeReport?.printerModel} — S/N: {activeReport?.serialNumber}</span>
              </div>
              <p className="text-[10px] text-slate-450 font-sans italic text-right leading-tight max-w-sm">
                * L'asse X mostra la cronologia dei report caricati. L'andamento crescente delle linee indica il volume cumulativo di stampe effettuate nel tempo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {reportIdToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-sm w-full p-6 text-left space-y-4">
            <div className="flex items-start space-x-3 text-red-600">
              <span className="p-2 bg-red-50 rounded-lg text-red-600 mt-0.5 animate-pulse">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-sans">
                  Eliminazione Report
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Sei sicuro di voler eliminare definitivamente questo report dalla cronologia dell'applicazione?
                </p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 text-[11px] text-slate-700 font-mono space-y-1">
                <div>
                  <strong className="text-slate-500">Modello:</strong> {reports.find(r => r.id === reportIdToDelete)?.printerModel}
                </div>
                <div>
                  <strong className="text-slate-500">Data Report:</strong> {formatDate(reports.find(r => r.id === reportIdToDelete)?.reportDate)}
                </div>
                <div>
                  <strong className="text-slate-500">S/N:</strong> {reports.find(r => r.id === reportIdToDelete)?.serialNumber}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-amber-600 font-sans italic leading-tight">
              * Nota: Questa azione rimuoverà il file sul server temporaneo, ma i report esportati in locale rimarranno integri.
            </p>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setReportIdToDelete(null)}
                className="px-3.5 py-1.5 border border-gray-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-gray-50 transition cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteReport(reportIdToDelete);
                  setReportIdToDelete(null);
                }}
                className="px-3.5 py-1.5 bg-red-650 hover:bg-red-700 text-white font-semibold text-xs rounded-lg transition shadow-sm cursor-pointer"
              >
                Conferma ed Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
