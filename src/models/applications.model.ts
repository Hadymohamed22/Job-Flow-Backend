import mongoose from "mongoose";

const StatusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  changed_at: { type: Date, default: Date.now },
});

const NoteSchema = new mongoose.Schema({
  text: { type: String, required: true },
});

const ApplicationSchema = new mongoose.Schema(
  {
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

const ApplicationModel = mongoose.model("Application", ApplicationSchema);

export default ApplicationModel;
