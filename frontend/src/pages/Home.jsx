import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck, Terminal, Bug, Radar, ArrowRight, CheckCircle2, Activity,
  Lock, Zap, GraduationCap, Star,
} from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/CourseCard";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

const stats = [
  { value: "10,000+", label: "Lab exercises completed" },
  { value: "99.8%", label: "WAF block rate" },
  { value: "45+", label: "Interactive modules" },
  { value: "24k", label: "Students trained" },
];

const whyItems = [
  { icon: Terminal, title: "Practical Labs, Not Theory", desc: "Every module ships with hands-on labs in a safe sandbox. You learn by doing, not by watching." },
  { icon: ShieldCheck, title: "SafeLine WAF Integration", desc: "See exactly how a modern WAF inspects, classifies and blocks suspicious traffic in real time." },
  { icon: Bug, title: "Real-World Attack Scenarios", desc: "Recreate the vulnerability classes that matter — access control, injection, SSRF and more." },
  { icon: Radar, title: "Career-Focused Outcomes", desc: "Build a portfolio, earn a Security Learning Score, and prepare for SOC, pentest and bug bounty roles." },
];

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [meta, setMeta] = useState({ testimonials: [], faqs: [] });

  useEffect(() => {
    api.get("/courses")
      .then(({ data }) => setCourses(Array.isArray(data?.courses) ? data.courses : []))
      .catch(() => setCourses([]));
    api.get("/meta")
      .then(({ data }) => setMeta({
        testimonials: Array.isArray(data?.testimonials) ? data.testimonials : [],
        faqs: Array.isArray(data?.faqs) ? data.faqs : [],
      }))
      .catch(() => setMeta({ testimonials: [], faqs: [] }));
  }, []);

  const featured = courses.find((c) => c.featured) || courses[0];
  const rest = courses.filter((c) => c.slug !== featured?.slug).slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="absolute inset-0 radial-cyan" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400">
              <span className="pulse-dot h-2 w-2 rounded-full bg-cyan-400" />
              <span className="font-mono uppercase tracking-widest">Learn · Build · Break · Defend</span>
            </div>
            <h1 className="mt-6 font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Master Cybersecurity.<br /><span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">One Skill at a Time.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Learn ethical hacking, bug bounty, web security, penetration testing and modern cybersecurity through practical, lab-driven learning.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/courses" data-testid="hero-explore-courses-button">
                <Button size="lg" className="w-full bg-cyan-500 font-semibold text-slate-950 hover:bg-cyan-400 sm:w-auto">
                  Explore Courses <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/register" data-testid="hero-start-learning-button">
                <Button size="lg" variant="outline" className="w-full border-slate-700 bg-slate-900/50 text-slate-100 hover:bg-slate-800 sm:w-auto">
                  Start Learning
                </Button>
              </Link>
            </div>
            {/* Live WAF status widget */}
            <div className="mt-10 inline-flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-slate-800 bg-slate-900/60 px-5 py-3 font-mono text-xs text-slate-400 backdrop-blur">
              <span className="flex items-center gap-2 text-emerald-400"><Activity className="h-3.5 w-3.5" /> SafeLine WAF: <span className="font-semibold">ACTIVE</span></span>
              <span>Requests today <span className="text-cyan-400">1,284</span></span>
              <span>Threats blocked <span className="text-rose-400">37</span></span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats banner */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center md:text-left">
              <p className="font-display text-3xl font-bold text-white lg:text-4xl">{s.value}</p>
              <p className="mt-1 text-sm text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular courses */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-cyan-400">Popular right now</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">Courses students love</h2>
          </div>
          <Link to="/courses" className="text-sm font-medium text-cyan-400 hover:text-cyan-300">View all courses →</Link>
        </div>
        {featured && (
          <div className="mt-10 space-y-6">
            <CourseCard course={featured} featured />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {rest.map((c) => <CourseCard key={c.slug} course={c} />)}
            </div>
          </div>
        )}
      </section>

      {/* Why */}
      <section className="border-y border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <p className="font-mono text-xs uppercase tracking-widest text-cyan-400">Why CyberHead Academy</p>
          <h2 className="mt-2 max-w-2xl font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
            Built for people who want to actually defend systems.
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {whyItems.map((w) => (
              <div key={w.title} className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 transition-colors hover:border-cyan-500/40">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                  <w.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-white">{w.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Lab teaser */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 lg:grid-cols-2 lg:p-12">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-emerald-400">Practical Learning</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">The Security Lab</h2>
            <p className="mt-4 text-base leading-relaxed text-slate-300">
              A controlled testing environment where you generate realistic traffic against the platform and watch SafeLine WAF inspect, classify and handle every request — live.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              {["Safe, sandboxed test endpoints", "Real-time request classification", "Live WAF traffic monitor & graphs"].map((t) => (
                <li key={t} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> {t}</li>
              ))}
            </ul>
            <Link to="/security-lab" data-testid="home-securitylab-cta">
              <Button className="mt-8 bg-emerald-500 font-semibold text-slate-950 hover:bg-emerald-400">Open Security Lab <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
            </Link>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 font-mono text-xs shadow-inner">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-slate-500">
              <span className="h-3 w-3 rounded-full bg-rose-500/70" /><span className="h-3 w-3 rounded-full bg-amber-500/70" /><span className="h-3 w-3 rounded-full bg-emerald-500/70" />
              <span className="ml-2">safeline-waf · live traffic</span>
            </div>
            <div className="space-y-2 pt-4 text-slate-400">
              <p><span className="text-emerald-400">10:42:11</span> GET /api/security-test/search <span className="text-emerald-400">200 OK</span></p>
              <p><span className="text-emerald-400">10:42:09</span> POST /api/security-test/input <span className="text-rose-400">403 BLOCKED</span> <span className="text-amber-400">SQLi</span></p>
              <p><span className="text-emerald-400">10:41:58</span> GET /api/courses <span className="text-emerald-400">200 OK</span></p>
              <p><span className="text-emerald-400">10:41:52</span> GET /api/security-test/resource <span className="text-rose-400">403 BLOCKED</span> <span className="text-amber-400">XSS</span></p>
              <p><span className="text-emerald-400">10:41:40</span> POST /api/security-test/traffic <span className="text-emerald-400">200 OK</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <p className="font-mono text-xs uppercase tracking-widest text-cyan-400">Career outcomes</p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">Trusted by working security professionals</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {meta.testimonials?.map((t) => (
              <div key={t.name} className="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
                <div className="flex gap-1 text-amber-400">{[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400" />)}</div>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">“{t.quote}”</p>
                <div className="mt-5 flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-700" />
                  <div className="text-xs"><p className="font-medium text-slate-200">{t.name}</p><p className="text-slate-500">{t.role}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-center font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">Frequently asked questions</h2>
        <Accordion type="single" collapsible className="mt-10">
          {meta.faqs?.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border-slate-800">
              <AccordionTrigger data-testid={`faq-${i}`} className="text-left font-medium text-slate-100 hover:text-cyan-400 hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="text-slate-400">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-900 to-slate-950 p-10 text-center lg:p-16">
          <div className="absolute inset-0 grid-bg opacity-40" />
          <div className="relative">
            <GraduationCap className="mx-auto h-10 w-10 text-cyan-400" />
            <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">Start your cybersecurity journey today</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-300">Join thousands of learners building real, defensible security skills.</p>
            <Link to="/register" data-testid="cta-register-button">
              <Button size="lg" className="mt-8 bg-cyan-500 font-semibold text-slate-950 hover:bg-cyan-400">Create your free account <Zap className="ml-1.5 h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
