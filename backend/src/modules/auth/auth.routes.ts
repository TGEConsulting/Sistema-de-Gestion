import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middleware/validate.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { loginGoogleSchema, loginSchema } from "./auth.validators";
import { loginRateLimiter } from "../../middleware/rateLimit.middleware";
import {
  loginController,
  loginGoogleController,
  logoutAllController,
  meController,
} from "./auth.controller";

export const authRouter = Router();

authRouter.post("/login", loginRateLimiter, validate(loginSchema), asyncHandler(loginController));
authRouter.post(
  "/google",
  loginRateLimiter,
  validate(loginGoogleSchema),
  asyncHandler(loginGoogleController)
);
authRouter.get("/me", authMiddleware, asyncHandler(meController));
authRouter.post("/logout-all", authMiddleware, asyncHandler(logoutAllController));
