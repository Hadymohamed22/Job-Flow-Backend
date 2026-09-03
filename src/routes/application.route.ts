import fs from "fs";
import express from "express";
import Application from "../models/applications.model";
import validate from "../middlewares/validate.middleware";
import {
  createApplicationValidator,
  updateApplicationValidator,
} from "../validators/application.validator";
import { verifyToken } from "../middlewares/auth.middleware";
import { upload } from "../config/multer";
import path from "path";
import { AuthRequest } from "../types/global";
import mongoose from "mongoose";

const router = express.Router();

// GET All
router.get("/", verifyToken, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({
      error: true,
      message: "Unauthorized: user not found in request.",
    });
  }

  const applications = await Application.find({
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
router.get("/statistics", verifyToken, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({
      error: true,
      message: "Unauthorized: user not found in request.",
    });
  }

  try {
    const applications = await Application.find({ userId: req.user.id }).select(
      "current_status",
    );
    const statuses = applications.map((application) =>
      String(application.current_status ?? "")
        .trim()
        .toLowerCase(),
    );
    const consideringStatuses = ["considering"];
    const interviewStatuses = ["interviewing"];
    const responseStatuses = ["interviewing", "considering", "rejected"];
    const totalApplications = applications.length;
    const responses = statuses.filter((status) =>
      responseStatuses.includes(status),
    ).length;

    return res.status(200).json({
      success: true,
      data: {
        totalApplications,
        inConsidering: statuses.filter((status) =>
          consideringStatuses.includes(status),
        ).length,
        activeInterviews: statuses.filter((status) =>
          interviewStatuses.includes(status),
        ).length,
        responseRate:
          totalApplications === 0
            ? 0
            : Math.round((responses / totalApplications) * 100),
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: true, message: (error as Error).message });
  }
});

// Get Dashboard Chart Data
router.get("/chart-data", verifyToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized", error: true });
    }

    const chartData = await Application.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
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
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Something went wrong", error: true });
  }
});

// Get Upcoming Interviews
router.get(
  "/upcoming-interviews",
  verifyToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized", error: true });
      }

      const upcomingInterviews = await Application.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
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
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Something went wrong", error: true });
    }
  },
);

// Get Activity Feed
router.get("/activity-feed", verifyToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized", error: true });
    }

    const limit = parseInt(req.query.limit as string) || 10;

    const activityFeed = await Application.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
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
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Something went wrong", error: true });
  }
});

// GET One
router.get("/:id", verifyToken, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({
      error: true,
      message: "Unauthorized: user not found in request.",
    });
  }

  const application = await Application.findOne({
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
router.post(
  "/",
  verifyToken,
  upload.single("company-image"),
  validate(createApplicationValidator, { requireFile: true }),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: true,
          message: "Unauthorized: user not found in request.",
        });
      }

      const image = req.file;

      if (!image)
        return res.status(400).json({
          error: true,
          message: "Company image not uploaded !",
        });

      const {
        companyName,
        jobTitle,
        workLocation,
        salary,
        jobURL,
        source,
        current_status,
        date,
        notes,
        contactLink,
      } = req.body;

      const companyImageURL = `${req.protocol}://${req.get("host")}/uploads/${image.filename}`;
      const initialStatus = current_status || "Applied";
      const notesArray: string[] = notes
        ? Array.isArray(notes)
          ? notes
          : [notes]
        : [];

      const newApplication = new Application({
        companyName,
        jobTitle,
        workLocation,
        salary: Number(salary),
        jobURL,
        source,
        current_status,
        status_history: [
          {
            status: initialStatus,
            changed_at: new Date(),
          },
        ],
        date,
        notes: notesArray.map((text) => ({ text })),
        fileName: image.filename,
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
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: true,
        message: "Internal Server Error , Try Again Later",
      });
    }
  },
);

// Delete Note
router.delete(
  "/:application_id/notes/:note_id",
  verifyToken,
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: true,
          message: "Unauthorized: user not found in request.",
        });
      }

      const { application_id, note_id } = req.params;

      const updatedApplication = await Application.findOneAndUpdate(
        {
          _id: application_id,
          userId: req.user.id,
          "notes._id": note_id,
        },
        { $pull: { notes: { _id: note_id } } },
        { returnDocument: "after" },
      );

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
    } catch (error) {
      return res
        .status(500)
        .json({ message: (error as Error).message, error: true });
    }
  },
);

