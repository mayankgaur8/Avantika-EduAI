const express = require("express");
const { z } = require("zod");
const { callAIPlatform } = require("../services/aiPlatform");
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

router.post("/generate", async (req, res) => {
  const parsed = assignmentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: "Validation failed", details: parsed.error.errors });
  }

  const { subject, topic, grade, marks, difficulty, numberOfQuestions, instructions } = parsed.data;

  try {
    const { data: assignment } = await callAIPlatform({
      feature: "assignment_generator",
      prompt: "assignment.generate.v1",
      input: {
        subject,
        topic,
        grade,
        difficulty,
        num_questions: numberOfQuestions,
        total_marks: marks,
        special_instructions: instructions || "None",
      },
      userId: req.user.id,
    });

    let savedMeta = { id: null, created_at: new Date().toISOString() };
    let saveWarning = null;

    try {
      // Save to DB (non-blocking for generation success)
      const saved = await query(
        `INSERT INTO assignments (user_id, subject, topic, grade, total_marks, difficulty, raw_json)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, created_at`,
        [req.user.id, subject, topic, grade, marks, difficulty, JSON.stringify(assignment)]
      );
      savedMeta = { id: saved.rows[0].id, created_at: saved.rows[0].created_at };
    } catch (dbErr) {
      console.error("[Assignment Save Error]", dbErr.message);
      saveWarning = "Assignment generated but could not be saved to database.";
    }

    res.json({
      success: true,
      data: { ...assignment, ...savedMeta },
      warning: saveWarning,
    });
  } catch (err) {
    if (err?.code === "CONFIG_ERROR") {
      return res.status(503).json({ success: false, error: err.message });
    }
    if (err?.code === "TIMEOUT_ERROR") {
      return res.status(504).json({ success: false, error: "AI generation timed out. Please try again." });
    }
    if (err?.code === "UPSTREAM_ERROR") {
      console.error("[Assignment Upstream Error]", err.message);
      return res.status(502).json({ success: false, error: "AI platform request failed. Please try again." });
    }

    console.error("[Assignment Generate Error]", err.message || err);
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
    // Graceful fallback for any DB schema issues (table/column missing, etc.)
    console.error("[Assignment History Error]", err.code, err.message);
    return res.json({ success: true, data: [], warning: "Could not load history: " + err.message });
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
