import express from 'express'
import crypto from 'node:crypto'
import { MenuItem } from '../models/MenuItem.js'
import { Order } from '../models/Order.js'
import { Setting } from '../models/Setting.js'

export const publicRoutes = express.Router()
export const adminRoutes = express.Router()

export async function getSettings() {
  let s = await Setting.findOne()
  if (!s) s = await Setting.create({ key: 'general' })
  return s
}

function makeOrderCode() {
  return 'SK-' + crypto.randomBytes(3).toString('hex').toUpperCase()
}

// ---------- Admin auth (simple passcode — fine for a small single-admin kitchen) ----------

function requireAdmin(req, res, next) {
  if (req.headers['x-admin-password'] === process.env.ADMIN_PASSWORD) next()
  else res.status(401).json({ error: 'Invalid admin password' })
}

adminRoutes.post('/login', (req, res) => {
  if (req.body?.password === process.env.ADMIN_PASSWORD) return res.json({ ok: true })
  res.status(401).json({ error: 'Invalid admin password' })
})

adminRoutes.use(requireAdmin)

// ---------- Public: menu + settings ----------

publicRoutes.get('/menu', async (_req, res) => {
  const items = await MenuItem.find().sort({ category: 1, name: 1 }).lean()
  res.json(items)
})

publicRoutes.get('/settings', async (_req, res) => {
  const s = await getSettings()
  res.json({ kitchenLive: s.kitchenLive, deliveryCharge: s.deliveryCharge })
})

// ---------- Public: orders ----------

publicRoutes.post('/orders', async (req, res) => {
  const settings = await getSettings()
  if (!settings.kitchenLive) {
    return res.status(503).json({ error: 'Kitchen is currently closed. Please try again later.' })
  }

  const { customer = {}, items, fulfilment, payment, note = '' } = req.body || {}
  const { name, phone, address } = customer

  if (!name || !phone) return res.status(400).json({ error: 'Name and phone are required.' })
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Cart is empty.' })
  if (!['delivery', 'pickup'].includes(fulfilment)) return res.status(400).json({ error: 'Invalid fulfilment option.' })
  if (!['cash', 'online'].includes(payment)) return res.status(400).json({ error: 'Invalid payment option.' })
  if (fulfilment === 'delivery' && !address) return res.status(400).json({ error: 'Delivery address is required for home delivery.' })

  // Re-price every item server-side so the client can't send fake prices
  const menuItems = await MenuItem.find().lean()
  const menuMap = new Map(menuItems.map((m) => [String(m._id), m]))
  const pricedItems = []
  for (const it of items) {
    const menu = menuMap.get(String(it.menuItemId))
    if (!menu || !menu.available) return res.status(400).json({ error: `Item is not available: ${it.name || 'unknown'}` })
    const quantity = Math.max(1, Math.min(50, Number(it.quantity) || 1))
    pricedItems.push({ menuItemId: String(menu._id), name: menu.name, price: menu.price, quantity })
  }

  const subtotal = pricedItems.reduce((sum, it) => sum + it.price * it.quantity, 0)
  const deliveryCharge = fulfilment === 'delivery' ? settings.deliveryCharge : 0

  const order = await Order.create({
    code: makeOrderCode(),
    customer: { name, phone, address: address || '' },
    items: pricedItems,
    fulfilment,
    payment,
    note,
    deliveryCharge,
    subtotal,
    total: subtotal + deliveryCharge,
  })

  res.status(201).json(order)
})

// Customer tracks their own order with the code handed out at checkout
publicRoutes.get('/orders/:code', async (req, res) => {
  const order = await Order.findOne({ code: req.params.code.toUpperCase() }).lean()
  if (!order) return res.status(404).json({ error: 'Order not found. Check your order code.' })
  res.json(order)
})

// ---------- Public: dummy online payment gateway ----------
// A simulated payment gateway for demo purposes — no real money moves.
// It validates the card format, pretends to process for a moment, and
// then marks the order as paid with a receipt number.
function cardCheck({ cardNumber, cardName, expiry, cvc }) {
  const digits = String(cardNumber || '').replace(/\D/g, '')
  if (digits.length < 15 || digits.length > 16) return 'Card number must be 15–16 digits.'
  if (!String(cardName || '').trim()) return 'Name on card is required.'
  if (!/^(0[1-9]|1[0-2])\/?\d{2}$/.test(String(expiry || '').trim())) return 'Expiry must be MM/YY.'
  if (!/^\d{3,4}$/.test(String(cvc || '').trim())) return 'CVC must be 3 or 4 digits.'
  return ''
}

