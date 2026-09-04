"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateApplicationValidator = exports.createApplicationValidator = void 0;
const zod_1 = __importDefault(require("zod"));
exports.createApplicationValidator = zod_1.default.object({
    companyName: zod_1.default.string("Company Name is required !"),
    jobTitle: zod_1.default.string("jobTitle is required !"),
    workLocation: zod_1.default.enum(["remote", "on-site", "hybrid"], {
        error: (issue) => {
            return issue.input === undefined
                ? "workLocation is required"
                : "workLocation must be remote, on-site, or hybrid";
        },
    }),
    salary: zod_1.default
        .string({
        error: (issue) => {
            return issue.input === undefined
                ? "salary is required !"
                : "Invalid Salary !";
        },
    })
        .optional(),
    jobURL: zod_1.default
        .url("jobURL Must be URL Not normal string")
        .min(1, "jobURL is required"),
    source: zod_1.default.string("source is required"),
    current_status: zod_1.default.enum(["Applied", "Interviewing", "Rejected", "Considering"], {
        error: (issue) => {
            return issue.input === undefined
                ? "application status is required !"
                : "application status must be Applied, Interviewing , Considering or Rejected";
        },
    }),
    date: zod_1.default.coerce
        .date("Date Field must be send as IOS string")
        .min(1, "Date Field is required"),
    notes: zod_1.default.string("Notes Must Be String").optional(),
    contactLink: zod_1.default.string("Contact link must be a string").optional(),
});
exports.updateApplicationValidator = exports.createApplicationValidator
    .partial()
    .extend({
    notes: zod_1.default.preprocess((value) => {
        if (typeof value === "string") {
            try {
                return JSON.parse(value);
            }
            catch {
                return value;
            }
        }
        return value;
    }, zod_1.default
        .array(zod_1.default.object({
        text: zod_1.default.string(),
        _id: zod_1.default.string(),
    }))
        .optional()),
});
//# sourceMappingURL=application.validator.js.map