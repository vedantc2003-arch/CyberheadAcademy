import React from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

export const Footer = () => (
  <footer className="border-t border-slate-800 bg-slate-950">
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-10 md:grid-cols-4">
        <div className="md:col-span-1">
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
            Learn Cybersecurity. Build. Break. Defend. Practical, lab-driven training for the next generation of security professionals.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            <span className="pulse-dot h-2 w-2 rounded-full bg-emerald-400" /> SafeLine WAF · Active Protection
          </div>
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold text-white">Platform</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
            <li><Link to="/courses" className="hover:text-cyan-400">Courses</Link></li>
            <li><Link to="/security-lab" className="hover:text-cyan-400">Security Lab</Link></li>
            <li><Link to="/security-lab/dashboard" className="hover:text-cyan-400">WAF Demo</Link></li>
            <li><Link to="/api/docs" className="hover:text-cyan-400">API Docs</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold text-white">Company</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
            <li><Link to="/contact" className="hover:text-cyan-400">Contact</Link></li>
            <li><Link to="/register" className="hover:text-cyan-400">Get Started</Link></li>
            <li><Link to="/login" className="hover:text-cyan-400">Student Login</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold text-white">Tracks</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
            <li>Web Security</li>
            <li>Pentesting</li>
            <li>Bug Bounty</li>
            <li>WAF &amp; Defense</li>
          </ul>
        </div>
      </div>
      <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-800 pt-6 text-xs text-slate-500 sm:flex-row">
        <p>© {new Date().getFullYear()} CyberHead Academy · cyberheadacademy.com</p>
        <p className="font-mono">Secure by default · Parameterized · Rate-limited</p>
      </div>
    </div>
  </footer>
);
