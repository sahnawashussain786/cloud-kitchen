import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      address: { type: String, default: '' },
    },
    items: [
      {
        menuItemId: String,
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    fulfilment: { type: String, enum: ['delivery', 'pickup'], required: true },
    payment: { type: String, enum: ['cash', 'online'], required: true },
    note: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed'],
    default: 'pending',
  },
  paid: { type: Boolean, default: false },
  receiptNo: { type: String, default: '' },
  paidAt: { type: Date, default: null },
    prepMinutes: { type: Number, default: null },
    rejectReason: { type: String, default: '' },
    deliveryCharge: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { timestamps: true },
)

export const Order = mongoose.model('Order', orderSchema)
