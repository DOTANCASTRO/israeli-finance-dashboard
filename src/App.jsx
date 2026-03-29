import { useState, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

// ─── Styles ─────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #f0f4f8;
    --surface: #ffffff;
    --surface2: #e8edf3;
    --border: rgba(0,0,0,0.08);
    --accent: #3b9ee8;
    --accent2: #e5534b;
    --accent3: #c8860a;
    --text: #1e2a3a;
    --muted: #6b7a8d;
    --card-glow: 0 0 0 1px rgba(59,158,232,0.1), 0 2px 12px rgba(0,0,0,0.07);
  }

  body { background: var(--bg); color: var(--text); font-family: 'Assistant', sans-serif; min-height: 100vh; direction: rtl; }

  .app { max-width: 1200px; margin: 0 auto; padding: 2rem 1.5rem; }

  .header {
    display: flex; align-items: baseline; gap: 1rem; margin-bottom: 2.5rem;
    border-bottom: 1px solid var(--border); padding-bottom: 1.5rem;
  }
  .header h1 { font-size: 2rem; font-weight: 800; letter-spacing: -0.04em; }
  .header h1 span { color: var(--accent); }
  .header .sub { font-family: 'Assistant', monospace; font-size: 0.75rem; color: var(--muted); margin-inline-start: auto; }

  /* Drop zone */
  .dropzone {
    border: 2px dashed rgba(59,158,232,0.35);
    border-radius: 16px;
    padding: 3rem 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: linear-gradient(135deg, rgba(59,158,232,0.04), transparent);
    position: relative;
  }
  .dropzone:hover, .dropzone.drag { border-color: var(--accent); background: rgba(59,158,232,0.07); }
  .dropzone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
  .dropzone .icon { font-size: 3rem; margin-bottom: 1rem; }
  .dropzone h2 { font-size: 1.3rem; font-weight: 700; margin-bottom: 0.5rem; }
  .dropzone p { color: var(--muted); font-size: 0.9rem; font-family: 'Assistant', monospace; }
  .banks-hint { display: flex; gap: 0.5rem; justify-content: center; margin-top: 1rem; flex-wrap: wrap; }
  .bank-pill {
    background: var(--surface2); border: 1px solid var(--border);
    padding: 0.25rem 0.75rem; border-radius: 999px;
    font-size: 0.75rem; color: var(--muted); font-family: 'Assistant', monospace;
  }

  /* Stats row */
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
  .stat-card {
    background: var(--surface); border-radius: 12px; padding: 1.25rem;
    box-shadow: var(--card-glow); border: 1px solid var(--border);
  }
  .stat-card .label { font-family: 'Assistant', monospace; font-size: 0.7rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem; }
  .stat-card .value { font-size: 1.6rem; font-weight: 800; letter-spacing: -0.03em; }
  .stat-card .value.red { color: var(--accent2); }
  .stat-card .value.green { color: var(--accent); }
  .stat-card .value.yellow { color: var(--accent3); }

  /* Grid */
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
  .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
  @media (max-width: 768px) { .grid2, .grid3 { grid-template-columns: 1fr; } }

  /* Panel */
  .panel {
    background: var(--surface); border-radius: 12px; padding: 1.5rem;
    box-shadow: var(--card-glow); border: 1px solid var(--border);
  }
  .panel h3 { font-size: 0.8rem; font-family: 'Assistant', monospace; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 1.25rem; }

  /* Transactions table */
  .tx-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  .tx-table th { text-align: right; padding: 0.5rem 0.75rem; color: var(--muted); font-family: 'Assistant', monospace; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid var(--border); font-weight: 400; }
  .tx-table td { padding: 0.6rem 0.75rem; border-bottom: 1px solid rgba(0,0,0,0.04); }
  .tx-table tr:hover td { background: rgba(0,0,0,0.02); }
  .tx-table .amount { font-family: 'Assistant', monospace; font-weight: 500; position: relative; cursor: default; }
  .tx-table .amount.debit { color: var(--accent2); }
  .tx-table .amount.credit { color: var(--accent); }
  .tx-table .amount .tip {
    display: none; position: absolute; bottom: calc(100% + 6px); left: 0;
    background: var(--surface); border: 1px solid var(--border);
    color: var(--text); font-size: 0.75rem; padding: 0.25rem 0.5rem;
    border-radius: 5px; white-space: nowrap; pointer-events: none;
    box-shadow: 0 4px 12px rgba(0,0,0,0.12); z-index: 10;
  }
  .tx-table .amount:hover .tip { display: block; }
  .cat-badge {
    display: inline-block; padding: 0.15rem 0.5rem; border-radius: 4px;
    font-size: 0.7rem; font-family: 'Assistant', monospace;
    background: var(--surface2); color: var(--muted);
  }

  /* AI panel */
  .ai-panel {
    background: linear-gradient(135deg, rgba(59,158,232,0.07), rgba(229,83,75,0.04));
    border: 1px solid rgba(59,158,232,0.25); border-radius: 12px; padding: 1.5rem;
    margin-top: 1rem;
  }
  .ai-panel h3 { font-size: 0.8rem; font-family: 'Assistant', monospace; color: var(--accent); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
  .ai-panel h3::before { content: '◆'; font-size: 0.6rem; }
  .ai-response { white-space: pre-wrap; line-height: 1.7; font-size: 0.9rem; color: var(--text); }
  .ai-loading { display: flex; align-items: center; gap: 0.75rem; color: var(--muted); font-family: 'Assistant', monospace; font-size: 0.85rem; }
  .pulse { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); animation: pulse 1s infinite; }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

  .analyze-btn {
    margin-top: 1rem; padding: 0.75rem 1.5rem; background: var(--accent);
    color: #ffffff; border: none; border-radius: 8px; font-family: 'Assistant', sans-serif;
    font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: opacity 0.2s;
  }
  .analyze-btn:hover { opacity: 0.85; }
  .analyze-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Error */
  .error { background: rgba(229,83,75,0.08); border: 1px solid rgba(229,83,75,0.25); color: var(--accent2); padding: 1rem 1.25rem; border-radius: 8px; font-size: 0.85rem; margin-top: 1rem; font-family: 'Assistant', monospace; }

  .filter-row { display: flex; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; align-items: center; }
  .filter-row label { font-family: 'Assistant', monospace; font-size: 0.75rem; color: var(--muted); }
  .filter-row select, .filter-row input {
    background: var(--surface2); border: 1px solid var(--border); color: var(--text);
    padding: 0.4rem 0.75rem; border-radius: 6px; font-family: 'Assistant', monospace; font-size: 0.8rem;
    direction: rtl;
  }
  .scroll-table { max-height: 380px; overflow-y: auto; }
  .scroll-table::-webkit-scrollbar { width: 4px; }
  .scroll-table::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
