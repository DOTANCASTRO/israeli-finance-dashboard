import { useState, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

// ─── Styles ─────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0c10;
    --surface: #111419;
    --surface2: #181c24;
    --border: rgba(255,255,255,0.07);
    --accent: #00e5c3;
    --accent2: #ff6b6b;
    --accent3: #ffd93d;
    --text: #e8eaf0;
    --muted: #6b7280;
    --card-glow: 0 0 0 1px rgba(0,229,195,0.08), 0 4px 24px rgba(0,0,0,0.4);
  }

  body { background: var(--bg); color: var(--text); font-family: 'Syne', sans-serif; min-height: 100vh; }

  .app { max-width: 1200px; margin: 0 auto; padding: 2rem 1.5rem; }

  .header {
    display: flex; align-items: baseline; gap: 1rem; margin-bottom: 2.5rem;
    border-bottom: 1px solid var(--border); padding-bottom: 1.5rem;
  }
  .header h1 { font-size: 2rem; font-weight: 800; letter-spacing: -0.04em; }
  .header h1 span { color: var(--accent); }
  .header .sub { font-family: 'DM Mono', monospace; font-size: 0.75rem; color: var(--muted); margin-left: auto; }

  /* Drop zone */
  .dropzone {
    border: 2px dashed rgba(0,229,195,0.3);
    border-radius: 16px;
    padding: 3rem 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: linear-gradient(135deg, rgba(0,229,195,0.03), transparent);
    position: relative;
  }
  .dropzone:hover, .dropzone.drag { border-color: var(--accent); background: rgba(0,229,195,0.05); }
  .dropzone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
  .dropzone .icon { font-size: 3rem; margin-bottom: 1rem; }
  .dropzone h2 { font-size: 1.3rem; font-weight: 700; margin-bottom: 0.5rem; }
  .dropzone p { color: var(--muted); font-size: 0.9rem; font-family: 'DM Mono', monospace; }
  .banks-hint { display: flex; gap: 0.5rem; justify-content: center; margin-top: 1rem; flex-wrap: wrap; }
  .bank-pill {
    background: var(--surface2); border: 1px solid var(--border);
    padding: 0.25rem 0.75rem; border-radius: 999px;
    font-size: 0.75rem; color: var(--muted); font-family: 'DM Mono', monospace;
  }

  /* Stats row */
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
  .stat-card {
    background: var(--surface); border-radius: 12px; padding: 1.25rem;
    box-shadow: var(--card-glow); border: 1px solid var(--border);
  }
  .stat-card .label { font-family: 'DM Mono', monospace; font-size: 0.7rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem; }
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
  .panel h3 { font-size: 0.8rem; font-family: 'DM Mono', monospace; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 1.25rem; }

  /* Transactions table */
  .tx-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  .tx-table th { text-align: left; padding: 0.5rem 0.75rem; color: var(--muted); font-family: 'DM Mono', monospace; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid var(--border); font-weight: 400; }
  .tx-table td { padding: 0.6rem 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.03); }
  .tx-table tr:hover td { background: rgba(255,255,255,0.02); }
  .tx-table .amount { font-family: 'DM Mono', monospace; font-weight: 500; }
  .tx-table .amount.debit { color: var(--accent2); }
  .tx-table .amount.credit { color: var(--accent); }
  .cat-badge {
    display: inline-block; padding: 0.15rem 0.5rem; border-radius: 4px;
    font-size: 0.7rem; font-family: 'DM Mono', monospace;
    background: rgba(255,255,255,0.06); color: var(--muted);
  }

  /* AI panel */
  .ai-panel {
    background: linear-gradient(135deg, rgba(0,229,195,0.06), rgba(255,107,107,0.04));
    border: 1px solid rgba(0,229,195,0.2); border-radius: 12px; padding: 1.5rem;
    margin-top: 1rem;
  }
  .ai-panel h3 { font-size: 0.8rem; font-family: 'DM Mono', monospace; color: var(--accent); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
  .ai-panel h3::before { content: '◆'; font-size: 0.6rem; }
  .ai-response { white-space: pre-wrap; line-height: 1.7; font-size: 0.9rem; color: var(--text); }
  .ai-loading { display: flex; align-items: center; gap: 0.75rem; color: var(--muted); font-family: 'DM Mono', monospace; font-size: 0.85rem; }
  .pulse { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); animation: pulse 1s infinite; }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

  .analyze-btn {
    margin-top: 1rem; padding: 0.75rem 1.5rem; background: var(--accent);
    color: #0a0c10; border: none; border-radius: 8px; font-family: 'Syne', sans-serif;
    font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: opacity 0.2s;
  }
  .analyze-btn:hover { opacity: 0.85; }
  .analyze-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Error */
  .error { background: rgba(255,107,107,0.1); border: 1px solid rgba(255,107,107,0.3); color: var(--accent2); padding: 1rem 1.25rem; border-radius: 8px; font-size: 0.85rem; margin-top: 1rem; font-family: 'DM Mono', monospace; }

  .filter-row { display: flex; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; align-items: center; }
  .filter-row label { font-family: 'DM Mono', monospace; font-size: 0.75rem; color: var(--muted); }
  .filter-row select, .filter-row input {
    background: var(--surface2); border: 1px solid var(--border); color: var(--text);
    padding: 0.4rem 0.75rem; border-radius: 6px; font-family: 'DM Mono', monospace; font-size: 0.8rem;
  }
  .scroll-table { max-height: 380px; overflow-y: auto; }
  .scroll-table::-webkit-scrollbar { width: 4px; }
  .scroll-table::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
