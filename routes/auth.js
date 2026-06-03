import express from "express";
import {
  register,
  login,
  verifyLinkCode,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-link", verifyLinkCode);

export default router;
