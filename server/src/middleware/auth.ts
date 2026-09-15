import type { NextFunction, Request, Response } from 'express'
import { UnauthorizedError } from '../lib/errors'
import { verifyAuthToken } from '../lib/jwt'

declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null

  if (!token) {
    throw new UnauthorizedError('Missing or invalid Authorization header')
  }

  try {
    const payload = verifyAuthToken(token)
    req.userId = payload.userId
    next()
  } catch {
    throw new UnauthorizedError('Invalid or expired token')
  }
}
