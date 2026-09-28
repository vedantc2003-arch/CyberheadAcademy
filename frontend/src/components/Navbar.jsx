import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, User, LogOut, LayoutDashboard, Shield } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const links = [
  { to: "/courses", label: "Courses", id: "nav-courses-link" },
  { to: "/security-lab", label: "Security Lab", id: "nav-securitylab-link" },
  { to: "/security-lab/dashboard", label: "WAF Demo", id: "nav-wafdemo-link" },
  { to: "/api/docs", label: "API Docs", id: "nav-apidocs-link" },
];

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const doLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              data-testid={l.id}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-cyan-400 ${
                location.pathname === l.to ? "text-cyan-400" : "text-slate-300"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button data-testid="user-menu-trigger" className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 py-1 pl-1 pr-3 transition-colors hover:border-cyan-500/50">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/15 text-sm font-semibold text-cyan-400">
                    {user.name?.[0]?.toUpperCase() || "U"}
                  </span>
                  <span className="max-w-[90px] truncate text-sm text-slate-200">{user.name}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 border-slate-800 bg-slate-900 text-slate-200">
                <DropdownMenuItem onClick={() => navigate("/dashboard")} data-testid="menu-dashboard" className="cursor-pointer focus:bg-slate-800">
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile")} data-testid="menu-profile" className="cursor-pointer focus:bg-slate-800">
                  <User className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem onClick={() => navigate("/admin")} data-testid="menu-admin" className="cursor-pointer focus:bg-slate-800">
                    <Shield className="mr-2 h-4 w-4" /> Admin Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-slate-800" />
                <DropdownMenuItem onClick={doLogout} data-testid="menu-logout" className="cursor-pointer text-rose-400 focus:bg-slate-800 focus:text-rose-400">
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login" data-testid="nav-login-link">
                <Button variant="ghost" className="text-slate-200 hover:bg-slate-800 hover:text-white">Log in</Button>
              </Link>
              <Link to="/register" data-testid="nav-register-link">
                <Button className="bg-cyan-500 font-semibold text-slate-950 hover:bg-cyan-400">Start Learning</Button>
              </Link>
            </>
          )}
        </div>
        <button data-testid="mobile-menu-toggle" className="text-slate-200 md:hidden" onClick={() => setOpen((o) => !o)}>
          {open ? <X /> : <Menu />}
        </button>
      </nav>
      {open && (
        <div className="border-t border-slate-800 bg-slate-950 px-4 py-4 md:hidden">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-900">
              {l.label}
            </Link>
          ))}
          <div className="mt-3 flex flex-col gap-2 border-t border-slate-800 pt-3">
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)}><Button variant="outline" className="w-full border-slate-700">Dashboard</Button></Link>
                {user.role === "admin" && <Link to="/admin" onClick={() => setOpen(false)}><Button variant="outline" className="w-full border-slate-700">Admin</Button></Link>}
                <Button onClick={() => { setOpen(false); doLogout(); }} className="w-full bg-rose-500/90 text-white">Log out</Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)}><Button variant="outline" className="w-full border-slate-700 text-slate-200">Log in</Button></Link>
                <Link to="/register" onClick={() => setOpen(false)}><Button className="w-full bg-cyan-500 text-slate-950">Start Learning</Button></Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
