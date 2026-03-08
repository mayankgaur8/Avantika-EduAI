"use strict";

/**
 * Escapes special HTML characters to prevent XSS in the PDF template.
 */
function esc(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Renders a single question block as HTML.
 */
function renderQuestion(q, index, includeAnswers) {
  const typeLabel = esc(q.type);
  const typeBadgeColor = {
    MCQ: "#3b82f6",
    Numerical: "#8b5cf6",
    "Short Answer": "#f59e0b",
    "Long Answer": "#ef4444",
  }[q.type] || "#6b7280";

  let optionsHtml = "";
  if (q.type === "MCQ" && Array.isArray(q.options) && q.options.length) {
    const correctLetter = String(q.correct_answer || "").charAt(0).toUpperCase();
    optionsHtml = `
      <div class="options">
        ${q.options
          .map((opt) => {
            const letter = String(opt).charAt(0).toUpperCase();
            const isCorrect = includeAnswers && letter === correctLetter;
            return `<div class="option ${isCorrect ? "option-correct" : ""}">
              ${isCorrect ? '<span class="tick">✓</span>' : ""}
              ${esc(opt)}
            </div>`;
          })
          .join("")}
      </div>`;
  }

  let answerHtml = "";
  if (includeAnswers) {
    if (q.type !== "MCQ" && q.correct_answer) {
      answerHtml = `
        <div class="answer-block">
          <span class="answer-label">Model Answer:</span>
          <span>${esc(q.correct_answer)}</span>
        </div>`;
    }
    if (q.explanation) {
      answerHtml += `
        <div class="explanation-block">
          <span class="explanation-label">Explanation:</span>
          ${esc(q.explanation)}
        </div>`;
    }
  }

  // Blank answer lines for student paper (non-MCQ, no answers)
  let blankLines = "";
  if (!includeAnswers && q.type !== "MCQ") {
    const lineCount = q.type === "Long Answer" ? 6 : 3;
    blankLines = `<div class="blank-lines">${"<div class='blank-line'></div>".repeat(lineCount)}</div>`;
  }

  return `
    <div class="question">
      <div class="question-header">
        <div class="question-number">Q${index + 1}</div>
        <div class="question-body">
          <span class="type-badge" style="background:${typeBadgeColor}20;color:${typeBadgeColor};border:1px solid ${typeBadgeColor}40">
            ${typeLabel}
          </span>
          <p class="question-text">${esc(q.question)}</p>
          ${optionsHtml}
          ${blankLines}
          ${answerHtml}
        </div>
      </div>
    </div>`;
}

/**
 * Renders the answer key summary table.
 */
function renderAnswerKey(answerKey) {
  if (!answerKey || !Object.keys(answerKey).length) return "";
  const rows = Object.entries(answerKey)
    .map(
      ([num, ans]) =>
        `<td class="ak-cell"><strong>Q${esc(num)}</strong><br/>${esc(ans)}</td>`
    )
    .join("");
  return `
    <div class="answer-key-section">
      <h3 class="section-title">Answer Key</h3>
      <table class="ak-table"><tr>${rows}</tr></table>
    </div>`;
}

/**
 * Generates the full HTML for the PDF.
 * @param {Object} quiz      - The quiz JSON from Claude / DB
 * @param {Object} options
 * @param {boolean} options.includeAnswers  - Include answer key + explanations
 * @param {string}  options.schoolName      - Optional school name in header
 */
function buildPdfHtml(quiz, { includeAnswers = false, schoolName = "" } = {}) {
  const {
    quiz_title,
    subject,
    grade,
    board,
    topic,
    difficulty,
    total_questions,
    questions = [],
    answer_key = {},
  } = quiz;

  const questionsHtml = questions
    .map((q, i) => renderQuestion(q, i, includeAnswers))
    .join('<div class="question-divider"></div>');

  const answerKeyHtml = includeAnswers ? renderAnswerKey(answer_key) : "";

  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 13px;
      color: #1a1a1a;
      background: #fff;
      padding: 0;
    }

    /* ── Page Header ── */
    .page-header {
      border-bottom: 3px solid #1d4ed8;
      padding: 20px 40px 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .school-name {
      font-size: 18px;
      font-weight: 700;
      color: #1d4ed8;
    }
    .powered-by {
      font-size: 10px;
      color: #94a3b8;
      margin-top: 2px;
    }
    .header-right { text-align: right; font-size: 11px; color: #64748b; }

    /* ── Quiz Title Band ── */
    .title-band {
      background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%);
      color: white;
      padding: 16px 40px;
    }
    .quiz-title {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .quiz-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 12px;
      opacity: 0.9;
    }
    .meta-item { display: flex; align-items: center; gap: 4px; }
    .meta-label { opacity: 0.75; }

    /* ── Instructions ── */
    .instructions {
      margin: 16px 40px;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 6px;
      padding: 10px 14px;
      font-size: 11.5px;
      color: #0369a1;
    }
    .instructions strong { display: block; margin-bottom: 4px; color: #0c4a6e; }

    /* ── Student Info ── */
    .student-info {
      display: flex;
      gap: 40px;
      margin: 0 40px 20px;
      padding-bottom: 12px;
      border-bottom: 1px dashed #cbd5e1;
    }
    .info-field {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #475569;
    }
    .info-line {
      flex: 1;
      border-bottom: 1px solid #94a3b8;
      height: 20px;
    }

    /* ── Questions ── */
    .questions-section { padding: 0 40px; }

    .question {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .question-divider {
      border-top: 1px dashed #e2e8f0;
      margin: 0 0 20px;
    }
    .question-header {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }
    .question-number {
      width: 28px;
      height: 28px;
      background: #1d4ed8;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .question-body { flex: 1; }
    .type-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 20px;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .question-text {
      font-size: 13.5px;
      line-height: 1.6;
      color: #1e293b;
      font-weight: 500;
      margin-bottom: 10px;
    }

    /* ── MCQ Options ── */
    .options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      margin-bottom: 4px;
    }
    .option {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 5px;
      padding: 6px 10px;
      font-size: 12.5px;
      color: #334155;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .option-correct {
      background: #f0fdf4;
      border-color: #86efac;
      color: #166534;
      font-weight: 600;
    }
    .tick { color: #16a34a; font-weight: 700; }

    /* ── Blank lines ── */
    .blank-lines { margin-top: 8px; }
    .blank-line {
      border-bottom: 1px solid #cbd5e1;
      height: 24px;
      margin-bottom: 6px;
    }

    /* ── Answer / Explanation ── */
    .answer-block {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 5px;
      padding: 8px 12px;
      font-size: 12px;
      color: #166534;
      margin-top: 8px;
    }
    .answer-label { font-weight: 700; margin-right: 6px; }
    .explanation-block {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 5px;
      padding: 8px 12px;
      font-size: 12px;
      color: #1e40af;
      margin-top: 6px;
      line-height: 1.5;
    }
    .explanation-label { font-weight: 700; margin-right: 6px; }

    /* ── Answer Key Section ── */
    .answer-key-section {
      margin: 24px 40px 0;
      padding-top: 20px;
      border-top: 2px solid #1d4ed8;
      page-break-before: always;
    }
    .section-title {
      font-size: 15px;
      font-weight: 700;
      color: #1d4ed8;
      margin-bottom: 12px;
    }
    .ak-table { border-collapse: collapse; width: 100%; }
    .ak-cell {
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      text-align: center;
      font-size: 12px;
      background: #f8fafc;
      min-width: 60px;
    }

    /* ── Footer ── */
    .page-footer {
      margin-top: 32px;
      padding: 12px 40px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #94a3b8;
    }

    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="page-header">
    <div>
      <div class="school-name">${esc(schoolName || "Avantika EduAI")}</div>
      <div class="powered-by">Powered by Avantika EduAI · avantika.ai</div>
    </div>
    <div class="header-right">
      <div>${esc(board)} · ${esc(grade)}</div>
      <div>${today}</div>
    </div>
  </div>

  <!-- Title Band -->
  <div class="title-band">
    <div class="quiz-title">${esc(quiz_title)}</div>
    <div class="quiz-meta">
      <div class="meta-item"><span class="meta-label">Subject:</span> ${esc(subject)}</div>
      <div class="meta-item"><span class="meta-label">Topic:</span> ${esc(topic)}</div>
      <div class="meta-item"><span class="meta-label">Difficulty:</span> ${esc(difficulty)}</div>
      <div class="meta-item"><span class="meta-label">Total Questions:</span> ${esc(total_questions)}</div>
    </div>
  </div>

  <!-- Instructions -->
  <div class="instructions">
    <strong>Instructions:</strong>
    Read all questions carefully. For MCQ, circle the correct option.
    ${!includeAnswers ? "All questions are compulsory unless stated otherwise." : "<em>— Answer Key Edition —</em>"}
  </div>

  <!-- Student Info (only on student paper) -->
  ${
    !includeAnswers
      ? `<div class="student-info">
          <div class="info-field">Name: <div class="info-line"></div></div>
          <div class="info-field">Roll No: <div class="info-line"></div></div>
          <div class="info-field">Date: <div class="info-line"></div></div>
        </div>`
      : ""
  }

  <!-- Questions -->
  <div class="questions-section">
    ${questionsHtml}
  </div>

  <!-- Answer Key (answer key edition only) -->
  ${answerKeyHtml}

  <!-- Footer -->
  <div class="page-footer">
    <span>${esc(quiz_title)} · ${esc(board)} · ${esc(grade)}</span>
    <span>${includeAnswers ? "Answer Key Edition" : "Student Copy"} · Generated by Avantika EduAI</span>
  </div>

</body>
</html>`;
}

module.exports = { buildPdfHtml };
