import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { initDb } from "./database/db.js";
import authRoutes from "./routes/auth.js";
import transactionRoutes from "./routes/transactions.js";
import categoryRoutes from "./routes/categories.js";
import budgetRoutes from "./routes/budgets.js";
import profileRoutes from "./routes/profile.js";
import savingsRoutes from "./routes/savings.js";
import familyRoutes from "./routes/family.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/savings", savingsRoutes);
app.use("/api/family", familyRoutes);

app.get("/api/health", (req, res) => {
  res.json({ message: "Server is running" });
});

// In production, serve the built React app from this same server so the whole
// app lives on one origin (no CORS, no hardcoded API host). In local dev the
// Vite dev server serves the frontend instead, so this block is skipped.
const distPath = path.join(__dirname, "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA fallback: any non-/api GET returns index.html so client-side routing works.
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Create tables / run migrations before accepting traffic.
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
