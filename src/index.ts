import express from "express";
import ApplicationRouter from "./routes/application.route";
import UserRouter from "./routes/user.route";
import connectDB from "./config/db";
import "dotenv/config";
import dns from "node:dns";
import logger from "./middlewares/logger.middleware";
import path from "node:path";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const app = express();
const PORT = 5000;

app.use(express.json());

// Middlewares
app.use(logger);
app.use(express.urlencoded({ extended: true }));

// Routers
app.use("/applications", ApplicationRouter);
app.use("/auth", UserRouter);

app.use("/applications", ApplicationRouter);
app.use("/auth", UserRouter);

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("Unhandled error:", err);
    return res.status(400).json({
      error: true,
      message:
        err.message || "Something went wrong while processing the request",
    });
  },
);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

connectDB();
app.listen(PORT, () => {
  console.log("Server Is Running");
  console.log("======================");
  console.log(`CLICK HERE :`);
  console.log(`http://localhost:${PORT}`);
  console.log("======================");
});
