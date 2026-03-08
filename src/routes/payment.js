const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { authMiddleware } = require("../middleware/auth");
const { query } = require("../db/client");

const router = express.Router();
router.use(authMiddleware);

const PLANS = {
  teacher: { amount: 29900, name: "Pro Teacher Plan", currency: "INR" },
  institute: { amount: 99900, name: "Institute Plan", currency: "INR" },
};

function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// POST /api/payment/create-order
router.post("/create-order", async (req, res) => {
  const { plan } = req.body;
  if (!PLANS[plan]) {
    return res.status(400).json({ success: false, error: "Invalid plan" });
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return res.status(503).json({ success: false, error: "Payment gateway not configured" });
  }

  try {
    const razorpay = getRazorpay();
    // Razorpay receipt max length is 40 chars.
    const compactUserId = String(req.user.id || "user").replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
    const shortTs = Date.now().toString().slice(-8);
    const receipt = `rcpt_${compactUserId}_${shortTs}`;

    const order = await razorpay.orders.create({
      amount: PLANS[plan].amount,
      currency: PLANS[plan].currency,
      receipt,
      notes: { user_id: req.user.id, plan },
    });

    res.json({
      success: true,
      data: {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
        plan_name: PLANS[plan].name,
      },
    });
  } catch (err) {
    console.error("[Payment Create Order Error]", err?.error?.description || err?.message || err);
    res.status(500).json({
      success: false,
      error: err?.error?.description || "Failed to create payment order",
    });
  }
});

// POST /api/payment/verify
router.post("/verify", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ success: false, error: "Payment verification failed" });
  }

  try {
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    await query(
      `INSERT INTO subscriptions (user_id, plan, status, payment_id, expiry_date)
       VALUES ($1, $2, 'active', $3, $4)
       ON CONFLICT (user_id) DO UPDATE SET plan = $2, status = 'active', payment_id = $3, expiry_date = $4`,
      [req.user.id, plan, razorpay_payment_id, expiryDate]
    );

    await query("UPDATE users SET plan = $1 WHERE id = $2", [plan, req.user.id]);

    res.json({ success: true, message: "Payment verified and plan activated" });
  } catch (err) {
    console.error("[Payment Verify Error]", err);
    res.status(500).json({ success: false, error: "Failed to activate subscription" });
  }
});

// GET /api/payment/subscription
router.get("/subscription", async (req, res) => {
  try {
    const result = await query(
      "SELECT plan, status, expiry_date, created_at FROM subscriptions WHERE user_id = $1",
      [req.user.id]
    );
    res.json({ success: true, data: result.rows[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch subscription" });
  }
});

module.exports = router;
