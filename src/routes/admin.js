const express = require("express");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");
const { query } = require("../db/client");

const router = express.Router();
router.use(authMiddleware, adminMiddleware);

// GET /api/admin/stats
router.get("/stats", async (req, res) => {
  try {
    const [users, quizzes, assignments, papers, revenue] = await Promise.all([
      query("SELECT COUNT(*) as total, COUNT(CASE WHEN plan != 'free' THEN 1 END) as paid FROM users"),
      query("SELECT COUNT(*) as total FROM quizzes"),
      query("SELECT COUNT(*) as total FROM assignments"),
      query("SELECT COUNT(*) as total FROM question_papers"),
      query(`SELECT COALESCE(SUM(CASE WHEN plan = 'teacher' THEN 299 WHEN plan = 'institute' THEN 999 ELSE 0 END), 0) as monthly_revenue FROM users WHERE plan != 'free'`),
    ]);

    res.json({
      success: true,
      data: {
        users: { total: parseInt(users.rows[0].total), paid: parseInt(users.rows[0].paid) },
        quizzes: parseInt(quizzes.rows[0].total),
        assignments: parseInt(assignments.rows[0].total),
        papers: parseInt(papers.rows[0].total),
        monthly_revenue: parseInt(revenue.rows[0].monthly_revenue),
      },
    });
  } catch (err) {
    console.error("[Admin Stats Error]", err);
    res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
});

// GET /api/admin/users
router.get("/users", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;
    const result = await query(
      `SELECT id, name, email, school_name, role, plan, created_at,
              (SELECT COUNT(*) FROM quizzes WHERE user_id = users.id) as quiz_count
       FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const total = await query("SELECT COUNT(*) FROM users");
    res.json({ success: true, data: result.rows, total: parseInt(total.rows[0].count) });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch users" });
  }
});

// GET /api/admin/recent-activity
router.get("/recent-activity", async (req, res) => {
  try {
    const result = await query(
      `SELECT ul.id, ul.action, ul.created_at, u.name, u.email, u.plan
       FROM usage_logs ul
       JOIN users u ON u.id = ul.user_id
       ORDER BY ul.created_at DESC LIMIT 20`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch activity" });
  }
});

// PATCH /api/admin/users/:id/plan
router.patch("/users/:id/plan", async (req, res) => {
  const { plan } = req.body;
  const validPlans = ["free", "teacher", "institute", "school"];
  if (!validPlans.includes(plan)) {
    return res.status(400).json({ success: false, error: "Invalid plan" });
  }
  try {
    await query("UPDATE users SET plan = $1 WHERE id = $2", [plan, req.params.id]);
    res.json({ success: true, message: "Plan updated" });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to update plan" });
  }
});

module.exports = router;
