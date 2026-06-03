import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  getChildren,
  getChildSummary,
} from "../controllers/familyController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/children", getChildren);
router.get("/child/:childId", getChildSummary);

export default router;
