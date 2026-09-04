"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const StatusHistorySchema = new mongoose_1.default.Schema({
    status: { type: String, required: true },
    changed_at: { type: Date, default: Date.now },
});
const NoteSchema = new mongoose_1.default.Schema({
    text: { type: String, required: true },
});
const ApplicationSchema = new mongoose_1.default.Schema({
    companyName: { type: String, required: true },
    jobTitle: { type: String, required: true },
    workLocation: {
        type: String,
        required: true,
        enum: ["remote", "on-site", "hybrid"],
    },
    salary: { type: Number, default: null },
    jobURL: { type: String, required: true },
    source: {
        type: String,
        required: true,
    },
    current_status: {
        type: String,
        required: true,
        enum: ["Applied", "Interviewing", "Considering", "Rejected"],
    },
    status_history: [StatusHistorySchema],
    date: { type: Date, required: true },
    fileName: { type: String, required: true },
    notes: {
        type: [NoteSchema],
        default: [],
    },
    companyImageURL: { type: String },
    contactLink: { type: String },
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
}, {
    timestamps: true,
});
const ApplicationModel = mongoose_1.default.model("Application", ApplicationSchema);
exports.default = ApplicationModel;
//# sourceMappingURL=applications.model.js.map