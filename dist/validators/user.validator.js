"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassValidator = exports.otpValidator = exports.forgetPassValidator = exports.loginUserValidator = exports.createUserValidator = void 0;
const zod_1 = __importDefault(require("zod"));
// Register
exports.createUserValidator = zod_1.default.object({
    fullName: zod_1.default.string("fullName is required !"),
    email: zod_1.default.email({
        error: (issue) => {
            return issue.input === undefined
                ? "email is required !"
                : "Write a correct email !";
        },
    }),
    password: zod_1.default
        .string("password is required")
        .min(8, "Password must be at least 8 characters long")
        .regex(/[A-Za-z]/, "Password must contain at least one letter")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/\d/, "Password must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});
// Login
exports.loginUserValidator = zod_1.default.object({
    email: zod_1.default.email({
        error: (issue) => {
            return issue.input === undefined
                ? "email is required !"
                : "Please enter a valid email !";
        },
    }),
    password: zod_1.default.string("password is required !"),
});
// Forget Password
exports.forgetPassValidator = zod_1.default.object({
    email: zod_1.default.email({
        error: (issue) => issue.input === undefined ? "Email is required !" : "Enter valid email !",
    }),
});
// OTP Validator
exports.otpValidator = zod_1.default.object({
    email: zod_1.default.email({
        error: (issue) => issue.input === undefined ? "Email is required !" : "Enter valid email !",
    }),
    otpCode: zod_1.default
        .string()
        .min(1, "OTP is required !")
        .max(6, "Enter a valid otp, OTP max characters 6"),
});
// Change Password Validator
exports.changePassValidator = zod_1.default.object({
    email: zod_1.default.email({
        error: (issue) => issue.input === undefined ? "Email is required !" : "Enter valid email !",
    }),
    currentPassword: zod_1.default.string("password is required !"),
    newPassword: zod_1.default
        .string("password is required")
        .min(8, "Password must be at least 8 characters long")
        .regex(/[A-Za-z]/, "Password must contain at least one letter")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/\d/, "Password must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});
//# sourceMappingURL=user.validator.js.map