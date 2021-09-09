import { Response } from "express";

export const sendData = (res: Response, data: unknown): void => {
  res.json({ data });
};

export const sendError = (
  res: Response,
  error: { code: string; message: string }
): void => {
  res.json({ error });
};
