import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Check, Code2, ExternalLink } from "lucide-react";
import api from "@/lib/api";

const methodColor = {
  GET: "bg-emerald-500/15 text-emerald-400",
  POST: "bg-cyan-500/15 text-cyan-400",
  PUT: "bg-amber-500/15 text-amber-400",
  "GET/POST": "bg-slate-700 text-slate-300",
  DELETE: "bg-rose-500/15 text-rose-400",
};

export default function ApiDocs() {
  const [spec, setSpec] = useState(null);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    api.get("/docs-spec").then(({ data }) => setSpec(data)).catch(() => {});
  }, []);

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(""), 1500);
  };

  const backend = process.env.REACT_APP_BACKEND_URL;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400"><Code2 className="h-6 w-6" /></span>
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">API Documentation</h1>
          <p className="text-sm text-slate-400">REST API for the CyberHead Academy platform &amp; Security Lab.</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 font-mono text-sm">
        <span className="text-slate-500">Base URL</span>
        <code className="text-cyan-400">{backend}/api</code>
        <a href={`${backend}/api/swagger`} target="_blank" rel="noreferrer" data-testid="swagger-link" className="ml-auto inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300">
          OpenAPI / Swagger <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950 p-5">
        <p className="mb-3 text-xs uppercase tracking-widest text-slate-500">Example — cURL</p>
        <div className="flex items-start justify-between gap-3 rounded-lg bg-slate-900 p-4 font-mono text-xs text-emerald-300">
          <pre className="overflow-x-auto whitespace-pre-wrap">{`curl "${backend}/api/courses/search?q=web"`}</pre>
          <button onClick={() => copy(`curl "${backend}/api/courses/search?q=web"`)} className="shrink-0 text-slate-400 hover:text-cyan-400">
            {copied.includes("search?q=web") ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {spec?.groups.map((g) => (
          <div key={g.group}>
            <h2 className="font-display text-lg font-semibold text-white">{g.group}</h2>
            <div className="mt-3 divide-y divide-slate-800 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">
              {g.endpoints.map((e) => (
                <div key={e.path} data-testid={`api-endpoint-${e.path}`} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
                  <span className={`inline-flex w-fit shrink-0 justify-center rounded px-2 py-0.5 text-xs font-semibold ${methodColor[e.method] || "bg-slate-700 text-slate-300"}`}>{e.method}</span>
                  <code className="font-mono text-sm text-slate-200">{e.path}</code>
                  <span className="text-sm text-slate-500 sm:ml-auto sm:text-right">{e.desc}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
