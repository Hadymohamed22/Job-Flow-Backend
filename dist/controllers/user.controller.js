"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserController = exports.updateProfileController = exports.getUserController = exports.changePasswordController = exports.otpController = exports.forgetPassController = exports.loginController = exports.registerController = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const send_reset_pass_email_service_1 = require("../services/send-reset-pass-email.service");
// Register
const registerController = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        const existsUser = await user_model_1.default.findOne({ email });
        if (existsUser)
            return res.status(400).json({
                error: true,
                message: "User Email is already exists !",
            });
        const hashedPass = await bcrypt_1.default.hash(password, 10);
        const savedUser = await user_model_1.default.create({
            fullName,
            email,
            password: hashedPass,
        });
        const token = jsonwebtoken_1.default.sign({ id: savedUser._id }, process.env.JWT_SECRET || "cb8f8a0db34a4f869d2c142a44604dca", { expiresIn: "12h" });
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
    }
    catch (e) {
        console.error(e.message);
        return res
            .status(500)
            .json({ error: true, message: "Internal Server Error" });
    }
};
exports.registerController = registerController;
// Login
const loginController = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await user_model_1.default.findOne({ email });
        if (!user)
            return res.status(400).json({
                error: true,
                message: "Invalid Email Or Password !",
            });
        const isPassMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isPassMatch)
            return res.status(400).json({
                error: true,
                message: "Invalid Email Or Password !",
            });
        const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET || "cb8f8a0db34a4f869d2c142a44604dca", { expiresIn: "12h" });
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
    }
    catch (e) {
        console.error(e.message);
        return res
            .status(500)
            .json({ error: true, message: "Internal Server Error" });
    }
};
exports.loginController = loginController;
// Forget Password
const forgetPassController = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await user_model_1.default.findOne({ email });
        if (!user)
            return res.status(400).json({
                error: true,
                message: "Email is not exists !",
            });
        const otp = crypto_1.default.randomInt(100000, 1000000).toString();
        const otpExpireTime = Date.now() + 1000 * 60 * 10; // After 10 Seconds
        user.passwordRestCode = await bcrypt_1.default.hash(otp, 10);
        user.passwordRestExpire = new Date(otpExpireTime);
        await user.save();
        await (0, send_reset_pass_email_service_1.sendResetPassEmail)(user.email, otp);
        return res.status(200).json({
            message: "Reset Code Send Successfully,Check your mail !",
        });
    }
    catch (e) {
        console.error(e.message);
        return res
            .status(500)
            .json({ error: true, message: "Internal Server Error" });
    }
};
exports.forgetPassController = forgetPassController;
// OTP
const MAX_OTP_CODE_ATTEMPTS = 5;
const RESET_TOKEN_EXPIRE_IN = "10m";
const otpController = async (req, res) => {
    try {
        const { otpCode, email } = req.body;
        const user = await user_model_1.default.findOne({ email });
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
        const isOTPMatch = await bcrypt_1.default.compare(otpCode, user.passwordRestCode);
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
        const resetToken = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: RESET_TOKEN_EXPIRE_IN });
        return res.status(200).json({
            message: "OTP code is correct",
            resetToken,
        });
    }
    catch (e) {
        console.error(e.message);
        return res
            .status(500)
            .json({ error: true, message: "Internal Server Error" });
    }
};
exports.otpController = otpController;
// Change Password
const changePasswordController = async (req, res) => {
    try {
        const { email, currentPassword, newPassword } = req.body;
        const user = await user_model_1.default.findOne({ email });
        if (!user)
            return res.status(400).json({
                error: true,
                message: "User Email does not exist !",
            });
        const isPasswordValid = await bcrypt_1.default.compare(currentPassword, user.password);
        if (!isPasswordValid)
            return res.status(400).json({
                error: true,
                message: "Current password is incorrect !",
            });
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        return res.status(200).json({
            message: "Password Changed Successfully !",
        });
    }
    catch (e) {
        console.error(e.message);
        return res
            .status(500)
            .json({ error: true, message: "Internal Server Error" });
    }
};
exports.changePasswordController = changePasswordController;
// Get User Data
const getUserController = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await user_model_1.default.findById(userId).select("-password");
        if (!user)
            return res.status(404).json({ message: "User not found !" });
        return res.status(200).json({
            user,
        });
    }
    catch (e) {
        console.error(e.message);
        return res.status(500).json({
            message: "Internal Server Error",
        });
    }
};
exports.getUserController = getUserController;
// Update Profile Info
const updateProfileController = async (req, res) => {
    try {
        const userId = req.user.id;
        const { email, fullName } = req.body;
        const user = await user_model_1.default.findById(userId);
        if (!user)
            return res.status(404).json({ message: "User not found !" });
        // Update email if provided
        if (email) {
            const existingUser = await user_model_1.default.findOne({ email, _id: { $ne: userId } });
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
    }
    catch (e) {
        console.error(e.message);
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        });
    }
};
exports.updateProfileController = updateProfileController;
// Delete
const deleteUserController = async (req, res) => {
    try {
        const existUser = await user_model_1.default.findByIdAndDelete(req.params.id);
        if (!existUser)
            res.status(404).json({
                error: true,
                message: "User Is not found already !",
            });
        return res.status(200).json({
            message: "User Deleted Successfully !",
            data: existUser,
        });
    }
    catch (e) {
        console.error(e.message);
        return res
            .status(500)
            .json({ error: true, message: "Internal Server Error" });
    }
};
exports.deleteUserController = deleteUserController;
//# sourceMappingURL=user.controller.js.map