import React, { useEffect, useState } from "react";
import {
  Users, BookOpen, GraduationCap, Mail, Activity, AlertTriangle, Loader2,
} from "lucide-react";
import api from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const classColor = {
  NORMAL: "text-emerald-400", SQL_INJECTION: "text-rose-400", XSS: "text-amber-400",
  COMMAND_INJECTION: "text-rose-400", PATH_TRAVERSAL: "text-amber-400",
};

export default function Admin() {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api.get("/admin/overview").then(({ data }) => setOverview(data)).catch(() => {});
    api.get("/admin/users").then(({ data }) => setUsers(data.users)).catch(() => {});
    api.get("/admin/enrollments").then(({ data }) => setEnrollments(data.enrollments)).catch(() => {});
    api.get("/admin/messages").then(({ data }) => setMessages(data.messages)).catch(() => {});
    api.get("/admin/logs?limit=100").then(({ data }) => setLogs(data.logs)).catch(() => {});
  }, []);

  if (!overview) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-cyan-500" /></div>;

  const cards = [
    { label: "Users", value: overview.users, icon: Users },
    { label: "Courses", value: overview.courses, icon: BookOpen },
    { label: "Enrollments", value: overview.enrollments, icon: GraduationCap },
    { label: "Messages", value: overview.messages, icon: Mail },
    { label: "Requests", value: overview.requests, icon: Activity },
    { label: "Suspicious", value: overview.suspicious, icon: AlertTriangle },
  ];

  const th = "pb-2 pr-4 font-medium text-slate-500";
  const td = "py-2 pr-4 text-slate-300";

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="font-mono text-xs uppercase tracking-widest text-cyan-400">Administration</p>
      <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-white">Admin Panel</h1>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <div key={c.label} data-testid={`admin-stat-${c.label}`} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <c.icon className="h-4 w-4 text-cyan-400" />
            <p className="mt-2 font-display text-xl font-bold text-white">{c.value?.toLocaleString()}</p>
            <p className="text-xs text-slate-400">{c.label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="users" className="mt-8">
        <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-slate-900/70">
          <TabsTrigger value="users" data-testid="admin-tab-users">Users</TabsTrigger>
          <TabsTrigger value="enrollments" data-testid="admin-tab-enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="messages" data-testid="admin-tab-messages">Messages</TabsTrigger>
          <TabsTrigger value="logs" data-testid="admin-tab-logs">Request Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead><tr className="border-b border-slate-800"><th className={th}>Name</th><th className={th}>Email</th><th className={th}>Role</th><th className={th}>Joined</th></tr></thead>
            <tbody data-testid="admin-users-table">
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-800/50">
                  <td className={td}>{u.name}</td><td className={td}>{u.email}</td>
                  <td className={td}><span className={u.role === "admin" ? "text-cyan-400" : "text-slate-400"}>{u.role}</span></td>
                  <td className="py-2 font-mono text-xs text-slate-500">{u.created_at?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabsContent>

        <TabsContent value="enrollments" className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead><tr className="border-b border-slate-800"><th className={th}>Course</th><th className={th}>Progress</th><th className={th}>Lessons</th><th className={th}>Enrolled</th></tr></thead>
            <tbody data-testid="admin-enrollments-table">
              {enrollments.map((e) => (
                <tr key={e.id} className="border-b border-slate-800/50">
                  <td className={td}>{e.course_title}</td><td className="py-2 pr-4 font-mono text-cyan-400">{e.progress}%</td>
                  <td className={td}>{e.completed_lessons}/{e.total_lessons}</td>
                  <td className="py-2 font-mono text-xs text-slate-500">{e.created_at?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabsContent>

        <TabsContent value="messages" className="mt-4 space-y-3">
          {messages.length === 0 ? <p className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-sm text-slate-400">No contact messages yet.</p> :
            messages.map((m) => (
              <div key={m.id} data-testid="admin-message-row" className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-100">{m.subject}</p>
                  <span className="font-mono text-xs text-slate-500">{m.created_at?.slice(0, 16).replace("T", " ")}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{m.name} · {m.email}</p>
                <p className="mt-2 text-sm text-slate-300">{m.message}</p>
              </div>
            ))}
        </TabsContent>

        <TabsContent value="logs" className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4">
          <table className="w-full min-w-[640px] text-left font-mono text-xs">
            <thead><tr className="border-b border-slate-800"><th className={th}>Time</th><th className={th}>Method</th><th className={th}>Path</th><th className={th}>Status</th><th className={th}>Class</th><th className={th}>IP</th></tr></thead>
            <tbody data-testid="admin-logs-table">
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-slate-800/50 text-slate-400">
                  <td className="py-2 pr-4">{l.timestamp?.slice(11, 19)}</td>
                  <td className="py-2 pr-4 text-cyan-400">{l.method}</td>
                  <td className="py-2 pr-4 max-w-[220px] truncate text-slate-300">{l.path}</td>
                  <td className="py-2 pr-4">{l.status_code}</td>
                  <td className={`py-2 pr-4 ${classColor[l.classification] || ""}`}>{l.classification}</td>
                  <td className="py-2 text-slate-600">{l.source_ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
