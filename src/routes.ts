// src/routes.ts

import { Router } from "express";
import authRouter from "./modules/auth/auth.routes";

const router = Router();

// AUTH
router.use("/auth", authRouter);

export default router;
