import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up larger limits to accept base64-encoded PDF files
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Shared Gemini client utility
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// Simulated in-memory database of parsed reports to allow historical trends
let reportsHistory: any[] = [];

// Helper to generate real CSV string from a report object
function generateCSVString(report: any): string {
  const headers = [
    "Data_Report",
    "Modello_Stampante",
    "S_N",
    "Toner_Nero%",
    "Toner_Ciano%",
    "Toner_Magenta%",
    "Toner_Giallo%",
    "Pagine_Totali",
    "Pagine_A4",
    "Pagine_A3",
    "Pagine_B_N",
    "Pagine_Colore",
    "Codici_Errore"
  ].join(",");

  const errors = report.errorLogs.map((e: any) => e.code).join("; ") || "Nessuno";
  
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
}

// Ensure workspace directories and preloaded CSV files exist immediately at the root and under GoogleDrive_Simulated
function ensureWorkspaceDirsAndFilesExist() {
  try {
    const defaultFolder = "Kyocera_Consumables_Reports";
    const subdirs = [
      path.join(process.cwd(), defaultFolder),
      path.join(process.cwd(), "GoogleDrive_Simulated"),
      path.join(process.cwd(), "GoogleDrive_Simulated", defaultFolder)
    ];
    subdirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    reportsHistory.forEach((report) => {
      if (report.savedToDrive && report.driveFilePath) {
        const parts = report.driveFilePath.split("/");
        if (parts.length >= 2) {
          const folder = parts[0];
          const fileName = parts.slice(1).join("/");
          
          const csvContent = generateCSVString(report);

          // Write directly to the root workspace directory
          const workspaceFolder = path.join(process.cwd(), folder);
          if (!fs.existsSync(workspaceFolder)) {
            fs.mkdirSync(workspaceFolder, { recursive: true });
          }
          const workspaceFile = path.join(workspaceFolder, fileName);
          fs.writeFileSync(workspaceFile, csvContent, "utf-8");

          // Write to the simulated GoogleDrive folder
          const simFolder = path.join(process.cwd(), "GoogleDrive_Simulated", folder);
          if (!fs.existsSync(simFolder)) {
            fs.mkdirSync(simFolder, { recursive: true });
          }
          const simFile = path.join(simFolder, fileName);
          fs.writeFileSync(simFile, csvContent, "utf-8");

          console.log(`[Bootstrap Sync] Synchronized report ${report.id} CSV to workspace folder and Simulated Drive.`);
        }
      }
    });
  } catch (err) {
    console.error("[Bootstrap Sync Error]", err);
  }
}

// Execute bootstrap folder/file creation immediately
ensureWorkspaceDirsAndFilesExist();

// Health Check API
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Get reports history
app.get("/api/reports", (req, res) => {
  const sortedReports = [...reportsHistory].sort((a, b) => 
    a.reportDate.localeCompare(b.reportDate)
  );
  res.json({ reports: sortedReports });
});

// Delete a report from history
app.delete("/api/reports/:id", (req, res) => {
  const { id } = req.params;
  reportsHistory = reportsHistory.filter((r) => r.id !== id);
  res.json({ success: true });
});

// Mock Google Drive upload destination config (virtual workspace)
let connectedDriveAccount = {
  connected: false,
  email: "",
  folderName: "Kyocera_Consumables_Reports"
};

app.get("/api/drive-status", (req, res) => {
  res.json(connectedDriveAccount);
});

app.post("/api/drive-connect", (req, res) => {
  const { email, folderName } = req.body;
  connectedDriveAccount = {
    connected: true,
    email: email || "pfallilone@gmail.com",
    folderName: folderName || "Kyocera_Consumables_Reports"
  };
  res.json(connectedDriveAccount);
});

app.post("/api/drive-disconnect", (req, res) => {
  connectedDriveAccount = {
    connected: false,
    email: "",
    folderName: "Kyocera_Consumables_Reports"
  };
  res.json(connectedDriveAccount);
});

