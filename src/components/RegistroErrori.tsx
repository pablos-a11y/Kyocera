import { useState } from "react";
import { 
  AlertTriangle, 
  HelpCircle, 
  Wrench, 
  CheckCircle, 
  BookOpen, 
  Info, 
  Clock, 
  Check, 
  ArrowRight,
  ExternalLink,
  Cpu
} from "lucide-react";
import { ErrorLog, KyoceraReport, KYOCERA_REPAIR_GUIDE } from "../types";

interface ErrorsProps {
  report: KyoceraReport | null;
}

export default function RegistroErrori({ report }: ErrorsProps) {
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [solvedErrors, setSolvedErrors] = useState<Record<string, boolean>>({});
  
  if (!report) return null;

  const errorLogs = report.errorLogs;

  const toggleSolved = (code: string) => {
    setSolvedErrors(prev => ({ ...prev, [code]: !prev[code] }));
  };

  return (
    <div className="space-y-6">
      {/* Visual Error Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-850 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-650" />
              <span>Registro Codici Errore e Diagnostica Kyocera</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Registro cronologico degli allarmi hardware e degli intoppi meccanici rilevati
            </p>
          </div>
          <div className="mt-3 sm:mt-0 text-xs text-slate-600 border border-gray-200 px-3 py-1.5 rounded-lg bg-gray-50 font-mono">
            Rilevati: <span className="text-slate-900 font-bold">{errorLogs.length}</span> eventi
          </div>
        </div>

        {/* Errors list table & interactive guide display side by side */}
        {errorLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 border border-gray-200 rounded-xl">
            <CheckCircle className="w-12 h-12 text-green-600 mb-3" />
            <h4 className="text-base font-bold text-slate-800">Dispositivo fully operativo!</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm leading-normal">
              Non sono stati riscontrati registri di errore attivi per questa unità nel report Kyocera analizzato. Tutto sta funzionando in modo ottimale.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Errore log table */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">
                Log delle ultime segnalazioni
              </h4>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {errorLogs.map((item, idx) => {
                  const isCritical = item.severity === "critical";
                  const isSelected = selectedError?.code === item.code && selectedError?.dateTime === item.dateTime;
                  const isSolved = solvedErrors[`${item.code}-${item.dateTime}`];

                  return (
                    <div
                      key={`${item.code}-${idx}`}
                      onClick={() => setSelectedError(item)}
                      className={`text-left p-3.5 rounded-xl border transition cursor-pointer flex items-start space-x-3 relative ${
                        isSelected 
                          ? "bg-red-50 border-red-300 shadow-sm" 
                          : isSolved
                            ? "bg-green-50/70 border-green-250 opacity-70"
                            : "bg-gray-50 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSolved
                          ? "bg-green-150 text-green-700 font-bold"
                          : isCritical
                            ? "bg-red-100 text-red-600 font-bold"
                            : "bg-amber-100 text-amber-600 font-bold"
                      }`}>
                        {isSolved ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-extrabold font-mono uppercase tracking-wider ${
                            isSolved ? "text-green-700" : isCritical ? "text-red-700" : "text-amber-700"
                          }`}>
                            {item.code}
                          </span>
                          <span className="text-[10px] text-slate-550 font-mono flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{item.dateTime || "Rapporto corrente"}</span>
                          </span>
                        </div>

                        <p className={`text-xs font-semibold text-slate-800 mt-1 line-clamp-2 truncate ${isSolved ? "line-through text-slate-400" : ""}`}>
                          {item.description}
                        </p>

                        <div className="flex items-center justify-between mt-3 text-[10px] text-slate-400 font-mono font-medium">
                          <span className="uppercase">Gravità: {item.severity}</span>
                          <span className="text-red-650 font-bold hover:underline flex items-center space-x-1">
                            <span>Vedi Soluzione AI</span>
                            <ArrowRight className="w-3 h-3 inline" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Troubleshooter Step guide based on mapping */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 flex flex-col justify-between">
              {(() => {
                const target = selectedError || errorLogs[0];
                const guide = KYOCERA_REPAIR_GUIDE[target.code];
                const keyUnique = `${target.code}-${target.dateTime}`;
                const isSolved = solvedErrors[keyUnique];

                return (
                  <div className="space-y-4 h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                        <div className="flex items-center space-x-2">
                          <Cpu className="w-4 h-4 text-red-650" />
                          <span className="text-[10px] font-bold text-red-650 tracking-wider uppercase font-mono">
                            Assistente Risoluzione Codici
                          </span>
                        </div>
                        <button
                          onClick={() => toggleSolved(keyUnique)}
                          className={`px-3 py-1 rounded text-[10px] font-mono font-bold transition flex items-center space-x-1.5 border cursor-pointer ${
                            isSolved 
                              ? "bg-green-100 text-green-700 border-green-300"
                              : "bg-white text-slate-650 border-gray-200 hover:bg-gray-100 hover:text-slate-800"
                          }`}
                        >
                          {isSolved ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Segnato come risolto</span>
                            </>
                          ) : (
                            <span>Segna risoluzione</span>
                          )}
                        </button>
                      </div>

                      {/* Error details summary */}
                      <div className="bg-white p-3.5 rounded-lg border border-gray-200 mt-4 shadow-sm">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">Segnalazione Selezionata</span>
                        <h4 className="font-bold text-slate-800 text-base font-mono mt-0.5">Codice {target.code}</h4>
                        <p className="text-xs text-slate-600 mt-1 leading-normal font-medium">{target.description}</p>
                      </div>

                      {/* Step by step guides */}
                      {guide ? (
                        <div className="mt-5 space-y-4 text-left">
                          <div>
                            <h5 className="text-xs font-extrabold uppercase tracking-wide font-mono text-slate-800 flex items-center space-x-1.5 border-b border-gray-200 pb-1.5">
                              <Wrench className="w-3.5 h-3.5 text-red-650" />
                              <span>{guide.title}</span>
                            </h5>
                            <p className="text-[11px] text-slate-500 mt-1">
                              Segui rigorosamente queste indicazioni tecniche prima dello smontaggio:
                            </p>
                          </div>

                          <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-700 bg-white p-3.5 rounded border border-gray-200 shadow-sm">
                            {guide.steps.map((step, idx) => (
                              <li key={idx} className="leading-relaxed pl-1.5 text-slate-600 font-medium">
                                <span className="font-sans text-slate-700">{step}</span>
                              </li>
                            ))}
                          </ol>

                          <div className="flex flex-wrap gap-1.5 pt-2">
                            <span className="text-[10px] text-slate-400 font-mono py-1">Strumenti:</span>
                            {guide.toolsNeeded.map((t, idx) => (
                              <span key={idx} className="bg-gray-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-mono border border-gray-300 shadow-sm font-semibold">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-5 py-6 px-4 bg-white rounded-lg border border-dashed border-gray-200 text-center space-y-2 shadow-sm">
                          <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
                          <h5 className="text-xs font-bold text-slate-600 uppercase font-mono">Nessuna procedura predefinita</h5>
                          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                            Questo specifico codice di errore Kyocera non fa parte dei diagnostici standard. Ti consigliamo di procedere contattando un tecnico autorizzato o consultando il manuale.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-gray-200 text-[10px] text-slate-500 flex items-center space-x-2 font-medium">
                      <BookOpen className="w-4 h-4 flex-shrink-0 text-red-650" />
                      <span>Note di servizio: Scollegare l'interruttore della multifunzione Kyocera prima di ispezionare il fusore o i rulli di prelievo.</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Advanced diagnostics reference panel */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Dizionario Rapido delle Anomalie Kyocera</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div className="p-3.5 bg-gray-550 bg-gray-50 rounded-lg border border-gray-200">
            <span className="font-bold text-red-700 text-xs font-mono">Codici classe C (es. C3100)</span>
            <p className="text-xs text-slate-650 mt-1.5 leading-normal font-medium">
              Errori di chiamata assistenza tecnica (Call Service). Possono riguardare alimentatori, ventole estrattrici, o temperatura anomala del telaio fusione (fuser).
            </p>
          </div>
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200">
            <span className="font-bold text-amber-600 text-xs font-mono">Codici classe J (es. J1100)</span>
            <p className="text-xs text-slate-650 mt-1.5 leading-normal font-medium">
              Inceppamenti carta (Jam). Spostamento incompleto dei fogli nei cassetti o rulli sporchi. Facili da risolvere estraendo e pulendo i rulli.
            </p>
          </div>
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200">
            <span className="font-bold text-cyan-600 text-xs font-mono">Codici classe U (es. U0100)</span>
            <p className="text-xs text-slate-650 mt-1.5 leading-normal font-medium">
              Anomalie di comunicazione. Rete instabile, firmware non allineato con il sistema operativo del server di stampa locale.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
