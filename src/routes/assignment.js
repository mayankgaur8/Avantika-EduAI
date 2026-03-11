const express = require("express");
const { z } = require("zod");
const { callLLM } = require("../claude/client");
const { authMiddleware } = require("../middleware/auth");
const { query } = require("../db/client");

const router = express.Router();
router.use(authMiddleware);

const assignmentSchema = z.object({
  subject: z.string().min(1),
  topic: z.string().min(1),
  grade: z.string().min(1),
  marks: z.number().int().min(5).max(100),
  difficulty: z.enum(["Easy", "Medium", "Hard", "Mixed"]),
  numberOfQuestions: z.number().int().min(1).max(20),
  instructions: z.string().optional(),
});

const ASSIGNMENT_SYSTEM_PROMPT = `You are an expert Indian school teacher creating assignments aligned with CBSE, ICSE, JEE and NEET standards.
Generate structured assignments with clear instructions, questions with mark allocations, and answer guidelines.
Output ONLY valid JSON with this structure:
{
  "assignment_title": "",
  "subject": "",
  "grade": "",
  "topic": "",
  "total_marks": 0,
  "difficulty": "",
  "instructions": "",
  "questions": [
    {
      "id": 1,
      "question": "",
      "marks": 0,
      "type": "Short Answer | Long Answer | MCQ | Numerical",
      "options": [],
      "answer_guideline": "",
      "hints": ""
    }
  ]
}`;

router.post("/generate", async (req, res) => {
  const parsed = assignmentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: "Validation failed", details: parsed.error.errors });
  }

  const { subject, topic, grade, marks, difficulty, numberOfQuestions, instructions } = parsed.data;

  const userPrompt = `Generate an assignment with these specifications:
- Subject: ${subject}
- Topic: ${topic}
- Grade: ${grade}
- Total Marks: ${marks}
- Difficulty: ${difficulty}
- Number of Questions: ${numberOfQuestions}
- Special Instructions: ${instructions || "None"}

Distribute marks proportionally across ${numberOfQuestions} questions. Include answer guidelines.`;

  try {
    const assignment = await callLLM(ASSIGNMENT_SYSTEM_PROMPT, userPrompt);

    // Save to DB
    const saved = await query(
      `INSERT INTO assignments (user_id, subject, topic, grade, total_marks, difficulty, raw_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, created_at`,
      [req.user.id, subject, topic, grade, marks, difficulty, JSON.stringify(assignment)]
    );

    res.json({ success: true, data: { ...assignment, id: saved.rows[0].id, created_at: saved.rows[0].created_at } });
  } catch (err) {
    console.error("[Assignment Generate Error]", err);
    res.status(500).json({ success: false, error: "Failed to generate assignment" });
  }
});

router.get("/history", async (req, res) => {
  try {
    const result = await query(
      `SELECT id, subject, topic, grade, total_marks, difficulty, created_at,
              raw_json->>'assignment_title' as assignment_title
       FROM assignments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch assignments" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM assignments WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: "Not found" });
    const row = result.rows[0];
    res.json({ success: true, data: { ...row.raw_json, id: row.id, created_at: row.created_at } });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch assignment" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await query("DELETE FROM assignments WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to delete" });
  }
});

module.exports = router;
