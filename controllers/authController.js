import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../database/db.js";
import dotenv from "dotenv";
import { sendLinkCode, sendVerificationEmail } from '../utils/email.js'
import crypto from 'crypto'
dotenv.config();

const generateCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const register = async (req, res) => {
  const { full_name, email, password, age, parent_email } = req.body;

  if (!full_name || !email || !password || age === undefined) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const existingUser = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(email);
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const isChild = parseInt(age) <= 15;

    if (isChild) {
      if (!parent_email) {
        return res
          .status(400)
          .json({ error: "Parent email is required for users under 16" });
      }

      const parent = db
        .prepare("SELECT id, email FROM users WHERE email = ?")
        .get(parent_email);
      if (!parent) {
        return res
          .status(400)
          .json({
            error:
              "No account found with that parent email. The parent must register first.",
          });
      }

      const code = generateCode();
      const expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      db.prepare("DELETE FROM pending_links WHERE child_email = ?").run(email);
      db.prepare(
        "INSERT INTO pending_links (child_email, parent_id, code, expires_at) VALUES (?, ?, ?, ?)",
      ).run(email, parent.id, code, expires_at);

      const password_hash = await bcrypt.hash(password, 10);
      db.prepare(
        "INSERT INTO users (full_name, email, password_hash, role, age) VALUES (?, ?, ?, ?, ?)",
      ).run(full_name, email, password_hash, "pending", parseInt(age));

      await sendLinkCode(parent_email, email, code);

      return res.status(200).json({
        requiresVerification: true,
        message: "A verification code has been sent to the parent email.",
      });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = db
      .prepare(
        "INSERT INTO users (full_name, email, password_hash, role, age) VALUES (?, ?, ?, ?, ?)",
      )
      .run(full_name, email, password_hash, "parent", parseInt(age));

    const token = jwt.sign(
      { userId: result.lastInsertRowid },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      token,
      user: { id: result.lastInsertRowid, full_name, email, role: "parent" },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const verifyLinkCode = async (req, res) => {
  const { child_email, code } = req.body;

  if (!child_email || !code) {
    return res.status(400).json({ error: "Email and code are required" });
  }

  try {
    const pending = db
      .prepare("SELECT * FROM pending_links WHERE child_email = ? AND code = ?")
      .get(child_email, code);

    if (!pending) {
      return res.status(400).json({ error: "Invalid code" });
    }

    if (new Date(pending.expires_at) < new Date()) {
      db.prepare("DELETE FROM pending_links WHERE id = ?").run(pending.id);
      return res
        .status(400)
        .json({ error: "Code has expired. Please register again." });
    }

    db.prepare("UPDATE users SET role = ?, parent_id = ? WHERE email = ?").run(
      "child",
      pending.parent_id,
      child_email,
    );

    db.prepare("DELETE FROM pending_links WHERE id = ?").run(pending.id);

    const user = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(child_email);
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: "child",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    if (user.role === "pending") {
      return res
        .status(403)
        .json({
          error:
            "Account pending verification. Please enter the code sent to your parent.",
        });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
