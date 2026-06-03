import db from "../database/db.js";
import bcrypt from "bcrypt";

export const getProfile = (req, res) => {
  try {
    const user = db
      .prepare(
        "SELECT id, full_name, email, created_at FROM users WHERE id = ?",
      )
      .get(req.userId);

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const updateFullName = (req, res) => {
  const { full_name } = req.body;

  if (!full_name || full_name.trim() === "") {
    return res.status(400).json({ error: "Full name is required" });
  }

  try {
    db.prepare("UPDATE users SET full_name = ? WHERE id = ?").run(
      full_name.trim(),
      req.userId,
    );

    const updated = db
      .prepare(
        "SELECT id, full_name, email, created_at FROM users WHERE id = ?",
      )
      .get(req.userId);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const updatePassword = async (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res
      .status(400)
      .json({ error: "Both current and new password are required" });
  }

  if (new_password.length < 6) {
    return res
      .status(400)
      .json({ error: "New password must be at least 6 characters" });
  }

  try {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
    const match = await bcrypt.compare(current_password, user.password_hash);

    if (!match) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const password_hash = await bcrypt.hash(new_password, 10);
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(
      password_hash,
      req.userId,
    );

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
