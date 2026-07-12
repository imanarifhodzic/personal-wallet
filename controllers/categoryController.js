import db from "../database/db.js";

export const getCategories = async (req, res) => {
  try {
    const categories = await db
      .prepare("SELECT * FROM categories WHERE user_id = ? ORDER BY name ASC")
      .all(req.userId);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const createCategory = async (req, res) => {
  const { name, type, color } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: "Name and type are required" });
  }

  try {
    const existing = await db
      .prepare("SELECT id FROM categories WHERE user_id = ? AND name = ?")
      .get(req.userId, name);

    if (existing) {
      return res.status(400).json({ error: "Category already exists" });
    }

    const result = await db
      .prepare(
        "INSERT INTO categories (user_id, name, type, color) VALUES (?, ?, ?, ?)",
      )
      .run(req.userId, name, type, color || "#534AB7");

    const category = await db
      .prepare("SELECT * FROM categories WHERE id = ?")
      .get(result.lastInsertRowid);
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, type, color } = req.body;

  try {
    const existing = await db
      .prepare("SELECT * FROM categories WHERE id = ? AND user_id = ?")
      .get(id, req.userId);

    if (!existing) {
      return res.status(404).json({ error: "Category not found" });
    }

    await db.prepare(
      "UPDATE categories SET name = ?, type = ?, color = ? WHERE id = ? AND user_id = ?",
    ).run(
      name ?? existing.name,
      type ?? existing.type,
      color ?? existing.color,
      id,
      req.userId,
    );

    const updated = await db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await db
      .prepare("SELECT * FROM categories WHERE id = ? AND user_id = ?")
      .get(id, req.userId);

    if (!existing) {
      return res.status(404).json({ error: "Category not found" });
    }

    await db.prepare("DELETE FROM categories WHERE id = ? AND user_id = ?").run(
      id,
      req.userId,
    );
    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
