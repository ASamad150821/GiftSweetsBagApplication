import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { env } from './config/env'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { apiRouter } from './routes/index'

export function createApp() {
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: env.CORS_ORIGIN }))
  app.use(express.json())

  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }))
  app.use('/api', apiRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
