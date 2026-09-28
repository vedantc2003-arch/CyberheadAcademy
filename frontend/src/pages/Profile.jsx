import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Profile() {
  const { setUser } = useAuth();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/user/profile").then(({ data }) => setForm(data.user)).catch(() => {});
  }, []);

  if (!form) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-cyan-500" /></div>;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put("/user/profile", { name: form.name, bio: form.bio, photo: form.photo });
      setUser(data.user);
      setForm(data.user);
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="font-mono text-xs uppercase tracking-widest text-cyan-400">Account</p>
      <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-white">Your profile</h1>

      <div className="mt-8 flex items-center gap-4">
        {form.photo ? (
          <img src={form.photo} alt={form.name} className="h-16 w-16 rounded-full object-cover ring-2 ring-slate-700" />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/15 font-display text-2xl font-bold text-cyan-400">{form.name?.[0]}</span>
        )}
        <div>
          <p className="font-display text-lg font-semibold text-white">{form.name}</p>
          <p className="text-sm text-slate-400">{form.email}</p>
          {form.role === "admin" && <span className="mt-1 inline-block rounded bg-cyan-500/15 px-2 py-0.5 text-xs font-medium text-cyan-400">Admin</span>}
        </div>
      </div>

      <form onSubmit={save} className="mt-8 space-y-5 rounded-xl border border-slate-800 bg-slate-900/70 p-6">
        <div>
          <Label htmlFor="name" className="text-slate-300">Full name</Label>
          <Input id="name" data-testid="profile-name-input" value={form.name || ""} onChange={set("name")} className="mt-1.5 border-slate-700 bg-slate-950 text-slate-100" />
        </div>
        <div>
          <Label htmlFor="email" className="text-slate-300">Email</Label>
          <Input id="email" data-testid="profile-email-input" value={form.email || ""} disabled className="mt-1.5 border-slate-800 bg-slate-950/60 text-slate-500" />
          <p className="mt-1 text-xs text-slate-500">Email cannot be changed.</p>
        </div>
        <div>
          <Label htmlFor="photo" className="text-slate-300">Profile photo URL</Label>
          <Input id="photo" data-testid="profile-photo-input" value={form.photo || ""} onChange={set("photo")} placeholder="https://…" className="mt-1.5 border-slate-700 bg-slate-950 text-slate-100" />
        </div>
        <div>
          <Label htmlFor="bio" className="text-slate-300">Bio</Label>
          <Textarea id="bio" data-testid="profile-bio-input" value={form.bio || ""} onChange={set("bio")} rows={4} placeholder="Tell us about yourself…" className="mt-1.5 border-slate-700 bg-slate-950 text-slate-100" />
        </div>
        <Button type="submit" data-testid="profile-save-button" disabled={saving} className="bg-cyan-500 font-semibold text-slate-950 hover:bg-cyan-400">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-1.5 h-4 w-4" /> Save changes</>}
        </Button>
      </form>
    </div>
  );
}