// Parse Kyocera PDF report via Gemini multimodal AI
app.post("/api/parse-pdf", async (req, res) => {
  try {
    const { pdfBase64, fileName } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({ error: "Nessun dato file ricevuto." });
    }

    if (!ai) {
      return res.status(500).json({
        error: "Il server Gemini API non è configurato. Inserisci la chiave GEMINI_API_KEY nei Secrets."
      });
    }

    // Clean base64 string (remove meta header if present)
    const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, "");

    const pdfPart = {
      inlineData: {
        mimeType: "application/pdf",
        data: base64Data
      }
    };

    const promptText = `
Sei un analista tecnico specializzato in stampanti e dispositivi multifunzione Kyocera.
Analizza accuratamente il documento PDF allegato (che può essere un foglio di stato Kyocera, una pagina di test o un report di gestione dei consumabili).
Estrai i seguenti dati nel formato JSON specificato:
1. Modello esatto del dispositivo Kyocera (es. ECOSYS M2045dn, TASKalfa 2552ci, ECOSYS P3145dn, ecc.).
2. Numero di serie se leggibile (Serial Number o S/N). Se non trovi un numero di serie, usa come default 'RF80Y15346'.
3. Livelli dei Toner rimasti in percentuale (da 0 a 100). Estrai i valori per Nero (Black/K), Ciano (Cyan/C), Magenta (Magenta/M) e Giallo (Yellow/Y). Se il dispositivo è monocromatico, valorizza solo il Nero (Black) e metti null o -1 per C, M, Y.
4. Contatori di stampa della carta (Total Counter/Pagine totali, pagine stampate in Bianco e Nero, pagine stampate a Colore, e se possibile il formato A4 vs A3). Se non sono presenti esplicitamente, calcola o distribuisci una stima ragionevole basata sui dati totali o imposta a stime proporzionali.
5. Registro degli ultimi codici di errore riscontrati (es. codici come J1100, C2000, J3102, C3100, F000, ecc.), con data/ora (se presente) e descrizione dell'errore. Determina la gravità (critical/warning/info) in base al codice dell'errore (ad esempio codici 'C' (Servizio/Fusore) sono solitamente critical, codici 'J' (Inceppamento carta) o serbatoio toner quasi esaurito sono warning).

Estrai SOLO dati reali e fedeli presenti nel report. Se le pagine A3 o i colori non sono supportati dal dispositivo, segnali correttamente a 0 o null.
La data corrente (oggi) è: 2026-05-18. Associa una data al report cercando nel testo del PDF (spesso c'è "Data report", "Ora", "Stampa foglio stato" o simili), se non trovi alcuna data usa '2026-05-18'.
`;

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [pdfPart, { text: promptText }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reportDate: {
              type: Type.STRING,
              description: "Data del report nel formato YYYY-MM-DD. Cerca riferimenti nel report o impiega la data odierna '2026-05-18' come fallback."
            },
            printerModel: {
              type: Type.STRING,
              description: "Modello esatto di stampante o multifunzione Kyocera (es. TASKalfa 3554ci)."
            },
            serialNumber: {
              type: Type.STRING,
              description: "Il numero di serie S/N del dispositivo. Se mancante usa 'RF80Y15346'."
            },
            tonerLevels: {
              type: Type.OBJECT,
              properties: {
                black: { type: Type.INTEGER, description: "Livello percentuale Toner Nero (0-100)." },
                cyan: { type: Type.INTEGER, description: "Livello percentuale Toner Ciano (0-100) o null se monocromatico." },
                magenta: { type: Type.INTEGER, description: "Livello percentuale Toner Magenta (0-100) o null se monocromatico." },
                yellow: { type: Type.INTEGER, description: "Livello percentuale Toner Giallo (0-100) o null se monocromatico." }
              },
              required: ["black"]
            },
            counters: {
              type: Type.OBJECT,
              properties: {
                total: { type: Type.INTEGER, description: "Contatore stampe totali." },
                a4Total: { type: Type.INTEGER, description: "Numero totale di stampe in formato A4." },
                a3Total: { type: Type.INTEGER, description: "Numero totale di stampe in formato A3." },
                monoTotal: { type: Type.INTEGER, description: "Se presenti, pagine totali in Bianco e Nero." },
                colorTotal: { type: Type.INTEGER, description: "Se presenti, pagine totali a Colori." }
              },
              required: ["total"]
            },
            errorLogs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  code: { type: Type.STRING, description: "Codice di errore Kyocera (es. J1100, C3100)." },
                  description: { type: Type.STRING, description: "Descrizione testuale dell'errore." },
                  dateTime: { type: Type.STRING, description: "Data/ora in cui si è verificato, se disponibile." },
                  severity: { type: Type.STRING, enum: ["critical", "warning", "info"], description: "Gravità indicativa." }
                },
                required: ["code", "description"]
              }
            }
          },
          required: ["printerModel", "tonerLevels", "counters", "errorLogs"]
        }
      }
    });

    const parsedText = response.text;
    if (!parsedText) {
      throw new Error("Il modello non ha restituito alcun testo.");
    }

    const reportData = JSON.parse(parsedText);
    
    // Add runtime attributes and save to our in-memory history
    const newReport = {
      id: "report-" + Math.random().toString(36).substr(2, 9),
      reportDate: reportData.reportDate || new Date().toISOString().split("T")[0],
      printerModel: reportData.printerModel || "Kyocera TASKalfa 3554ci",
      serialNumber: reportData.serialNumber || "RF80Y15346",
      tonerLevels: {
        black: typeof reportData.tonerLevels?.black === "number" ? reportData.tonerLevels.black : 100,
        cyan: typeof reportData.tonerLevels?.cyan === "number" ? reportData.tonerLevels.cyan : null,
        magenta: typeof reportData.tonerLevels?.magenta === "number" ? reportData.tonerLevels.magenta : null,
        yellow: typeof reportData.tonerLevels?.yellow === "number" ? reportData.tonerLevels.yellow : null,
      },
      counters: {
        total: reportData.counters?.total || 1000,
        a4Total: reportData.counters?.a4Total || Math.floor((reportData.counters?.total || 1000) * 0.9),
        a3Total: reportData.counters?.a3Total || Math.floor((reportData.counters?.total || 1000) * 0.1),
        monoTotal: reportData.counters?.monoTotal || Math.floor((reportData.counters?.total || 1000) * 0.6),
        colorTotal: reportData.counters?.colorTotal || Math.floor((reportData.counters?.total || 1000) * 0.4),
      },
      errorLogs: Array.isArray(reportData.errorLogs) ? reportData.errorLogs : [],
      savedToDrive: false
    };

    // Save of newly uploaded report to simulation history
    reportsHistory.push(newReport);

    res.json({
      success: true,
      report: newReport,
      rawGeminiResult: parsedText
    });
  } catch (error: any) {
    console.error("Errore durante l'elaborazione del PDF:", error);
    res.status(500).json({
      error: error.message || "Si è verificato un errore nel parsing dell'IA."
    });
  }
});

