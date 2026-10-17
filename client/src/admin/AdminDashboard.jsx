import { useCallback, useEffect, useState } from 'react'
import { api } from '../api.js'

const STATUS_STYLES = {
  pending: 'bg-amber-900/10 text-amber-800',
  accepted: 'bg-blue-900/10 text-blue-800',
  rejected: 'bg-red-900/10 text-red-800',
  completed: 'bg-green-900/10 text-green-800',
}
const FILTERS = ['pending', 'accepted', 'rejected', 'completed', 'all']

// The owner's dashboard: live order requests, the kitchen switch, the delivery
// charge and today's numbers. Orders poll every 6 s so new requests show up live.
export default function AdminDashboard({ password, onSignOut }) {
  const [orders, setOrders] = useState([])
  const [settings, setSettings] = useState({ kitchenLive: true, deliveryCharge: 0 })
  const [view, setView] = useState('orders') // orders | settings
  const [statusFilter, setStatusFilter] = useState('pending')
  const [deliveryChargeInput, setDeliveryChargeInput] = useState('0')
  const [error, setError] = useState('')
  const [savedNote, setSavedNote] = useState('')

  const load = useCallback(async () => {
    try {
      const [ordersData, settingsData] = await Promise.all([api.adminOrders(password), api.getSettings()])
      setOrders(ordersData)
      setSettings(settingsData)
      setDeliveryChargeInput((prev) => (prev === '0' || prev === '' ? String(settingsData.deliveryCharge) : prev))
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
  }, [load])

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
      setSavedNote('Delivery charge saved')
      setTimeout(() => setSavedNote(''), 2500)
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

  const counts = Object.fromEntries(FILTERS.map((f) => [f, f === 'all' ? orders.length : orders.filter((o) => o.status === f).length]))
  const today = new Date().toDateString()
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today)
  const revenue = todayOrders.filter((o) => o.status !== 'rejected').reduce((n, o) => n + o.total, 0)
  const onlineRevenue = todayOrders.filter((o) => o.paid).reduce((n, o) => n + o.total, 0)
  const visible = statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter)

  return (
    <div className="flex min-h-screen">
      {/* ===== Sidebar ===== */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-walnut-deep p-5 text-stone-300">
        <div className="mb-8">
          <p className="font-display text-xl font-semibold text-cream">
            Shahnaz <span className="text-clay">Kitchen</span>
          </p>
          <p className="text-xs text-stone-500">Admin panel</p>
        </div>

        {/* Kitchen switch */}
        <div className="mb-6 rounded-2xl bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Kitchen</span>
            <span className={`live-dot h-2.5 w-2.5 rounded-full ${settings.kitchenLive ? 'bg-green-400' : 'bg-red-400'}`} />
          </div>
          <button onClick={toggleKitchen} role="switch" aria-checked={settings.kitchenLive} className="mt-4 flex w-full items-center justify-between">
            <span className={`font-display text-lg font-semibold ${settings.kitchenLive ? 'text-green-400' : 'text-red-400'}`}>
              {settings.kitchenLive ? 'Live' : 'Closed'}
            </span>
            <span className={`relative h-7 w-12 rounded-full transition ${settings.kitchenLive ? 'bg-green-500' : 'bg-stone-600'}`}>
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${settings.kitchenLive ? 'left-6' : 'left-1'}`} />
            </span>
          </button>
          <p className="mt-2 text-[11px] text-stone-500">{settings.kitchenLive ? 'Accepting customer orders' : 'New orders are paused'}</p>
        </div>

        <nav className="flex-1 space-y-1">
          {[['orders', '🧾', 'Orders'], ['settings', '⚙️', 'Kitchen Settings']].map(([key, icon, label]) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${view === key ? 'bg-white/10 text-cream' : 'text-stone-400 hover:bg-white/5 hover:text-cream'}`}
            >
              <span>{icon}</span>
              {label}
              {key === 'orders' && counts.pending > 0 && (
                <span className="ml-auto rounded-full bg-clay px-2 py-0.5 text-[11px] font-bold text-white">{counts.pending}</span>
              )}
            </button>
          ))}
        </nav>

        <button onClick={onSignOut} className="mt-6 rounded-xl border border-white/10 px-3.5 py-2.5 text-sm text-stone-400 transition hover:bg-white/5 hover:text-cream">
          Sign out
        </button>
      </aside>

      {/* ===== Main ===== */}
      <main className="ml-64 flex-1 px-8 py-7">
        {error && <p className="mb-4 rounded-xl bg-red-900/10 p-3 text-sm text-red-800">{error}</p>}

        {view === 'settings' ? (
          <SettingsView
            settings={settings}
            chargeValue={deliveryChargeInput}
            onChargeChange={(v) => setDeliveryChargeInput(v)}
            onSaveCharge={saveDeliveryCharge}
            savedNote={savedNote}
            onToggleKitchen={toggleKitchen}
          />
        ) : (
          <OrdersView
            orders={orders}
            counts={counts}
            statusFilter={statusFilter}
            onFilter={setStatusFilter}
            visible={visible}
            todayStats={{ total: todayOrders.length, revenue, onlineRevenue, pending: counts.pending }}
            act={act}
          />
        )}
      </main>
    </div>
  )
}

