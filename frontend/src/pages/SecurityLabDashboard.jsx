import React, { useEffect, useState, useCallback } from "react";
import {
  Activity, ShieldCheck, AlertTriangle, ArrowUpRight, RefreshCw, Loader2,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar,
} from "recharts";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";

const classColor = {
  NORMAL: "text-emerald-400",
  SQL_INJECTION: "text-rose-400",
  XSS: "text-amber-400",
  COMMAND_INJECTION: "text-rose-400",
  PATH_TRAVERSAL: "text-amber-400",
};
const statusColor = (s) => (s >= 500 ? "text-rose-400" : s >= 400 ? "text-amber-400" : "text-emerald-400");

export default function SecurityLabDashboard() {
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data } = await api.get("/security-test/stats");
      setStats(data);
    } catch { /* ignore */ }
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  if (!stats) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-cyan-500" /></div>;

  const methodData = [
    { name: "GET", value: stats.methods.GET || 0 },
    { name: "POST", value: stats.methods.POST || 0 },
  ];
  const cards = [
    { label: "Total requests", value: stats.total_requests, icon: Activity, color: "text-cyan-400" },
    { label: "Requests today", value: stats.requests_today, icon: ArrowUpRight, color: "text-emerald-400" },
    { label: "Suspicious patterns", value: stats.suspicious, icon: AlertTriangle, color: "text-rose-400" },
    { label: "WAF status", value: "ACTIVE", icon: ShieldCheck, color: "text-emerald-400", mono: true },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            <span className="pulse-dot h-2 w-2 rounded-full bg-emerald-400" /> SafeLine WAF · Active Protection
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-white">Security Lab Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">Live traffic monitor for the CyberHead controlled testing environment.</p>
        </div>
        <Button onClick={load} data-testid="waf-refresh-button" variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-800">
          <RefreshCw className={`mr-1.5 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Metric cards */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} data-testid={`waf-stat-${c.label}`} className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
            <c.icon className={`h-5 w-5 ${c.color}`} />
            <p className={`mt-3 font-display text-2xl font-bold text-white ${c.mono ? "font-mono text-emerald-400" : ""}`}>{typeof c.value === "number" ? c.value.toLocaleString() : c.value}</p>
            <p className="mt-0.5 text-xs text-slate-400">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Traffic timeline */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="font-display text-lg font-semibold text-white">Traffic over time</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.timeline}>
                <defs>
                  <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06B6D4" stopOpacity={0.5} /><stop offset="100%" stopColor="#06B6D4" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gSus" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F43F5E" stopOpacity={0.5} /><stop offset="100%" stopColor="#F43F5E" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="hour" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#0B0F17", border: "1px solid #1E293B", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="total" stroke="#06B6D4" fill="url(#gTotal)" strokeWidth={2} name="Total" />
                <Area type="monotone" dataKey="suspicious" stroke="#F43F5E" fill="url(#gSus)" strokeWidth={2} name="Suspicious" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Methods */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="font-display text-lg font-semibold text-white">Request methods</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={methodData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#0B0F17", border: "1px solid #1E293B", borderRadius: 8, fontSize: 12 }} cursor={{ fill: "#1E293B55" }} />
                <Bar dataKey="value" fill="#06B6D4" radius={[6, 6, 0, 0]} name="Requests" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white"><Activity className="h-4 w-4 text-emerald-400" /> Recent request log</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500">
                <th className="pb-2 pr-4 font-medium">Time</th>
                <th className="pb-2 pr-4 font-medium">Method</th>
                <th className="pb-2 pr-4 font-medium">Endpoint</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 pr-4 font-medium">Class</th>
                <th className="pb-2 font-medium">Request ID</th>
              </tr>
            </thead>
            <tbody data-testid="waf-log-table">
              {stats.recent.map((r) => (
                <tr key={r.id} data-testid="waf-log-table-row" className="border-b border-slate-800/50 text-slate-400">
                  <td className="py-2 pr-4">{r.timestamp?.slice(11, 19)}</td>
                  <td className="py-2 pr-4 text-cyan-400">{r.method}</td>
                  <td className="py-2 pr-4 max-w-[220px] truncate text-slate-300">{r.path}</td>
                  <td className={`py-2 pr-4 ${statusColor(r.status_code)}`}>{r.status_code}</td>
                  <td className={`py-2 pr-4 ${classColor[r.classification] || "text-slate-400"}`}>{r.classification}</td>
                  <td className="py-2 text-slate-600">{r.request_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
