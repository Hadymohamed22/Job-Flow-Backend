import { Response, Request } from "express";
import User from "../models/user.model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendResetPassEmail } from "../services/send-reset-pass-email.service";

interface AuthRequest extends Request {
  user?: { id: string };
}

// Register
export const registerController = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { fullName, email, password } = req.body;

    const existsUser = await User.findOne({ email });

    if (existsUser)
      return res.status(400).json({
        error: true,
        message: "User Email is already exists !",
      });

    const hashedPass = await bcrypt.hash(password, 10);

    const savedUser = await User.create({
      fullName,
      email,
      password: hashedPass,
    });

    const token = jwt.sign(
      { id: savedUser._id },
      process.env.JWT_SECRET || "cb8f8a0db34a4f869d2c142a44604dca",
      { expiresIn: "12h" },
    );

    return res.status(201).json({
      message: "User Created Successfully !",
      token,
      data: {
        _id: savedUser._id,
        fullName: savedUser.fullName,
        email: savedUser.email,
        createdAt: savedUser.createdAt,
        updatedAt: savedUser.updatedAt,
      },
    });
  } catch (e) {
    console.error((e as Error).message);
    return res
      .status(500)
      .json({ error: true, message: "Internal Server Error" });
  }
};

// Login
export const loginController = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user)
      return res.status(400).json({
        error: true,
        message: "Invalid Email Or Password !",
      });

    const isPassMatch = await bcrypt.compare(password, user.password);

    if (!isPassMatch)
      return res.status(400).json({
        error: true,
        message: "Invalid Email Or Password !",
      });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "cb8f8a0db34a4f869d2c142a44604dca",
      { expiresIn: "12h" },
    );

    return res.status(200).json({
      message: "Login Successfully !",
      token,
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (e) {
    console.error((e as Error).message);
    return res
      .status(500)
      .json({ error: true, message: "Internal Server Error" });
  }
};

// Forget Password
export const forgetPassController = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user)
      return res.status(400).json({
        error: true,
        message: "Email is not exists !",
      });

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpExpireTime = Date.now() + 1000 * 60 * 10; // After 10 Seconds

    user.passwordRestCode = await bcrypt.hash(otp, 10);
    user.passwordRestExpire = new Date(otpExpireTime);

    await user.save();
    await sendResetPassEmail(user.email, otp);

    return res.status(200).json({
      message: "Reset Code Send Successfully,Check your mail !",
    });
  } catch (e) {
    console.error((e as Error).message);
    return res
      .status(500)
      .json({ error: true, message: "Internal Server Error" });
  }
};

// OTP
const MAX_OTP_CODE_ATTEMPTS = 5;
const RESET_TOKEN_EXPIRE_IN = "10m";
export const otpController = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { otpCode, email } = req.body;
    const user = await User.findOne({ email });

    if (!user)
      return res.status(400).json({
        error: true,
        message: "Email is not exists !",
      });

    if (!user.passwordRestCode || !user.passwordRestExpire)
      return res.status(400).json({
        error: true,
        message: "Something went wrong , try send code again !",
      });

    if (new Date(user.passwordRestExpire).getTime() < Date.now())
      return res.status(400).json({
        error: true,
        message: "OTP code is expired , send code again !",
      });

    // Brute Force Protection
    if ((user.otpAttempts ?? 0) > MAX_OTP_CODE_ATTEMPTS) {
      user.passwordRestCode = null;
      user.passwordRestExpire = null;
      user.otpAttempts = 0;
      await user.save();

      return res.status(429).json({
        error: true,
        message: "Too many failed attempts , please request a new code !",
      });
    }

    const isOTPMatch = await bcrypt.compare(otpCode, user.passwordRestCode);

    if (!isOTPMatch) {
      user.otpAttempts = (user.otpAttempts ?? 0) + 1;
      await user.save();

      return res.status(400).json({
        error: true,
        message: "OTP code is not correct !",
      });
    }

    user.passwordRestCode = null;
    user.passwordRestExpire = null;
    user.otpAttempts = 0;

    await user.save();

    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: RESET_TOKEN_EXPIRE_IN },
    );

    return res.status(200).json({
      message: "OTP code is correct",
      resetToken,
    });
  } catch (e) {
    console.error((e as Error).message);
    return res
      .status(500)
      .json({ error: true, message: "Internal Server Error" });
  }
};

// Change Password
export const changePasswordController = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user)
      return res.status(400).json({
        error: true,
        message: "User Email does not exist !",
      });

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid)
      return res.status(400).json({
        error: true,
        message: "Current password is incorrect !",
      });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      message: "Password Changed Successfully !",
    });
  } catch (e) {
    console.error((e as Error).message);
    return res
      .status(500)
      .json({ error: true, message: "Internal Server Error" });
  }
};

// Get User Data
export const getUserController = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user!.id;
    const user = await User.findById(userId).select("-password");

    if (!user) return res.status(404).json({ message: "User not found !" });

    return res.status(200).json({
      user,
    });
  } catch (e) {
    console.error((e as Error).message);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

// Update Profile Info
export const updateProfileController = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user!.id;
    const { email, fullName } = req.body;

    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found !" });

    // Update email if provided
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser)
        return res.status(400).json({
          error: true,
          message: "Email is already in use !",
        });
      user.email = email;
    }

    // Update fullName if provided
    if (fullName) {
      user.fullName = fullName;
    }

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully !",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (e) {
    console.error((e as Error).message);
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
};

// Delete
export const deleteUserController = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const existUser = await User.findByIdAndDelete(req.params.id);

    if (!existUser)
      res.status(404).json({
        error: true,
        message: "User Is not found already !",
      });

    return res.status(200).json({
      message: "User Deleted Successfully !",
      data: existUser,
    });
  } catch (e) {
    console.error((e as Error).message);
    return res
      .status(500)
      .json({ error: true, message: "Internal Server Error" });
  }
};
