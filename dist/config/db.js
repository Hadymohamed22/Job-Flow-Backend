"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    const uri = process.env.DB_URL;
    if (!uri) {
        throw new Error("DB_URI (or DB_URL) is not set");
    }
    try {
        await mongoose_1.default.connect(uri, { family: 4 });
        console.log("MongoDB Connected Successfully :)");
    }
    catch (error) {
        console.error("Failed to connect to MongoDB :", error.message);
        process.exit(1);
    }
};
exports.default = connectDB;
//# sourceMappingURL=db.js.map