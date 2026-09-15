import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import * as authController from '../controllers/auth.controller'
import { asyncHandler } from '../middleware/asyncHandler'
import { requireAuth } from '../middleware/auth'

export const authRouter = Router()

// Auth endpoints are a common brute-force target, so they get a tighter limit
// than the rest of the API.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
})

authRouter.post('/register', authLimiter, asyncHandler(authController.register))
authRouter.post('/login', authLimiter, asyncHandler(authController.login))
authRouter.get('/me', requireAuth, asyncHandler(authController.me))
