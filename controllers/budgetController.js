import db from "../database/db.js";

export const getBudgets = (req, res) => {
  try {
    const budgets = db
      .prepare(
        `
      SELECT b.*, c.name as category_name, c.color as category_color,
        COALESCE((
          SELECT SUM(t.amount)
          FROM transactions t
          WHERE t.category_id = b.category_id
          AND t.user_id = b.user_id
          AND t.type = 'expense'
          AND strftime('%Y-%m', t.transaction_date) = strftime('%Y-%m', b.start_date)
        ), 0) as spent_amount
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = ?
      ORDER BY c.name ASC
    `,
      )
      .all(req.userId);

    res.json(budgets);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const createBudget = (req, res) => {
  const { category_id, limit_amount, period, start_date } = req.body;

  if (!category_id || !limit_amount || !start_date) {
    return res
      .status(400)
      .json({ error: "Category, limit and start date are required" });
  }

  try {
    const existing = db
      .prepare(
        "SELECT id FROM budgets WHERE user_id = ? AND category_id = ? AND start_date = ?",
      )
      .get(req.userId, category_id, start_date);

    if (existing) {
      return res
        .status(400)
        .json({ error: "Budget already exists for this category and period" });
    }

    const result = db
      .prepare(
        "INSERT INTO budgets (user_id, category_id, limit_amount, period, start_date) VALUES (?, ?, ?, ?, ?)",
      )
      .run(
        req.userId,
        category_id,
        limit_amount,
        period || "monthly",
        start_date,
      );

    const budget = db
      .prepare("SELECT * FROM budgets WHERE id = ?")
      .get(result.lastInsertRowid);
    res.status(201).json(budget);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const updateBudget = (req, res) => {
  const { id } = req.params;
  const { limit_amount, period, start_date } = req.body;

  try {
    const existing = db
      .prepare("SELECT * FROM budgets WHERE id = ? AND user_id = ?")
      .get(id, req.userId);

    if (!existing) {
      return res.status(404).json({ error: "Budget not found" });
    }

    db.prepare(
      "UPDATE budgets SET limit_amount = ?, period = ?, start_date = ? WHERE id = ? AND user_id = ?",
    ).run(
      limit_amount ?? existing.limit_amount,
      period ?? existing.period,
      start_date ?? existing.start_date,
      id,
      req.userId,
    );

    const updated = db.prepare("SELECT * FROM budgets WHERE id = ?").get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteBudget = (req, res) => {
  const { id } = req.params;

  try {
    const existing = db
      .prepare("SELECT * FROM budgets WHERE id = ? AND user_id = ?")
      .get(id, req.userId);

    if (!existing) {
      return res.status(404).json({ error: "Budget not found" });
    }

    db.prepare("DELETE FROM budgets WHERE id = ? AND user_id = ?").run(
      id,
      req.userId,
    );
    res.json({ message: "Budget deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
