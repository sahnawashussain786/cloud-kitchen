import mongoose from 'mongoose'

/**
 * Centralized MongoDB connection helper for Shahnaz Kitchen API.
 *
 * Usage:
 *   import { connectDb } from './db.js'
 *   await connectDb()
 *
 * In production, set MONGO_URI in server/.env (e.g. your Atlas connection
 * string). When MONGO_URI is unset the helper falls back to a local MongoDB
 * on the default localhost port so the app can start for development without
 * an external service.
 */
const DEFAULT_URI = 'mongodb://127.0.0.1:27017/shahnaz-kitchen'

function resolveUri() {
  const configured = process.env.MONGO_URI?.trim()
  if (configured) return configured
  console.warn(
    'MONGO_URI is not set in server/.env — falling back to',
    DEFAULT_URI,
    '\nSet MONGO_URI to your MongoDB/Atlas connection string for production.'
  )
  return DEFAULT_URI
}

let connectionPromise = null

export async function connectDb() {
  if (connectionPromise) return connectionPromise

  connectionPromise = mongoose
    .connect(resolveUri())
    .then(() => {
      console.log('Connected to MongoDB.')
    })
    .catch((err) => {
      console.error('Could not connect to MongoDB:', err.message)
      process.exit(1)
    })

  return connectionPromise
}

/**
 * Graceful teardown for tests or server shutdown.
 */
export async function disconnectDb() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close()
    console.log('Disconnected from MongoDB.')
  }
}
