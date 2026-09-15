import { PrismaClient } from '@prisma/client'

// One client for the whole process — Prisma pools connections internally,
// so a fresh client per request would exhaust the database's connection limit.
export const prisma = new PrismaClient()
