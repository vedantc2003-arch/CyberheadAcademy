import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/CourseCard";

const CATEGORIES = ["All", "Web Security", "Pentesting", "WAF & Defense", "Bug Bounty"];
const DIFFICULTIES = ["All", "Beginner", "Intermediate", "Advanced"];

export default function Courses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("All");
  const [diff, setDiff] = useState("All");
  const [q, setQ] = useState("");

  useEffect(() => {
    api.get("/courses").then(({ data }) => { setCourses(data.courses); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => courses.filter((c) =>
    (cat === "All" || c.category === cat) && (diff === "All" || c.difficulty === diff)
  ), [courses, cat, diff]);

  const submitSearch = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div className="relative">
      <div className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="font-mono text-xs uppercase tracking-widest text-cyan-400">Course catalogue</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">Cybersecurity Courses</h1>
          <p className="mt-3 max-w-2xl text-slate-400">Hands-on tracks across web security, pentesting, bug bounty and defense. Pick a path and start building real skills.</p>
          <form onSubmit={submitSearch} className="mt-6 flex max-w-md gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                data-testid="courses-search-input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search courses…"
                className="border-slate-700 bg-slate-900 pl-9 text-slate-100 placeholder:text-slate-500"
              />
            </div>
            <Button type="submit" data-testid="courses-search-button" className="bg-cyan-500 font-semibold text-slate-950 hover:bg-cyan-400">Search</Button>
          </form>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c} data-testid={`filter-cat-${c}`} onClick={() => setCat(c)}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${cat === c ? "border-cyan-500 bg-cyan-500/15 text-cyan-400" : "border-slate-700 text-slate-300 hover:border-slate-500"}`}>
                {c}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {DIFFICULTIES.map((d) => (
              <button key={d} data-testid={`filter-diff-${d}`} onClick={() => setDiff(d)}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${diff === d ? "border-emerald-500 bg-emerald-500/15 text-emerald-400" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-cyan-500" /></div>
        ) : filtered.length === 0 ? (
          <p className="py-24 text-center text-slate-400">No courses match those filters.</p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="courses-grid">
            {filtered.map((c) => <CourseCard key={c.slug} course={c} />)}
          </div>
        )}
      </div>
    </div>
  );
}
