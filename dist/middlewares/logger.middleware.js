"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger = (req, res, next) => {
    console.log(`${req.url} ${req.method}`);
    next();
};
exports.default = logger;
//# sourceMappingURL=logger.middleware.js.map