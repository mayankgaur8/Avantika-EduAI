import { useState } from "react";
import { Eye, EyeOff, Download, RefreshCw, CheckSquare } from "lucide-react";
import QuestionCard from "./QuestionCard";

const DIFFICULTY_COLOR = {
  Easy: "bg-green-100 text-green-700",
  Medium: "bg-amber-100 text-amber-700",
  Hard: "bg-red-100 text-red-700",
  Mixed: "bg-purple-100 text-purple-700",
};

const BOARD_COLOR = {
  CBSE: "bg-blue-100 text-blue-700",
  ICSE: "bg-indigo-100 text-indigo-700",
  JEE: "bg-orange-100 text-orange-700",
  NEET: "bg-rose-100 text-rose-700",
  "State Board": "bg-teal-100 text-teal-700",
  Other: "bg-gray-100 text-gray-700",
};

export default function QuizDisplay({ quiz, onReset }) {
  const [showAnswers, setShowAnswers] = useState(false);

  function handlePrint() {
    window.print();
  }

  const difficultyClass = DIFFICULTY_COLOR[quiz.difficulty] || "bg-gray-100 text-gray-700";
  const boardClass = BOARD_COLOR[quiz.board] || "bg-gray-100 text-gray-700";

  return (
    <div className="space-y-4">
      {/* Quiz Header Card */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900">{quiz.quiz_title}</h2>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                {quiz.subject}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                {quiz.grade}
              </span>
              <span className={`px-2.5 py-1 rounded-full font-medium ${boardClass}`}>
                {quiz.board}
              </span>
              <span className={`px-2.5 py-1 rounded-full font-medium ${difficultyClass}`}>
                {quiz.difficulty}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                {quiz.total_questions} Questions
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Topic: <span className="font-medium text-gray-700">{quiz.topic}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowAnswers((v) => !v)}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              {showAnswers ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Hide Answers
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Show Answers
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={onReset}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              New
            </button>
          </div>
        </div>
      </div>

      {/* Answer Key Summary (when shown) */}
      {showAnswers && quiz.answer_key && Object.keys(quiz.answer_key).length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckSquare className="w-4 h-4 text-green-600" />
            <h3 className="font-semibold text-gray-900 text-sm">Answer Key</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(quiz.answer_key).map(([qNum, ans]) => (
              <span
                key={qNum}
                className="px-3 py-1 bg-green-50 border border-green-200 rounded-lg text-sm font-medium text-green-800"
              >
                Q{qNum}: {ans}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-3">
        {quiz.questions.map((q, i) => (
          <QuestionCard
            key={q.id ?? i}
            question={q}
            index={i}
            showAnswers={showAnswers}
          />
        ))}
      </div>
    </div>
  );
}
