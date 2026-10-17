// Dev entry point that boots an in-memory MongoDB so the app runs with no
// local Mongo install. Real deployments should use "npm start" with MONGO_URI.
import 'dotenv/config'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import express from 'express'
import cors from 'cors'
import { seedIfEmpty } from './seed.js'
import { publicRoutes, adminRoutes } from './routes/api.js'

const mongod = await MongoMemoryServer.create()
console.log('In-memory MongoDB running at', mongod.getUri())

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.use('/api', publicRoutes)
app.use('/api/admin', adminRoutes)

await mongoose.connect(mongod.getUri())
await seedIfEmpty()

// Ensure the 24h auto-delete TTL index exists on orders
const { Order } = await import('./models/Order.js')
await Order.ensureIndexes()

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`Shahnaz Kitchen API (memory mode) on http://localhost:${PORT}`))