function SettingsView({ settings, chargeValue, onChargeChange, onSaveCharge, savedNote, onToggleKitchen }) {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-walnut">Kitchen Settings</h1>
      <p className="mt-1 mb-6 text-sm text-stone-500">These controls affect the customer site immediately.</p>

      <div className="mb-4 flex items-center justify-between rounded-2xl border border-stone-200/80 bg-white p-6">
        <div>
          <h2 className="font-display text-lg font-semibold text-walnut">Kitchen status</h2>
          <p className={`mt-0.5 text-sm ${settings.kitchenLive ? 'text-green-700' : 'text-red-700'}`}>
            {settings.kitchenLive ? 'Live — the customer site shows an open counter' : 'Closed — ordering is paused everywhere'}
          </p>
        </div>
        <button onClick={onToggleKitchen} role="switch" aria-checked={settings.kitchenLive} className={`relative h-9 w-16 shrink-0 rounded-full transition ${settings.kitchenLive ? 'bg-green-600' : 'bg-stone-300'}`}>
          <span className={`absolute top-1 h-7 w-7 rounded-full bg-white shadow transition-all ${settings.kitchenLive ? 'left-8' : 'left-1'}`} />
        </button>
      </div>

      <div className="rounded-2xl border border-stone-200/80 bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-walnut">Home delivery charge (₨)</h2>
        <p className="mt-0.5 text-sm text-stone-500">Shown to customers at checkout and added to every delivery order.</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input type="number" min="0" value={chargeValue} onChange={(e) => onChargeChange(e.target.value)} className="w-28 rounded-xl border border-stone-200 px-3 py-2.5 font-mono focus:border-clay focus:outline-none" />
          {[100, 150, 200].map((v) => (
            <button key={v} onClick={() => onChargeChange(String(v))} className={`rounded-xl border px-3 py-2 text-sm ${Number(chargeValue) === v ? 'border-clay bg-clay/10 text-clay' : 'border-stone-200 text-stone-500 hover:border-stone-300'}`}>
              ₨{v}
            </button>
          ))}
          <button onClick={onSaveCharge} className="ml-auto rounded-xl bg-walnut px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-walnut-deep">
            Save
          </button>
        </div>
        {savedNote && <p className="mt-3 text-sm font-medium text-green-700">✓ {savedNote}</p>}
        <p className="mt-3 text-xs text-stone-400">Currently live on the site: ₨{settings.deliveryCharge}</p>
      </div>
    </div>
  )
}

