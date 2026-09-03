import { NextFunction, Request, Response } from "express";

const logger = (req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.url} ${req.method}`);
  next();
};

export default logger;
