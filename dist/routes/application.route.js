"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const applications_model_1 = __importDefault(require("../models/applications.model"));
const validate_middleware_1 = __importDefault(require("../middlewares/validate.middleware"));
const application_validator_1 = require("../validators/application.validator");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const multer_1 = require("../config/multer");
const mongoose_1 = __importDefault(require("mongoose"));
const cloudinary_1 = require("../config/cloudinary");
const router = express_1.default.Router();
// GET All
router.get("/", auth_middleware_1.verifyToken, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            error: true,
            message: "Unauthorized: user not found in request.",
        });
    }
    const applications = await applications_model_1.default.find({
        userId: req.user.id,
    });
    if (applications.length === 0) {
        return res.status(200).json({
            message: "Not Applications Yet !",
            data: applications,
        });
    }
    return res.status(200).json({
        message: "Applications Get Successfully !",
        data: applications,
    });
});
// GET Dashboard statistics
router.get("/statistics", auth_middleware_1.verifyToken, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            error: true,
            message: "Unauthorized: user not found in request.",
        });
    }
    try {
        const applications = await applications_model_1.default.find({ userId: req.user.id }).select("current_status");
        const statuses = applications.map((application) => String(application.current_status ?? "")
            .trim()
            .toLowerCase());
        const consideringStatuses = ["considering"];
        const interviewStatuses = ["interviewing"];
        const responseStatuses = ["interviewing", "considering", "rejected"];
        const totalApplications = applications.length;
        const responses = statuses.filter((status) => responseStatuses.includes(status)).length;
        return res.status(200).json({
            success: true,
            data: {
                totalApplications,
                inConsidering: statuses.filter((status) => consideringStatuses.includes(status)).length,
                activeInterviews: statuses.filter((status) => interviewStatuses.includes(status)).length,
                responseRate: totalApplications === 0
                    ? 0
                    : Math.round((responses / totalApplications) * 100),
            },
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({ error: true, message: error.message });
    }
});
// Get Dashboard Chart Data
router.get("/chart-data", auth_middleware_1.verifyToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized", error: true });
        }
        const chartData = await applications_model_1.default.aggregate([
            {
                $match: {
                    userId: new mongoose_1.default.Types.ObjectId(userId),
                },
            },
            { $sort: { date: 1 } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    count: { $sum: 1 },
                    firstApp: { $first: "$$ROOT" },
                },
            },
            {
                $project: {
                    _id: 0,
                    date: "$_id",
                    count: 1,
                    jobTitle: "$firstApp.jobTitle",
                    companyName: "$firstApp.companyName",
                },
            },
            { $sort: { date: 1 } },
        ]);
        return res.status(200).json({
            message: "Chart Data Get Successfully !",
            data: chartData,
        });
    }
    catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ message: "Something went wrong", error: true });
    }
});
// Get Upcoming Interviews
router.get("/upcoming-interviews", auth_middleware_1.verifyToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized", error: true });
        }
        const upcomingInterviews = await applications_model_1.default.aggregate([
            {
                $match: {
                    userId: new mongoose_1.default.Types.ObjectId(userId),
                    current_status: "Interviewing",
                },
            },
            {
                $project: {
                    _id: 1,
                    companyName: 1,
                    jobTitle: 1,
                    companyImageURL: 1,
                    lastInterviewStatusChange: {
                        $let: {
                            vars: {
                                interviewEntries: {
                                    $filter: {
                                        input: "$status_history",
                                        as: "sh",
                                        cond: { $eq: ["$$sh.status", "Interviewing"] },
                                    },
                                },
                            },
                            in: { $arrayElemAt: ["$$interviewEntries.changed_at", -1] },
                        },
                    },
                },
            },
            {
                $addFields: {
                    interviewDate: {
                        $ifNull: ["$lastInterviewStatusChange", "$createdAt"],
                    },
                },
            },
            { $sort: { interviewDate: 1 } },
            {
                $project: {
                    _id: 1,
                    companyName: 1,
                    jobTitle: 1,
                    companyImageURL: 1,
                    interviewDate: 1,
                },
            },
        ]);
        return res.status(200).json({
            message: "Upcoming Interviews Get Successfully !",
            data: upcomingInterviews,
        });
    }
    catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ message: "Something went wrong", error: true });
    }
});
// Get Activity Feed
router.get("/activity-feed", auth_middleware_1.verifyToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized", error: true });
        }
        const limit = parseInt(req.query.limit) || 10;
        const activityFeed = await applications_model_1.default.aggregate([
            {
                $match: {
                    userId: new mongoose_1.default.Types.ObjectId(userId),
                },
            },
            { $unwind: "$status_history" },
            {
                $project: {
                    _id: 0,
                    applicationId: "$_id",
                    companyName: 1,
                    jobTitle: 1,
                    companyImageURL: 1,
                    status: "$status_history.status",
                    changed_at: "$status_history.changed_at",
                },
            },
            { $sort: { changed_at: -1 } },
            { $limit: limit },
        ]);
        return res.status(200).json({
            message: "Activity Feed Get Successfully !",
            data: activityFeed,
        });
    }
    catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ message: "Something went wrong", error: true });
    }
});
// GET One
router.get("/:id", auth_middleware_1.verifyToken, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            error: true,
            message: "Unauthorized: user not found in request.",
        });
    }
    const application = await applications_model_1.default.findOne({
        _id: req.params.id,
        userId: req.user.id,
    });
    if (!application)
        return res.status(400).json({
            message: "There is not application match this id !",
            data: null,
        });
    return res.status(200).json({
        message: "Application Get Successfully !",
        data: application,
    });
});
// POST
router.post("/", auth_middleware_1.verifyToken, multer_1.upload.single("company-image"), (0, validate_middleware_1.default)(application_validator_1.createApplicationValidator, { requireFile: true }), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: true,
                message: "Unauthorized: user not found in request.",
            });
        }
        const image = req.file;
        if (!image) {
            return res
                .status(400)
                .json({ error: true, message: "Company image not uploaded !" });
        }
        const { companyName, jobTitle, workLocation, salary, jobURL, source, current_status, date, notes, contactLink, } = req.body;
        const { url: companyImageURL, publicId } = await (0, cloudinary_1.uploadImageBuffer)(image.buffer);
        const initialStatus = current_status || "Applied";
        const notesArray = notes
            ? Array.isArray(notes)
                ? notes
                : [notes]
            : [];
        const newApplication = new applications_model_1.default({
            companyName,
            jobTitle,
            workLocation,
            salary: Number(salary),
            jobURL,
            source,
            current_status,
            status_history: [{ status: initialStatus, changed_at: new Date() }],
            date,
            notes: notesArray.map((text) => ({ text })),
            fileName: publicId, // 👈 بقت بتخزن الـ Cloudinary public_id مش اسم ملف محلي
            contactLink: contactLink ?? null,
            companyImageURL,
            userId: req.user.id,
        });
        await newApplication.save();
        return res.status(201).json({
            message: "Application Added Successfully !",
            data: {
                companyName,
                jobTitle,
                workLocation,
                salary,
                jobURL,
                source,
                current_status: initialStatus,
                date,
                notes,
                companyImageURL,
                contactLink,
            },
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            error: true,
            message: "Internal Server Error , Try Again Later",
        });
    }
});
// Delete Note
router.delete("/:application_id/notes/:note_id", auth_middleware_1.verifyToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: true,
                message: "Unauthorized: user not found in request.",
            });
        }
        const { application_id, note_id } = req.params;
        const updatedApplication = await applications_model_1.default.findOneAndUpdate({
            _id: application_id,
            userId: req.user.id,
            "notes._id": note_id,
        }, { $pull: { notes: { _id: note_id } } }, { returnDocument: "after" });
        if (!updatedApplication) {
            return res.status(404).json({
                error: true,
                message: "Application or note not found",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Note deleted successfully",
            data: updatedApplication,
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({ message: error.message, error: true });
    }
});
// Patch
router.patch("/:id", auth_middleware_1.verifyToken, multer_1.upload.single("company-image"), (0, validate_middleware_1.default)(application_validator_1.updateApplicationValidator), async (req, res) => {
    const ALLOWED_FIELDS = [
        "companyName",
        "jobTitle",
        "workLocation",
        "salary",
        "jobURL",
        "source",
        "current_status",
        "date",
        "notes",
        "contactLink",
    ];
    if (!req.user) {
        return res
            .status(401)
            .json({
            error: true,
            message: "Unauthorized: user not found in request.",
        });
    }
    try {
        const updateData = {};
        for (const field of ALLOWED_FIELDS) {
            if (req.body[field] !== undefined) {
                updateData[field] =
                    field === "salary" ? Number(req.body[field]) : req.body[field];
            }
        }
        const isApplicationExist = await applications_model_1.default.findOne({
            _id: req.params.id,
            userId: req.user.id,
        });
        if (!isApplicationExist) {
            return res
                .status(404)
                .json({
                error: true,
                message: "There is no application matching this id!",
            });
        }
        if (req.file) {
            // امسح الصورة القديمة من Cloudinary لو موجودة
            if (isApplicationExist.fileName) {
                await (0, cloudinary_1.deleteImage)(isApplicationExist.fileName);
            }
            const { url, publicId } = await (0, cloudinary_1.uploadImageBuffer)(req.file.buffer);
            updateData.fileName = publicId;
            updateData.companyImageURL = url;
        }
        if (Object.keys(updateData).length === 0) {
            return res
                .status(400)
                .json({ error: true, message: "No fields provided for update!" });
        }
        const updatedApplication = await applications_model_1.default.findByIdAndUpdate(req.params.id, updateData, {
            returnDocument: "after",
            runValidators: true,
        });
        return res.status(200).json({
            message: "Application updated successfully!",
            data: { ...updatedApplication.toObject() },
        });
    }
    catch (error) {
        console.error("Error updating application:", error);
        return res
            .status(500)
            .json({
            message: "Internal Server Error",
            error: error.message,
        });
    }
});
// Delete
router.delete("/:id", auth_middleware_1.verifyToken, async (req, res) => {
    if (!req.user) {
        return res
            .status(401)
            .json({
            error: true,
            message: "Unauthorized: user not found in request.",
        });
    }
    const application = await applications_model_1.default.findOneAndDelete({
        _id: req.params.id,
        userId: req.user.id,
    });
    if (!application) {
        return res
            .status(400)
            .json({
            message: "There is no application match this id !",
            error: true,
        });
    }
    if (application.fileName) {
        await (0, cloudinary_1.deleteImage)(application.fileName);
    }
    return res
        .status(200)
        .json({ message: "Application Deleted Successfully !", data: application });
});
// Edit Application TimeLine
router.patch("/:id/status", async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        const allowedStatuses = [
            "Applied",
            "Interviewing",
            "Considering",
            "Rejected",
        ];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Status must be one of: ${allowedStatuses.join(", ")}`,
            });
        }
        const updatedApplication = await applications_model_1.default.findByIdAndUpdate(id, {
            $set: { current_status: status },
            $push: {
                status_history: {
                    status: status,
                    notes: notes || `Status updated to ${status}`,
                    changed_at: new Date(),
                },
            },
        }, { new: true, runValidators: true });
        if (!updatedApplication) {
            return res
                .status(404)
                .json({ success: false, message: "Application not found" });
        }
        return res.status(200).json({
            success: true,
            message: "Application status updated successfully",
            data: updatedApplication,
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({ success: false, error: error.message });
    }
});
// Add Note
router.patch("/:id/notes", auth_middleware_1.verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { note } = req.body;
        if (!note) {
            return res
                .status(400)
                .json({ error: true, message: "Note content is required" });
        }
        if (typeof note !== "string")
            return res
                .status(400)
                .json({ error: true, message: "Note Content is required !" });
        const updatedApp = await applications_model_1.default.findByIdAndUpdate(id, {
            $push: { notes: { text: note.trim() } },
        }, { returnDocument: "after" });
        if (!updatedApp) {
            return res
                .status(404)
                .json({ error: true, message: "Application not found" });
        }
        return res.status(200).json({
            success: true,
            message: "Note added successfully",
            data: updatedApp,
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({ message: error.message, error: true });
    }
});
// Edit Note
router.patch("/:application_id/notes/:note_id/", auth_middleware_1.verifyToken, async (req, res) => {
    try {
        const { application_id, note_id } = req.params;
        const { new_note } = req.body;
        if (!new_note || typeof new_note !== "string" || !new_note.trim()) {
            return res.status(400).json({
                error: true,
                message: "Note content is required",
            });
        }
        const updatedApplication = await applications_model_1.default.findOneAndUpdate({
            _id: application_id,
            "notes._id": note_id,
        }, {
            $set: {
                "notes.$.text": new_note.trim(),
            },
        }, {
            returnDocument: "after",
        });
        if (!updatedApplication) {
            return res.status(404).json({
                error: true,
                message: "Application or note not found",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Note updated successfully",
            data: updatedApplication,
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({ message: error.message, error: true });
    }
});
exports.default = router;
//# sourceMappingURL=application.route.js.map