import express from "express";
import ApplicationRouter from "./routes/application.route";
import UserRouter from "./routes/user.route";
import connectDB from "./config/db";
import "dotenv/config";
import dns from "node:dns";
import logger from "./middlewares/logger.middleware";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middlewares
app.use(logger);

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

// Routers
app.use("/applications", ApplicationRouter);
app.use("/auth", UserRouter);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

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

if (process.env.NODE_ENV !== "production") {
  connectDB()
    .then(() => console.log("Database connected successfully"))
    .catch((err) => console.error("Database connection failed:", err));

  app.listen(PORT, () => {
    console.log("Server Is Running");
    console.log("======================");
    console.log(`CLICK HERE :`);
    console.log(`http://localhost:${PORT}`);
    console.log("======================");
  });
}

export default app;