// Patch
router.patch(
  "/:id",
  verifyToken,
  upload.single("company-image"),
  validate(updateApplicationValidator),
  async (req: AuthRequest, res) => {
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
      return res.status(401).json({
        error: true,
        message: "Unauthorized: user not found in request.",
      });
    }

    try {
      const updateData: Record<string, any> = {};
      for (const field of ALLOWED_FIELDS) {
        if (req.body[field] !== undefined) {
          updateData[field] =
            field === "salary" ? Number(req.body[field]) : req.body[field];
        }
      }

      const isApplicationExist = await Application.findOne({
        _id: req.params.id,
        userId: req.user.id,
      });

      if (!isApplicationExist) {
        if (req.file) {
          fs.unlink(req.file.path, (err) => {
            if (err) console.error("Failed to delete orphan file:", err);
          });
        }

        return res.status(404).json({
          error: true,
          message: "There is no application matching this id!",
        });
      }

      if (req.file) {
        if (isApplicationExist.fileName) {
          const oldPath = path.join(
            __dirname,
            "../assets/images",
            isApplicationExist.fileName,
          );
          fs.unlink(oldPath, (err) => {
            if (err) console.error("Failed to delete old image:", err);
          });
        }
        const fileName = (req.file as Express.Multer.File).filename;
        updateData.fileName = fileName;
        updateData.companyImageURL = `${req.protocol}://${req.get(
          "host",
        )}/uploads/${fileName}`;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: true,
          message: "No fields provided for update!",
        });
      }

      const updatedApplication = await Application.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
          returnDocument: "after",
          runValidators: true,
        },
      );

      const companyImageURL = `${req.protocol}://${req.get("host")}/uploads/${
        updatedApplication!.fileName
      }`;

      return res.status(200).json({
        message: "Application updated successfully!",
        data: {
          ...updatedApplication!.toObject(),
          companyImageURL,
        },
      });
    } catch (error) {
      console.error("Error updating application:", error);
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  },
);

// Delete
router.delete("/:id", verifyToken, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({
      error: true,
      message: "Unauthorized: user not found in request.",
    });
  }

  const application = await Application.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.id,
  });

  if (!application) {
    return res.status(400).json({
      message: "There is no application match this id !",
      error: true,
    });
  }

  const filePath = path.join(
    __dirname,
    "..",
    "assets",
    "images",
    application.fileName,
  );
  fs.unlink(filePath, (err) => {
    if (err)
      console.error("Failed to delete file for deleted application:", err);
  });

  return res.status(200).json({
    message: "Application Deleted Successfully !",
    data: application,
  });
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

    const updatedApplication = await Application.findByIdAndUpdate(
      id,
      {
        $set: { current_status: status },
        $push: {
          status_history: {
            status: status,
            notes: notes || `Status updated to ${status}`,
            changed_at: new Date(),
          },
        },
      },
      { new: true, runValidators: true },
    );

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
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: (error as Error).message });
  }
});

// Add Note
router.patch("/:id/notes", verifyToken, async (req, res) => {
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

    const updatedApp = await Application.findByIdAndUpdate(
      id,
      {
        $push: { notes: { text: note.trim() } },
      },
      { returnDocument: "after" },
    );

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
  } catch (error) {
    return res
      .status(500)
      .json({ message: (error as Error).message, error: true });
  }
});

// Edit Note
router.patch(
  "/:application_id/notes/:note_id/",
  verifyToken,
  async (req, res) => {
    try {
      const { application_id, note_id } = req.params;
      const { new_note } = req.body;

      if (!new_note || typeof new_note !== "string" || !new_note.trim()) {
        return res.status(400).json({
          error: true,
          message: "Note content is required",
        });
      }

      const updatedApplication = await Application.findOneAndUpdate(
        {
          _id: application_id,
          "notes._id": note_id,
        },
        {
          $set: {
            "notes.$.text": new_note.trim(),
          },
        },
        {
          returnDocument: "after",
        },
      );

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
    } catch (error) {
      return res
        .status(500)
        .json({ message: (error as Error).message, error: true });
    }
  },
);

export default router;
