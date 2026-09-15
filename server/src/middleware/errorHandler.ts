import type { NextFunction, Request, Response } from 'express'
import { AppError, ValidationError } from '../lib/errors'

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` })
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({ error: err.message, details: err.details })
    return
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message })
    return
  }

  console.error(err)
  res.status(500).json({ error: 'Something went wrong' })
}
