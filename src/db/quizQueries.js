const { query, transaction } = require("./client");

/**
 * Save a generated quiz + its questions in one transaction.
 * Returns the saved quiz row.
 */
async function saveQuiz(userId, input, quizJson) {
  return transaction(async (client) => {
    // 1. Insert quiz
    const quizResult = await client.query(
      `INSERT INTO quizzes
         (user_id, quiz_title, subject, topic, grade, board,
          difficulty, question_type, total_questions, raw_json)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        userId,
        quizJson.quiz_title,
        input.subject,
        input.topic,
        input.grade,
        input.board,
        input.difficulty,
        input.questionType,
        quizJson.total_questions,
        JSON.stringify(quizJson),
      ]
    );

    const quiz = quizResult.rows[0];

    // 2. Insert individual questions
    if (quizJson.questions?.length) {
      const values = quizJson.questions.map((q, i) => [
        quiz.id,
        i + 1,
        q.question,
        q.type,
        q.options?.length ? JSON.stringify(q.options) : null,
        q.correct_answer,
        q.explanation ?? null,
      ]);

      for (const v of values) {
        await client.query(
          `INSERT INTO questions
             (quiz_id, sequence, question_text, type, options, correct_answer, explanation)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          v
        );
      }
    }

    // 3. Log usage
    await client.query(
      `INSERT INTO usage_logs (user_id, action, quiz_id)
       VALUES ($1, 'quiz_generate', $2)`,
      [userId, quiz.id]
    );

    return quiz;
  });
}

/**
 * Get all quizzes for a user (newest first), without questions.
 */
async function getQuizzesByUser(userId, { limit = 20, offset = 0 } = {}) {
  const result = await query(
    `SELECT id, quiz_title, subject, topic, grade, board,
            difficulty, question_type, total_questions, created_at
     FROM quizzes
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return result.rows;
}

/**
 * Get a single quiz with its questions by quiz ID.
 * Returns null if not found or doesn't belong to userId.
 */
async function getQuizById(quizId, userId) {
  const quizResult = await query(
    `SELECT * FROM quizzes WHERE id = $1 AND user_id = $2`,
    [quizId, userId]
  );

  if (!quizResult.rows.length) return null;
  const quiz = quizResult.rows[0];

  const questionsResult = await query(
    `SELECT * FROM questions WHERE quiz_id = $1 ORDER BY sequence`,
    [quizId]
  );

  quiz.questions = questionsResult.rows;
  return quiz;
}

/**
 * Delete a quiz (cascades to questions and usage_logs).
 */
async function deleteQuiz(quizId, userId) {
  const result = await query(
    `DELETE FROM quizzes WHERE id = $1 AND user_id = $2 RETURNING id`,
    [quizId, userId]
  );
  return result.rowCount > 0;
}

/**
 * Count how many quizzes a user has generated this calendar month.
 * Used to enforce free plan limit.
 */
async function getMonthlyUsageCount(userId) {
  const result = await query(
    `SELECT COUNT(*) AS count
     FROM usage_logs
     WHERE user_id = $1
       AND action = 'quiz_generate'
       AND created_at >= date_trunc('month', NOW())`,
    [userId]
  );
  return parseInt(result.rows[0].count, 10);
}

/**
 * Get the plan limit for a user.
 */
async function getUserPlanLimit(userId) {
  const result = await query(
    `SELECT pl.*
     FROM users u
     JOIN plan_limits pl ON pl.plan = u.plan
     WHERE u.id = $1`,
    [userId]
  );
  return result.rows[0] ?? null;
}

module.exports = {
  saveQuiz,
  getQuizzesByUser,
  getQuizById,
  deleteQuiz,
  getMonthlyUsageCount,
  getUserPlanLimit,
};
