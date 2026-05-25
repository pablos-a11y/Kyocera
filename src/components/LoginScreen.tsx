import React, { useState } from "react";
import { Lock, User, Eye, EyeOff, KeyRound, AlertCircle, ShieldAlert } from "lucide-react";

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Inserisci sia l'username che la password.");
      return;
    }

    setIsLoading(true);

    // Simulate a brief secure check for a premium feel
    setTimeout(() => {
      if (username === "admin" && password === "pippo123") {
        localStorage.setItem("kyocera_auth", "true");
        onLoginSuccess();
      } else {
        setError("Credenziali non corrette. Riprova.");
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 select-none relative overflow-hidden font-sans">
      {/* Visual background details to establish an immersive tech aesthetic */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-red-650 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-slate-500 blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-top-4 duration-300 z-10">
        
        {/* Logo and Greeting Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-650 rounded-2xl flex items-center justify-center text-white font-extrabold shadow-lg shadow-red-950/20 mx-auto mb-4">
            <span className="text-3xl font-black">K</span>
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight uppercase font-mono">
            Kyocera <span className="text-red-500">Analyzer</span> Plus
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Area riservata per l'analisi dei consumi e della diagnostica stampanti
          </p>
        </div>

        {/* Credentials Form Box */}
        <div className="bg-slate-950/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-800/80">
            <KeyRound className="w-4 h-4 text-red-500" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              Accesso Autenticato
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username Input Field */}
            <div className="space-y-1.5">
              <label 
                htmlFor="username-input" 
                className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono"
              >
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  id="username-input"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="Inserisci l'username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 focus:border-red-650 focus:ring-1 focus:ring-red-650/40 rounded-xl text-xs text-white placeholder-slate-600 transition outline-none"
                />
              </div>
            </div>

            {/* Password Input Field */}
            <div className="space-y-1.5">
              <label 
                htmlFor="password-input" 
                className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Inserisci la password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-10 pr-10 py-3 bg-slate-900 border border-slate-800 focus:border-red-650 focus:ring-1 focus:ring-red-650/40 rounded-xl text-xs text-white placeholder-slate-600 transition outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-305 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message Section */}
            {error && (
              <div className="bg-red-950/40 border border-red-900/40 text-red-200 px-3.5 py-3 rounded-xl text-xs leading-relaxed flex items-start space-x-2.5 animate-in fade-in zoom-in-95 duration-200">
                <AlertCircle className="w-4.5 h-4.5 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Control Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 text-xs font-bold text-white uppercase tracking-wider font-mono rounded-xl transition cursor-pointer flex items-center justify-center space-x-2 ${
                isLoading 
                  ? "bg-red-800/50 text-slate-300" 
                  : "bg-red-600 hover:bg-red-700 active:scale-[0.98] shadow-lg shadow-red-900/20"
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Verifica in corso...</span>
                </>
              ) : (
                <span>Accedi</span>
              )}
            </button>
          </form>

          {/* Secure Workspace Note Banner */}
          <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-800/60 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-500 font-sans leading-normal">
              Questo portale è riservato esclusivamente al personale autorizzato. I tentativi di accesso non autorizzato sono registrati.
            </p>
          </div>
        </div>

        {/* Bottom system footer details */}
        <p className="text-center text-[10px] text-slate-600 font-mono mt-6">
          SISTEMA DI DIAGNOSTICA PROTETTO — COGNITIVE SECURITY PORTAL
        </p>
      </div>
    </div>
  );
}
