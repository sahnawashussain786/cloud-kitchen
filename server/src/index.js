import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { seedIfEmpty } from './seed.js'
import { publicRoutes, adminRoutes } from './routes/api.js'
import { connectDb } from './db.js'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.use('/api', publicRoutes)
app.use('/api/admin', adminRoutes)

const PORT = process.env.PORT || 4000

await connectDb()
await seedIfEmpty()

// Ensure the 24h auto-delete TTL index exists on orders
const { Order } = await import('./models/Order.js')
await Order.ensureIndexes()

app.listen(PORT, () => console.log(`Shahnaz Kitchen API listening on http://localhost:${PORT}`))
