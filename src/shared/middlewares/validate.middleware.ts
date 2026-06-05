import { NextFunction, Request, Response } from "express";
import { ZodSchema, ZodError } from "zod";

export function validate(
  schema: ZodSchema,
  property: "body" | "query" | "params" = "body",
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedData = await schema.parseAsync(req[property]);
      req[property] = parsedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          const path = issue.path.join(".");
          errors[path] = issue.message;
        });

        return res.status(400).json({
          message: "Échec de la validation",
          errors,
        });
      }

      next(error);
    }
  };
}
