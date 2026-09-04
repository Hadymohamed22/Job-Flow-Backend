"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const fs_1 = __importDefault(require("fs"));
const validate = (schema, options) => (req, res, next) => {
    try {
        if (options?.requireFile) {
            const hasFile = req.file ||
                (req.files &&
                    (Array.isArray(req.files)
                        ? req.files.length > 0
                        : Object.keys(req.files).length > 0));
            if (!hasFile) {
                return res.status(400).json({
                    error: true,
                    message: "File is required, try upload again!",
                });
            }
        }
        const parsedData = schema.parse(req.body);
        req.body = parsedData;
        return next();
    }
    catch (err) {
        if (req.file) {
            fs_1.default.unlink(req.file.path, (unlinkErr) => {
                if (unlinkErr)
                    console.error("Failed to delete orphan file:", unlinkErr);
            });
        }
        if (err instanceof zod_1.ZodError) {
            return res.status(400).json({
                error: true,
                message: err.issues[0]?.message,
                errors: zod_1.z.flattenError(err).fieldErrors,
            });
        }
        return next(err);
    }
};
exports.default = validate;
//# sourceMappingURL=validate.middleware.js.map