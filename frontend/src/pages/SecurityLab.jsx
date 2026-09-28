import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, Send, Terminal, Database, FileSearch, Zap, Loader2, Info } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const classColor = {
  NORMAL: "text-emerald-400",
  SQL_INJECTION: "text-rose-400",
  XSS: "text-amber-400",
  COMMAND_INJECTION: "text-rose-400",
  PATH_TRAVERSAL: "text-amber-400",
};

const SAMPLES = [
  { label: "Normal query", value: "web application security" },
  { label: "SQLi pattern", value: "1' OR '1'='1' UNION SELECT * FROM users--" },
  { label: "XSS pattern", value: "<script>alert(document.cookie)</script>" },
  { label: "Command injection", value: "test; cat /etc/passwd" },
];

export default function SecurityLab() {
  const [searchInput, setSearchInput] = useState("");
  const [payload, setPayload] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [log, setLog] = useState([]);
  const [busy, setBusy] = useState(null);

  const append = (entry) => setLog((l) => [{ ...entry, t: new Date().toLocaleTimeString() }, ...l].slice(0, 25));

  const run = async (key, fn) => {
    setBusy(key);
    try {
      const res = await fn();
      append({ endpoint: res.endpoint || key, classification: res.classification || "NORMAL", requestId: res.requestId, status: 200 });
    } catch (e) {
      append({ endpoint: key, classification: "ERROR", status: e?.response?.status || 0, requestId: "-" });
    } finally {
      setBusy(null);
    }
  };

  const testSearch = () => run("/api/security-test/search", async () => (await api.get(`/security-test/search?q=${encodeURIComponent(searchInput)}`)).data);
  const testInput = () => run("/api/security-test/input", async () => (await api.post("/security-test/input", { payload, label: "manual" })).data);
  const testResource = () => run("/api/security-test/resource", async () => (await api.get(`/security-test/resource?id=${encodeURIComponent(resourceId)}`)).data);
  const testTraffic = () => run("/api/security-test/traffic", async () => (await api.post("/security-test/traffic", {})).data);

  const burst = async () => {
    setBusy("burst");
    for (let i = 0; i < 12; i++) {
      // eslint-disable-next-line no-await-in-loop
      await run("/api/security-test/traffic", async () => (await api.post("/security-test/traffic", {})).data);
    }
    setBusy(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <h1 className="font-display text-xl font-bold text-white">CyberHead Academy Security Testing Environment</h1>
            <p className="mt-1 text-sm text-slate-300">All tests are performed against this application in a controlled environment. Inputs are safely classified and logged for demonstration — <span className="font-medium text-amber-300">never executed as code or SQL.</span></p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Test panels */}
        <div className="space-y-5">
          {/* Search */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center gap-2 text-slate-200"><FileSearch className="h-4 w-4 text-cyan-400" /><h3 className="font-display font-semibold">Search endpoint</h3></div>
            <p className="mt-1 font-mono text-xs text-slate-500">GET /api/security-test/search?q=</p>
            <div className="mt-3 flex gap-2">
              <Input data-testid="lab-search-input" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Enter a query…" className="border-slate-700 bg-slate-950 text-slate-100" />
              <Button data-testid="lab-search-send" onClick={testSearch} disabled={busy} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400">{busy === "/api/security-test/search" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {SAMPLES.map((s) => <button key={s.label} onClick={() => setSearchInput(s.value)} className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-400 hover:border-cyan-500/50 hover:text-cyan-400">{s.label}</button>)}
            </div>
          </div>

          {/* Input */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center gap-2 text-slate-200"><Terminal className="h-4 w-4 text-cyan-400" /><h3 className="font-display font-semibold">Input endpoint</h3></div>
            <p className="mt-1 font-mono text-xs text-slate-500">POST /api/security-test/input</p>
            <Textarea data-testid="lab-input-payload" value={payload} onChange={(e) => setPayload(e.target.value)} rows={2} placeholder="Enter a payload…" className="mt-3 border-slate-700 bg-slate-950 text-slate-100" />
            <Button data-testid="lab-input-send" onClick={testInput} disabled={busy} className="mt-3 bg-cyan-500 text-slate-950 hover:bg-cyan-400">{busy === "/api/security-test/input" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send payload"}</Button>
          </div>

          {/* Resource */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center gap-2 text-slate-200"><Database className="h-4 w-4 text-cyan-400" /><h3 className="font-display font-semibold">Resource endpoint</h3></div>
            <p className="mt-1 font-mono text-xs text-slate-500">GET /api/security-test/resource?id=</p>
            <div className="mt-3 flex gap-2">
              <Input data-testid="lab-resource-input" value={resourceId} onChange={(e) => setResourceId(e.target.value)} placeholder="Resource id…" className="border-slate-700 bg-slate-950 text-slate-100" />
              <Button data-testid="lab-resource-send" onClick={testResource} disabled={busy} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400">{busy === "/api/security-test/resource" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button>
            </div>
          </div>

          {/* Traffic */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center gap-2 text-slate-200"><Zap className="h-4 w-4 text-emerald-400" /><h3 className="font-display font-semibold">Rate-limit / traffic endpoint</h3></div>
            <p className="mt-1 font-mono text-xs text-slate-500">POST /api/security-test/traffic</p>
            <div className="mt-3 flex gap-2">
              <Button data-testid="lab-traffic-send" onClick={testTraffic} disabled={busy} variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-800">Single request</Button>
              <Button data-testid="lab-traffic-burst" onClick={burst} disabled={busy} className="bg-emerald-500 font-semibold text-slate-950 hover:bg-emerald-400">{busy === "burst" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send 12 (burst)"}</Button>
            </div>
          </div>
        </div>

        {/* Live output */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="flex items-center gap-2 font-display font-semibold text-white"><Terminal className="h-4 w-4 text-emerald-400" /> Request output</h3>
            <Link to="/security-lab/dashboard" className="text-xs font-medium text-cyan-400 hover:text-cyan-300">View WAF dashboard →</Link>
          </div>
          <div className="mt-4 space-y-2 font-mono text-xs" data-testid="lab-output">
            {log.length === 0 ? (
              <p className="flex items-center gap-2 text-slate-500"><Info className="h-4 w-4" /> Run a test to see classified requests appear here.</p>
            ) : log.map((e, i) => (
              <div key={i} className="flex items-center justify-between border-b border-slate-800/60 pb-2 text-slate-400">
                <span className="truncate"><span className="text-slate-600">{e.t}</span> {e.endpoint}</span>
                <span className={classColor[e.classification] || "text-slate-400"}>{e.classification}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
