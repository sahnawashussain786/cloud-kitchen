import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import { seedIfEmpty } from './seed.js'
import { publicRoutes, adminRoutes } from './routes/api.js'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.use('/api', publicRoutes)
app.use('/api/admin', adminRoutes)

const PORT = process.env.PORT || 4000

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB.')
    await seedIfEmpty()
    app.listen(PORT, () => console.log(`Shahnaz Kitchen API listening on http://localhost:${PORT}`))
  })
  .catch((err) => {
    console.error('Could not connect to MongoDB:', err.message)
    console.error('Start MongoDB first (mongod) or set MONGO_URI in server/.env to your Atlas connection string, then restart.')
    process.exit(1)
  })
