import type { NextFunction, Request, Response } from 'express'

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>

// Express doesn't await async handlers itself, so a rejected promise would otherwise
// become an unhandled rejection instead of reaching the error-handling middleware.
export function asyncHandler(handler: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next)
  }
}
