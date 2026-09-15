import { Router } from 'express'
import * as ordersController from '../controllers/orders.controller'
import { asyncHandler } from '../middleware/asyncHandler'
import { requireAuth } from '../middleware/auth'

export const ordersRouter = Router()

ordersRouter.use(requireAuth)
ordersRouter.post('/', asyncHandler(ordersController.create))
ordersRouter.get('/', asyncHandler(ordersController.list))
ordersRouter.get('/:id', asyncHandler(ordersController.getById))
ordersRouter.delete('/:id', asyncHandler(ordersController.deletee))
