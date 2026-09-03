import z from "zod";

// Register
export const createUserValidator = z.object({
  fullName: z.string("fullName is required !"),
  email: z.email({
    error: (issue) => {
      return issue.input === undefined
        ? "email is required !"
        : "Write a correct email !";
    },
  }),
  password: z
    .string("password is required")
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Za-z]/, "Password must contain at least one letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character",
    ),
});

// Login
export const loginUserValidator = z.object({
  email: z.email({
    error: (issue) => {
      return issue.input === undefined
        ? "email is required !"
        : "Please enter a valid email !";
    },
  }),
  password: z.string("password is required !"),
});

// Forget Password
export const forgetPassValidator = z.object({
  email: z.email({
    error: (issue) =>
      issue.input === undefined ? "Email is required !" : "Enter valid email !",
  }),
});

// OTP Validator
export const otpValidator = z.object({
  email: z.email({
    error: (issue) =>
      issue.input === undefined ? "Email is required !" : "Enter valid email !",
  }),
  otpCode: z
    .string()
    .min(1, "OTP is required !")
    .max(6, "Enter a valid otp, OTP max characters 6"),
});

// Change Password Validator
export const changePassValidator = z.object({
  email: z.email({
    error: (issue) =>
      issue.input === undefined ? "Email is required !" : "Enter valid email !",
  }),
  currentPassword: z.string("password is required !"),
  newPassword: z
    .string("password is required")
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Za-z]/, "Password must contain at least one letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character",
    ),
});
