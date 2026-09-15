import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app'

const app = createApp()

const validRegistration = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  password: 'super-secret-1',
}

describe('POST /api/auth/register', () => {
  it('creates a user and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send(validRegistration)

    expect(res.status).toBe(201)
    expect(res.body.user).toMatchObject({ name: 'Ada Lovelace', email: 'ada@example.com' })
    expect(res.body.user.passwordHash).toBeUndefined()
    expect(typeof res.body.token).toBe('string')
  })

  it('rejects a duplicate email', async () => {
    await request(app).post('/api/auth/register').send(validRegistration)
    const res = await request(app).post('/api/auth/register').send(validRegistration)

    expect(res.status).toBe(409)
  })

  it('rejects an invalid payload', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'A', email: 'not-an-email', password: '123' })

    expect(res.status).toBe(422)
    expect(res.body.details).toBeDefined()
  })
})

describe('POST /api/auth/login', () => {
  it('logs in with the right credentials', async () => {
    await request(app).post('/api/auth/register').send(validRegistration)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validRegistration.email, password: validRegistration.password })

    expect(res.status).toBe(200)
    expect(typeof res.body.token).toBe('string')
  })

  it('rejects the wrong password', async () => {
    await request(app).post('/api/auth/register').send(validRegistration)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validRegistration.email, password: 'wrong-password' })

    expect(res.status).toBe(401)
  })
})

describe('GET /api/auth/me', () => {
  it('rejects a request with no token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

    it(`returns the current user for a valid token`, async () => {
        const register = await request(app).post(`/api/auth/register`).send(validRegistration);
        const token = register.body.token as string;

        const res = await request(app).get(`/api/auth/me`).set(`Authorization`, `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.user.email).toBe(validRegistration.email)
    })
})
