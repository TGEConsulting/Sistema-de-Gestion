import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { authMiddleware } from "@/middleware/auth.middleware";
import { resumen } from "@/modules/dashboard/dashboard.controller";

export const dashboardRouter = Router();

dashboardRouter.use(authMiddleware);
dashboardRouter.get("/summary", asyncHandler(resumen));
