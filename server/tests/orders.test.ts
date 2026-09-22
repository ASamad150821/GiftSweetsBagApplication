import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app'

const app = createApp()

const validOrder = {
  quantity: 2,
  personalMessage: 'Hope this makes your day sweeter!',
  customer: {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    address: '1 Analytical Engine Way',
    city: 'London',
    postcode: 'SW1A 1AA',
  },
}

let token: string

beforeEach(async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'super-secret-1',
  })
  token = res.body.token
});

describe('POST /api/orders', () => {
  it('rejects an unauthenticated request', async () => {
    const res = await request(app).post('/api/orders').send(validOrder)
    expect(res.status).toBe(401)
  })

  it('rejects invalid order details', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validOrder, quantity: 0 })

    expect(res.status).toBe(422)
  })

  it('creates an order with a server-computed price and order number', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(validOrder)

    expect(res.status).toBe(201)
    expect(res.body.order.orderNumber).toMatch(/^SB-[A-Z0-9]{5}$/)
    expect(res.body.order.totalPrice).toBe(13) // 2 x 6.50
  })

  it('ignores a client-supplied price and recomputes it server-side', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validOrder, totalPrice: 0.01 })

    expect(res.status).toBe(201)
    expect(res.body.order.totalPrice).toBe(13)
  })
});

describe('GET /api/orders', () => {
  it('lists only the current user\'s orders, newest first', async () => {
    await request(app).post('/api/orders').set('Authorization', `Bearer ${token}`).send(validOrder)
    await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validOrder, quantity: 1 })

    const res = await request(app).get('/api/orders/').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.orders).toHaveLength(2)
    expect(res.body.orders[0].quantity).toBe(1) // most recent first
  })
});

describe('GET /api/orders/:id', () => {
  it('returns 404 for another user\'s order', async () => {
    const created = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(validOrder)

    const otherUser = await request(app).post('/api/auth/register').send({
      name: 'Grace Hopper',
      email: 'grace@example.com',
      password: 'super-secret-2',
    })

    const res = await request(app)
      .get(`/api/orders/${created.body.order.id}`)
      .set('Authorization', `Bearer ${otherUser.body.token}`)

    expect(res.status).toBe(404)
  })
});

describe('DELETE /api/orders/:id', () => {
  it('will delete an order that the user made', async () => {
      const created = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(validOrder);

      const res = await request(app).delete(`/api/orders/${created.body.order.id}`).set('Authorization', `Bearer ${token}`)
;
      expect(res.status).toBe(200);
  })
})


