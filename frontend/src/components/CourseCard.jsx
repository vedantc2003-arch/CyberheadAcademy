import React from "react";
import { useNavigate } from "react-router-dom";
import { Star, Clock, BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const diffColor = {
  Beginner: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  Intermediate: "border-cyan-500/40 bg-cyan-500/10 text-cyan-400",
  Advanced: "border-amber-500/40 bg-amber-500/10 text-amber-400",
};

export const CourseCard = ({ course, featured = false }) => {
  const navigate = useNavigate();
  const go = () => navigate(`/courses/${course.slug || course.id}`);

  return (
    <div
      data-testid={`course-card-${course.slug}`}
      className={`group flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 shadow-lg shadow-black/40 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/40 ${featured ? "md:flex-row" : ""}`}
    >
      <div className={`relative overflow-hidden ${featured ? "md:w-1/2" : ""}`}>
        <img
          src={course.thumb}
          alt={course.title}
          loading="lazy"
          className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${featured ? "h-56 md:h-full" : "h-44"}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
        <span className={`absolute left-3 top-3 rounded-md border px-2 py-0.5 text-xs font-medium ${diffColor[course.difficulty]}`}>
          {course.difficulty}
        </span>
        <span className="absolute right-3 top-3 rounded-md bg-slate-950/80 px-2 py-0.5 text-xs font-medium text-slate-300 backdrop-blur">
          {course.category}
        </span>
      </div>
      <div className={`flex flex-1 flex-col p-5 ${featured ? "md:w-1/2 md:p-7" : ""}`}>
        <h3 className={`font-display font-semibold leading-tight text-white ${featured ? "text-2xl" : "text-lg"}`}>{course.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400 line-clamp-3">{course.short}</p>
        <div className="mt-4 flex items-center gap-3">
          <img src={course.instructor?.avatar} alt={course.instructor?.name} className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-700" />
          <div className="text-xs">
            <p className="font-medium text-slate-200">{course.instructor?.name}</p>
            <p className="text-slate-500">{course.instructor?.title}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {course.rating}</span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {course.duration_hours}h</span>
          <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {course.lessons_count} lessons</span>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
          <span className="font-display text-xl font-bold text-white">${course.price}</span>
          <Button onClick={go} data-testid={`course-enroll-${course.slug}`} className="bg-cyan-500 font-semibold text-slate-950 hover:bg-cyan-400">
            View Course <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
