import db from "../database/db.js";

export const getSavingsGoals = (req, res) => {
  try {
    const goals = db
      .prepare(
        "SELECT * FROM savings_goals WHERE user_id = ? ORDER BY created_at DESC",
      )
      .all(req.userId);
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const createSavingsGoal = (req, res) => {
  const { name, target_amount, monthly_contribution, color } = req.body;

  if (!name || !target_amount || !monthly_contribution) {
    return res.status(400).json({
      error: "Name, target amount and monthly contribution are required",
    });
  }

  try {
    const result = db
      .prepare(
        `
      INSERT INTO savings_goals (user_id, name, target_amount, monthly_contribution, color)
      VALUES (?, ?, ?, ?, ?)
    `,
      )
      .run(
        req.userId,
        name,
        target_amount,
        monthly_contribution,
        color || "#534AB7",
      );

    const goal = db
      .prepare("SELECT * FROM savings_goals WHERE id = ?")
      .get(result.lastInsertRowid);
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const addContribution = (req, res) => {
  const { id } = req.params;
  const { amount, date } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Valid amount is required" });
  }

  try {
    const goal = db
      .prepare("SELECT * FROM savings_goals WHERE id = ? AND user_id = ?")
      .get(id, req.userId);

    if (!goal) return res.status(404).json({ error: "Goal not found" });

    const newAmount = Math.min(
      goal.saved_amount + parseFloat(amount),
      goal.target_amount,
    );

    db.prepare(
      "UPDATE savings_goals SET saved_amount = ? WHERE id = ? AND user_id = ?",
    ).run(newAmount, id, req.userId);

    const contributionDate = date || new Date().toISOString().split("T")[0];

    // Find or create a Savings category for this user
    let savingsCategory = db
      .prepare(
        "SELECT * FROM categories WHERE user_id = ? AND name = 'Savings'",
      )
      .get(req.userId);

    if (!savingsCategory) {
      const result = db
        .prepare(
          "INSERT INTO categories (user_id, name, type, color) VALUES (?, 'Savings', 'expense', '#534AB7')",
        )
        .run(req.userId);
      savingsCategory = db
        .prepare("SELECT * FROM categories WHERE id = ?")
        .get(result.lastInsertRowid);
    }

    // Create expense transaction for the contribution
    db.prepare(
      `
      INSERT INTO transactions (user_id, category_id, amount, type, description, transaction_date)
      VALUES (?, ?, ?, 'expense', ?, ?)
    `,
    ).run(
      req.userId,
      savingsCategory.id,
      parseFloat(amount),
      `Savings: ${goal.name}`,
      contributionDate,
    );

    const updated = db
      .prepare("SELECT * FROM savings_goals WHERE id = ?")
      .get(id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateSavingsGoal = (req, res) => {
  const { id } = req.params;
  const { name, target_amount, monthly_contribution, color } = req.body;

  try {
    const existing = db
      .prepare("SELECT * FROM savings_goals WHERE id = ? AND user_id = ?")
      .get(id, req.userId);

    if (!existing) return res.status(404).json({ error: "Goal not found" });

    db.prepare(
      `
      UPDATE savings_goals
      SET name = ?, target_amount = ?, monthly_contribution = ?, color = ?
      WHERE id = ? AND user_id = ?
    `,
    ).run(
      name ?? existing.name,
      target_amount ?? existing.target_amount,
      monthly_contribution ?? existing.monthly_contribution,
      color ?? existing.color,
      id,
      req.userId,
    );

    const updated = db
      .prepare("SELECT * FROM savings_goals WHERE id = ?")
      .get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteSavingsGoal = (req, res) => {
  const { id } = req.params;

  try {
    const existing = db
      .prepare("SELECT * FROM savings_goals WHERE id = ? AND user_id = ?")
      .get(id, req.userId);

    if (!existing) return res.status(404).json({ error: "Goal not found" });

    db.prepare("DELETE FROM savings_goals WHERE id = ? AND user_id = ?").run(
      id,
      req.userId,
    );
    res.json({ message: "Goal deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
