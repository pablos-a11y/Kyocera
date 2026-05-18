import React, { useState, useRef, useEffect } from "react";
import { 
  BookOpen, 
  Send, 
  Sparkles, 
  HelpCircle, 
  MessageSquare, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Printer,
  FileQuestion,
  Trash2,
  Clock
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

const SUGGESTED_QUESTIONS = [
  {
    title: "Errore 1102 SMB",
    desc: "Come si risolve il codice di errore 1102 nell'invio?",
    prompt: "Come posso risolvere l'errore con codice 1102 quando provo a fare una scansione su cartella condivisa SMB?"
  },
  {
    title: "Password Amministratore",
    desc: "Quali sono le credenziali di fabbrica amministratore?",
    prompt: "Quali sono le credenziali di default dell'amministratore (Username e Password) per accedere al Menu Sistema o a Command Center RX?"
  },
  {
    title: "Inceppamento Lettera 'H'",
    desc: "Cosa indica la segnalazione con lettera H?",
    prompt: "Cosa significa la segnalazione di inceppamento con la lettera 'H' sul display e quali passi devo seguire per risolverlo?"
  },
  {
    title: "Specifiche TASKalfa 5053ci",
    desc: "Velocità, riscaldamento e capienza carta.",
    prompt: "Quali sono le specifiche tecniche esatte della stampante Kyocera TASKalfa 5053ci (pagine al minuto, tempo di riscaldamento, capacità dei cassetti carta)?"
  }
];

export default function ManualeChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Ciao! Sono il tuo Assistente Virtuale Kyocera. Ho studiato integralmente il manuale d'uso ufficiale della stampante multifunzione **Kyocera TASKalfa 5053ci**.\n\nPuoi chiedermi qualsiasi informazione desumibile dal manuale, ad esempio:\n* Risoluzione di problemi di invio scansione (es. **Errore 1101**, **1102** o **1103**)\n* Significato delle lettere di diagnostica inceppamento carta (es. **Lettera A, H, M, ecc.**)\n* Credenziali ed indirizzi di fabbrica\n* Dati tecnici e capacità dei cassetti carta\n\nCome posso aiutarti oggi?",
      timestamp: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isQuotaError, setIsQuotaError] = useState(false);
  const [quotaCountdown, setQuotaCountdown] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quota countdown effect
  useEffect(() => {
    if (quotaCountdown > 0) {
      const timer = setTimeout(() => {
        setQuotaCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [quotaCountdown]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (questionText: string) => {
    if (!questionText.trim()) return;
    if (quotaCountdown > 0) return; // Prevent sending during cooldown
    
    setErrorMsg(null);
    setIsQuotaError(false);
    
    const userMessageTime = new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
    const newUserMsg: Message = {
      id: "msg-" + Math.random().toString(36).substr(2, 9),
      role: "user",
      text: questionText,
      timestamp: userMessageTime
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Map history to the required role format
      const historyPayload = messages.slice(1).map(msg => ({
        role: msg.role === "user" ? "user" : "model",
        text: msg.text
      }));

      const response = await fetch("/api/ask-manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question: questionText,
          history: historyPayload
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429 || errorData.quotaExceeded) {
          throw new Error(`QUOTA_EXCEEDED|${errorData.details || errorData.error}`);
        }
        throw new Error(errorData.error || "Errore nella comunicazione con il server.");
      }

      const data = await response.json();
      
      const assistantMessageTime = new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
      setMessages(prev => [...prev, {
        id: "msg-" + Math.random().toString(36).substr(2, 9),
        role: "assistant",
        text: data.answer,
        timestamp: assistantMessageTime
      }]);
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "";
      if (msg.startsWith("QUOTA_EXCEEDED|")) {
        setIsQuotaError(true);
        setQuotaCountdown(15);
        setErrorMsg(msg.substring("QUOTA_EXCEEDED|".length));
      } else {
        setErrorMsg(msg || "Si è verificato un errore imprevisto.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (confirm("Vuoi davvero azzerare la conversazione?")) {
      setMessages([
        {
          id: "welcome-reset",
          role: "assistant",
          text: "Conversazione azzerata. Chiedimi pure qualsiasi dubbio sul manuale operativo della Kyocera TASKalfa 5053ci!",
          timestamp: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
        }
      ]);
      setErrorMsg(null);
    }
  };

  // Basic custom Markdown parser to make standard markup look phenomenal in the chat
  const renderFormattedText = (text: string) => {
    return text.split("\n").map((line, idx) => {
      // Check if it's an un-ordered list item
      if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
        const cleaned = line.replace(/^[\s*-]+/, "").trim();
        return (
          <li key={idx} className="list-disc list-inside ml-4 text-xs text-slate-700 leading-relaxed my-1 font-sans">
            {parseInlineStyling(cleaned)}
          </li>
        );
      }
      
      // Check if it's a numbered list item
      const numMatch = line.trim().match(/^(\d+)\.\s+(.*)$/);
      if (numMatch) {
         return (
           <div key={idx} className="pl-4 text-xs text-slate-700 leading-relaxed my-1 font-sans">
             <span className="font-bold text-red-650 mr-1.5">{numMatch[1]}.</span>
             {parseInlineStyling(numMatch[2])}
           </div>
         );
      }

      // Check if it's a main title or separator
      if (line.trim().startsWith("###")) {
        return (
          <h4 key={idx} className="text-xs font-bold font-mono tracking-tight uppercase text-slate-850 mt-3 mb-1.5 border-b border-gray-150 pb-0.5">
            {parseInlineStyling(line.replace(/^###+/, "").trim())}
          </h4>
        );
      }

      return (
        <p key={idx} className="text-xs text-slate-700 leading-relaxed font-sans mb-1.5">
          {parseInlineStyling(line)}
        </p>
      );
    });
  };

  const parseInlineStyling = (linePart: string) => {
    // Escape standard line markup for bold **text** and code blocks `code`
    const parts = [];
    let temp = linePart;

    // Split on bold/code tags sequence
    const regex = /(\*\*.*?\*\*|`.*?`)/g;
    const items = temp.split(regex);

    return items.map((partValue, i) => {
      if (partValue.startsWith("**") && partValue.endsWith("**")) {
        return (
          <strong key={i} className="font-bold text-slate-900 bg-red-50/50 px-1 rounded border border-red-100/30">
            {partValue.slice(2, -2)}
          </strong>
        );
      }
      if (partValue.startsWith("`") && partValue.endsWith("`")) {
        return (
          <code key={i} className="bg-slate-100 text-red-600 px-1.5 py-0.5 rounded font-mono text-[11px] border border-slate-205">
            {partValue.slice(1, -1)}
          </code>
        );
      }
      return partValue;
    });
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      
      {/* Suggestions column (bento grid item) */}
      <div className="xl:col-span-1 space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4 text-left">
          <div className="flex items-center space-x-2 text-red-650">
            <span className="p-1.5 bg-red-50 rounded-lg text-red-650">
              <BookOpen className="w-4 h-4" />
            </span>
            <h3 className="text-xs font-bold text-slate-800 font-mono uppercase tracking-wider">
              Documentazione Modello
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Interroga l'AI addestrata sulla <strong>Guida alle Funzioni Kyocera TASKalfa 5053ci</strong>. 
            Perfetto per risolvere all'istante allarmi hardware, diagnosticare inceppamenti o richiamare parametri amministratore.
          </p>

          <div className="border-t border-gray-150 pt-4 space-y-2">
            <h4 className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest mb-2">
              Domande Suggerite
            </h4>
            
            <div className="space-y-2.5">
              {SUGGESTED_QUESTIONS.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSend(item.prompt)}
                  disabled={isLoading}
                  className="w-full text-left p-3.5 bg-slate-50 hover:bg-red-50/40 border border-slate-150 hover:border-red-200 rounded-xl transition-all shadow-3xs group flex items-start space-x-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="w-4 h-4 rounded-full bg-slate-100 group-hover:bg-red-50 flex items-center justify-center text-[10px] font-bold text-slate-400 group-hover:text-red-600 flex-shrink-0 mt-0.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </span>
                  <div className="space-y-0.5">
                    <div className="text-[11px] font-bold text-slate-800 group-hover:text-red-700 transition">
                      {item.title}
                    </div>
                    <div className="text-[10px] text-slate-450 leading-tight">
                      {item.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Diagnostic helper card */}
        <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 text-left space-y-3 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Printer className="w-24 h-24 transform translate-x-4 -translate-y-4" />
          </div>
          <div className="flex items-center space-x-2 text-red-500">
            <span className="p-1 px-1.5 bg-red-950/60 rounded text-red-400 font-mono text-[10px] uppercase font-bold tracking-wider">
              Diagnostica Rapida
            </span>
          </div>
          <h4 className="text-xs font-bold text-slate-100 font-mono">
            Usa le lettere di codice
          </h4>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Se ricevi un errore come inceppamento, chiedi esplicitamente della lettera visualizzata sul display per saltare i manuali di carta. Es: <code className="bg-slate-800 text-red-400 font-mono px-1 rounded">Lettera H</code> corrisponde al coperchio destro (gruppo fissaggio).
          </p>
        </div>
      </div>

      {/* Main Chat Interface (colspan 3) */}
      <div className="xl:col-span-3 flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm h-[600px] overflow-hidden">
        
        {/* Chat Header */}
        <div className="border-b border-gray-150 p-4 px-5 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3 text-left">
            <div className="relative">
              <span className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-sm font-mono font-bold text-base">
                K
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center" title="Assistente Attivo" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="text-xs font-bold text-slate-800 font-mono uppercase tracking-wider">
                  Kyocera AI Support
                </h3>
                <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wide">
                  On-Manual
                </span>
              </div>
              <p className="text-[10px] text-slate-450">
                Pronto per domande d'aiuto operative sul modello TASKalfa 5053ci
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClearChat}
            className="flex items-center space-x-1 text-slate-400 hover:text-red-600 transition p-1.5 rounded-lg hover:bg-gray-100 text-xs font-semibold cursor-pointer"
            title="Azzera conversazione"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Azzera Chat</span>
          </button>
        </div>

        {/* Chat message list area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/20">
          
          {messages.map((message) => {
            const isAss = message.role === "assistant";
            return (
              <div
                key={message.id}
                className={`flex ${isAss ? "justify-start" : "justify-end"} text-left animate-fadeIn`}
              >
                <div 
                  className={`flex items-start gap-3 max-w-[85%] ${isAss ? "flex-row" : "flex-row-reverse"}`}
                >
                  {/* Avatar */}
                  <span className={`w-8 h-8 rounded-lg font-mono font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-3xs ${
                    isAss ? "bg-red-650 text-white" : "bg-slate-700 text-slate-100"
                  }`}>
                    {isAss ? "Ky" : "Tu"}
                  </span>

                  {/* Message Bubble wrapper */}
                  <div className="space-y-1">
                    <div className={`p-4 rounded-2xl ${
                      isAss 
                        ? "bg-white border border-gray-150 text-slate-800 shadow-3xs rounded-tl-none" 
                        : "bg-red-650 text-white rounded-tr-none text-xs leading-relaxed shadow-sm font-sans"
                    }`}>
                      {isAss ? (
                        <div className="space-y-1">{renderFormattedText(message.text)}</div>
                      ) : (
                        <p>{message.text}</p>
                      )}
                    </div>
                    {/* Timestamp */}
                    <div className={`text-[9px] text-slate-400 px-1 font-mono ${isAss ? "text-left" : "text-right"}`}>
                      {message.timestamp}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading bubble */}
          {isLoading && (
            <div className="flex justify-start text-left animate-fadeIn">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-red-650 text-white shadow-3xs flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </span>
                <div className="p-3 px-4 bg-white border border-gray-150 text-slate-500 rounded-2xl rounded-tl-none shadow-3xs text-xs italic flex items-center space-x-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                  <span>Kyocera AI sta esaminando i capitoli del manuale...</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner inside chat */}
          {errorMsg && (
            isQuotaError ? (
              <div className="bg-amber-50 border border-amber-250 rounded-xl p-4.5 text-left flex items-start space-x-3 text-amber-900 animate-fadeIn mx-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5 animate-pulse" />
                <div className="text-xs space-y-2.5 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold font-mono text-amber-850 uppercase tracking-wide">
                      Limite di Quota Raggiunto (429)
                    </span>
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-amber-200">
                      Cooldown Attivo
                    </span>
                  </div>
                  <p className="text-amber-800 leading-relaxed text-xs">
                    {errorMsg}
                  </p>
                  
                  {/* Cooldown Timer */}
                  <div className="bg-amber-100/40 p-3 rounded-lg border border-amber-200 flex items-center justify-between">
                    <span className="font-semibold text-amber-900 flex items-center space-x-1.5 font-mono text-[11px]">
                      <Clock className="w-4 h-4 animate-spin text-amber-600 mr-0.5" />
                      Sblocco automatico tra: <strong className="text-amber-950 font-mono text-xs">{quotaCountdown}s</strong>
                    </span>
                    <div className="w-24 bg-amber-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-600 h-full transition-all duration-1000" 
                        style={{ width: `${(quotaCountdown / 15) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="text-[10.5px] text-slate-500 bg-white/80 p-3 rounded-lg border border-gray-150 leading-relaxed shadow-3xs">
                    💡 <strong>Consiglio professionale:</strong> Per domande illimitate e risposte ultra-rapide dal manuale, inserisci la tua chiave API personale gratuita o a pagamento in <strong>Settings &gt; Secrets</strong> nell'editor di codice.
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-left flex items-start space-x-2 text-red-800 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs space-y-1 flex-1">
                  <div className="font-bold font-mono">Errore di comunicazione AI</div>
                  <p className="text-red-700 leading-tight">
                    {errorMsg}
                  </p>
                  <p className="text-[10px] text-slate-500 pt-1 leading-normal italic">
                    * Suggerimento: Assicurati di aver configurato una chiave valida nel pannello Settings, o prova a rieseguire la richiesta.
                  </p>
                </div>
              </div>
            )
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input panel */}
        <div className="border-t border-gray-150 p-4 bg-slate-50/50">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex items-center space-x-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading || quotaCountdown > 0}
              placeholder={
                quotaCountdown > 0
                  ? `Raffreddamento in corso... attendi ${quotaCountdown}s`
                  : "Chiedi pure: 'Come risolvo il codice di aggancio 1102?' o 'Cosa significa la lettera H?'..."
              }
              className="flex-1 bg-white border border-gray-200 hover:border-gray-300 focus:border-red-400 focus:ring-1 focus:ring-red-100 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 transition-all font-sans outline-hidden shadow-2xs focus:shadow-xs disabled:opacity-60"
            />
            
            <button
              type="submit"
              disabled={!input.trim() || isLoading || quotaCountdown > 0}
              className="px-4.5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition shadow-sm hover:shadow flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs flex-shrink-0"
              title="Invia domanda"
            >
              <span>{quotaCountdown > 0 ? `Attendi (${quotaCountdown}s)` : "Chiedi AI"}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-mono px-1">
            <span>TASKalfa 5053ci Manual Q&A Console</span>
            <span className="flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-red-500 inline mr-0.5 animate-pulse" />
              <span>Grounded by Gemini 3.0</span>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
