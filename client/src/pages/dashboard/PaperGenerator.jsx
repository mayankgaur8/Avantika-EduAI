import { useState } from "react";
import api from "../../api/client";
import toast from "react-hot-toast";

const BOARDS = ["CBSE", "ICSE", "State Board", "JEE", "NEET", "Other"];
const GRADES = ["Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"];

const SECTION_STYLES = {
  A: { border: "border-indigo-100", bg: "bg-indigo-50", title: "text-indigo-900", sub: "text-indigo-600", badge: "bg-indigo-200 text-indigo-800", dot: "bg-indigo-100 text-indigo-700" },
  B: { border: "border-blue-100", bg: "bg-blue-50", title: "text-blue-900", sub: "text-blue-600", badge: "bg-blue-200 text-blue-800", dot: "bg-blue-100 text-blue-700" },
  C: { border: "border-green-100", bg: "bg-green-50", title: "text-green-900", sub: "text-green-600", badge: "bg-green-200 text-green-800", dot: "bg-green-100 text-green-700" },
};

function PaperResult({ paper, onReset }) {

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{paper.paper_title}</h2>
          <p className="text-sm text-gray-500">{paper.subject} · {paper.grade} · {paper.board} · {paper.total_marks} Marks · {paper.duration_minutes} min</p>
        </div>
        <button onClick={onReset} className="text-sm px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50">← New Paper</button>
      </div>

      {paper.general_instructions?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-900 mb-2">General Instructions:</p>
          <ul className="space-y-1">
            {paper.general_instructions.map((inst, i) => (
              <li key={i} className="text-xs text-amber-800 flex gap-2"><span>{i + 1}.</span>{inst}</li>
            ))}
          </ul>
        </div>
      )}

      {paper.sections?.map((section) => {
        const s = SECTION_STYLES[section.section] || SECTION_STYLES.A;
        return (
          <div key={section.section} className={`bg-white rounded-2xl border-2 ${s.border}`}>
            <div className={`${s.bg} rounded-t-2xl px-5 py-3 flex items-center justify-between`}>
              <div>
                <h3 className={`font-bold ${s.title}`}>Section {section.section}: {section.title}</h3>
                <p className={`text-xs ${s.sub}`}>{section.instructions} · {section.questions?.length} questions · {section.marks_per_question} mark each · Total: {section.total_marks} marks</p>
              </div>
              <span className={`text-xs font-bold ${s.badge} px-3 py-1 rounded-full`}>{section.total_marks}M</span>
            </div>
            <div className="p-5 space-y-4">
              {section.questions?.map((q, i) => (
                <div key={q.id || i} className="flex gap-3">
                  <span className={`flex-shrink-0 w-7 h-7 rounded-full ${s.dot} text-xs font-bold flex items-center justify-center`}>{q.id || i + 1}</span>
                  <div className="flex-1">
                    <p className="text-gray-900 text-sm leading-relaxed">{q.question}</p>
                    {q.options?.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {q.options.map((opt, j) => (
                          <div key={j} className="text-xs px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-700">{opt}</div>
                        ))}
                      </div>
                    )}
                    {q.correct_answer && (
                      <details className="mt-2">
                        <summary className="text-xs text-green-600 cursor-pointer font-medium">Answer Key</summary>
                        <p className="text-xs text-gray-600 mt-1 bg-green-50 rounded-lg p-2 border border-green-200">{q.correct_answer}</p>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function PaperGenerator() {
  const [form, setForm] = useState({ subject: "Mathematics", grade: "Grade 10", board: "CBSE", totalMarks: 80, duration: 180, mcqCount: 20, shortCount: 10, longCount: 6, topic: "", instructions: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/papers/generate", {
        ...form,
        totalMarks: Number(form.totalMarks),
        duration: Number(form.duration),
        mcqCount: Number(form.mcqCount),
        shortCount: Number(form.shortCount),
        longCount: Number(form.longCount),
      });
      setResult(res.data.data);
      toast.success("Question paper generated!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Generation failed");
    } finally { setLoading(false); }
  };

  if (result) return <PaperResult paper={result} onReset={() => setResult(null)} />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Question Paper Generator</h1>
        <p className="text-gray-500 text-sm mt-1">Create complete exam papers with Section A, B, and C</p>
      </div>

      <form onSubmit={handleGenerate} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
            <input value={form.subject} onChange={set("subject")} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Class</label>
            <select value={form.grade} onChange={set("grade")} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {GRADES.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Board</label>
            <select value={form.board} onChange={set("board")} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {BOARDS.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Topic (optional)</label>
            <input value={form.topic} onChange={set("topic")} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Full syllabus" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Marks</label>
            <input type="number" min="20" max="200" value={form.totalMarks} onChange={set("totalMarks")} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (minutes)</label>
            <input type="number" min="30" max="240" value={form.duration} onChange={set("duration")} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700">Section Configuration</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Section A (MCQ)</label>
              <input type="number" min="0" max="30" value={form.mcqCount} onChange={set("mcqCount")} className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <p className="text-xs text-gray-400 mt-0.5">1 mark each</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Section B (Short)</label>
              <input type="number" min="0" max="20" value={form.shortCount} onChange={set("shortCount")} className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <p className="text-xs text-gray-400 mt-0.5">3 marks each</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Section C (Long)</label>
              <input type="number" min="0" max="10" value={form.longCount} onChange={set("longCount")} className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <p className="text-xs text-gray-400 mt-0.5">5 marks each</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Special Instructions (optional)</label>
          <textarea value={form.instructions} onChange={set("instructions")} rows={2} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="Focus on chapters 1-5, include case-study questions..." />
        </div>

        <button type="submit" disabled={loading} className="w-full bg-orange-500 text-white font-semibold py-3 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating Paper...</> : <><span>📄</span> Generate Question Paper</>}
        </button>
      </form>
    </div>
  );
}
