import { 
  FileText, 
  Layers, 
  Info, 
  TrendingUp, 
  Activity,
  TreePine,
  Maximize2
} from "lucide-react";
import { KyoceraReport } from "../types";

interface PaperProps {
  report: KyoceraReport | null;
}

export default function ConsumoCarta({ report }: PaperProps) {
  if (!report) return null;

  const { total, a4Total, a3Total, monoTotal, colorTotal } = report.counters;

  const a4Percent = total > 0 ? Math.round((a4Total / total) * 100) : 0;
  const a3Percent = total > 0 ? Math.round((a3Total / total) * 100) : 0;

  const monoPercent = total > 0 ? Math.round((monoTotal / total) * 105) > 100 ? Math.round((monoTotal / total) * 100) : Math.round((monoTotal / total) * 100) : 0;
  const colorPercent = 100 - monoPercent;

  // Tree conservation metrics simulation inside bento card:
  // 1 standard wood tree yields about 8333 sheets of paper.
  const treesConsumed = parseFloat((total / 8333).toFixed(2));

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-pink-500" />
              <span>Analisi dei Volumi Carta e Ripartizione Formati</span>
            </h3>
            <p className="text-xs text-slate-550 mt-1">
              Registro volumetrico dei fogli stampati suddivisi per formato A4/A3 e profilo cromatico
            </p>
          </div>
          <div className="mt-3 sm:mt-0 text-xs text-slate-600 border border-gray-200 px-3 py-1.5 rounded-lg bg-gray-50 font-mono font-semibold">
            Totale Pagine stampate: {total.toLocaleString("it-IT")}
          </div>
        </div>

        {/* Paper Volume Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Formats Ratio: A4 vs A3 */}
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono flex items-center justify-between">
              <span>Formato Dimensione Carta</span>
              <Maximize2 className="w-4 h-4 text-cyan-600" />
            </h4>

            {/* A4 vs A3 progress indicators */}
            <div className="space-y-4 pt-3">
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-semibold">
                  <span className="text-slate-700 font-mono text-[11px] uppercase">[A4] Standard</span>
                  <span className="font-mono text-cyan-650">
                    {a4Total.toLocaleString("it-IT")} ({a4Percent}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full rounded-full transition-all duration-1000" style={{ width: `${a4Percent}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-semibold">
                  <span className="text-slate-700 font-mono text-[11px] uppercase">[A3] Tabloid/Registri</span>
                  <span className="font-mono text-purple-650">
                    {a3Total.toLocaleString("it-IT")} ({a3Percent}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full transition-all duration-1000" style={{ width: `${a3Percent}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 text-[11px] text-slate-500 leading-normal">
              Il consumo di fogli A3 ha una tariffa differente (solitamente equivalente al doppio di un foglio A4) per molti contratti di noleggio a canone assistito.
            </div>
          </div>

          {/* Color Profiles Ratio: B/W vs Color */}
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono flex items-center justify-between">
              <span>Ripartizione CROMATICA</span>
              <Activity className="w-4 h-4 text-pink-500" />
            </h4>

            <div className="space-y-4 pt-3">
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-semibold">
                  <span className="text-slate-700 font-mono text-[11px] uppercase">Monocromatico (B/N)</span>
                  <span className="font-mono text-slate-500">
                    {monoTotal.toLocaleString("it-IT")} ({monoPercent}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-slate-400 h-full rounded-full transition-all duration-1000" style={{ width: `${monoPercent}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-semibold">
                  <span className="text-slate-700 font-mono text-[11px] uppercase">Stampe a Colori</span>
                  <span className="font-mono text-pink-600">
                    {colorTotal.toLocaleString("it-IT")} ({colorPercent}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-pink-500 h-full rounded-full transition-all duration-1000" style={{ width: `${colorPercent}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 text-[11px] text-slate-500 leading-normal">
              Monitorare attentamente la quota a Colori permette di evitare addebiti elevati sul costo copia (color click pricing).
            </div>
          </div>

          {/* Environmental Tree conserving Metric */}
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono flex items-center justify-between">
                <span>Impronta Ecologica</span>
                <TreePine className="w-4 h-4 text-green-600" />
              </h4>

              <div className="text-center pt-5">
                <span className="text-5xl font-extrabold text-green-650 tracking-tight">
                  {treesConsumed}
                </span>
                <p className="text-xs text-slate-550 mt-2 font-mono uppercase tracking-wider font-semibold">
                  Alberi equivalenti impiegati
                </p>
                <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
                  L'attività di questa periferica ha assorbito circa {treesConsumed} alberi di cellulosa per la produzione di carta per ufficio standard.
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-3 mt-4 text-[10px] text-slate-400 font-mono text-center">
              * Stima basata sui parametri della Environmental Paper Network.
            </div>
          </div>
        </div>
      </div>

      {/* Sustainability Advice and Double-Sided Usage */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-green-700 font-mono uppercase tracking-wider block">
            Best Practice di Sostenibilità
          </span>
          <h4 className="text-sm font-bold text-slate-800">Come ottimizzare il consumo di cellulosa flotta</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Consigliamo di forzare il driver di stampa predefinito su <b>Fronte/Retro (Duplex)</b> per dimezzare l'acquisto di fogli di carta e diminuire la carica statica sui rulli, prolungando la vita dell'unità duplex della stampante Kyocera.
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center space-x-4">
          <div className="w-12 h-12 bg-red-50 text-red-700 border border-red-200 rounded-full flex items-center justify-center font-bold font-mono text-sm flex-shrink-0">
            {monoPercent < 70 ? "COL" : "B/N"}
          </div>
          <div>
            <h5 className="font-semibold text-slate-800 text-xs uppercase tracking-wider font-mono">Profilo d'utilizzo flotta</h5>
            <p className="text-xs text-slate-600 mt-1">
              {monoPercent < 70 
                ? "Questo ufficio fa un uso intensivo del colore. Consigliamo di definire delle policy ACL (Access Control List) sulle multifunzioni Kyocera per limitare le stampe colore ai soli reparti marketing/grafica."
                : "Uso della stampante orientato principalmente alla documentazione amministrativa interna e contrattualistica. Profilo di costo efficiente."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
