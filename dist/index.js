"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const application_route_1 = __importDefault(require("./routes/application.route"));
const user_route_1 = __importDefault(require("./routes/user.route"));
const db_1 = __importDefault(require("./config/db"));
require("dotenv/config");
const node_dns_1 = __importDefault(require("node:dns"));
const logger_middleware_1 = __importDefault(require("./middlewares/logger.middleware"));
node_dns_1.default.setServers(["8.8.8.8", "1.1.1.1"]);
const app = (0, express_1.default)();
const PORT = 5000;
app.use(express_1.default.json());
// Middlewares
app.use(logger_middleware_1.default);
app.use(express_1.default.urlencoded({ extended: true }));
// Routers
app.use("/applications", application_route_1.default);
app.use("/auth", user_route_1.default);
app.use("/applications", application_route_1.default);
app.use("/auth", user_route_1.default);
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    return res.status(400).json({
        error: true,
        message: err.message || "Something went wrong while processing the request",
    });
});
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});
(0, db_1.default)();
app.listen(PORT, () => {
    console.log("Server Is Running");
    console.log("======================");
    console.log(`CLICK HERE :`);
    console.log(`http://localhost:${PORT}`);
    console.log("======================");
});
//# sourceMappingURL=index.js.map