import db from "../database/db.js";

export const getChildren = async (req, res) => {
  try {
    const children = await db
      .prepare(
        "SELECT id, full_name, email, age FROM users WHERE parent_id = ? AND role = ?",
      )
      .all(req.userId, "child");
    res.json(children);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const getChildSummary = async (req, res) => {
  const { childId } = req.params;

  try {
    const child = await db
      .prepare(
        "SELECT id, full_name, email FROM users WHERE id = ? AND parent_id = ?",
      )
      .get(childId, req.userId);

    if (!child) return res.status(403).json({ error: "Not authorized" });

    const income = await db
      .prepare(
        `
      SELECT COALESCE(SUM(amount), 0) as total FROM transactions
      WHERE user_id = ? AND type = 'income'
      AND strftime('%Y-%m', transaction_date) = strftime('%Y-%m', 'now')
    `,
      )
      .get(childId);

    const expenses = await db
      .prepare(
        `
      SELECT COALESCE(SUM(amount), 0) as total FROM transactions
      WHERE user_id = ? AND type = 'expense'
      AND strftime('%Y-%m', transaction_date) = strftime('%Y-%m', 'now')
    `,
      )
      .get(childId);

    const transactions = await db
      .prepare(
        `
      SELECT t.*, c.name as category_name FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
      ORDER BY t.transaction_date DESC LIMIT 10
    `,
      )
      .all(childId);

    res.json({
      child,
      summary: {
        income: income.total,
        expenses: expenses.total,
        balance: income.total - expenses.total,
      },
      transactions,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
