import React, { useState, useEffect, useRef } from "react";
import { 
  Printer, 
  Layers, 
  AlertTriangle, 
  HardDrive, 
  Calendar, 
  Droplet, 
  FileText, 
  UploadCloud, 
  Info, 
  Eye, 
  CheckCircle2, 
  Plus, 
  X,
  RefreshCw,
  Clock,
  ExternalLink,
  ChevronRight,
  Database,
  HelpCircle,
  LogOut
} from "lucide-react";

import { KyoceraReport, DriveAccount } from "./types";
import DashboardGenerale from "./components/DashboardGenerale";
import ConsumoToner from "./components/ConsumoToner";
import ConsumoCarta from "./components/ConsumoCarta";
import RegistroErrori from "./components/RegistroErrori";
import DriveSync from "./components/DriveSync";
import ManualeChat from "./components/ManualeChat";
import LoginScreen from "./components/LoginScreen";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("kyocera_auth") === "true";
  });
  const [reports, setReports] = useState<KyoceraReport[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "toner" | "carta" | "errori" | "drive" | "manuale">("dashboard");
  
  // File upload states
  const [isDragOver, setIsDragOver] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsingStep, setParsingStep] = useState<string>("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successParsedReport, setSuccessParsedReport] = useState<KyoceraReport | null>(null);

  // Google Drive states
  const [driveAccount, setDriveAccount] = useState<DriveAccount>({
    connected: false,
    email: "",
    folderName: "Kyocera_Consumables_Reports"
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history from API on mount
  useEffect(() => {
    fetchReports();
    fetchDriveStatus();
  }, []);

  const fetchReports = async (skipAutoSelect = false) => {
    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports);
        if (data.reports.length > 0 && !selectedReportId && !skipAutoSelect) {
          // Select newest report by default only if none is selected
          setSelectedReportId(data.reports[data.reports.length - 1].id);
        }
      }
    } catch (err) {
      console.error("Errore nel recupero dei report storici:", err);
    }
  };

  const fetchDriveStatus = async () => {
    try {
      const res = await fetch("/api/drive-status");
      if (res.ok) {
        const data = await res.json();
        setDriveAccount(data);
      }
    } catch (err) {
      console.error("Errore nello stato del Drive:", err);
    }
  };

  const handleDriveConnect = async (email: string, folderName: string) => {
    try {
      const res = await fetch("/api/drive-connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, folderName })
      });
      if (res.ok) {
        const data = await res.json();
        setDriveAccount(data);
      }
    } catch (err) {
      console.error("Errore connessione Drive:", err);
    }
  };

  const handleDriveDisconnect = async () => {
    try {
      const res = await fetch("/api/drive-disconnect", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setDriveAccount(data);
      }
    } catch (err) {
      console.error("Errore disconnessione Drive:", err);
    }
  };

  const handleManualSaveToDrive = async (reportId: string) => {
    // Save to Google Drive Simulation (Express Endpoint)
    try {
      if (!driveAccount.connected) {
        // Automatically connect a default profile to make it smooth for the user!
        await handleDriveConnect("pfallilone@gmail.com", "Kyocera_Consumables_Reports");
      }

      const reportToSync = reports.find((r) => r.id === reportId);
      if (!reportToSync) return;

      const customFileName = `Kyocera_Report_${reportToSync.printerModel.replace(/\s+/g, "_")}_${reportToSync.reportDate}.csv`;
      
      const res = await fetch("/api/save-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          customFileName,
          csvContent: "" // compiled on server anyway
        })
      });

      if (res.ok) {
        const result = await res.json();
        // Update reports list state
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, savedToDrive: true, driveFilePath: result.path } : r));
      }
    } catch (err) {
      console.error("Errore salvataggio su Drive:", err);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}`, { method: "DELETE" });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
        if (selectedReportId === reportId) {
          const remaining = reports.filter((r) => r.id !== reportId);
          setSelectedReportId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
        }
      }
    } catch (err) {
      console.error("Errore nell'eliminazione del report:", err);
    }
  };

  // Convert PDF file upload to Base64 and post to server
  const processPDFFiles = async (files: FileList | File[]) => {
    const pdfFiles = Array.from(files).filter(f => f.type === "application/pdf");
    
    if (pdfFiles.length === 0) {
      if (files.length > 0) {
        setUploadError("Tutti i file devono essere esclusivamente documenti PDF.");
      }
      return;
    }

    setUploadError(null);
    setIsParsing(true);
    setSuccessParsedReport(null);
    
    // Total count for progress
    const totalFiles = pdfFiles.length;
    let processedCount = 0;

    for (const file of pdfFiles) {
      processedCount++;
      const progressPrefix = totalFiles > 1 ? `[${processedCount}/${totalFiles}] ` : "";
      
      // Simulate steps on the loading screen
      setParsingStep(`${progressPrefix}Analisi di "${file.name}"...`);
      
      try {
        const base64String = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Errore lettura file"));
        });

        const res = await fetch("/api/parse-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pdfBase64: base64String,
            fileName: file.name
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || `Errore nel parsing di ${file.name}`);
        }

        const data = await res.json();
        if (data.success) {
          // Add parsed report to state
          setReports(prev => [...prev, data.report]);
          setSelectedReportId(data.report.id);
          setSuccessParsedReport(data.report);
        }
      } catch (err: any) {
        console.error(`Errore parsing ${file.name}:`, err);
        setUploadError(`Errore file "${file.name}": ${err.message}`);
        // Continue with next file if possible
      }
    }

    // Re-fetch reports to ensure perfectly synced lists
    const res = await fetch("/api/reports");
    if (res.ok) {
      const data = await res.json();
      setReports(data.reports);
      if (data.reports.length > 0) {
        // Automatically select the report with the newest date
        setSelectedReportId(data.reports[data.reports.length - 1].id);
      }
    }
    
    setParsingStep("");
    setIsParsing(false);
    setActiveTab("dashboard");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processPDFFiles(files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processPDFFiles(files);
    }
  };

  const handleDragClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Simula l'upload dei report di test fornendo dei presets utili
  const loadPresetSimulation = (presetType: "color" | "mono" | "graphic") => {
    setIsParsing(true);
    setParsingStep("Caricamento report dimostrativo Kyocera...");
    
    // Simulate immediate parsing
    setTimeout(() => {
      let simulatedReport: KyoceraReport;
      const uniqueId = `simulated-${Date.now()}`;

      if (presetType === "color") {
        simulatedReport = {
          id: uniqueId,
          reportDate: "2026-05-17",
          printerModel: "Kyocera ECOSYS M5526cdw",
          serialNumber: "K-M5526-9284102",
          tonerLevels: { black: 12, cyan: 82, magenta: 75, yellow: 18 },
          counters: { total: 45200, a4Total: 43200, a3Total: 2000, monoTotal: 15200, colorTotal: 30000 },
          errorLogs: [
            { code: "J1100", description: "Inceppamento carta nel cassetto 1", dateTime: "2026-05-17 10:45", severity: "warning" }
          ],
          savedToDrive: false
        };
      } else if (presetType === "mono") {
        simulatedReport = {
          id: uniqueId,
          reportDate: "2026-05-16",
          printerModel: "Kyocera ECOSYS M2045dn (Mono)",
          serialNumber: "K-M2045-3104928",
          tonerLevels: { black: 45, cyan: null, magenta: null, yellow: null },
          counters: { total: 111800, a4Total: 111800, a3Total: 0, monoTotal: 111800, colorTotal: 0 },
          errorLogs: [
            { code: "C3100", description: "Errore del motore di ventilazione / fuser", dateTime: "2026-05-15 15:30", severity: "critical" }
          ],
          savedToDrive: false
        };
      } else {
        simulatedReport = {
          id: uniqueId,
          reportDate: "2026-05-15",
          printerModel: "Kyocera TASKalfa 5053ci - Reparto Grafica",
          serialNumber: "K-T5053-8409121",
          tonerLevels: { black: 95, cyan: 88, magenta: 90, yellow: 82 },
          counters: { total: 247100, a4Total: 212500, a3Total: 34600, monoTotal: 121000, colorTotal: 126100 },
          errorLogs: [], // No errors, nominal
          savedToDrive: true,
          driveFilePath: "Kyocera_Consumables_Reports/Kyocera_TASKalfa_5053ci_Report_2026-05-15.csv"
        };
      }

      setReports((prev) => {
        // Remove existing duplicates or keep both
        return [...prev.filter(r => r.id !== uniqueId), simulatedReport];
      });
      setSelectedReportId(simulatedReport.id);
      setIsParsing(false);
      setSuccessParsedReport(simulatedReport);
      setActiveTab("dashboard");
    }, 2000);
  };

  const activeReport = reports.find((r) => r.id === selectedReportId) || reports[reports.length - 1] || null;

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 flex flex-col font-sans select-none selection:bg-red-500/20">
      
      {/* Upper Navigation & Branding Header */}
      <header className="border-b border-gray-200 bg-white backdrop-filter backdrop-blur sticky top-0 z-40 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded bg-red-650 flex items-center justify-center text-white font-extrabold shadow-sm">
            <span className="text-xl font-black">K</span>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight uppercase font-mono">
              Kyocera <span className="text-red-650">Consumables</span> & Maintenance Plus
            </h1>
            <p className="text-[11px] text-slate-500">
              Analisi dei consumi stampanti Kyocera ed esportazione CSV tramite Intelligenza Artificiale
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 gap-2">
          <span className="flex items-center space-x-1.5 text-xs text-slate-600 font-mono bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" />
            <span>AI Client Ready</span>
          </span>
          <button
            onClick={() => {
              localStorage.removeItem("kyocera_auth");
              setIsAuthenticated(false);
            }}
            className="flex items-center space-x-1 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg border border-gray-300 shadow-xs cursor-pointer active:scale-95 transition-all"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500" />
            <span>Disconnetti</span>
          </button>
        </div>
      </header>

      {/* Main Container Workspace Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left column: PDF upload, presets, file selector and quick navigation */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Section 1: PDF Drop Zone */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              Caricamento Report PDF
            </h3>

            {/* Drag Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleDragClick}
              className={`border-2 border-dashed rounded-xl py-6 px-4 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 ${
                isDragOver 
                  ? "border-red-500 bg-red-50/50" 
                  : "border-gray-200 bg-gray-50 hover:bg-white hover:border-red-600"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              
              {isParsing ? (
                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                  <RefreshCw className="w-8 h-8 text-red-650 animate-spin" />
                  <p className="text-xs font-semibold text-slate-700 leading-relaxed max-w-xs transition duration-300">
                    {parsingStep}
                  </p>
                </div>
              ) : (
                <>
                  <UploadCloud className="w-10 h-10 text-gray-400" />
                  <div>
                    <span className="text-xs font-bold text-slate-800">
                      Rilascia PDF o Sfoglia
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Supporta fogli di stato e report consumi (.pdf)
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Error Upload */}
            {uploadError && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2.5 rounded-lg text-[11px] leading-snug font-medium">
                {uploadError}
              </div>
            )}

            {/* Visual Simulators Removed */}
            <div className="hidden">
              <span className="text-[10px] text-slate-500 font-mono uppercase block mb-2">
                Non hai un PDF? Prova un Report Simulato:
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  onClick={() => loadPresetSimulation("color")}
                  disabled={isParsing}
                  className="w-full text-left text-xs bg-gray-50 text-slate-700 hover:text-red-600 hover:bg-gray-100 p-2 rounded border border-gray-200 transition flex items-center justify-between"
                >
                  <span className="truncate font-medium">ECOSYS M5526cdw (Colori)</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </button>
                <button
                  onClick={() => loadPresetSimulation("mono")}
                  disabled={isParsing}
                  className="w-full text-left text-xs bg-gray-50 text-slate-700 hover:text-red-600 hover:bg-gray-100 p-2 rounded border border-gray-200 transition flex items-center justify-between"
                >
                  <span className="truncate font-medium">ECOSYS M2045dn (Mono - Allarme)</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </button>
                <button
                  onClick={() => loadPresetSimulation("graphic")}
                  disabled={isParsing}
                  className="w-full text-left text-xs bg-gray-50 text-slate-700 hover:text-red-600 hover:bg-gray-100 p-2 rounded border border-gray-200 transition flex items-center justify-between"
                >
                  <span className="truncate font-medium">TASKalfa 5053ci (Ufficio Grafico)</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Unified Sidebar Menu for tabs */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm space-y-1">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block p-2">
              Menu Navigatore Area
            </span>

            {/* Dashboard Tab */}
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full text-left flex items-center space-x-3 text-xs font-semibold px-4 py-3 rounded-lg transition-all ${
                activeTab === "dashboard"
                  ? "bg-gray-100 text-red-600 shadow-sm font-bold"
                  : "text-slate-600 hover:bg-gray-50 hover:text-slate-900"
              }`}
            >
              <Printer className="w-4.5 h-4.5 flex-shrink-0" />
              <span>Dashboard Generale</span>
            </button>

            {/* Toner Tab */}
            <button
              onClick={() => setActiveTab("toner")}
              className={`w-full text-left flex items-center space-x-3 text-xs font-semibold px-4 py-3 rounded-lg transition-all ${
                activeTab === "toner"
                  ? "bg-gray-100 text-red-600 shadow-sm font-bold"
                  : "text-slate-600 hover:bg-gray-50 hover:text-slate-900"
              }`}
            >
              <Droplet className="w-4.5 h-4.5 flex-shrink-0" />
              <span>Consumo Toner</span>
            </button>

            {/* Paper Tab */}
            <button
              onClick={() => setActiveTab("carta")}
              className={`w-full text-left flex items-center space-x-3 text-xs font-semibold px-4 py-3 rounded-lg transition-all ${
                activeTab === "carta"
                  ? "bg-gray-100 text-red-600 shadow-sm font-bold"
                  : "text-slate-600 hover:bg-gray-50 hover:text-slate-900"
              }`}
            >
              <FileText className="w-4.5 h-4.5 flex-shrink-0" />
              <span>Consumo Carta</span>
            </button>

            {/* Error logs Tab */}
            <button
              onClick={() => setActiveTab("errori")}
              className={`w-full text-left flex items-center space-x-3 text-xs font-semibold px-4 py-3 rounded-lg transition-all ${
                activeTab === "errori"
                  ? "bg-gray-100 text-red-600 shadow-sm font-bold"
                  : "text-slate-600 hover:bg-gray-50 hover:text-slate-900"
              }`}
            >
              <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0" />
              <span>Diagnostica & Errori</span>
            </button>

            {/* Google Drive Tab */}
            <button
              onClick={() => setActiveTab("drive")}
              className={`w-full text-left flex items-center space-x-3 text-xs font-semibold px-4 py-3 rounded-lg transition-all ${
                activeTab === "drive"
                  ? "bg-gray-100 text-red-600 shadow-sm font-bold"
                  : "text-slate-600 hover:bg-gray-50 hover:text-slate-900"
              }`}
            >
              <HardDrive className="w-4.5 h-4.5 flex-shrink-0" />
              <span>Google Drive Cloud</span>
            </button>

            {/* Kyocera Q&A Chat Tab */}
            <button
              onClick={() => setActiveTab("manuale")}
              className={`w-full text-left flex items-center space-x-3 text-xs font-semibold px-4 py-3 rounded-lg transition-all ${
                activeTab === "manuale"
                  ? "bg-gray-100 text-red-600 shadow-sm font-bold"
                  : "text-slate-600 hover:bg-gray-50 hover:text-slate-900"
              }`}
            >
              <HelpCircle className="w-4.5 h-4.5 flex-shrink-0" />
              <span>Chiedi al Manuale IA</span>
            </button>
          </div>
        </div>

        {/* Right column (colspan 3): Responsive Views Area */}
        <div id="visualizer-stage" className="lg:col-span-3 space-y-6">
          
          {reports.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-16 text-center shadow-sm space-y-4">
              <div className="w-20 h-20 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-center text-red-600 mx-auto animate-bounce shadow-sm">
                <Printer className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">Kyocera Analyzer</h3>
                <p className="text-xs text-slate-505 max-w-sm mx-auto leading-relaxed">
                  Carica un PDF estratto dalla stampante Kyocera (fogli di stato o pagina eventi) o simula istantaneamente un report demo per analizzare i livelli toner, i fogli rimasti e il registro di diagnostica guasti.
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleDragClick}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs py-2.5 px-6 rounded-lg shadow-sm transition inline-flex items-center space-x-1.5 cursor-pointer font-bold"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Seleziona file PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => loadPresetSimulation("color")}
                  className="bg-gray-100 hover:bg-gray-200 text-slate-700 font-semibold text-xs py-2.5 px-6 rounded-lg border border-gray-300 transition cursor-pointer"
                >
                  Avvia Demo Rapida
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tab switching output block */}
              {activeTab === "dashboard" && (
                <DashboardGenerale
                  reports={reports}
                  selectedReportId={selectedReportId}
                  onSelectReport={(id) => setSelectedReportId(id)}
                  onDeleteReport={handleDeleteReport}
                  driveAccount={driveAccount}
                  onSaveToDrive={handleManualSaveToDrive}
                />
              )}

              {activeTab === "toner" && (
                <ConsumoToner report={activeReport} />
              )}

              {activeTab === "carta" && (
                <ConsumoCarta report={activeReport} />
              )}

              {activeTab === "errori" && (
                <RegistroErrori report={activeReport} />
              )}

              {activeTab === "drive" && (
                <DriveSync
                  driveAccount={driveAccount}
                  onConnect={handleDriveConnect}
                  onDisconnect={handleDriveDisconnect}
                  reports={reports}
                  onSaveToDrive={handleManualSaveToDrive}
                />
              )}

              {activeTab === "manuale" && (
                <ManualeChat />
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-slate-500 mt-auto font-sans">
        <p>© 2026 Kyocera Consumables & Maintenance Analyzer. Processed by Gemini Multimodal AI.</p>
      </footer>
    </div>
  );
}
