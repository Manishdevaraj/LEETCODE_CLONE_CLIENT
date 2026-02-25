// @ts-nocheck
//@ts-ignore
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchQuestions, type QuestionSummary } from '@/lib/editor.action'

const difficultyColor: Record<QuestionSummary['difficulty'], string> = {
  EASY: 'text-green-400',
  MEDIUM: 'text-yellow-400',
  HARD: 'text-red-400',
};

function acceptanceRate(q: QuestionSummary): string {
  if (q.totalSubmissions === 0) return '—';
  return ((q.acceptedSubmissions / q.totalSubmissions) * 100).toFixed(1) + '%';
}

export default function QuestionsPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions()
      .then(setQuestions)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen px-6 py-10 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Problems</h1>

      {loading && (
        <div className="text-gray-400 text-center py-20">Loading questions...</div>
      )}

      {error && (
        <div className="text-red-400 text-center py-20">{error}</div>
      )}

      {!loading && !error && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400 text-left">
              <th className="py-3 pr-4 w-10">#</th>
              <th className="py-3 pr-4">Title</th>
              <th className="py-3 pr-4">Difficulty</th>
              <th className="py-3 pr-4">Acceptance</th>
              <th className="py-3">Time Limit</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q, idx) => (
              <tr
                key={q.id}
                onClick={() => navigate(`/playground/${q.id}`)}
                className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors"
              >
                <td className="py-3 pr-4 text-gray-500">{idx + 1}</td>
                <td className="py-3 pr-4 font-medium hover:text-blue-400 transition-colors">
                  {q.title}
                </td>
                <td className={`py-3 pr-4 font-medium ${difficultyColor[q.difficulty]}`}>
                  {q.difficulty.charAt(0) + q.difficulty.slice(1).toLowerCase()}
                </td>
                <td className="py-3 pr-4 text-gray-400">{acceptanceRate(q)}</td>
                <td className="py-3 text-gray-400">{q.timeLimit}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && !error && questions.length === 0 && (
        <div className="text-gray-400 text-center py-20">No questions found.</div>
      )}
    </div>
  );
}