`;

// ─── Category detection ──────────────────────────────────────────────────────
const SECTOR_MAP = {
  "מסעדות": "🍔 אוכל ומסעדות",
  "מזון ומשקאות": "🍔 אוכל ומסעדות",
  "מזון מהיר": "🍔 אוכל ומסעדות",
  "מזון": "🍔 אוכל ומסעדות",
  "קפה ובתי קפה": "🍔 אוכל ומסעדות",
  "סופרמרקט": "🛒 סופרמרקט",
  "מכולת וסופרמרקט": "🛒 סופרמרקט",
  "אנרגיה": "⛽ תחבורה ודלק",
  "תחבורה": "⛽ תחבורה ודלק",
  "חניה": "⛽ תחבורה ודלק",
  "בריאות": "🏥 בריאות ורוקחות",
  "רפואה": "🏥 בריאות ורוקחות",
  "בית מרקחת": "🏥 בריאות ורוקחות",
  "אופנה": "🛍️ קניות",
  "קניות": "🛍️ קניות",
  "ריהוט ובית": "🏠 בית ומחיה",
  "ריהוט": "🏠 בית ומחיה",
  "תקשורת ומחשבים": "📡 מנויים",
  "תקשורת": "📡 מנויים",
  "ספורט": "🏋️ ספורט ובריאות",
  "טיפוח ויופי": "🏋️ ספורט ובריאות",
  "נסיעות": "✈️ נסיעות",
  "תיירות": "✈️ נסיעות",
  "פנאי בילוי": "🎭 בידור",
  "בידור": "🎭 בידור",
  "ביטוח ופיננסים": "💰 פיננסים",
  "בנקים ופיננסים": "💰 פיננסים",
  "חינוך": "📚 חינוך",
  "ציוד ומשרד": "📦 אחר",
};

const CATEGORY_RULES = [
  { cat: "🍔 אוכל ומסעדות", keywords: ["מסעדה","קפה","אוכל","פיצה","סושי","בורגר","שוקולד","מאפה","קפיטריה","coffee","restaurant","food","cafe","מקדונלד","שופרסל קפה","גוד פוד"] },
  { cat: "🛒 סופרמרקט", keywords: ["שופרסל","רמי לוי","ויקטורי","מגה","יוחננוף","חצי חינם","סופר","supermarket","super","grocery","מעדנייה"] },
  { cat: "⛽ תחבורה ודלק", keywords: ["דלק","פז","סונול","yellow","גז","תחנת","רכב","parking","חניה","רכבת","אוטובוס","uber","taxi","gett"] },
  { cat: "🏥 בריאות ורוקחות", keywords: ["פארם","בית מרקחת","pharmacy","רופא","doctor","מרפאה","clalit","כללית","מכבי","leumit","ליאומית"] },
  { cat: "🛍️ קניות", keywords: ["עלמה","זארה","h&m","ksp","office","adidas","nike","castro","renuar","golf","shopping","mall","סנטר"] },
  { cat: "🏠 בית ומחיה", keywords: ["ikea","אייקאה","home","הום","שיפוצים","חשמל","מים","גז","ארנונה","וילון","ריהוט"] },
  { cat: "📡 מנויים", keywords: ["netflix","spotify","apple","google","youtube","microsoft","amazon","yes","hot","cellular","סלולר","פרטנר","סלקום","פלאפון"] },
  { cat: "🏋️ ספורט ובריאות", keywords: ["gym","חדר כושר","sport","ספורט","yoga","pilates","swim"] },
  { cat: "✈️ נסיעות", keywords: ["flight","hotel","airbnb","booking","אל על","elal","airport","נמל תעופה","אירופה"] },
  { cat: "🎭 בידור", keywords: ["cinema","סרט","קולנוע","theater","concert","event","אירוע","בילוי"] },
];

function categorize(description, sector) {
  if (sector) {
    const mapped = SECTOR_MAP[sector.trim()];
    if (mapped) return mapped;
  }
  if (!description) return "📦 אחר";
  const lower = description.toLowerCase();
  for (const { cat, keywords } of CATEGORY_RULES) {
    if (keywords.some(k => lower.includes(k.toLowerCase()))) return cat;
  }
  return "📦 אחר";
}

// ─── CSV/Excel parsing ───────────────────────────────────────────────────────
function detectAndParse(data) {
  const strictHeaderTerms = ["תאריך", "שם בית", "transaction date", "date"];
  let headerRow = -1;
  for (let i = 0; i < Math.min(15, data.length); i++) {
    const row = data[i].map(c => String(c || "").toLowerCase());
    if (strictHeaderTerms.some(k => row.some(cell => cell.includes(k)))) {
      headerRow = i;
      break;
    }
  }
  if (headerRow === -1) headerRow = 0;

  const headers = data[headerRow].map(h => String(h || "").trim());
  const rows = data.slice(headerRow + 1);

  const findCol = (...terms) => {
    for (const term of terms) {
      const idx = headers.findIndex(h => h.toLowerCase().includes(term.toLowerCase()));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const dateIdx    = findCol("תאריך", "date");
  const descIdx    = findCol("שם בית", "תיאור", "description", "פעולה", "merchant", "בית עסק");
  const chargeIdx  = findCol("חיוב", "amount", "זיכוי וחיוב");
  const txAmtIdx   = findCol("סכום", "amount");
  const typeIdx    = findCol("סוג", "type", "זיכוי");
  const sectorIdx  = findCol("ענף");

  const txs = [];
  for (const row of rows) {
    if (!row || row.every(c => !c)) continue;
    const rawDate   = row[dateIdx];
    const rawDesc   = row[descIdx];
    const rawCharge = chargeIdx !== -1 ? row[chargeIdx] : undefined;
    const rawTxAmt  = txAmtIdx  !== -1 ? row[txAmtIdx]  : undefined;
    const rawAmt    = (rawCharge !== "" && rawCharge != null) ? rawCharge : rawTxAmt;
    const rawSector = sectorIdx !== -1 ? String(row[sectorIdx] || "").trim() : "";

    if (!rawAmt && !rawDesc) continue;

    let amount = parseFloat(String(rawAmt || "0").replace(/[^\d.\-]/g, "")) || 0;
    const isCredit = amount < 0 || String(row[typeIdx] || "").includes("זיכוי");
    amount = Math.abs(amount);

    let date = rawDate ? new Date(rawDate) : null;
    if (!date || isNaN(date)) {
      const parts = String(rawDate || "").split(/[\/\-\.]/);
      if (parts.length === 3) {
        const [a, b, c] = parts;
        date = new Date(`${c.length === 4 ? c : "20"+c}-${b.padStart(2,"0")}-${a.padStart(2,"0")}`);
      }
    }

    const description = String(rawDesc || "").trim();
    if (!description && amount === 0) continue;

    txs.push({
      date: date && !isNaN(date) ? date : null,
      dateStr: date && !isNaN(date) ? date.toLocaleDateString("he-IL") : String(rawDate || ""),
      description,
      amount,
      isCredit,
      category: categorize(description, rawSector),
    });
  }
  return txs.filter(t => t.amount > 0 || t.description);
}

// ─── Chart colors (lighter, pastel-toned) ───────────────────────────────────
const COLORS = ["#3b9ee8","#e5534b","#c8860a","#7c6af7","#2db87d","#f07b30","#00a991","#e0609c","#7fba2c","#c55fd4"];

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [error, setError]         = useState("");
  const [drag, setDrag]           = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [apiKey, setApiKey]       = useState("");
  const [filterCat, setFilterCat] = useState("הכל");
  const [filterMonth, setFilterMonth] = useState("הכל");
  const [search, setSearch]       = useState("");
  const [fileNames, setFileNames] = useState([]);

  const processFile = useCallback((file, existingNames) => {
    if (existingNames.includes(file.name)) return;
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "binary", cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        const txs = detectAndParse(data);
        if (txs.length === 0) throw new Error(`לא נמצאו עסקאות בקובץ ${file.name}.`);
        setTransactions(prev => [...prev, ...txs]);
        setFileNames(prev => [...prev, file.name]);
        setAiResponse("");
      } catch (err) {
        setError("⚠️ " + err.message);
      }
    };
    reader.readAsBinaryString(file);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDrag(false);
    setFileNames(prev => {
      Array.from(e.dataTransfer.files).forEach(f => processFile(f, prev));
      return prev;
    });
  }, [processFile]);

  const onFileInput = (e) => {
    setFileNames(prev => {
      Array.from(e.target.files).forEach(f => processFile(f, prev));
      e.target.value = "";
      return prev;
    });
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const months = useMemo(() => {
    const set = new Set();
    transactions.forEach(t => {
      if (t.date) set.add(`${t.date.getFullYear()}-${String(t.date.getMonth()+1).padStart(2,"0")}`);
    });
    return ["הכל", ...Array.from(set).sort().reverse()];
  }, [transactions]);

  const categories = useMemo(() => {
    const set = new Set(transactions.map(t => t.category));
    return ["הכל", ...Array.from(set).sort()];
  }, [transactions]);

  const filtered = useMemo(() => transactions.filter(t => {
    const matchCat   = filterCat === "הכל" || t.category === filterCat;
    const matchMonth = filterMonth === "הכל" || (t.date && `${t.date.getFullYear()}-${String(t.date.getMonth()+1).padStart(2,"0")}` === filterMonth);
    const matchSearch = !search || t.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchMonth && matchSearch && !t.isCredit;
  }), [transactions, filterCat, filterMonth, search]);

  const totalSpend  = useMemo(() => filtered.reduce((s, t) => s + t.amount, 0), [filtered]);
  const totalCredit = useMemo(() => transactions.filter(t => {
    if (!t.isCredit) return false;
    if (filterMonth === "הכל") return true;
    return t.date && `${t.date.getFullYear()}-${String(t.date.getMonth()+1).padStart(2,"0")}` === filterMonth;
  }).reduce((s,t)=>s+t.amount,0), [transactions, filterMonth]);
  const txCount     = filtered.length;
  const avgTx       = txCount ? totalSpend / txCount : 0;

  const byCategory = useMemo(() => {
    const map = {};
    filtered.forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map).sort((a,b) => b[1]-a[1]).map(([cat, amount]) => ({ cat, amount: Math.round(amount) }));
  }, [filtered]);

  const byMonth = useMemo(() => {
    const map = {};
    transactions.filter(t => !t.isCredit).forEach(t => {
      if (!t.date) return;
      const key = `${t.date.getFullYear()}-${String(t.date.getMonth()+1).padStart(2,"0")}`;
      map[key] = (map[key] || 0) + t.amount;
    });
    return Object.entries(map).sort().map(([month, amount]) => ({ month, amount: Math.round(amount) }));
  }, [transactions]);

  const topMerchants = useMemo(() => {
    const map = {};
    filtered.forEach(t => { map[t.description] = (map[t.description]||0) + t.amount; });
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name,amount])=>({name,amount:Math.round(amount),exact:+amount.toFixed(2)}));
  }, [filtered]);

  // ── AI Analysis ───────────────────────────────────────────────────────────
  const runAI = async () => {
    setAiLoading(true); setAiResponse("");
    const summary = {
      totalSpend: Math.round(totalSpend),
      txCount,
      topCategories: byCategory.slice(0,6),
      topMerchants: topMerchants.slice(0,5),
      monthlyTrend: byMonth,
    };
    const prompt = `אתה יועץ פיננסי אישי המנתח עסקאות כרטיס אשראי ישראלי. ענה בעברית.

