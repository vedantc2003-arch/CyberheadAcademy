import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Star, Clock, BookOpen, BarChart3, Loader2, PlayCircle, CheckCircle2, ArrowLeft, ShieldCheck,
} from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/context/AuthContext";

const diffColor = {
  Beginner: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  Intermediate: "border-cyan-500/40 bg-cyan-500/10 text-cyan-400",
  Advanced: "border-amber-500/40 bg-amber-500/10 text-amber-400",
};

export default function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/courses/${id}`).then(({ data }) => setCourse(data.course)).catch(() => setCourse(null)).finally(() => setLoading(false));
  }, [id]);

  const enroll = async () => {
    if (!user) { navigate("/login", { state: { from: `/courses/${id}` } }); return; }
    setEnrolling(true);
    try {
      const { data } = await api.post(`/courses/${course.id}/enroll`);
      toast.success(data.already ? "You're already enrolled — jump back in!" : "Enrolled! Redirecting to your dashboard…");
      setTimeout(() => navigate("/dashboard"), 900);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-cyan-500" /></div>;
  if (!course) return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="font-display text-2xl font-bold text-white">Course not found</h1>
      <Link to="/courses"><Button className="mt-6 bg-cyan-500 text-slate-950">Back to courses</Button></Link>
    </div>
  );

  const totalLessons = course.modules?.reduce((a, m) => a + m.lessons.length, 0) || 0;

  return (
    <div>
      {/* Hero */}
      <section className="relative border-b border-slate-800 bg-slate-950">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div className="lg:col-span-2">
            <Link to="/courses" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-cyan-400"><ArrowLeft className="h-4 w-4" /> All courses</Link>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${diffColor[course.difficulty]}`}>{course.difficulty}</span>
              <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{course.category}</span>
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">{course.title}</h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300">{course.description}</p>
            <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-slate-400">
              <span className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {course.rating} rating</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {course.duration_hours} hours</span>
              <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> {totalLessons} lessons</span>
              <span className="flex items-center gap-1.5"><BarChart3 className="h-4 w-4" /> {course.students?.toLocaleString()} students</span>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <img src={course.instructor?.avatar} alt={course.instructor?.name} className="h-11 w-11 rounded-full object-cover ring-1 ring-slate-700" />
              <div className="text-sm"><p className="font-medium text-slate-100">{course.instructor?.name}</p><p className="text-slate-500">{course.instructor?.title}</p></div>
            </div>
          </div>

          {/* Enroll card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">
              <img src={course.thumb} alt={course.title} className="h-40 w-full object-cover" />
              <div className="p-6">
                <p className="font-display text-3xl font-bold text-white">${course.price}</p>
                <Button onClick={enroll} disabled={enrolling} data-testid="course-enroll-button" className="mt-4 w-full bg-cyan-500 font-semibold text-slate-950 hover:bg-cyan-400">
                  {enrolling ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enroll Now"}
                </Button>
                <ul className="mt-5 space-y-2.5 text-sm text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> {course.modules?.length} modules · {totalLessons} lessons</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Hands-on sandbox labs</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Completion certificate</li>
                  <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-400" /> Lifetime access</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-white">Course curriculum</h2>
        <p className="mt-2 text-sm text-slate-400">{course.modules?.length} modules · {totalLessons} lessons</p>
        <Accordion type="single" collapsible defaultValue="mod-0" className="mt-6" data-testid="curriculum-accordion">
          {course.modules?.map((m, i) => (
            <AccordionItem key={i} value={`mod-${i}`} className="mb-3 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 px-4">
              <AccordionTrigger data-testid={`module-${i}`} className="text-left hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 font-mono text-sm text-cyan-400">{String(m.order).padStart(2, "0")}</span>
                  <div>
                    <p className="font-medium text-slate-100">{m.title}</p>
                    <p className="text-xs text-slate-500">{m.lessons.length} lessons</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-1 pl-11">
                  {m.lessons.map((l, j) => (
                    <li key={j} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/60">
                      <span className="flex items-center gap-2"><PlayCircle className="h-4 w-4 text-slate-500" /> {l.title}</span>
                      <span className="font-mono text-xs text-slate-500">{l.duration_min}m</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
