import type { Request, Response } from 'express'
import { UnauthorizedError, ValidationError } from '../lib/errors'
import { flattenZodError } from '../lib/flattenZodError'
import { createOrder, getOrderForUser, listOrdersForUser, deleteOrder } from '../services/orders.service'
import { createOrderSchema } from '../validation/order.schema'

export async function create(req: Request, res: Response) {
  if (!req.userId) throw new UnauthorizedError()

  const parsed = createOrderSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new ValidationError('Invalid order details', flattenZodError(parsed.error))
  }

  const order = await createOrder(req.userId, parsed.data)
  res.status(201).json({ order })
}

export async function list(req: Request, res: Response) {
  if (!req.userId) throw new UnauthorizedError()
  const orders = await listOrdersForUser(req.userId)
  res.status(200).json({ orders })
}

export async function getById(req: Request, res: Response) {
  if (!req.userId) throw new UnauthorizedError()
  const order = await getOrderForUser(req.userId, req.params.id)
  res.status(200).json({ order })
};


export async function deletee(req: Request, res: Response) {
  if (!req.userId) throw new UnauthorizedError();

  await deleteOrder(req.userId, req.params.id);
  res.status(200).json({message: "Order has been deleted"});
}