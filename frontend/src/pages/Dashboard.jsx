import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Loader2, Trophy, BookMarked, FlaskConical, Clock, ArrowRight, Activity,
} from "lucide-react";
import api from "@/lib/api";
import { Progress } from "@/components/ui/progress";

const classBadge = {
  NORMAL: "text-emerald-400",
  SQL_INJECTION: "text-rose-400",
  XSS: "text-amber-400",
  COMMAND_INJECTION: "text-rose-400",
  PATH_TRAVERSAL: "text-amber-400",
};

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/user/dashboard").then(({ data }) => setData(data)).catch(() => {});
  }, []);

  if (!data) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-cyan-500" /></div>;

  const { user, enrollments, stats, recent_activity } = data;
  const cards = [
    { icon: Trophy, label: "Security Score", value: `${stats.security_score}`, sub: "/ 1000", color: "text-cyan-400" },
    { icon: FlaskConical, label: "Labs Completed", value: stats.labs_completed, color: "text-emerald-400" },
    { icon: BookMarked, label: "Enrolled Courses", value: stats.enrolled, color: "text-amber-400" },
    { icon: Clock, label: "Hours Spent", value: `${stats.hours_spent}h`, color: "text-slate-200" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-cyan-400">Student dashboard</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-white" data-testid="dashboard-welcome">Welcome back, {user.name.split(" ")[0]}</h1>
        </div>
        <Link to="/courses"><button className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400">Browse courses <ArrowRight className="h-4 w-4" /></button></Link>
      </div>

      {/* Metric cards */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} data-testid={`stat-${c.label}`} className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
            <c.icon className={`h-5 w-5 ${c.color}`} />
            <p className="mt-3 font-display text-2xl font-bold text-white">{c.value}<span className="text-base font-normal text-slate-500">{c.sub || ""}</span></p>
            <p className="mt-0.5 text-xs text-slate-400">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Learning progress */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="font-display text-lg font-semibold text-white">Your learning progress</h2>
            {enrollments.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-slate-400">You haven't enrolled in any courses yet.</p>
                <Link to="/courses" className="mt-3 inline-block text-sm font-medium text-cyan-400 hover:text-cyan-300">Find your first course →</Link>
              </div>
            ) : (
              <div className="mt-5 space-y-5" data-testid="enrollments-list">
                {enrollments.map((e) => (
                  <div key={e.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-200">{e.course_title}</span>
                      <span className="font-mono text-cyan-400">{e.progress}%</span>
                    </div>
                    <Progress value={e.progress} className="mt-2 h-2 bg-slate-800" />
                    <p className="mt-1 text-xs text-slate-500">{e.completed_lessons}/{e.total_lessons} lessons completed</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent activity + profile */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white"><Activity className="h-4 w-4 text-emerald-400" /> Recent lab activity</h2>
            <div className="mt-4 space-y-3 font-mono text-xs">
              {recent_activity.length === 0 ? (
                <p className="text-slate-500">No lab activity yet. Try the Security Lab.</p>
              ) : recent_activity.map((a) => (
                <div key={a.id} className="flex items-center justify-between border-b border-slate-800/60 pb-2 text-slate-400">
                  <span className="truncate">{a.method} {a.path.replace("/api/security-test/", "…/")}</span>
                  <span className={classBadge[a.classification] || "text-slate-400"}>{a.classification === "NORMAL" ? "OK" : a.classification.split("_")[0]}</span>
                </div>
              ))}
            </div>
            <Link to="/security-lab" className="mt-4 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300">Open Security Lab →</Link>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="font-display text-lg font-semibold text-white">Profile</h2>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/15 font-display text-lg font-bold text-cyan-400">{user.name[0]}</span>
              <div className="text-sm"><p className="font-medium text-slate-100">{user.name}</p><p className="text-slate-500">{user.email}</p></div>
            </div>
            <Link to="/profile" className="mt-4 inline-block text-sm font-medium text-cyan-400 hover:text-cyan-300">Edit profile →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
