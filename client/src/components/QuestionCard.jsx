import { CheckCircle, Info } from "lucide-react";

const OPTION_COLORS = {
  A: "bg-blue-50 border-blue-200 text-blue-800",
  B: "bg-purple-50 border-purple-200 text-purple-800",
  C: "bg-amber-50 border-amber-200 text-amber-800",
  D: "bg-green-50 border-green-200 text-green-800",
};

const CORRECT_COLOR = "bg-green-50 border-green-400 text-green-800 ring-1 ring-green-400";

const TYPE_BADGE = {
  MCQ: "bg-blue-100 text-blue-700",
  Numerical: "bg-purple-100 text-purple-700",
  "Short Answer": "bg-amber-100 text-amber-700",
  "Long Answer": "bg-rose-100 text-rose-700",
};

export default function QuestionCard({ question, index, showAnswers }) {
  const { question: text, type, options, correct_answer, explanation } = question;
  const badgeClass = TYPE_BADGE[type] || "bg-gray-100 text-gray-600";

  // Derive the letter key from correct_answer (e.g. "B" from "B) Real and equal")
  const correctLetter = correct_answer?.charAt(0).toUpperCase();

  return (
    <div className="card p-5 space-y-3">
      {/* Question header */}
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center">
          {index + 1}
        </span>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeClass}`}>
              {type}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-900 leading-relaxed">{text}</p>
        </div>
      </div>

      {/* MCQ Options */}
      {type === "MCQ" && options?.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-10">
          {options.map((opt) => {
            const letter = opt.charAt(0).toUpperCase();
            const isCorrect = showAnswers && letter === correctLetter;
            const colorClass = isCorrect
              ? CORRECT_COLOR
              : OPTION_COLORS[letter] || "bg-gray-50 border-gray-200 text-gray-700";

            return (
              <div
                key={letter}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${colorClass}`}
              >
                {isCorrect && (
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                )}
                <span>{opt}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Non-MCQ answer */}
      {showAnswers && type !== "MCQ" && (
        <div className="pl-10">
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-green-700 mb-1 uppercase tracking-wide">
              Model Answer
            </p>
            <p className="text-sm text-green-900 leading-relaxed">{correct_answer}</p>
          </div>
        </div>
      )}

      {/* Explanation */}
      {showAnswers && explanation && (
        <div className="pl-10">
          <div className="flex gap-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-blue-700 mb-0.5 uppercase tracking-wide">
                Explanation
              </p>
              <p className="text-sm text-blue-900 leading-relaxed">{explanation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
