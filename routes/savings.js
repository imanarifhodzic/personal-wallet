import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  getSavingsGoals,
  createSavingsGoal,
  addContribution,
  updateSavingsGoal,
  deleteSavingsGoal,
} from "../controllers/savingsController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getSavingsGoals);
router.post("/", createSavingsGoal);
router.post("/:id/contribute", addContribution);
router.put("/:id", updateSavingsGoal);
router.delete("/:id", deleteSavingsGoal);

export default router;