publicRoutes.post('/payments', async (req, res) => {
  const { code, cardNumber, cardName, expiry, cvc } = req.body || {}
  const order = await Order.findOne({ code: String(code || '').toUpperCase() })
  if (!order) return res.status(404).json({ error: 'Order not found.' })
  if (order.payment !== 'online') return res.status(400).json({ error: 'This order is set for cash payment.' })
  if (order.status === 'rejected') return res.status(400).json({ error: 'This order was rejected and cannot be paid.' })
  if (order.paid) return res.status(409).json({ error: `This order is already paid (receipt ${order.receiptNo}).` })

  const problem = cardCheck({ cardNumber, cardName, expiry, cvc })
  if (problem) return res.status(400).json({ error: problem })

  // Simulate network + bank processing latency
  await new Promise((resolve) => setTimeout(resolve, 1500))

  order.paid = true
  order.paidAt = new Date()
  order.receiptNo = 'RCP-' + crypto.randomBytes(3).toString('hex').toUpperCase()
  await order.save()
  res.json({ paid: true, receiptNo: order.receiptNo, paidAt: order.paidAt, amount: order.total })
})

// ---------- Admin: menu management ----------

adminRoutes.post('/menu', async (req, res) => {
  const { name, description = '', price, category } = req.body || {}
  if (!name || price == null || !category) return res.status(400).json({ error: 'name, price and category are required.' })
  const item = await MenuItem.create({ name, description, price: Number(price), category })
  res.status(201).json(item)
})

adminRoutes.patch('/menu/:id', async (req, res) => {
  const allowed = ['name', 'description', 'price', 'category', 'available']
  const update = Object.fromEntries(allowed.filter((k) => k in req.body).map((k) => [k, req.body[k]]))
  const item = await MenuItem.findByIdAndUpdate(req.params.id, update, { new: true })
  if (!item) return res.status(404).json({ error: 'Menu item not found.' })
  res.json(item)
})

// ---------- Admin: settings (kitchen live switch + delivery charge) ----------

adminRoutes.put('/settings', async (req, res) => {
  const update = {}
  if ('kitchenLive' in req.body) update.kitchenLive = Boolean(req.body.kitchenLive)
  if ('deliveryCharge' in req.body) {
    const charge = Number(req.body.deliveryCharge)
    if (!Number.isFinite(charge) || charge < 0) return res.status(400).json({ error: 'Invalid delivery charge.' })
    update.deliveryCharge = charge
  }
  const s = await Setting.findOneAndUpdate({}, update, { new: true, upsert: true })
  res.json({ kitchenLive: s.kitchenLive, deliveryCharge: s.deliveryCharge })
})

// ---------- Admin: orders ----------

adminRoutes.get('/orders', async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {}
  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(200).lean()
  res.json(orders)
})

// Admin accepts (with prep time) or rejects an order request
adminRoutes.patch('/orders/:id', async (req, res) => {
  const { action, prepMinutes, rejectReason = '' } = req.body || {}
  const order = await Order.findById(req.params.id)
  if (!order) return res.status(404).json({ error: 'Order not found.' })

  if (action === 'accept') {
    if (order.status !== 'pending') return res.status(409).json({ error: 'This order was already processed.' })
    const minutes = Number(prepMinutes)
    if (!Number.isFinite(minutes) || minutes <= 0) return res.status(400).json({ error: 'Preparation time in minutes is required.' })
    order.status = 'accepted'
    order.prepMinutes = Math.round(minutes)
  } else if (action === 'reject') {
    if (order.status !== 'pending') return res.status(409).json({ error: 'This order was already processed.' })
    order.status = 'rejected'
    order.rejectReason = rejectReason
  } else if (action === 'complete') {
    if (order.status !== 'accepted') return res.status(409).json({ error: 'Only accepted orders can be completed.' })
    order.status = 'completed'
  } else {
    return res.status(400).json({ error: 'Invalid action.' })
  }

  await order.save()
  res.json(order)
})
