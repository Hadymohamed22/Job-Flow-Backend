import express from "express";
import {
  changePasswordController,
  deleteUserController,
  forgetPassController,
  getUserController,
  loginController,
  otpController,
  registerController,
  updateProfileController,
} from "../controllers/user.controller";
import validate from "../middlewares/validate.middleware";
import {
  changePassValidator,
  createUserValidator,
  forgetPassValidator,
  loginUserValidator,
  otpValidator,
} from "../validators/user.validator";
import { verifyToken } from "../middlewares/auth.middleware";

const router = express.Router();

// /auth/register POST
router.post("/register", validate(createUserValidator), registerController);

// /auth/login POST
router.post("/login", validate(loginUserValidator), loginController);

// /auth/forget-password POST
router.post(
  "/forget-password",
  validate(forgetPassValidator),
  forgetPassController,
);

// /auth/verify-otp POST
router.post("/verify-otp", validate(otpValidator), otpController);

// /auth/change-password PATCH
router.patch(
  "/change-password",
  verifyToken,
  validate(changePassValidator),
  changePasswordController,
);

// /auth/me GET
router.get("/me", verifyToken, getUserController);

// Edit Profile Info
router.patch("/me/profile", verifyToken, updateProfileController);

// Delete
router.delete("/me/:id", deleteUserController);

export default router;
