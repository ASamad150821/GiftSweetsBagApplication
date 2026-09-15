import { Router } from 'express'
import { authRouter } from './auth.routes'
import { ordersRouter } from './orders.routes'

export const apiRouter = Router()

apiRouter.use('/auth', authRouter)
apiRouter.use('/orders', ordersRouter)