// Endpoint to simulate saving a CSV to Google Drive
app.post("/api/save-drive", (req, res) => {
  const { reportId, csvContent, customFileName } = req.body;

  const report = reportsHistory.find((r) => r.id === reportId);
  if (!report) {
    return res.status(404).json({ error: "Report non trovato" });
  }

  const nameOfFile = customFileName || `Kyocera_Report_${report.printerModel.replace(/\s+/g, "_")}_${report.reportDate}.csv`;
  const virtualPath = `${connectedDriveAccount.folderName}/${nameOfFile}`;

  report.savedToDrive = true;
  report.driveFilePath = virtualPath;

  // Let's also update any matches in reportsHistory
  reportsHistory = reportsHistory.map((r) => {
    if (r.id === reportId) {
      return { ...r, savedToDrive: true, driveFilePath: virtualPath };
    }
    return r;
  });

  // Generate real CSV content to save to disk
  const fullCsvContent = generateCSVString(report);

  // Make sure both Workspace and Simulated Drive directories exist and write physical CSV files for transparency!
  try {
    // 1. Write to workspace root folder (directly visible in the workspace list)
    const workspaceFolder = path.join(process.cwd(), connectedDriveAccount.folderName);
    if (!fs.existsSync(workspaceFolder)) {
      fs.mkdirSync(workspaceFolder, { recursive: true });
    }
    const workspaceFile = path.join(workspaceFolder, nameOfFile);
    fs.writeFileSync(workspaceFile, fullCsvContent, "utf-8");

    // 2. Write to the simulated Google Drive folder
    const parentDir = path.join(process.cwd(), "GoogleDrive_Simulated");
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    const targetFolder = path.join(parentDir, connectedDriveAccount.folderName);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }
    const fullFilePath = path.join(targetFolder, nameOfFile);
    fs.writeFileSync(fullFilePath, fullCsvContent, "utf-8");
    console.log(`[Google Drive Sim] File CSV salvato correttamente su disk in entrambi i percorsi: ${workspaceFile} e ${fullFilePath}`);
  } catch (fsErr) {
    console.error("Integrazione Google Drive error: Impossibile scrivere file su disk", fsErr);
  }

  res.json({
    success: true,
    message: "File salvato con successo!",
    accountEmail: connectedDriveAccount.email,
    folder: connectedDriveAccount.folderName,
    fileName: nameOfFile,
    path: virtualPath,
    previewUrl: `/api/drive-download/${reportId}`
  });
});

