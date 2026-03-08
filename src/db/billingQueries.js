"use strict";

const { query, transaction } = require("./client");

/**
 * Get all plan prices for the pricing page.
 */
async function getAllPlanPrices() {
  const result = await query(
    `SELECT pp.*, pl.quizzes_per_month, pl.max_questions, pl.pdf_export, pl.multi_teacher
     FROM plan_prices pp
     JOIN plan_limits pl ON pl.plan = pp.plan
     ORDER BY pp.amount_paise ASC`
  );
  return result.rows;
}

/**
 * Get a single plan price row.
 */
async function getPlanPrice(plan) {
  const result = await query(
    `SELECT * FROM plan_prices WHERE plan = $1`,
    [plan]
  );
  return result.rows[0] ?? null;
}

/**
 * Save a newly created Razorpay order.
 */
async function createOrder(userId, razorpayOrderId, plan, amountPaise) {
  const result = await query(
    `INSERT INTO billing_orders (user_id, razorpay_order_id, plan, amount_paise)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, razorpayOrderId, plan, amountPaise]
  );
  return result.rows[0];
}

/**
 * Get an order by Razorpay order ID.
 */
async function getOrderByRazorpayId(razorpayOrderId) {
  const result = await query(
    `SELECT * FROM billing_orders WHERE razorpay_order_id = $1`,
    [razorpayOrderId]
  );
  return result.rows[0] ?? null;
}

/**
 * Mark order as paid, record payment, and upgrade user plan — all in one transaction.
 */
async function fulfillPayment({ orderId, userId, plan, razorpayPaymentId, razorpaySignature, amountPaise }) {
  return transaction(async (client) => {
    // 1. Mark order paid
    await client.query(
      `UPDATE billing_orders SET status = 'paid' WHERE id = $1`,
      [orderId]
    );

    // 2. Record payment
    await client.query(
      `INSERT INTO billing_payments
         (order_id, user_id, razorpay_payment_id, razorpay_signature, plan, amount_paise)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [orderId, userId, razorpayPaymentId, razorpaySignature, plan, amountPaise]
    );

    // 3. Upgrade user plan
    await client.query(
      `UPDATE users SET plan = $1, updated_at = NOW() WHERE id = $2`,
      [plan, userId]
    );
  });
}

/**
 * Mark an order as failed.
 */
async function failOrder(razorpayOrderId) {
  await query(
    `UPDATE billing_orders SET status = 'failed' WHERE razorpay_order_id = $1`,
    [razorpayOrderId]
  );
}

/**
 * Get payment history for a user.
 */
async function getPaymentHistory(userId) {
  const result = await query(
    `SELECT bp.razorpay_payment_id, bp.plan, bp.amount_paise, bp.paid_at,
            bo.razorpay_order_id
     FROM billing_payments bp
     JOIN billing_orders bo ON bo.id = bp.order_id
     WHERE bp.user_id = $1
     ORDER BY bp.paid_at DESC`,
    [userId]
  );
  return result.rows;
}

module.exports = {
  getAllPlanPrices,
  getPlanPrice,
  createOrder,
  getOrderByRazorpayId,
  fulfillPayment,
  failOrder,
  getPaymentHistory,
};