function OrdersView({ counts, statusFilter, onFilter, visible, todayStats, act }) {
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-walnut">Orders</h1>
          <p className="mt-1 text-sm text-stone-500">New requests appear here automatically.</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ['⏳', 'Pending requests', todayStats.pending, 'amber'],
          ['🧾', "Orders today", todayStats.total, 'stone'],
          ['📈', "Revenue today", `₨${todayStats.revenue}`, 'stone'],
          ['💳', 'Paid online today', `₨${todayStats.onlineRevenue}`, 'green'],
        ].map(([icon, label, value]) => (
          <div key={label} className="rounded-2xl border border-stone-200/80 bg-white p-5">
            <p className="text-xs font-medium text-stone-400">{icon} {label}</p>
            <p className="mt-1 font-display text-2xl font-semibold text-walnut">{value}</p>
          </div>
        ))}
      </div>

      {/* Status filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => onFilter(s)}
            className={`rounded-full border px-4 py-1.5 text-sm capitalize transition ${statusFilter === s ? 'border-walnut bg-walnut text-cream' : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'}`}
          >
            {s} {counts[s] > 0 && <span className="ml-1 font-bold">· {counts[s]}</span>}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-white/50 p-10 text-center text-sm text-stone-400">
          No {statusFilter === 'all' ? '' : statusFilter + ' '}orders yet.
        </p>
      ) : (
        <ul className="space-y-4">
          {visible.map((o) => (
            <li key={o._id} className="rounded-2xl border border-stone-200/80 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-semibold text-walnut">{o.code}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[o.status]}`}>{o.status}</span>
                  {o.paid && <span className="rounded-full bg-green-900/10 px-2.5 py-0.5 text-xs font-semibold text-green-800">💰 Paid · {o.receiptNo}</span>}
                </div>
                <span className="text-xs text-stone-400">
                  {new Date(o.createdAt).toLocaleString()} · {o.fulfilment === 'delivery' ? '🛵 Delivery' : '🚶 Pickup'} · {o.payment === 'cash' ? '💵 Cash' : '💳 Online'}
                </span>
              </div>

              <div className="grid gap-4 pt-3 text-sm sm:grid-cols-2">
                <div className="text-stone-500">
                  <p className="font-semibold text-walnut">{o.customer.name} · <span className="font-normal">{o.customer.phone}</span></p>
                  {o.fulfilment === 'delivery' && o.customer.address && <p className="mt-0.5">📍 {o.customer.address}</p>}
                  {o.note && <p className="mt-0.5 text-clay">📝 {o.note}</p>}
                </div>
                <div className="text-stone-500">
                  {o.items.map((it, i) => (
                    <p key={i}>
                      {it.quantity} × {it.name} <span className="text-stone-400">₨{it.price * it.quantity}</span>
                    </p>
                  ))}
                  <p className="mt-1 font-semibold text-walnut">
                    Total: ₨{o.total}
                    {o.deliveryCharge > 0 && <span className="text-xs font-normal text-stone-400"> (incl. ₨{o.deliveryCharge} delivery)</span>}
                  </p>
                </div>
              </div>

              {o.status === 'pending' && <AcceptRejectRow act={act} orderId={o._id} />}
              {o.status === 'accepted' && (
                <div className="mt-3 flex items-center gap-3 border-t border-stone-100 pt-3 text-sm">
                  <span className="rounded-lg bg-blue-900/10 px-2.5 py-1 text-blue-800">Prep time · {o.prepMinutes} min</span>
                  <button onClick={() => act(o._id, { action: 'complete' })} className="rounded-xl bg-green-700 px-4 py-1.5 font-semibold text-white transition hover:bg-green-600">
                    Mark completed
                  </button>
                </div>
              )}
              {o.status === 'rejected' && o.rejectReason && (
                <p className="mt-3 border-t border-stone-100 pt-3 text-sm text-red-700">Reason given: {o.rejectReason}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function AcceptRejectRow({ orderId, act }) {
  const [prep, setPrep] = useState('30')
  const [reason, setReason] = useState('')
  const [showReject, setShowReject] = useState(false)

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3 text-sm">
      <span className="font-medium text-walnut">Prep time:</span>
      {[20, 30, 45, 60, 90].map((m) => (
        <button
          key={m}
          onClick={() => setPrep(String(m))}
          className={`rounded-full border px-2.5 py-1 transition ${prep === String(m) ? 'border-walnut bg-walnut text-cream' : 'border-stone-200 text-stone-500 hover:border-stone-300'}`}
        >
          {m}m
        </button>
      ))}
      <input type="number" min="5" value={prep} onChange={(e) => setPrep(e.target.value)} className="w-20 rounded-lg border border-stone-200 px-2 py-1.5" />
      <button onClick={() => act(orderId, { action: 'accept', prepMinutes: Number(prep) })} className="rounded-xl bg-green-700 px-4 py-2 font-semibold text-white transition hover:bg-green-600">
        ✓ Accept
      </button>
      <button onClick={() => setShowReject(true)} className="rounded-xl border border-red-200 px-4 py-2 font-semibold text-red-700 transition hover:bg-red-900/5">
        ✕ Reject
      </button>
      {showReject && (
        <form
          className="flex flex-1 flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            act(orderId, { action: 'reject', rejectReason: reason })
          }}
        >
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (shown to the customer, optional)" className="min-w-48 flex-1 rounded-lg border border-stone-200 px-3 py-1.5" />
          <button type="submit" className="rounded-xl bg-red-600 px-3.5 py-2 font-semibold text-white transition hover:bg-red-500">
            Confirm rejection
          </button>
        </form>
      )}
    </div>
  )
}
