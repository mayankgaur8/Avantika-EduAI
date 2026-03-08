import { BookOpen, Loader2 } from "lucide-react";

const BOARDS = ["CBSE", "ICSE", "State Board", "JEE", "NEET", "Other"];
const DIFFICULTIES = ["Easy", "Medium", "Hard", "Mixed"];
const QUESTION_TYPES = ["MCQ", "Short Answer", "Long Answer", "Numerical", "Mixed"];
const QUESTION_COUNTS = [5, 10, 15, 20, 25, 30];

const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Hindi",
  "History",
  "Geography",
  "Economics",
  "Computer Science",
  "Other",
];

export default function QuizForm({ onSubmit, loading }) {
  function handleSubmit(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    onSubmit(data);
  }

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <BookOpen className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Quiz Generator</h2>
          <p className="text-sm text-gray-500">Fill in the details to generate a quiz</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Subject + Topic */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Subject</label>
            <select name="subject" className="form-input" required defaultValue="">
              <option value="" disabled>Select subject</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Topic</label>
            <input
              name="topic"
              type="text"
              className="form-input"
              placeholder="e.g. Quadratic Equations"
              required
            />
          </div>
        </div>

        {/* Row 2: Grade + Board */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Grade / Class</label>
            <input
              name="grade"
              type="text"
              className="form-input"
              placeholder="e.g. Class 10, Class 12, JEE"
              required
            />
          </div>
          <div>
            <label className="form-label">Board / Exam</label>
            <select name="board" className="form-input" defaultValue="CBSE">
              {BOARDS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 3: Difficulty + Question Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Difficulty</label>
            <select name="difficulty" className="form-input" defaultValue="Medium">
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Question Type</label>
            <select name="questionType" className="form-input" defaultValue="MCQ">
              {QUESTION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 4: Number of Questions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Number of Questions</label>
            <select name="numberOfQuestions" className="form-input" defaultValue="10">
              {QUESTION_COUNTS.map((n) => (
                <option key={n} value={n}>{n} questions</option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Quiz...
              </>
            ) : (
              "Generate Quiz"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
