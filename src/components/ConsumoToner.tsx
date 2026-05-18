import { 
  AlertOctagon, 
  CheckCircle, 
  TrendingDown, 
  Calendar, 
  Sparkles,
  RefreshCw,
  Droplet
} from "lucide-react";
import { KyoceraReport } from "../types";

interface TonerProps {
  report: KyoceraReport | null;
}

export default function ConsumoToner({ report }: TonerProps) {
  if (!report) return null;

  const toners = [
    {
      name: "Nero",
      key: "black" as const,
      colorClass: "bg-slate-900 border-slate-750",
      textColor: "text-slate-900",
      fluidColor: "#1e293b",
      percentage: report.tonerLevels.black,
      supported: true
    },
    {
      name: "Ciano",
      key: "cyan" as const,
      colorClass: "bg-cyan-500",
      textColor: "text-cyan-650",
      fluidColor: "#06b6d4",
      percentage: report.tonerLevels.cyan,
      supported: report.tonerLevels.cyan !== null
    },
    {
      name: "Magenta",
      key: "magenta" as const,
      colorClass: "bg-pink-500",
      textColor: "text-pink-650",
      fluidColor: "#ec4899",
      percentage: report.tonerLevels.magenta,
      supported: report.tonerLevels.magenta !== null
    },
    {
      name: "Giallo",
      key: "yellow" as const,
      colorClass: "bg-yellow-400",
      textColor: "text-yellow-600",
      fluidColor: "#eab308",
      percentage: report.tonerLevels.yellow,
      supported: report.tonerLevels.yellow !== null
    }
  ];

  // Logic to calculate estimated pages left based on 5% coverage
  const calculatePagesRemaining = (percentage: number, color: string) => {
    // Standard Kyocera toner page yields:
    const baseYield = color === "Nero" ? 12000 : 7500;
    return Math.max(0, Math.floor((percentage / 100) * baseYield));
  };

  const lowToners = toners.filter(t => t.supported && t.percentage !== null && t.percentage <= 20);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
              <Droplet className="w-5 h-5 text-cyan-600" />
              <span>Stato e Livelli delle Cartucce Toner Kyocera</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Rilevamento in tempo reale dei consumi cartuccia estratti dal foglio di stato
            </p>
          </div>
          <div className="mt-3 sm:mt-0 text-xs text-slate-600 border border-gray-200 px-3 py-1.5 rounded-lg bg-gray-50 font-mono font-semibold">
            Modello: {report.printerModel}
          </div>
        </div>

        {/* Low Toner Alerts Box if any */}
        {lowToners.length > 0 ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3 text-red-800 mb-6">
            <AlertOctagon className="w-5 h-5 text-red-650 mt-0.5 flex-shrink-0 animate-pulse" />
            <div className="space-y-1">
              <h5 className="text-xs font-bold uppercase tracking-wider font-mono text-red-900">Allarme Sostituzione Toner Imminente!</h5>
              <p className="text-xs text-red-850 leading-normal">
                I seguenti colori sono scesi sotto la soglia di sicurezza del 20%:{" "}
                <span className="font-bold text-red-950">
                  {lowToners.map(t => `${t.name} (${t.percentage}%)`).join(", ")}
                </span>.
                Si consiglia di ordinare preventivamente le cartucce Kyocera TK originali per evitare fermi macchina.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start space-x-3 text-green-800 mb-6">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <h5 className="text-xs font-bold uppercase tracking-wider font-mono text-green-900">Autonomia Consumabili Operativa</h5>
              <p className="text-xs text-green-700">
                Tutte le unità toner dispongono di un livello adeguato alle attività ordinarie di ufficio. Nessuna sostituzione immediata richiesta.
              </p>
            </div>
          </div>
        )}

        {/* Visual Ink Wells Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {toners.map((toner) => {
            if (!toner.supported || toner.percentage === null) {
              return (
                <div key={toner.name} className="bg-gray-50 border border-gray-200 p-5 rounded-xl flex flex-col items-center justify-center text-center opacity-40">
                  <div className="w-16 h-28 border border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-500 font-mono text-[9px]">
                    N/D
                  </div>
                  <h4 className="mt-3 font-semibold text-gray-400 text-sm">{toner.name}</h4>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase font-mono">Non in uso</p>
                </div>
              );
            }

            const isLow = toner.percentage <= 20;
            const remainingPages = calculatePagesRemaining(toner.percentage, toner.name);

            return (
              <div key={toner.name} className="bg-gray-50 border border-gray-200 p-5 rounded-xl flex flex-col hover:border-slate-350 transition">
                {/* Visual Cartridge Tube */}
                <div className="flex justify-center">
                  <div className="relative w-16 h-32 bg-white rounded-lg overflow-hidden border border-gray-300 flex flex-col justify-end p-0.5 shadow-sm">
                    {/* Bottle Neck */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-2 bg-gray-200 rounded-t border-t border-l border-r border-gray-300 z-10" />
                    
                    {/* Interactive Liquid Fluid Fill */}
                    <div 
                      className={`w-full rounded transition-all duration-1000 ease-out flex items-center justify-center select-none text-[11px] font-mono font-bold text-white shadow-inner`}
                      style={{ 
                        height: `${Math.max(12, toner.percentage)}%`, 
                        backgroundColor: toner.fluidColor,
                        opacity: isLow ? 0.85 : 1,
                        boxShadow: `inset 0 4px 12px rgba(255,255,255,0.25), 0 0 8px ${toner.fluidColor}80`
                      }}
                    >
                      {toner.percentage}%
                    </div>

                    {/* Low indicator warning inside tube */}
                    {isLow && (
                      <div className="absolute top-8 left-0 right-0 text-center animate-pulse">
                        <span className="text-[9px] bg-red-650 text-white rounded px-1 py-0.5 font-bold font-mono">
                          LOW
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Toner Info Details */}
                <div className="mt-5 text-center">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center justify-center space-x-1">
                    <span className={`w-2.5 h-2.5 rounded-full inline-block ${toner.name === "Nero" ? "bg-slate-900 border border-slate-700" : toner.colorClass}`} />
                    <span>Toner {toner.name}</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">
                    Valore: <span className="text-slate-800 font-bold">{toner.percentage}%</span>
                  </p>

                  <div className="mt-4 pt-3 border-t border-gray-200 text-left space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-mono">Autonomia pag.</span>
                      <span className="text-slate-700 font-mono font-bold">
                        ~{remainingPages.toLocaleString("it-IT")}
                      </span>
                    </div>
                    
                    {/* Progress slider bar representation */}
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${isLow ? "bg-red-500" : toner.name === "Nero" ? "bg-slate-700" : toner.colorClass}`}
                        style={{ width: `${toner.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Consumption Projection Insights Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Metodologia di Calcolo</h4>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            I volumi di stampe restanti sono stimati ipotizzando una copertura del foglio del 5% (standard ISO/IEC 19752 per cartucce in bianco e nero, e ISO/IEC 19798 per cartucce a colori). Il calcolo dell'autonomia restante si basa sui codici cartuccia Kyocera originali TK di prima dotazione e sostitutivi.
          </p>
          <div className="flex items-center space-x-2 mt-4 text-[11px] text-amber-600 font-mono font-semibold">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>Consiglio: Mantieni la stampante in modalità Eco-Print per risparmiare fino al 15% di toner.</span>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-red-650 tracking-wider uppercase font-mono">
              Integrazione Flotta MPS (Kyocera Fleet)
            </span>
            <h5 className="font-semibold text-slate-800 mt-1 text-sm">Contratto di Assistenza Costo-Copia attivo?</h5>
            <p className="text-xs text-slate-550 mt-1 leading-normal">
              Se questa stampante fa parte di un contratto di noleggio a canone, le notifiche di basso livello vengono inoltrate ai nostri sistemi per l'invio automatico dei toner sostitutivi prima del blocco.
            </p>
          </div>
          
          <button 
            onClick={() => alert("Funzionalità integrata via Kyocera Fleet Manager API (Simulato). L'alert di riordino automatico è stato iscritto per questa periferica.")}
            className="mt-3 self-start text-xs font-semibold bg-white text-red-650 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded transition cursor-pointer"
          >
            Iscrivi a riordino automatico
          </button>
        </div>
      </div>
    </div>
  );
}