`;

// ─── Category detection ──────────────────────────────────────────────────────
// Map Diners/Israeli bank "ענף" (sector) values to emoji categories
const SECTOR_MAP = {
  "מסעדות": "🍔 Food & Dining",
  "מזון ומשקאות": "🍔 Food & Dining",
  "מזון מהיר": "🍔 Food & Dining",
  "מזון": "🍔 Food & Dining",
  "קפה ובתי קפה": "🍔 Food & Dining",
  "סופרמרקט": "🛒 Groceries",
  "מכולת וסופרמרקט": "🛒 Groceries",
  "אנרגיה": "⛽ Transport & Gas",
  "תחבורה": "⛽ Transport & Gas",
  "חניה": "⛽ Transport & Gas",
  "בריאות": "🏥 Health & Pharmacy",
  "רפואה": "🏥 Health & Pharmacy",
  "בית מרקחת": "🏥 Health & Pharmacy",
  "אופנה": "🛍️ Shopping",
  "קניות": "🛍️ Shopping",
  "ריהוט ובית": "🏠 Home & Living",
  "ריהוט": "🏠 Home & Living",
  "תקשורת ומחשבים": "📡 Subscriptions",
  "תקשורת": "📡 Subscriptions",
  "ספורט": "🏋️ Sport & Wellness",
  "טיפוח ויופי": "🏋️ Sport & Wellness",
  "נסיעות": "✈️ Travel",
  "תיירות": "✈️ Travel",
  "פנאי בילוי": "🎭 Entertainment",
  "בידור": "🎭 Entertainment",
  "ביטוח ופיננסים": "💰 Finance",
  "בנקים ופיננסים": "💰 Finance",
  "חינוך": "📚 Education",
  "ציוד ומשרד": "📦 Other",
};

const CATEGORY_RULES = [
  { cat: "🍔 Food & Dining", keywords: ["מסעדה","קפה","אוכל","פיצה","סושי","בורגר","שוקולד","מאפה","קפיטריה","coffee","restaurant","food","cafe","מקדונלד","שופרסל קפה","גוד פוד"] },
  { cat: "🛒 Groceries", keywords: ["שופרסל","רמי לוי","ויקטורי","מגה","יוחננוף","חצי חינם","סופר","supermarket","super","grocery","מעדנייה"] },
  { cat: "⛽ Transport & Gas", keywords: ["דלק","פז","סונול","yellow","גז","תחנת","רכב","parking","חניה","רכבת","אוטובוס","uber","taxi","gett"] },
  { cat: "🏥 Health & Pharmacy", keywords: ["פארם","בית מרקחת","pharmacy","רופא","doctor","מרפאה","clalit","כללית","מכבי","leumit","ליאומית"] },
  { cat: "🛍️ Shopping", keywords: ["עלמה","זארה","h&m","ksp","office","adidas","nike","castro","renuar","golf","shopping","mall","סנטר"] },
  { cat: "🏠 Home & Living", keywords: ["ikea","אייקאה","home","הום","שיפוצים","חשמל","מים","גז","ארנונה","וילון","ריהוט"] },
  { cat: "📡 Subscriptions", keywords: ["netflix","spotify","apple","google","youtube","microsoft","amazon","yes","hot","cellular","סלולר","פרטנר","סלקום","פלאפון"] },
  { cat: "🏋️ Sport & Wellness", keywords: ["gym","חדר כושר","sport","ספורט","yoga","pilates","swim"] },
  { cat: "✈️ Travel", keywords: ["flight","hotel","airbnb","booking","אל על","elal","airport","נמל תעופה","אירופה"] },
  { cat: "🎭 Entertainment", keywords: ["cinema","סרט","קולנוע","theater","concert","event","אירוע","בילוי"] },
];

function categorize(description, sector) {
  // Prefer the bank's own sector classification
  if (sector) {
    const mapped = SECTOR_MAP[sector.trim()];
    if (mapped) return mapped;
  }
  // Fallback: keyword match on description
  if (!description) return "📦 Other";
  const lower = description.toLowerCase();
  for (const { cat, keywords } of CATEGORY_RULES) {
    if (keywords.some(k => lower.includes(k.toLowerCase()))) return cat;
  }
  return "📦 Other";
}

// ─── CSV/Excel parsing ───────────────────────────────────────────────────────
function detectAndParse(data) {
  // Find header row. Use terms that only appear as column labels, not in title/summary rows.
  // e.g. "עסקאות לחיוב ב-..." contains "חיוב" but not "תאריך" or "שם בית".
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

  // Find column by trying terms in priority order — first matching term wins.
  // This prevents a later term matching an earlier column.
  const findCol = (...terms) => {
    for (const term of terms) {
      const idx = headers.findIndex(h => h.toLowerCase().includes(term.toLowerCase()));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const dateIdx    = findCol("תאריך", "date");
  // "שם בית" before "עסקה" — avoids matching "תאריך עסקה" as the description column
  const descIdx    = findCol("שם בית", "תיאור", "description", "פעולה", "merchant", "בית עסק");
  // "חיוב" finds "סכום חיוב" (ILS charged amount) before "סכום עסקה" (original-currency amount)
  const chargeIdx  = findCol("חיוב", "amount", "זיכוי וחיוב");
  const txAmtIdx   = findCol("סכום", "amount");   // fallback when charge column is empty
  const typeIdx    = findCol("סוג", "type", "זיכוי");
  const sectorIdx  = findCol("ענף");              // Diners/Israeli banks provide a sector column

  const txs = [];
  for (const row of rows) {
    if (!row || row.every(c => !c)) continue;
    const rawDate   = row[dateIdx];
    const rawDesc   = row[descIdx];
    // Use charged ILS amount; fall back to transaction amount if empty (e.g. in-flight transactions)
    const rawCharge = chargeIdx !== -1 ? row[chargeIdx] : undefined;
    const rawTxAmt  = txAmtIdx  !== -1 ? row[txAmtIdx]  : undefined;
    const rawAmt    = (rawCharge !== "" && rawCharge != null) ? rawCharge : rawTxAmt;
    const rawSector = sectorIdx !== -1 ? String(row[sectorIdx] || "").trim() : "";

    if (!rawAmt && !rawDesc) continue;

    let amount = parseFloat(String(rawAmt || "0").replace(/[^\d.\-]/g, "")) || 0;
    const isCredit = amount < 0 || String(row[typeIdx] || "").includes("זיכוי");
    amount = Math.abs(amount);

    // Parse date
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

// ─── Chart colors ────────────────────────────────────────────────────────────
const COLORS = ["#00e5c3","#ff6b6b","#ffd93d","#a78bfa","#34d399","#fb923c","#60a5fa","#f472b6","#a3e635","#e879f9"];

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [error, setError]         = useState("");
  const [drag, setDrag]           = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [apiKey, setApiKey]       = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [filterMonth, setFilterMonth] = useState("All");
  const [search, setSearch]       = useState("");
  const [fileNames, setFileNames] = useState([]);

  const processFile = useCallback((file, existingNames) => {
    if (existingNames.includes(file.name)) return; // skip duplicates
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "binary", cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        const txs = detectAndParse(data);
        if (txs.length === 0) throw new Error(`No transactions detected in ${file.name}.`);
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
    return ["All", ...Array.from(set).sort().reverse()];
  }, [transactions]);

  const categories = useMemo(() => {
    const set = new Set(transactions.map(t => t.category));
    return ["All", ...Array.from(set).sort()];
  }, [transactions]);

  const filtered = useMemo(() => transactions.filter(t => {
    const matchCat   = filterCat === "All" || t.category === filterCat;
    const matchMonth = filterMonth === "All" || (t.date && `${t.date.getFullYear()}-${String(t.date.getMonth()+1).padStart(2,"0")}` === filterMonth);
    const matchSearch = !search || t.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchMonth && matchSearch && !t.isCredit;
  }), [transactions, filterCat, filterMonth, search]);

  const totalSpend  = useMemo(() => filtered.reduce((s, t) => s + t.amount, 0), [filtered]);
  const totalCredit = useMemo(() => transactions.filter(t => {
    if (!t.isCredit) return false;
    if (filterMonth === "All") return true;
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
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name,amount])=>({name,amount:Math.round(amount)}));
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
    const prompt = `You are a personal finance advisor analyzing Israeli credit card transactions.