להלן סיכום הנתונים:
סה"כ הוצאות: ₪${summary.totalSpend}
מספר עסקאות: ${summary.txCount}

קטגוריות הוצאה מובילות:
${summary.topCategories.map(c=>`- ${c.cat}: ₪${c.amount}`).join("\n")}

בתי עסק מובילים:
${summary.topMerchants.map(m=>`- ${m.name}: ₪${m.amount}`).join("\n")}

מגמה חודשית:
${summary.monthlyTrend.map(m=>`- ${m.month}: ₪${m.amount}`).join("\n")}

אנא ספק:
1. 2-3 תצפיות מרכזיות על דפוסי ההוצאות
2. 1-2 הצעות ממשיות לחיסכון כסף
3. דפוסים חריגים הראויים לציון

היה תמציתי, ידידותי וספציפי. השתמש ב-₪ לסכומים.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      setAiResponse(data.content?.map(b => b.text).join("") || "אין תגובה.");
    } catch (err) {
      setAiResponse("שגיאה: " + err.message);
    }
    setAiLoading(false);
  };

  const fmt = (n) => `₪${Math.round(n).toLocaleString("he-IL")}`;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="header">
          <h1>Finance<span>Lens</span></h1>
          <span className="sub">Castro Lab</span>
        </div>

        {transactions.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
            {fileNames.map(n => (
              <span key={n} style={{ background: "var(--surface2)", border: "1px solid var(--border)", padding: "0.2rem 0.6rem", borderRadius: 4, fontFamily: "Assistant", fontSize: "0.72rem", color: "var(--muted)" }}>{n}</span>
            ))}
            <label style={{ background: "none", border: "1px solid rgba(59,158,232,0.35)", color: "var(--accent)", padding: "0.35rem 0.8rem", borderRadius: 6, cursor: "pointer", fontFamily: "Assistant", fontSize: "0.78rem", position: "relative" }}>
              + הוסף קבצים נוספים
              <input type="file" accept=".csv,.xlsx,.xls" multiple onChange={onFileInput} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }} />
            </label>
            <button onClick={() => { setTransactions([]); setAiResponse(""); setFileNames([]); setFilterMonth("הכל"); setFilterCat("הכל"); setSearch(""); }}
              style={{ marginInlineStart: "auto", background: "none", border: "1px solid rgba(229,83,75,0.3)", color: "var(--accent2)", padding: "0.35rem 0.8rem", borderRadius: 6, cursor: "pointer", fontFamily: "Assistant", fontSize: "0.78rem" }}>
              ↺ איפוס
            </button>
          </div>
        )}

        {transactions.length === 0 ? (
          <div
            className={`dropzone ${drag ? "drag" : ""}`}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
          >
            <input type="file" accept=".csv,.xlsx,.xls" multiple onChange={onFileInput} onDrop={e => e.stopPropagation()} />
            <div className="icon">📂</div>
            <h2>העלה לכאן את קובץ ההוצאות</h2>
            <p>קובץ CSV או Excel מהבנק • לא נשלח דבר לשרת</p>
            <div className="banks-hint">
              {["ישראכרט","מקס","כאל","הפועלים","לאומי","דיסקונט","מזרחי"].map(b => (
                <span key={b} className="bank-pill">{b}</span>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="stats">
              <div className="stat-card">
                <div className="label">סה״כ הוצאות</div>
                <div className="value red">{fmt(totalSpend)}</div>
              </div>
              <div className="stat-card">
                <div className="label">עסקאות</div>
                <div className="value yellow">{txCount}</div>
              </div>
              <div className="stat-card">
                <div className="label">ממוצע לעסקה</div>
                <div className="value">{fmt(avgTx)}</div>
              </div>
              <div className="stat-card">
                <div className="label">זיכויים / החזרים</div>
                <div className="value green">{fmt(totalCredit)}</div>
              </div>
              <div className="stat-card">
                <div className="label">קטגוריות</div>
                <div className="value">{byCategory.length}</div>
              </div>
            </div>

            {/* Charts row 1 */}
            <div className="grid2">
              <div className="panel">
                <h3>הוצאות חודשיות</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={byMonth} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="month" tick={{ fill: "#6b7a8d", fontSize: 11, fontFamily: "Assistant" }} />
                    <YAxis tick={{ fill: "#6b7a8d", fontSize: 11, fontFamily: "Assistant" }} tickFormatter={v=>`₪${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 8, fontFamily: "Assistant", fontSize: 12 }} formatter={v => [`₪${v.toLocaleString()}`, "הוצאה"]} />
                    <Bar dataKey="amount" fill="#3b9ee8" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="panel">
                <h3>הוצאות לפי קטגוריה</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={byCategory} dataKey="amount" nameKey="cat" cx="50%" cy="50%" outerRadius={85} innerRadius={45}>
                      {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 8, fontFamily: "Assistant", fontSize: 12 }} formatter={v => [`₪${v.toLocaleString()}`, ""]} />
                    <Legend formatter={(v) => <span style={{ fontSize: 11, color: "#6b7a8d", fontFamily: "Assistant" }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top merchants */}
            <div className="panel" style={{ marginBottom: "1rem" }}>
              <h3>בתי עסק מובילים</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topMerchants} layout="vertical" barSize={14} margin={{ right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#6b7a8d", fontSize: 11, fontFamily: "Assistant" }} tickFormatter={v=>`₪${(v/1000).toFixed(1)}k`} />
                  <YAxis type="category" dataKey="name" width={220} tick={{ fill: "#1e2a3a", fontSize: 11, fontFamily: "Assistant" }} />
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const { name, exact } = payload[0].payload;
                    return (
                      <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 8, fontFamily: "Assistant", fontSize: 12, padding: "0.5rem 0.75rem" }}>
                        <p style={{ color: "#6b7a8d", marginBottom: "0.25rem", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
                        <p style={{ color: "#3b9ee8" }}>₪{exact.toLocaleString("he-IL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    );
                  }} />
                  <Bar dataKey="amount" radius={[0,4,4,0]}>
                    {topMerchants.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Transactions table */}
            <div className="panel" style={{ marginBottom: "1rem" }}>
              <h3>עסקאות — {filtered.length} מוצגות</h3>
              <div className="filter-row">
                <label>חודש</label>
                <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                  {months.map(m => <option key={m}>{m}</option>)}
                </select>
                <label>קטגוריה</label>
                <select value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
                <input placeholder="חיפוש בית עסק..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="scroll-table">
                <table className="tx-table">
                  <thead>
                    <tr>
                      <th>תאריך</th>
                      <th>תיאור</th>
                      <th>קטגוריה</th>
                      <th>סכום</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 200).map((t, i) => (
                      <tr key={i}>
                        <td style={{ fontFamily: "Assistant", fontSize: "0.8rem", color: "var(--muted)" }}>{t.dateStr}</td>
                        <td>{t.description}</td>
                        <td><span className="cat-badge">{t.category}</span></td>
                        <td><span className={`amount ${t.isCredit ? "credit" : "debit"}`}>{t.isCredit ? "+" : "-"}{fmt(t.amount)}<span className="tip">₪{t.amount.toFixed(2)}</span></span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Analysis */}
            <div className="ai-panel">
              <h3>ניתוח פיננסי בינה מלאכותית</h3>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontFamily: "'Assistant', monospace", fontSize: "0.72rem", color: "var(--muted)", marginBottom: "0.4rem", letterSpacing: "0.08em" }}>
                  מפתח API של Anthropic — נשמר בזיכרון הדפדפן בלבד, לא נשלח לשום מקום מלבד Anthropic
                </label>
                <input
                  type="password"
                  placeholder="sk-ant-..."
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", padding: "0.5rem 0.75rem", borderRadius: 6, fontFamily: "'Assistant', monospace", fontSize: "0.82rem", direction: "ltr", textAlign: "left" }}
                />
              </div>
              {!apiKey && <p style={{ color: "var(--muted)", fontSize: "0.8rem", fontFamily: "'Assistant', monospace", marginBottom: "0.75rem" }}>קבל מפתח חינמי בכתובת console.anthropic.com</p>}
              {aiLoading && <div className="ai-loading"><div className="pulse" /> מנתח את העסקאות שלך...</div>}
              {aiResponse && <div className="ai-response">{aiResponse}</div>}
              <button className="analyze-btn" onClick={runAI} disabled={aiLoading || !apiKey}>
                {aiLoading ? "מנתח..." : aiResponse ? "נתח מחדש" : "✦ נתח עם בינה מלאכותית"}
              </button>
            </div>

          </>
        )}
        {error && <div className="error">{error}</div>}
      </div>
    </>
  );
}
