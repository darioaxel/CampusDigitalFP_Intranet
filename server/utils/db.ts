import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Crear pool de conexiones PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Crear adapter de Prisma para PostgreSQL
const adapter = new PrismaPg(pool)

// Crear cliente Prisma con el adapter
const prisma = new PrismaClient({ adapter })

export { prisma }
