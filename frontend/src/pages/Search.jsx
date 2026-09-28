import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/CourseCard";

export default function Search() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const q = params.get("q") || "";
  const [term, setTerm] = useState(q);
  const [results, setResults] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) { setResults([]); setCount(0); return; }
    setLoading(true);
    api.get(`/courses/search?q=${encodeURIComponent(q)}`)
      .then(({ data }) => { setResults(Array.isArray(data?.courses) ? data.courses : []); setCount(data?.count || 0); })
      .catch(() => { setResults([]); setCount(0); })
      .finally(() => setLoading(false));
  }, [q]);

  const submit = (e) => {
    e.preventDefault();
    setParams(term.trim() ? { q: term.trim() } : {});
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">Search courses</h1>
      <form onSubmit={submit} className="mt-6 flex max-w-xl gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            data-testid="search-page-input"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Try 'web', 'bug bounty', 'api'…"
            className="border-slate-700 bg-slate-900 pl-9 text-slate-100 placeholder:text-slate-500"
          />
        </div>
        <Button type="submit" data-testid="search-page-button" className="bg-cyan-500 font-semibold text-slate-950 hover:bg-cyan-400">Search</Button>
      </form>

      {q && !loading && (
        <p className="mt-6 text-sm text-slate-400" data-testid="search-results-count">
          {count} result{count === 1 ? "" : "s"} for <span
  className="font-mono text-cyan-400"
  dangerouslySetInnerHTML={{
    __html: `“${q}”`
  }}
/>
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-cyan-500" /></div>
      ) : q && results.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-slate-400">No courses matched your search.</p>
          <Button onClick={() => navigate("/courses")} variant="outline" className="mt-4 border-slate-700 text-slate-200">Browse all courses</Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="search-results-grid">
          {results.map((c) => <CourseCard key={c.slug} course={c} />)}
        </div>
      )}
    </div>
  );
}
