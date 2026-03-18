// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, authFetch } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { Progress } from '@/components/ui/progress';

interface CourseProgress {
  id: string;
  courseId: string;
  completedDayNum: number;
  course: {
    id: string;
    title: string;
    description: string | null;
    totalDays: number;
  };
}

export default function StudentCoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await authFetch(`${API_BASE}/course-progress/my-courses`);
        if (res.ok) {
          const data = await res.json();
          setCourses(Array.isArray(data) ? data : data.data ?? []);
        }
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetchCourses();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">My Courses</h1>
          <p className="text-sm text-zinc-400">Track your learning progress across all assigned courses.</p>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-12 text-zinc-400">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4 opacity-30">📚</div>
            <p className="text-zinc-400 text-lg mb-2">No courses assigned yet</p>
            <p className="text-zinc-500 text-sm">Courses assigned to your batch will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((cp) => {
              const total = cp.course.totalDays || 1;
              const completed = cp.completedDayNum || 0;
              const percent = Math.round((completed / total) * 100);

              return (
                <div
                  key={cp.id}
                  onClick={() => navigate(`/student/courses/${cp.course.id}`)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 cursor-pointer hover:border-zinc-700 hover:bg-zinc-900/80 transition-colors"
                >
                  <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">
                    {cp.course.title}
                  </h3>
                  {cp.course.description && (
                    <p className="text-zinc-400 text-sm mb-4 line-clamp-3">
                      {cp.course.description}
                    </p>
                  )}

                  <div className="mt-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-zinc-400 text-sm">
                        {completed}/{total} days completed
                      </span>
                      <span className="text-zinc-500 text-xs">{percent}%</span>
                    </div>
                    <Progress value={percent} className="h-2 bg-zinc-800" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
