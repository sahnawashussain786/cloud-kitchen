import { useCallback, useEffect, useState } from 'react'
import { api } from '../api.js'

const PRESET_MINUTES = [20, 30, 45, 60, 90]

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-green-100 text-green-800',
}

// The owner's dashboard: incoming order requests, the kitchen live switch and
// the delivery charge slider. Orders poll every 6 s so new requests show up live.
export default function AdminDashboard({ password, onSignOut }) {
  const [orders, setOrders] = useState([])
  const [settings, setSettings] = useState({ kitchenLive: true, deliveryCharge: 0 })
  const [statusFilter, setStatusFilter] = useState('pending')
  const [deliveryChargeInput, setDeliveryChargeInput] = useState('0')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const [ordersData, settingsData] = await Promise.all([
        api.adminOrders(password),
        api.getSettings(),
      ])
      setOrders(ordersData)
      setSettings(settingsData)
      setDeliveryChargeInput(String(settingsData.deliveryCharge))
      setError('')
    } catch (err) {
      setError(err.message)
      if (err.message === 'Invalid admin password') onSignOut()
    }
  }, [password, onSignOut])

  useEffect(() => {
    load()
    const t = setInterval(load, 6000)
    return () => clearInterval(t)
  }, [load, statusFilter])

  const toggleKitchen = async () => {
    try {
      setSettings(await api.adminUpdateSettings(password, { kitchenLive: !settings.kitchenLive }))
    } catch (err) {
      setError(err.message)
    }
  }

  const saveDeliveryCharge = async () => {
    try {
      setSettings(await api.adminUpdateSettings(password, { deliveryCharge: Number(deliveryChargeInput) }))
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  const act = async (id, body) => {
    try {
      await api.adminUpdateOrder(password, id, body)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const pendingCount = orders.filter((o) => o.status === 'pending').length
  const visible = statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter)

  return (
    <div className="min-h-screen">
      <header className="bg-stone-900 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <h1 className="text-lg font-bold">🍽 Shahnaz Kitchen — Admin Panel</h1>
          <button onClick={onSignOut} className="rounded-lg border border-stone-600 px-3 py-1.5 text-sm hover:bg-stone-800">
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {error && <p className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">{error}</p>}

        {/* Kitchen controls */}
        <section className="mb-6 grid gap-4 sm:grid-cols-2">
          {/* Kitchen live switch */}
          <div className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm">
            <div>
              <h2 className="font-bold">Kitchen status</h2>
              <p className={`text-sm ${settings.kitchenLive ? 'text-green-700' : 'text-red-700'}`}>
                {settings.kitchenLive ? 'LIVE — accepting orders' : 'CLOSED — no new orders will be accepted'}
              </p>
            </div>
            <button
              onClick={toggleKitchen}
              role="switch"
              aria-checked={settings.kitchenLive}
              className={`relative h-8 w-14 rounded-full transition ${settings.kitchenLive ? 'bg-green-600' : 'bg-stone-300'}`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${
                  settings.kitchenLive ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Delivery charge */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="font-bold">Home delivery charge (₨)</h2>
            <p className="mb-3 text-sm text-stone-500">Applied automatically to delivery orders.</p>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                value={deliveryChargeInput}
                onChange={(e) => setDeliveryChargeInput(e.target.value)}
                className="w-28 rounded-lg border border-stone-300 px-3 py-2 focus:border-amber-600 focus:outline-none"
              />
              <button onClick={saveDeliveryCharge} className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600">
                Save
              </button>
            </div>
          </div>
        </section>

        {/* Orders */}
        <section>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h2 className="mr-auto text-lg font-bold">
              Order requests {pendingCount > 0 && <span className="ml-1 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">{pendingCount} new</span>}
            </h2>
            {['pending', 'accepted', 'rejected', 'completed', 'all'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-3 py-1.5 text-sm capitalize ${statusFilter === s ? 'bg-stone-800 text-white' : 'bg-white text-stone-600 hover:bg-stone-100'}`}
              >
                {s}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="rounded-xl bg-white p-8 text-center text-sm text-stone-500 shadow-sm">
              No {statusFilter === 'all' ? '' : statusFilter + ' '}orders yet.
            </p>
          ) : (
            <ul className="space-y-4">
              {visible.map((o) => (
                <li key={o._id} className="rounded-xl bg-white p-5 shadow-sm">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold">{o.code}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[o.status]}`}>{o.status}</span>
                      <span className="text-sm text-stone-500">{new Date(o.createdAt).toLocaleString()}</span>
                    </div>
                    <span className="text-sm text-stone-500">
                      {o.fulfilment === 'delivery' ? '🛵 Delivery' : '🚶 Pickup'} ·{' '}
                      {o.payment === 'cash' ? '💵 Cash' : '💳 Online'}
                    </span>
                  </div>

                  <div className="mb-3 grid gap-2 text-sm text-stone-600 sm:grid-cols-2">
                    <div>
                      <p><strong>{o.customer.name}</strong> · {o.customer.phone}</p>
                      {o.fulfilment === 'delivery' && o.customer.address && <p>📍 {o.customer.address}</p>}
                      {o.note && <p>📝 {o.note}</p>}
                    </div>
                    <div>
                      {o.items.map((it, i) => (
                        <p key={i}>
                          {it.quantity} × {it.name} <span className="text-stone-400">₨{it.price * it.quantity}</span>
                        </p>
                      ))}
                      <p className="font-semibold text-stone-800">
                        Total: ₨{o.total}
                        {o.deliveryCharge > 0 && <span className="text-xs text-stone-500"> (incl. ₨{o.deliveryCharge} delivery)</span>}
                      </p>
                    </div>
                  </div>

                  {/* Actions per status */}
                  {o.status === 'pending' && <AcceptRejectRow order={o} act={act} />}
                  {o.status === 'accepted' && (
                    <div className="flex items-center gap-3 text-sm">
                      <span className="rounded bg-blue-50 px-2 py-1 text-blue-700">Prep time set to {o.prepMinutes} min</span>
                      <button onClick={() => act(o._id, { action: 'complete' })} className="rounded-lg bg-green-700 px-3 py-1.5 font-semibold text-white hover:bg-green-600">
                        Mark completed
                      </button>
                    </div>
                  )}
                  {o.status === 'rejected' && o.rejectReason && (
                    <p className="text-sm text-red-600">Reason: {o.rejectReason}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}

function AcceptRejectRow({ order, act }) {
  const [prep, setPrep] = useState('30')
  const [reason, setReason] = useState('')
  const [showReject, setShowReject] = useState(false)

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3 text-sm">
      <span className="font-medium">Prep time:</span>
      {PRESET_MINUTES.map((m) => (
        <button
          key={m}
          onClick={() => setPrep(String(m))}
          className={`rounded-full px-2.5 py-1 ${prep === String(m) ? 'bg-amber-700 text-white' : 'bg-stone-100 hover:bg-stone-200'}`}
        >
          {m} min
        </button>
      ))}
      <input
        type="number"
        min="5"
        value={prep}
        onChange={(e) => setPrep(e.target.value)}
        className="w-20 rounded-lg border border-stone-300 px-2 py-1"
      />
      <button
        onClick={() => act(order._id, { action: 'accept', prepMinutes: Number(prep) })}
        className="rounded-lg bg-green-700 px-4 py-1.5 font-semibold text-white hover:bg-green-600"
      >
        ✓ Accept order
      </button>
      <button
        onClick={() => setShowReject(true)}
        className="rounded-lg border border-red-300 px-4 py-1.5 font-semibold text-red-700 hover:bg-red-50"
      >
        ✕ Reject
      </button>
      {showReject && (
        <form
          className="flex flex-1 flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            act(order._id, { action: 'reject', rejectReason: reason })
          }}
        >
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (shown to customer, optional)"
            className="min-w-48 flex-1 rounded-lg border border-stone-300 px-2 py-1"
          />
          <button type="submit" className="rounded-lg bg-red-600 px-3 py-1.5 font-semibold text-white hover:bg-red-500">
            Confirm rejection
          </button>
        </form>
      )}
    </div>
  )
}
