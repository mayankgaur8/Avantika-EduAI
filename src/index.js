require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const authRouter = require("./routes/auth");
const quizRouter = require("./routes/quiz");
const assignmentRouter = require("./routes/assignment");
const papersRouter = require("./routes/papers");
const billingRouter = require("./routes/billing");
const paymentRouter = require("./routes/payment");
const adminRouter = require("./routes/admin");
const { authMiddleware } = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "2mb" }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests. Please wait and try again." },
});
app.use("/api", limiter);

// ── Routes ───────────────────────────────────────────────────────────────────

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "Avantika EduAI API", version: "2.0.0" });
});

app.use("/api/auth", authRouter);
app.use("/api/quiz", authMiddleware, quizRouter);
app.use("/api/assignment", assignmentRouter);
app.use("/api/papers", papersRouter);
app.use("/api/billing", billingRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/admin", adminRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("[Unhandled Error]", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

// ── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Avantika EduAI API v2.0 running on port ${PORT}`);
});
