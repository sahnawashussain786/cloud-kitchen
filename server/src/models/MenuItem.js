import mongoose from 'mongoose'

// Dummy menu — seeded on first startup, admin can toggle availability
const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    available: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export const MenuItem = mongoose.model('MenuItem', menuItemSchema)
