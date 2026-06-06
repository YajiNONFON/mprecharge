import { Router } from "express";
import { authRouter } from "./modules/auth/auth.routes";
import { userRouter } from "./modules/user/user.routes";
import { profileRouter } from "./modules/profile/profile.routes";
import { operationRouter } from "./modules/operation/operation.routes";
import { transactionRouter } from "./modules/transaction/transaction.routes";
import { notificationRouter } from "./modules/notification/notification.routes";
import { serviceRouter } from "./modules/service/service.routes";
import { promoRouter } from "./modules/promo/promo.routes";
import { adminRouter } from "./modules/admin/admin.routes";

const router = Router();

router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/profile", profileRouter);
router.use("/operations", operationRouter);
router.use("/transactions", transactionRouter);
router.use("/notifications", notificationRouter);
router.use("/services", serviceRouter);
router.use("/promos", promoRouter);
router.use("/admin", adminRouter);

export default router;
