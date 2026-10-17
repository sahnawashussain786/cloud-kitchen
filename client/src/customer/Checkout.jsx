import { useState } from 'react'
import { api } from '../api.js'

// Checkout modal — collects contact info plus the two customer choices:
//   fulfilment: home delivery (with charge) or self pickup
//   payment:    cash on delivery/pickup, or online via the (dummy) gateway
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
    if (!kitchenLive) return setError('The kitchen just closed and cannot take new orders.')
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
      onPlaced(order) // online orders continue into the payment modal
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-walnut-deep/50 backdrop-blur-[2px] p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-cream shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-cream px-6 py-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-walnut">Checkout</h2>
            <p className="text-xs text-stone-500">{cart.length} items · ₨{total}</p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-2xl leading-none text-stone-400 hover:bg-stone-200/60" aria-label="Close checkout">
            &times;
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 px-6 py-5">
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-walnut">Your name *</span>
              <input value={form.name} onChange={set('name')} required className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 focus:border-clay focus:outline-none" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-walnut">Phone *</span>
              <input value={form.phone} onChange={set('phone')} required placeholder="03xx-xxxxxxx" className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 focus:border-clay focus:outline-none" />
            </label>
          </div>

          {/* Fulfilment */}
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-walnut">How would you like your food?</legend>
            <div className="grid grid-cols-2 gap-2">
              <label className={`cursor-pointer rounded-xl border bg-white p-3.5 text-sm transition ${form.fulfilment === 'delivery' ? 'border-clay ring-1 ring-clay/30' : 'border-stone-200 hover:border-stone-300'}`}>
                <div className="flex items-center gap-2">
                  <input type="radio" name="fulfilment" value="delivery" checked={form.fulfilment === 'delivery'} onChange={set('fulfilment')} className="accent-clay" />
                  <span className="font-semibold text-walnut">🛵 Home delivery</span>
                </div>
                <span className="mt-1 block pl-6 text-xs text-stone-400">Comes to you · ₨{deliveryCharge}</span>
              </label>
              <label className={`cursor-pointer rounded-xl border bg-white p-3.5 text-sm transition ${form.fulfilment === 'pickup' ? 'border-clay ring-1 ring-clay/30' : 'border-stone-200 hover:border-stone-300'}`}>
                <div className="flex items-center gap-2">
                  <input type="radio" name="fulfilment" value="pickup" checked={form.fulfilment === 'pickup'} onChange={set('fulfilment')} className="accent-clay" />
                  <span className="font-semibold text-walnut">🚶 Self pickup</span>
                </div>
                <span className="mt-1 block pl-6 text-xs text-stone-400">Collect it yourself · no charge</span>
              </label>
            </div>
          </fieldset>

          {isDelivery && (
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-walnut">Delivery address *</span>
              <textarea value={form.address} onChange={set('address')} rows={2} placeholder="House, street, area" className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 focus:border-clay focus:outline-none" />
            </label>
          )}

          {/* Payment */}
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-walnut">Payment method</legend>
            <div className="grid grid-cols-2 gap-2">
              <label className={`cursor-pointer rounded-xl border bg-white p-3.5 text-sm transition ${form.payment === 'cash' ? 'border-clay ring-1 ring-clay/30' : 'border-stone-200 hover:border-stone-300'}`}>
                <div className="flex items-center gap-2">
                  <input type="radio" name="payment" value="cash" checked={form.payment === 'cash'} onChange={set('payment')} className="accent-clay" />
                  <span className="font-semibold text-walnut">💵 Cash</span>
                </div>
                <span className="mt-1 block pl-6 text-xs text-stone-400">Pay when it arrives / at pickup</span>
              </label>
              <label className={`cursor-pointer rounded-xl border bg-white p-3.5 text-sm transition ${form.payment === 'online' ? 'border-clay ring-1 ring-clay/30' : 'border-stone-200 hover:border-stone-300'}`}>
                <div className="flex items-center gap-2">
                  <input type="radio" name="payment" value="online" checked={form.payment === 'online'} onChange={set('payment')} className="accent-clay" />
                  <span className="font-semibold text-walnut">💳 Online</span>
                </div>
                <span className="mt-1 block pl-6 text-xs text-stone-400">Card via secure gateway</span>
              </label>
            </div>
          </fieldset>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-walnut">Order notes (optional)</span>
            <textarea value={form.note} onChange={set('note')} rows={2} placeholder="e.g. extra spicy, ring the bell twice" className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 focus:border-clay focus:outline-none" />
          </label>

          {/* Summary */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm">
            {cart.map((c) => (
              <div key={c.menuItemId} className="flex justify-between text-stone-500">
                <span>{c.quantity} × {c.name}</span>
                <span>₨{c.price * c.quantity}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-stone-100 pt-2 text-stone-500">
              <span>Subtotal</span>
              <span>₨{cartTotal}</span>
            </div>
            {isDelivery && (
              <div className="flex justify-between text-stone-500">
                <span>Delivery charge</span>
                <span>₨{deliveryCharge}</span>
              </div>
            )}
            <div className="mt-1.5 flex justify-between font-display text-lg font-semibold text-walnut">
              <span>Total</span>
              <span>₨{total}</span>
            </div>
          </div>

          {error && <p className="rounded-xl bg-red-900/10 p-2.5 text-sm text-red-800">{error}</p>}

          {!kitchenLive && <p className="rounded-xl bg-amber-900/10 p-2.5 text-sm text-amber-800">Kitchen closed — ordering is paused, but nothing is lost.</p>}

          <button type="submit" disabled={submitting} className="w-full rounded-xl bg-walnut py-3 font-semibold text-cream transition hover:bg-walnut-deep disabled:bg-stone-300">
            {submitting ? 'Placing order…' : `Place order · ₨${total}`}
          </button>
          <p className="text-center text-xs text-stone-400">
            Sent to the kitchen for confirmation — you&apos;ll get your exact prep time on the tracking page.
          </p>
        </form>
      </div>
    </div>
  )
}
