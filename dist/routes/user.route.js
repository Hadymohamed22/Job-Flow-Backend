"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const validate_middleware_1 = __importDefault(require("../middlewares/validate.middleware"));
const user_validator_1 = require("../validators/user.validator");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
// /auth/register POST
router.post("/register", (0, validate_middleware_1.default)(user_validator_1.createUserValidator), user_controller_1.registerController);
// /auth/login POST
router.post("/login", (0, validate_middleware_1.default)(user_validator_1.loginUserValidator), user_controller_1.loginController);
// /auth/forget-password POST
router.post("/forget-password", (0, validate_middleware_1.default)(user_validator_1.forgetPassValidator), user_controller_1.forgetPassController);
// /auth/verify-otp POST
router.post("/verify-otp", (0, validate_middleware_1.default)(user_validator_1.otpValidator), user_controller_1.otpController);
// /auth/change-password PATCH
router.patch("/change-password", auth_middleware_1.verifyToken, (0, validate_middleware_1.default)(user_validator_1.changePassValidator), user_controller_1.changePasswordController);
// /auth/me GET
router.get("/me", auth_middleware_1.verifyToken, user_controller_1.getUserController);
// Edit Profile Info
router.patch("/me/profile", auth_middleware_1.verifyToken, user_controller_1.updateProfileController);
// Delete
router.delete("/me/:id", user_controller_1.deleteUserController);
exports.default = router;
//# sourceMappingURL=user.route.js.map