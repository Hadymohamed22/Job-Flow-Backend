"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
        return res.status(401).json({
            error: true,
            message: "Token is not provided !",
        });
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.id };
        return next();
    }
    catch (e) {
        console.error(`Verify Token failed : ` + e.message);
        res.status(401).json({
            error: true,
            message: "Unauthorized User !",
        });
    }
};
exports.verifyToken = verifyToken;
//# sourceMappingURL=auth.middleware.js.map