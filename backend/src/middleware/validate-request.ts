import { type NextFunction, type Request, type Response } from "express";
import { type AnyZodObject } from "zod";

export function validateRequest(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    });

    next();
  };
}