Here's a summary of the data:
Total spending: ₪${summary.totalSpend}
Number of transactions: ${summary.txCount}

Top spending categories:
${summary.topCategories.map(c=>`- ${c.cat}: ₪${c.amount}`).join("\n")}

Top merchants:
${summary.topMerchants.map(m=>`- ${m.name}: ₪${m.amount}`).join("\n")}

Monthly trend:
${summary.monthlyTrend.map(m=>`- ${m.month}: ₪${m.amount}`).join("\n")}

Please provide:
1. 2-3 key observations about spending patterns
2. 1-2 concrete money-saving suggestions
3. Any unusual patterns worth flagging

Be concise, friendly, and specific. Use ₪ for amounts.`;

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
      setAiResponse(data.content?.map(b => b.text).join("") || "No response.");
    } catch (err) {
      setAiResponse("Error: " + err.message);
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
          <span className="sub">Israeli Bank Transaction Analyzer</span>
        </div>

        {transactions.length === 0 ? (
          <div
            className={`dropzone ${drag ? "drag" : ""}`}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
          >
            <input type="file" accept=".csv,.xlsx,.xls" multiple onChange={onFileInput} />
            <div className="icon">📂</div>
            <h2>Drop your bank export here</h2>
            <p>CSV or Excel file from your bank • Nothing is sent to any server</p>
            <div className="banks-hint">
              {["Isracard","Max","Cal","Hapoalim","Leumi","Discount","Mizrahi"].map(b => (
                <span key={b} className="bank-pill">{b}</span>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="stats">
              <div className="stat-card">
                <div className="label">Total Spend</div>
                <div className="value red">{fmt(totalSpend)}</div>
              </div>
              <div className="stat-card">
                <div className="label">Transactions</div>
                <div className="value yellow">{txCount}</div>
              </div>
              <div className="stat-card">
                <div className="label">Avg Transaction</div>
                <div className="value">{fmt(avgTx)}</div>
              </div>
              <div className="stat-card">
                <div className="label">Credits / Refunds</div>
                <div className="value green">{fmt(totalCredit)}</div>
              </div>
              <div className="stat-card">
                <div className="label">Categories</div>
                <div className="value">{byCategory.length}</div>
              </div>
            </div>

            {/* Charts row 1 */}
            <div className="grid2">
              <div className="panel">
                <h3>Monthly Spending</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={byMonth} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11, fontFamily: "DM Mono" }} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 11, fontFamily: "DM Mono" }} tickFormatter={v=>`₪${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ background: "#181c24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, fontFamily: "DM Mono", fontSize: 12 }} formatter={v => [`₪${v.toLocaleString()}`, "Spend"]} />
                    <Bar dataKey="amount" fill="#00e5c3" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="panel">
                <h3>Spending by Category</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={byCategory} dataKey="amount" nameKey="cat" cx="50%" cy="50%" outerRadius={85} innerRadius={45}>
                      {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#181c24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, fontFamily: "DM Mono", fontSize: 12 }} formatter={v => [`₪${v.toLocaleString()}`, ""]} />
                    <Legend formatter={(v) => <span style={{ fontSize: 11, color: "#9ca3af", fontFamily: "DM Mono" }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top merchants */}
            <div className="panel" style={{ marginBottom: "1rem" }}>
              <h3>Top Merchants</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topMerchants} layout="vertical" barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 11, fontFamily: "DM Mono" }} tickFormatter={v=>`₪${(v/1000).toFixed(1)}k`} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fill: "#e8eaf0", fontSize: 11, fontFamily: "DM Mono" }} />
                  <Tooltip contentStyle={{ background: "#181c24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, fontFamily: "DM Mono", fontSize: 12 }} formatter={v => [`₪${v.toLocaleString()}`, "Total"]} />
                  <Bar dataKey="amount" radius={[0,4,4,0]}>
                    {topMerchants.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Transactions table */}
            <div className="panel" style={{ marginBottom: "1rem" }}>
              <h3>Transactions — {filtered.length} shown</h3>
              <div className="filter-row">
                <label>Month</label>
                <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                  {months.map(m => <option key={m}>{m}</option>)}
                </select>
                <label>Category</label>
                <select value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
                <input placeholder="Search merchant..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="scroll-table">
                <table className="tx-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 200).map((t, i) => (
                      <tr key={i}>
                        <td style={{ fontFamily: "DM Mono", fontSize: "0.8rem", color: "#6b7280" }}>{t.dateStr}</td>
                        <td>{t.description}</td>
                        <td><span className="cat-badge">{t.category}</span></td>
                        <td><span className={`amount ${t.isCredit ? "credit" : "debit"}`}>{t.isCredit ? "+" : "-"}{fmt(t.amount)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Analysis */}
            <div className="ai-panel">
              <h3>AI Financial Analysis</h3>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", color: "var(--muted)", marginBottom: "0.4rem", letterSpacing: "0.08em" }}>
                  ANTHROPIC API KEY — stored in browser memory only, never sent anywhere except Anthropic
                </label>
                <input
                  type="password"
                  placeholder="sk-ant-..."
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", padding: "0.5rem 0.75rem", borderRadius: 6, fontFamily: "'DM Mono', monospace", fontSize: "0.82rem" }}
                />
              </div>
              {!apiKey && <p style={{ color: "var(--muted)", fontSize: "0.8rem", fontFamily: "'DM Mono', monospace", marginBottom: "0.75rem" }}>Get a free key at console.anthropic.com</p>}
              {aiLoading && <div className="ai-loading"><div className="pulse" /> Analyzing your transactions...</div>}
              {aiResponse && <div className="ai-response">{aiResponse}</div>}
              <button className="analyze-btn" onClick={runAI} disabled={aiLoading || !apiKey}>
                {aiLoading ? "Analyzing..." : aiResponse ? "Re-analyze" : "✦ Analyze with AI"}
              </button>
            </div>

            <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "DM Mono", fontSize: "0.75rem", color: "#6b7280" }}>
                {fileNames.length} file{fileNames.length !== 1 ? "s" : ""} loaded:
              </span>
              {fileNames.map(n => (
                <span key={n} style={{ background: "#181c24", border: "1px solid rgba(255,255,255,0.07)", padding: "0.2rem 0.6rem", borderRadius: 4, fontFamily: "DM Mono", fontSize: "0.72rem", color: "#9ca3af" }}>{n}</span>
              ))}
              <label style={{ marginLeft: "auto", background: "none", border: "1px solid rgba(0,229,195,0.3)", color: "#00e5c3", padding: "0.4rem 0.9rem", borderRadius: 6, cursor: "pointer", fontFamily: "DM Mono", fontSize: "0.8rem", position: "relative" }}>
                + Add more files
                <input type="file" accept=".csv,.xlsx,.xls" multiple onChange={onFileInput} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }} />
              </label>
              <button onClick={() => { setTransactions([]); setAiResponse(""); setFileNames([]); setFilterMonth("All"); setFilterCat("All"); setSearch(""); }}
                style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#6b7280", padding: "0.4rem 0.9rem", borderRadius: 6, cursor: "pointer", fontFamily: "DM Mono", fontSize: "0.8rem" }}>
                ← Clear all
              </button>
            </div>
          </>
        )}
        {error && <div className="error">{error}</div>}
      </div>
    </>
  );
}