// Real download endpoint to get the serialized CSV
app.get("/api/drive-download/:reportId", (req, res) => {
  const { reportId } = req.params;
  const report = reportsHistory.find((r) => r.id === reportId);
  if (!report) {
    return res.status(404).send("Report non trovato.");
  }

  const nameOfFile = `Kyocera_Report_${report.printerModel.replace(/\s+/g, "_")}_${report.reportDate}.csv`;

  const fullCsvContent = generateCSVString(report);

  res.setHeader("Content-Disposition", `attachment; filename="${nameOfFile}"`);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.send(fullCsvContent);
});

// Endpoint per porre domande sul manuale della stampante Kyocera TASKalfa 5053ci
app.post("/api/ask-manual", async (req, res) => {
  try {
    const { question, history } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Nessuna domanda inserita." });
    }

    if (!ai) {
      return res.status(500).json({
        error: "Il server Gemini API non è configurato. Inserisci la chiave GEMINI_API_KEY nei Secrets del pannello Settings."
      });
    }

    // Carica il contesto dal file del manuale
    const manualContextPath = path.join(process.cwd(), "Kyocera_TASKalfa_manual_context.txt");
    let manualContext = "";
    if (fs.existsSync(manualContextPath)) {
      manualContext = fs.readFileSync(manualContextPath, "utf-8");
    } else {
      manualContext = "Nessuna documentazione manuale disponibile sul server.";
    }

    // Costruisci il prompt di istruzione di sistema per blindare le risposte sul contesto del manuale
    const systemInstruction = `Sei l'Assistente Tecnico Virtuale ufficiale Kyocera per la stampante TASKalfa 5053ci ed altri modelli della stessa serie. 
Il tuo unico scopo è assistere gli utenti fornendo risposte estremamente accurate, professionali e cordiali in lingua italiana basate UNICAMENTE sulla documentazione ufficiale d'uso della stampante fornita qui sotto.

IMPORTANTE: 
1. Se la risposta ad una domanda NON è rintracciabile nella documentazione fornita, non inventarla o presumere nulla: di' espressamente ed in modo cortese che l'informazione non è presente nel manuale d'uso in tuo possesso e suggerisci di consultare un tecnico autorizzato o il portale Kyocera Document Solutions.
2. Formatta la tua risposta in Markdown chiaro e leggibile (usa elenchi puntati, grassetti, tabelle o sezioni dove opportuno).
3. Sii cordiale e molto professionale.

DOCUMENTAZIONE MANUALE KYOCERA:
${manualContext}`;

    // Costruisci l'array di parti per la request a Gemini 3.0 secondo le linee guida
    const contents: any[] = [];
    contents.push({ text: `Istruzioni di sistema: ${systemInstruction}` });

    // Gestione della cronologia della chat se inviata dal client
    if (Array.isArray(history)) {
      history.forEach((turn: any) => {
        contents.push({
          text: `${turn.role === "user" ? "Utente" : "Assistente"}: ${turn.content || turn.text}`
        });
      });
    }

    contents.push({ text: `Domanda attuale dell'utente: ${question}` });

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest", // Modello consigliato per compiti generici di Q&A
      contents: contents,
    });

    const answer = response.text || "Non sono riuscito a generare una risposta valida per questa domanda.";

    res.json({
      success: true,
      answer: answer
    });
  } catch (err: any) {
    console.error("Errore nell'endpoint /api/ask-manual:", err);
    
    const errorStr = err?.message || String(err);
    const isQuotaExceeded = errorStr.includes("RESOURCE_EXHAUSTED") || 
                            errorStr.includes("429") || 
                            errorStr.toLowerCase().includes("quota") ||
                            errorStr.toLowerCase().includes("limit") ||
                            errorStr.toLowerCase().includes("rate limit");
    
    if (isQuotaExceeded) {
      return res.status(429).json({
        success: false,
        quotaExceeded: true,
        error: "Quota API esaurita / Limite raggiunto (Errore 429 - RESOURCE_EXHAUSTED)",
        details: "Gentile utente, hai superato il limite di richieste contemporanee o totali previste per la chiave API gratuita di Gemini sul server d'anteprima. Attendi circa 15 secondi prima di riprovare, oppure configura una tua chiave API abilitata alla fatturazione nel pannello 'Settings > Secrets' per eliminare qualsiasi limite."
      });
    }

    res.status(500).json({
      error: err.message || "Si è verificato un errore durante l'elaborazione della domanda da parte dell'intelligenza artificiale."
    });
  }
});

// Serve frontend assets
if (process.env.NODE_ENV !== "production") {
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  }).then((vite) => {
    app.use(vite.middlewares);
    
    // Fallback static route for dev
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server dev avviato in ascolto su http://localhost:${PORT}`);
    });
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server di produzione avviato sulla porta ${PORT}`);
  });
}
