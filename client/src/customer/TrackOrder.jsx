import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api.js'
import PaymentModal from './PaymentModal.jsx'

const STATUS_META = {
  pending: { label: 'Awaiting confirmation', icon: '⏳', cls: 'bg-amber-900/10 text-amber-800' },
  accepted: { label: 'Accepted — being prepared', icon: '👨‍🍳', cls: 'bg-blue-900/10 text-blue-800' },
  rejected: { label: 'Not accepted', icon: '❌', cls: 'bg-red-900/10 text-red-800' },
  completed: { label: 'Completed — enjoy!', icon: '✅', cls: 'bg-green-900/10 text-green-800' },
}

// Timeline of the happy path; rejected exits from step 1.
const TIMELINE = [
  ['Request sent', 'The kitchen has your order'],
  ['Confirmed', 'Prep time assigned'],
  ['Ready', 'Dispatched for delivery / ready to pickup'],
]

// Customers track their order with the code received at checkout.
export default function TrackOrder() {
  const [params, setParams] = useSearchParams()
  const codeFromUrl = params.get('code') || ''
  const [code, setCode] = useState(codeFromUrl)
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [payOpen, setPayOpen] = useState(false)

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

  // pending / accepted orders refresh automatically so the status stays current
  useEffect(() => {
    if (!order || !['pending', 'accepted'].includes(order.status)) return
    const t = setInterval(() => search(order.code), 10000)
    return () => clearInterval(t)
  }, [order, search])

  const meta = order ? STATUS_META[order.status] : null
  const stepIndex = order
    ? { pending: 0, accepted: 1, rejected: 1, completed: 2 }[order.status]
    : 0
  const readyAt = order?.prepMinutes
    ? new Date(Date.now() + order.prepMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null
  const canPay = order && order.payment === 'online' && !order.paid && order.status !== 'rejected'

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <a href="/" className="text-sm font-medium text-clay hover:underline">← Back to menu</a>
      <h1 className="mt-3 mb-6 font-display text-3xl font-semibold text-walnut">Track Your Order</h1>

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
          className="flex-1 rounded-xl border border-stone-200 bg-white px-4 py-2.5 font-mono tracking-wider focus:border-clay focus:outline-none"
        />
        <button type="submit" className="rounded-xl bg-walnut px-6 py-2.5 font-semibold text-cream transition hover:bg-walnut-deep">
          {loading ? '…' : 'Track'}
        </button>
      </form>

      {error && <p className="mb-6 rounded-xl bg-red-900/10 p-3 text-sm text-red-800">{error}</p>}

      {order && (
        <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm">
          {/* Header band */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 bg-cream px-6 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">Order</p>
              <p className="font-mono text-lg font-semibold text-walnut">{order.code}</p>
            </div>
            <div className="flex items-center gap-2">
              {order.paid ? (
                <span className="rounded-full bg-green-900/10 px-3 py-1 text-xs font-semibold text-green-800">💰 Paid · {order.receiptNo}</span>
              ) : order.payment === 'online' ? (
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-500">Unpaid (online)</span>
              ) : (
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-500">💵 Cash on {order.fulfilment === 'delivery' ? 'delivery' : 'pickup'}</span>
              )}
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.cls}`}>
                {meta.icon} {meta.label}
              </span>
            </div>
          </div>

          <div className="px-6 py-6">
            {/* Status notes */}
            {order.status === 'pending' && (
              <p className="mb-5 rounded-xl bg-amber-900/5 p-3 text-sm text-amber-800">
                Your request is with the kitchen. Once accepted, your exact preparation time appears here — this page
                checks on its own, no need to reload.
              </p>
            )}
            {order.status === 'accepted' && (
              <p className="mb-5 rounded-xl bg-blue-900/5 p-3 text-sm text-blue-800">
                👨‍🍳 Accepted! Estimated preparation time: <strong>{order.prepMinutes} minutes</strong>
                {readyAt && <> — ready by approximately <strong>{readyAt}</strong> ({order.fulfilment === 'delivery' ? 'delivery dispatched after that' : 'pickup ready at that time'}).</>}
              </p>
            )}
            {order.status === 'rejected' && (
              <p className="mb-5 rounded-xl bg-red-900/5 p-3 text-sm text-red-800">
                Unfortunately the kitchen could not take this order.
                {order.rejectReason && <> Reason: <em>{order.rejectReason}</em></>}
              </p>
            )}

            {/* Timeline */}
            {order.status !== 'rejected' && (
              <ol className="mb-6 flex gap-0">
                {TIMELINE.map(([title, sub], i) => {
                  const done = i <= stepIndex
                  return (
                    <li key={title} className="flex flex-1 flex-col items-center text-center">
                      <div className="flex w-full items-center">
                        <span className={`h-0.5 flex-1 ${i === 0 ? 'opacity-0' : done && i <= stepIndex ? 'bg-clay' : 'bg-stone-200'}`} />
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done ? 'bg-clay text-white' : 'bg-stone-100 text-stone-400'}`}>
                          {done ? '✓' : i + 1}
                        </span>
                        <span className={`h-0.5 flex-1 ${i === TIMELINE.length - 1 ? 'opacity-0' : i < stepIndex ? 'bg-clay' : 'bg-stone-200'}`} />
                      </div>
                      <p className={`mt-2 text-xs font-semibold ${done ? 'text-walnut' : 'text-stone-400'}`}>{title}</p>
                      <p className="text-[11px] text-stone-400">{sub}</p>
                    </li>
                  )
                })}
              </ol>
            )}

            {/* Items + total */}
            <ul className="mb-3 space-y-1.5 text-sm text-stone-600">
              {order.items.map((it, i) => (
                <li key={i} className="flex justify-between">
                  <span>{it.quantity} × {it.name}</span>
                  <span>₨{it.price * it.quantity}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-stone-100 pt-3 text-sm text-stone-500">
              <p className="flex justify-between"><span>Subtotal</span><span>₨{order.subtotal}</span></p>
              {order.deliveryCharge > 0 && (
                <p className="flex justify-between"><span>Home delivery</span><span>₨{order.deliveryCharge}</span></p>
              )}
              <p className="mt-1.5 flex justify-between font-display text-lg font-semibold text-walnut"><span>Total</span><span>₨{order.total}</span></p>
            </div>

            {canPay && (
              <button onClick={() => setPayOpen(true)} className="mt-4 w-full rounded-xl bg-clay py-3 font-semibold text-white transition hover:brightness-110">
                Pay ₨{order.total} online now
              </button>
            )}

            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1.5 border-t border-stone-100 pt-4 text-xs text-stone-400">
              <span>🛵 {order.fulfilment === 'delivery' ? `Home delivery: ${order.customer.address}` : 'Self pickup'}</span>
              <span>💳 {order.payment === 'cash' ? 'Cash on delivery/pickup' : 'Online payment'}</span>
              {order.paid && <span>🧾 Receipt {order.receiptNo}</span>}
            </div>
          </div>
        </div>
      )}

      {!order && !error && !codeFromUrl && (
        <p className="text-sm text-stone-400">Enter the order code you received when placing your order…</p>
      )}

      {payOpen && order && (
        <PaymentModal
          code={order.code}
          total={order.total}
          onClose={() => setPayOpen(false)}
          onDone={() => {
            setPayOpen(false)
            search(order.code)
          }}
          onPaid={() => search(order.code)}
        />
      )}
    </main>
  )
}
