import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuestionStore } from '@/stores/questionStore'
import type { QuestionSummary } from '@/types/question.types'
import Navbar from '@/components/Navbar'

const difficultyConfig: Record<QuestionSummary['difficulty'], { label: string; bg: string; text: string }> = {
  EASY: { label: 'Easy', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  MEDIUM: { label: 'Medium', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  HARD: { label: 'Hard', bg: 'bg-red-500/10', text: 'text-red-400' },
};

function acceptanceRate(q: QuestionSummary): string {
  if (q.totalSubmissions === 0) return '--';
  return ((q.acceptedSubmissions / q.totalSubmissions) * 100).toFixed(1) + '%';
}

export default function QuestionsPage() {
  const navigate = useNavigate();
  const { questions, isLoading: loading, error, fetchQuestions } = useQuestionStore();
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const filtered = questions.filter(q => {
    if (diffFilter !== 'ALL' && q.difficulty !== diffFilter) return false;
    if (search && !q.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />

      <div className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Problems</h1>
          <p className="text-zinc-500 text-sm">Sharpen your skills with coding challenges</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problems..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>
          <div className="flex gap-2">
            {['ALL', 'EASY', 'MEDIUM', 'HARD'].map(diff => (
              <button
                key={diff}
                onClick={() => setDiffFilter(diff)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  diffFilter === diff
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
              >
                {diff === 'ALL' ? 'All' : diff.charAt(0) + diff.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        {!loading && !error && questions.length > 0 && (
          <div className="flex gap-6 mb-6 text-sm">
            <span className="text-zinc-500">
              <span className="text-white font-medium">{filtered.length}</span> problems
            </span>
            <span className="text-zinc-500">
              <span className="text-emerald-400 font-medium">{questions.filter(q => q.difficulty === 'EASY').length}</span> easy
            </span>
            <span className="text-zinc-500">
              <span className="text-amber-400 font-medium">{questions.filter(q => q.difficulty === 'MEDIUM').length}</span> medium
            </span>
            <span className="text-zinc-500">
              <span className="text-red-400 font-medium">{questions.filter(q => q.difficulty === 'HARD').length}</span> hard
            </span>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-zinc-500 text-sm">Loading problems...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Questions table */}
        {!loading && !error && filtered.length > 0 && (
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-left text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-5 w-14">#</th>
                  <th className="py-3.5 px-5">Title</th>
                  <th className="py-3.5 px-5 w-28">Difficulty</th>
                  <th className="py-3.5 px-5 w-28 text-right">Acceptance</th>
                  <th className="py-3.5 px-5 w-24 text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q, idx) => {
                  const diff = difficultyConfig[q.difficulty];
                  return (
                    <tr
                      key={q.id}
                      onClick={() => navigate(`/playground/${q.id}`)}
                      className="border-b border-zinc-800/50 last:border-b-0 hover:bg-zinc-800/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-5 text-zinc-600 font-mono text-xs">{idx + 1}</td>
                      <td className="py-3.5 px-5 font-medium text-zinc-200 group-hover:text-blue-400 transition-colors">
                        {q.title}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${diff.bg} ${diff.text}`}>
                          {diff.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right text-zinc-400 font-mono text-xs">{acceptanceRate(q)}</td>
                      <td className="py-3.5 px-5 text-right text-zinc-500 text-xs">{q.timeLimit}ms</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty states */}
        {!loading && !error && questions.length > 0 && filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-zinc-500 text-sm">No problems match your filters.</p>
          </div>
        )}

        {!loading && !error && questions.length === 0 && (
          <div className="text-center py-20">
            <p className="text-zinc-500 text-sm">No problems available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
