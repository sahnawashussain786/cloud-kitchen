import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api.js'

const STATUS_STEPS = ['pending', 'accepted', 'completed']
const STATUS_TEXT = {
  pending: { label: 'Awaiting kitchen confirmation', cls: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
  accepted: { label: 'Accepted — being prepared', cls: 'bg-blue-100 text-blue-800', icon: '👨‍🍳' },
  rejected: { label: 'Rejected by the kitchen', cls: 'bg-red-100 text-red-800', icon: '❌' },
  completed: { label: 'Order completed — enjoy!', cls: 'bg-green-100 text-green-800', icon: '✅' },
}

// Customers track an order with the code they received at checkout.
export default function TrackOrder() {
  const [params, setParams] = useSearchParams()
  const codeFromUrl = params.get('code') || ''
  const [code, setCode] = useState(codeFromUrl)
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (codeValue) => {
    const code = (codeValue || '').trim()
    if (!code) return
    setLoading(true)
    setError('')
    try {
      const data = await api.trackOrder(code)
      setOrder(data)
      setParams({ code }, { replace: true })
    } catch (err) {
      setOrder(null)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [setParams])

  useEffect(() => {
    if (codeFromUrl) search(codeFromUrl)
  }, [codeFromUrl, search])

  // Accepted orders refresh automatically so the status stays current
  useEffect(() => {
    if (!order || !['pending', 'accepted'].includes(order.status)) return
    const t = setInterval(() => search(order.code), 10000)
    return () => clearInterval(t)
  }, [order, search])

  const readyAt = order?.prepMinutes
    ? new Date(Date.now() + order.prepMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <a href="/" className="text-sm text-amber-700 hover:underline">
        ← Back to menu
      </a>
      <h1 className="mt-3 mb-6 text-2xl font-bold">Track Your Order</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          search(code)
        }}
        className="mb-6 flex gap-2"
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Order code, e.g. SK-A1B2C3"
          className="flex-1 rounded-lg border border-stone-300 px-3 py-2 focus:border-amber-600 focus:outline-none"
        />
        <button type="submit" className="rounded-lg bg-amber-700 px-5 py-2 font-semibold text-white hover:bg-amber-600">
          {loading ? '…' : 'Track'}
        </button>
      </form>

      {error && <p className="mb-6 rounded-lg bg-red-100 p-3 text-sm text-red-700">{error}</p>}

      {order && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-stone-400">Order code</p>
              <p className="text-xl font-bold">{order.code}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS_TEXT[order.status].cls}`}>
              {STATUS_TEXT[order.status].icon} {STATUS_TEXT[order.status].label}
            </span>
          </div>

          {order.status === 'pending' && (
            <p className="mb-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
              Your request has been sent to the kitchen. Once the cook accepts it, your preparation time will
              appear here. This page updates automatically.
            </p>
          )}
          {order.status === 'accepted' && (
            <p className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              👨‍🍳 Order accepted! Estimated preparation time: <strong>{order.prepMinutes} minutes</strong>
              {readyAt && <> — ready by approximately <strong>{readyAt}</strong> ({order.fulfilment === 'delivery' ? 'delivery dispatched after' : 'pickup ready at'} that time).</>}
            </p>
          )}
          {order.status === 'rejected' && (
            <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
              Unfortunately the kitchen could not take this order.
              {order.rejectReason && <> Reason: <em>{order.rejectReason}</em></>}
            </p>
          )}

          <ul className="mb-4 space-y-1 text-sm text-stone-600">
            {order.items.map((it, i) => (
              <li key={i} className="flex justify-between">
                <span>
                  {it.quantity} × {it.name}
                </span>
                <span>₨{it.price * it.quantity}</span>
              </li>
            ))}
          </ul>

          <div className="border-t border-stone-200 pt-3 text-sm text-stone-600">
            <p className="flex justify-between">
              <span>Subtotal</span>
              <span>₨{order.subtotal}</span>
            </p>
            {order.deliveryCharge > 0 && (
              <p className="flex justify-between">
                <span>Home delivery</span>
                <span>₨{order.deliveryCharge}</span>
              </p>
            )}
            <p className="mt-1 flex justify-between text-base font-bold text-stone-800">
              <span>Total</span>
              <span>₨{order.total}</span>
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-stone-500">
            <span>🛵 {order.fulfilment === 'delivery' ? `Home delivery: ${order.customer.address}` : 'Self pickup'}</span>
            <span>💳 {order.payment === 'cash' ? 'Cash on delivery/pickup' : 'Online payment'}</span>
          </div>
        </div>
      )}

      {!order && !error && codeFromUrl === '' && (
        <p className="text-sm text-stone-500">Enter the order code you received when placing your order…</p>
      )}
    </main>
  )
}
