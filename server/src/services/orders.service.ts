import { Prisma } from '@prisma/client'
import { prisma } from '../db/prisma'
import { NotFoundError } from '../lib/errors'
import { generateOrderNumber } from '../lib/orderNumber'
import type { CreateOrderInput } from '../validation/order.schema'

export const PRICE_PER_BAG = 6.5
const MAX_ORDER_NUMBER_ATTEMPTS = 5

function formatOrder(order: {
  id: string
  orderNumber: string
  quantity: number
  personalMessage: string
  pricePerBag: Prisma.Decimal
  totalPrice: Prisma.Decimal
  customerName: string
  customerEmail: string
  address: string
  city: string
  postcode: string
  createdAt: Date
}) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    quantity: order.quantity,
    personalMessage: order.personalMessage,
    pricePerBag: order.pricePerBag.toNumber(),
    totalPrice: order.totalPrice.toNumber(),
    customer: {
      name: order.customerName,
      email: order.customerEmail,
      address: order.address,
      city: order.city,
      postcode: order.postcode,
    },
    createdAt: order.createdAt.toISOString(),
  }
}

export async function createOrder(userId: string, input: CreateOrderInput) {
  const totalPrice = Number((input.quantity * PRICE_PER_BAG).toFixed(2))

  // Order numbers are random, so a collision is possible (if unlikely) — retry a few
  // times on the DB's unique-constraint violation rather than trusting randomness alone.
  for (let attempt = 0; attempt < MAX_ORDER_NUMBER_ATTEMPTS; attempt++) {
    try {
      const order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          quantity: input.quantity,
          personalMessage: input.personalMessage,
          pricePerBag: PRICE_PER_BAG,
          totalPrice: totalPrice,
          customerName: input.customer.name,
          customerEmail: input.customer.email,
          address: input.customer.address,
          city: input.customer.city,
          postcode: input.customer.postcode,
          userId: userId,
        },
      })
      return formatOrder(order)
    } catch (error) {
      const isOrderNumberCollision =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        (error.meta?.target as string[] | undefined)?.includes('orderNumber')

      if (!isOrderNumberCollision) throw error
    }
  }

  throw new Error('Could not generate a unique order number, please try again')
}

export async function listOrdersForUser(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId : userId},
    orderBy: { createdAt: 'desc' },
  })
  return orders.map(formatOrder)
}

export async function getOrderForUser(userId: string, orderId: string) {
  const order = await prisma.order.findFirst({ where: { id: orderId, userId : userId} })
  if (!order) {
    throw new NotFoundError('Order not found')
  }
  return formatOrder(order)
}

export async function deleteOrder(userId: string, orderId: string) {
  const order = await getOrderForUser(userId, orderId);

  await prisma.order.delete({where: {id: order.id}})
}
