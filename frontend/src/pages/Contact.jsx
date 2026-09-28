import React, { useState } from "react";
import { toast } from "sonner";
import { Loader2, Mail, MapPin, MessageSquare } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/contact", form);
      toast.success(data.message);
      setDone(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-cyan-400">Get in touch</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">Contact & support</h1>
          <p className="mt-4 text-slate-400">Questions about courses, the Security Lab, or partnerships? Send us a message and our team will respond shortly.</p>
          <div className="mt-8 space-y-4 text-sm">
            <div className="flex items-center gap-3 text-slate-300"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400"><Mail className="h-5 w-5" /></span> support@cyberheadacademy.com</div>
            <div className="flex items-center gap-3 text-slate-300"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400"><MessageSquare className="h-5 w-5" /></span> Live chat, Mon–Fri</div>
            <div className="flex items-center gap-3 text-slate-300"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400"><MapPin className="h-5 w-5" /></span> Remote-first · Worldwide</div>
          </div>
        </div>

        <form onSubmit={submit} className="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
          {done && <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400" data-testid="contact-success">Thanks! Your message has been received.</div>}
          <div className="space-y-4">
            <div>
              <Label htmlFor="cname" className="text-slate-300">Name</Label>
              <Input id="cname" data-testid="contact-name-input" required value={form.name} onChange={set("name")} className="mt-1.5 border-slate-700 bg-slate-950 text-slate-100" />
            </div>
            <div>
              <Label htmlFor="cemail" className="text-slate-300">Email</Label>
              <Input id="cemail" data-testid="contact-email-input" type="email" required value={form.email} onChange={set("email")} className="mt-1.5 border-slate-700 bg-slate-950 text-slate-100" />
            </div>
            <div>
              <Label htmlFor="csubject" className="text-slate-300">Subject</Label>
              <Input id="csubject" data-testid="contact-subject-input" required value={form.subject} onChange={set("subject")} className="mt-1.5 border-slate-700 bg-slate-950 text-slate-100" />
            </div>
            <div>
              <Label htmlFor="cmessage" className="text-slate-300">Message</Label>
              <Textarea id="cmessage" data-testid="contact-message-input" required rows={5} value={form.message} onChange={set("message")} className="mt-1.5 border-slate-700 bg-slate-950 text-slate-100" />
            </div>
            <Button type="submit" data-testid="contact-submit-button" disabled={loading} className="w-full bg-cyan-500 font-semibold text-slate-950 hover:bg-cyan-400">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send message"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
