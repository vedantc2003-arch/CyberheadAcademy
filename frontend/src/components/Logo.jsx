import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

export const Logo = ({ className = "" }) => (
  <Link to="/" className={`flex items-center gap-2.5 group ${className}`} data-testid="brand-logo">
    <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 shadow-lg shadow-cyan-500/20">
      <ShieldCheck className="h-5 w-5 text-slate-950" strokeWidth={2.4} />
    </div>
    <div className="leading-none">
      <span className="font-display text-lg font-bold tracking-tight text-white">CyberHead</span>
      <span className="ml-1 font-display text-lg font-bold tracking-tight text-cyan-400">Academy</span>
    </div>
  </Link>
);
