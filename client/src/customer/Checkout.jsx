import { useState } from 'react'
import { api } from '../api.js'

// Checkout form modal — collects contact info and the two customer choices:
//   fulfilment: delivery (with charge) or pickup, payment: cash or online.
export default function Checkout({ cart, cartTotal, deliveryCharge, kitchenLive, onClose, onPlaced }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    fulfilment: 'delivery',
    payment: 'cash',
    note: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isDelivery = form.fulfilment === 'delivery'
  const total = cartTotal + (isDelivery ? deliveryCharge : 0)

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!kitchenLive) return setError('The kitchen is closed right now and cannot accept orders.')
    if (!form.name.trim() || !form.phone.trim()) return setError('Please enter your name and phone number.')
    if (isDelivery && !form.address.trim()) return setError('Please enter your delivery address.')

    setSubmitting(true)
    setError('')
    try {
      const order = await api.placeOrder({
        customer: { name: form.name.trim(), phone: form.phone.trim(), address: form.address.trim() },
        items: cart.map((c) => ({ menuItemId: c.menuItemId, quantity: c.quantity })),
        fulfilment: form.fulfilment,
        payment: form.payment,
        note: form.note.trim(),
      })
      onPlaced(order)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Checkout</h2>
          <button onClick={onClose} className="rounded p-1 text-2xl leading-none text-stone-500 hover:bg-stone-100" aria-label="Close checkout">
            &times;
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Your name *</span>
              <input value={form.name} onChange={set('name')} required className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-amber-600 focus:outline-none" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Phone *</span>
              <input value={form.phone} onChange={set('phone')} required placeholder="03xx-xxxxxxx" className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-amber-600 focus:outline-none" />
            </label>
          </div>

          {/* Fulfilment: delivery or pickup */}
          <fieldset>
            <legend className="mb-1 text-sm font-medium">How would you like your food?</legend>
            <div className="grid grid-cols-2 gap-2">
              <label className={`cursor-pointer rounded-lg border p-3 text-sm ${form.fulfilment === 'delivery' ? 'border-amber-600 bg-amber-50' : 'border-stone-300'}`}>
                <input type="radio" name="fulfilment" value="delivery" checked={form.fulfilment === 'delivery'} onChange={set('fulfilment')} className="mr-2" />
                🛵 Home delivery
                <span className="mt-1 block text-xs text-stone-500">Delivery charge: ₨{deliveryCharge}</span>
              </label>
              <label className={`cursor-pointer rounded-lg border p-3 text-sm ${form.fulfilment === 'pickup' ? 'border-amber-600 bg-amber-50' : 'border-stone-300'}`}>
                <input type="radio" name="fulfilment" value="pickup" checked={form.fulfilment === 'pickup'} onChange={set('fulfilment')} className="mr-2" />
                🚶 Self pickup
                <span className="mt-1 block text-xs text-stone-500">No delivery charges</span>
              </label>
            </div>
          </fieldset>

          {isDelivery && (
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Delivery address *</span>
              <textarea value={form.address} onChange={set('address')} rows={2} placeholder="House, street, area" className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-amber-600 focus:outline-none" />
            </label>
          )}

          {/* Payment: cash or online */}
          <fieldset>
            <legend className="mb-1 text-sm font-medium">Payment method</legend>
            <div className="grid grid-cols-2 gap-2">
              <label className={`cursor-pointer rounded-lg border p-3 text-sm ${form.payment === 'cash' ? 'border-amber-600 bg-amber-50' : 'border-stone-300'}`}>
                <input type="radio" name="payment" value="cash" checked={form.payment === 'cash'} onChange={set('payment')} className="mr-2" />
                💵 Cash
                <span className="mt-1 block text-xs text-stone-500">Pay on delivery / pickup</span>
              </label>
              <label className={`cursor-pointer rounded-lg border p-3 text-sm ${form.payment === 'online' ? 'border-amber-600 bg-amber-50' : 'border-stone-300'}`}>
                <input type="radio" name="payment" value="online" checked={form.payment === 'online'} onChange={set('payment')} className="mr-2" />
                💳 Online
                <span className="mt-1 block text-xs text-stone-500">Card / mobile wallet</span>
              </label>
            </div>
          </fieldset>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Order notes (optional)</span>
            <textarea value={form.note} onChange={set('note')} rows={2} placeholder="e.g. extra spicy, ring the bell twice" className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-amber-600 focus:outline-none" />
          </label>

          {/* Order summary */}
          <div className="rounded-lg bg-stone-50 p-3 text-sm">
            {cart.map((c) => (
              <div key={c.menuItemId} className="flex justify-between text-stone-600">
                <span>
                  {c.quantity} × {c.name}
                </span>
                <span>₨{c.price * c.quantity}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-stone-200 pt-2 text-stone-600">
              <span>Subtotal</span>
              <span>₨{cartTotal}</span>
            </div>
            {isDelivery && (
              <div className="flex justify-between text-stone-600">
                <span>Delivery charge</span>
                <span>₨{deliveryCharge}</span>
              </div>
            )}
            <div className="mt-1 flex justify-between text-base font-bold">
              <span>Total</span>
              <span>₨{total}</span>
            </div>
          </div>

          {error && <p className="rounded-lg bg-red-100 p-2 text-sm text-red-700">{error}</p>}

          <button type="submit" disabled={submitting} className="w-full rounded-lg bg-amber-700 py-3 font-semibold text-white transition hover:bg-amber-600 disabled:bg-stone-300">
            {submitting ? 'Placing order…' : `Place Order · ₨${total}`}
          </button>
          <p className="text-center text-xs text-stone-500">
            Your order request will be sent to the kitchen. You&apos;ll get the confirmation &amp; preparation
            time shortly.
          </p>
        </form>
      </div>
    </div>
  )
}
