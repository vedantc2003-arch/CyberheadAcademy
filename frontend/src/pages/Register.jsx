import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm_password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm_password) { setError("Passwords do not match."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const u = await register(form);
      toast.success(`Welcome to CyberHead, ${u.name}!`);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute inset-0 radial-cyan" />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500">
          <ShieldCheck className="h-6 w-6 text-slate-950" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-white">Create your account</h1>
        <p className="mt-1 text-sm text-slate-400">Start learning cybersecurity for real.</p>

        {error && <div data-testid="register-error" className="mt-5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-400">{error}</div>}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="name" className="text-slate-300">Full name</Label>
            <Input id="name" data-testid="register-name-input" required value={form.name} onChange={set("name")} placeholder="Jane Doe" className="mt-1.5 border-slate-700 bg-slate-950 text-slate-100" />
          </div>
          <div>
            <Label htmlFor="email" className="text-slate-300">Email</Label>
            <Input id="email" data-testid="register-email-input" type="email" required value={form.email} onChange={set("email")} placeholder="you@example.com" className="mt-1.5 border-slate-700 bg-slate-950 text-slate-100" />
          </div>
          <div>
            <Label htmlFor="password" className="text-slate-300">Password</Label>
            <Input id="password" data-testid="register-password-input" type="password" required value={form.password} onChange={set("password")} placeholder="At least 8 characters" className="mt-1.5 border-slate-700 bg-slate-950 text-slate-100" />
          </div>
          <div>
            <Label htmlFor="confirm" className="text-slate-300">Confirm password</Label>
            <Input id="confirm" data-testid="register-confirm-input" type="password" required value={form.confirm_password} onChange={set("confirm_password")} placeholder="Re-enter password" className="mt-1.5 border-slate-700 bg-slate-950 text-slate-100" />
          </div>
          <Button type="submit" data-testid="register-submit-button" disabled={loading} className="w-full bg-cyan-500 font-semibold text-slate-950 hover:bg-cyan-400">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account? <Link to="/login" className="font-medium text-cyan-400 hover:text-cyan-300">Log in</Link>
        </p>
      </div>
    </div>
  );
}
