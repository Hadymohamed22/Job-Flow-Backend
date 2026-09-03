import { NextFunction, Request, Response } from "express";
import { z, ZodError, ZodSchema } from "zod";
import fs from "fs";

type ValidateOptions = {
  requireFile?: boolean;
};

const validate =
  (schema: ZodSchema, options?: ValidateOptions) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (options?.requireFile) {
        const hasFile =
          req.file ||
          (req.files &&
            (Array.isArray(req.files)
              ? req.files.length > 0
              : Object.keys(req.files).length > 0));

        if (!hasFile) {
          return res.status(400).json({
            error: true,
            message: "File is required, try upload again!",
          });
        }
      }

      const parsedData = schema.parse(req.body);
      req.body = parsedData;
      return next();
    } catch (err) {
      if (req.file) {
        fs.unlink(req.file.path, (unlinkErr) => {
          if (unlinkErr)
            console.error("Failed to delete orphan file:", unlinkErr);
        });
      }

      if (err instanceof ZodError) {
        return res.status(400).json({
          error: true,
          message: err.issues[0]?.message,
          errors: z.flattenError(err).fieldErrors,
        });
      }

      return next(err);
    }
  };

export default validate;
