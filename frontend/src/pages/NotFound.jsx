import React from "react";
import { Link } from "react-router-dom";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 text-center">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="relative">
        <ShieldOff className="mx-auto h-14 w-14 text-slate-600" />
        <p className="mt-6 font-mono text-6xl font-bold text-cyan-400">404</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-white">Page not found</h1>
        <p className="mt-2 text-slate-400">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/"><Button className="mt-6 bg-cyan-500 font-semibold text-slate-950 hover:bg-cyan-400">Back to home</Button></Link>
      </div>
    </div>
  );
}
