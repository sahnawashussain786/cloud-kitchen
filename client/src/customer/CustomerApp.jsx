import { useEffect, useMemo, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { api } from '../api.js'
import CartSidebar from './CartSidebar.jsx'
import Checkout from './Checkout.jsx'
import PaymentModal from './PaymentModal.jsx'
import TrackOrder from './TrackOrder.jsx'

const CATEGORIES = ['All', 'Biryani & Rice', 'Karahi & Handi', 'BBQ & Grill', 'Desi', 'Fast Food', 'Add-ons']

export default function CustomerApp() {
  const [menu, setMenu] = useState([])
  const [settings, setSettings] = useState({ kitchenLive: true, deliveryCharge: 0 })
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOrder, setCheckoutOrder] = useState(null) // order awaiting (optional) dummy online payment
  const [category, setCategory] = useState('All')
  const [error, setError] = useState('')

  const open = settings.kitchenLive

  // cart survives page refreshes
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('sk-cart') || '[]')
    if (Array.isArray(saved)) setCart(saved)
    api
      .getMenu()
      .then(setMenu)
      .catch((e) => setError('Could not load the menu: ' + e.message))
  }, [])

  // LIVE kitchen status: the banner, badge and buttons update on their own,
  // every 5 seconds, without the customer ever reloading the page.
  useEffect(() => {
    let alive = true
    const poll = () =>
      api
        .getSettings()
        .then((s) => {
          if (alive) setSettings(s)
        })
        .catch(() => {})
    poll()
    const t = setInterval(poll, 5000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [])

  const updateCart = (next) => {
    setCart(next)
    localStorage.setItem('sk-cart', JSON.stringify(next))
  }

  const qtyOf = (item) =>
    cart.find((c) => c.menuItemId === String(item._id))?.quantity || 0

  const addItem = (item) => {
    if (!open) return
    const existing = cart.find((c) => c.menuItemId === String(item._id))
    updateCart(
      existing
        ? cart.map((c) => (c.menuItemId === String(item._id) ? { ...c, quantity: c.quantity + 1 } : c))
        : [...cart, { menuItemId: String(item._id), name: item.name, price: item.price, quantity: 1 }],
    )
  }

  const changeQuantity = (menuItemId, delta) =>
    updateCart(
      cart
        .map((c) => (c.menuItemId === menuItemId ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0),
    )

  const cartCount = cart.reduce((n, c) => n + c.quantity, 0)
  const cartTotal = cart.reduce((n, c) => n + c.price * c.quantity, 0)

  const visible = useMemo(
    () => (category === 'All' ? menu : menu.filter((m) => m.category === category)),
    [menu, category],
  )

  return (
    <div className="min-h-screen">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5">
          <a href="/" className="flex items-baseline gap-1.5">
            <span className="font-display text-xl font-semibold tracking-tight text-walnut sm:text-2xl">
              Shahnaz <span className="text-clay">Kitchen</span>
            </span>
          </a>
          <div className="flex items-center gap-3">
            <a href="/track" className="hidden text-sm font-medium text-walnut/70 underline-offset-4 hover:text-clay hover:underline sm:inline">
              Track order
            </a>
            <button
              onClick={() => setCartOpen(true)}
              disabled={!open}
              className="rounded-full bg-walnut px-4 py-2 text-sm font-semibold text-cream transition hover:bg-walnut-deep disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              Cart · {cartCount} · ₨{cartTotal}
            </button>
          </div>
        </div>

        {/* Live status strip — driven by polling, no reload needed */}
        <div className={`flex items-center justify-center gap-2 py-1.5 text-xs font-medium ${open ? 'bg-green-700/10 text-green-800' : 'bg-red-700/10 text-red-800'}`}>
          <span className={`live-dot inline-block h-2 w-2 rounded-full ${open ? 'bg-green-500' : 'bg-red-500'}`} />
          {open ? (
            <span>Kitchen is live — taking orders right now</span>
          ) : (
            <span>Kitchen is closed — orders pause automatically. This keeps checking on itself…</span>
          )}
        </div>
      </header>

      <Routes>
        <Route
          path="/"
          element={
            <main className="mx-auto max-w-6xl px-4 pb-16">
              {/* ===== Hero ===== */}
              <section className="mt-6 overflow-hidden rounded-3xl bg-walnut text-cream">
                <div className="grid items-center gap-8 p-8 sm:p-12 lg:grid-cols-[1.2fr_1fr]">
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-cream/50">
                      Cloud Kitchen
                    </p>
                    <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
                      Desi comfort food,
                      <br />
                      cooked fresh <em className="text-clay not-italic">to order</em>.
                    </h1>
                    <p className="mt-4 max-w-lg text-sm leading-relaxed text-cream/70">
                      Biryani, karahi and chargrilled favourites made the old-fashioned way — you order,
                      the kitchen confirms with an exact prep time, then it&apos;s dispatched hot for
                      delivery or kept ready for you to pick up.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <a href="#menu" className="rounded-full bg-clay px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110">
                        Browse menu
                      </a>
                      <a href="/track" className="rounded-full border border-cream/25 px-6 py-2.5 text-sm font-medium text-cream/90 transition hover:bg-cream/10">
                        Track your order
                      </a>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-medium text-cream/60">
                      {['Home delivery', 'Self pickup', 'Cash or online', 'Live prep-time updates'].map((chip) => (
                        <span key={chip} className="rounded-full border border-cream/15 px-3 py-1">
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Decorative counter card */}
                  <div className="relative hidden justify-self-center lg:block">
                    <div className="flex h-64 w-64 items-center justify-center rounded-full border border-cream/15 bg-walnut-deep text-7xl shadow-2xl">
                      🍲
                    </div>
                    <div className="absolute -left-6 top-4 rounded-xl bg-cream px-4 py-2 text-xs font-semibold text-walnut shadow-lg">
                      Avg. prep · 30 min
                    </div>
                    <div className="absolute -right-4 bottom-6 rounded-xl bg-cream px-4 py-2 text-xs font-semibold text-walnut shadow-lg">
                      Delivery charge · ₨{settings.deliveryCharge}
                    </div>
                  </div>
                </div>
              </section>

              {/* ===== Menu ===== */}
              <section id="menu" className="mt-12">
                <div className="mb-6 text-center">
                  <h2 className="font-display text-3xl font-semibold text-walnut">Our Menu</h2>
                  <p className="mt-1 text-sm text-walnut/60">Add what you fancy — the counter confirms your order personally.</p>
                </div>

                {/* Category pills */}
                <div className="mb-6 flex flex-wrap justify-center gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`rounded-full border px-4 py-1.5 text-sm transition ${
                        category === c
                          ? 'border-walnut bg-walnut text-cream'
                          : 'border-stone-200 bg-white text-walnut/70 hover:border-clay/50 hover:text-clay'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {error && <p className="mb-4 rounded-xl bg-red-900/10 p-3 text-center text-sm text-red-800">{error}</p>}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {visible.map((item) => {
                    const qty = qtyOf(item)
                    const disabled = qty > 0
                    return (
                      <article
                        key={item._id}
                        className="flex flex-col rounded-2xl border border-stone-200/80 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-display text-lg font-semibold text-walnut">{item.name}</h3>
                            <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                              {item.category}
                            </span>
                          </div>
                          <span className="whitespace-nowrap font-display text-lg font-semibold text-clay">
                            ₨{item.price}
                          </span>
                        </div>
                        <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-500">{item.description}</p>

                        {/* Add / quantity stepper */}
                        <div className="mt-4">
                          {qty === 0 ? (
                            <button
                              onClick={() => addItem(item)}
                              disabled={!open || !item.available}
                              className="w-full rounded-xl border border-walnut/15 bg-walnut/5 py-2 text-sm font-semibold text-walnut transition hover:bg-walnut hover:text-cream disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-300"
                            >
                              {open ? (item.available ? 'Add to order' : 'Unavailable') : 'Kitchen closed'}
                            </button>
                          ) : (
                            <div className="flex items-center justify-between rounded-xl bg-walnut text-cream">
                              <button onClick={() => changeQuantity(String(item._id), -1)} className="px-4 py-2 text-lg hover:text-clay" aria-label="Decrease">−</button>
                              <span className="text-sm font-semibold">{qty} in cart</span>
                              <button onClick={() => changeQuantity(String(item._id), 1)} className="px-4 py-2 text-lg hover:text-clay" aria-label="Increase">+</button>
                            </div>
                          )}
                          {qty > 0 && disabled && !open && (
                            <p className="mt-1 text-center text-[11px] text-red-700">Kitchen closed — keep your cart, checkout reopens when we do.</p>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            </main>
          }
        />
        <Route path="/track" element={<TrackOrder />} />
      </Routes>

      {/* ===== Footer ===== */}
      <footer className="bg-walnut-deep py-10 text-sm text-stone-300">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="font-display text-lg font-semibold text-cream">Shahnaz <span className="text-clay">Kitchen</span></p>
            <p className="mt-1 text-xs text-stone-400">Home-style desi food · Cloud kitchen</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-stone-400">
            <a href="/" className="hover:text-cream">Menu</a>
            <a href="/track" className="hover:text-cream">Track order</a>
            <span>Cash &amp; online payment</span>
            <span>Delivery &amp; pickup</span>
          </div>
        </div>
      </footer>

      {/* Cart drawer */}
      <CartSidebar
        open={cartOpen}
        cart={cart}
        deliveryCharge={settings.deliveryCharge}
        kitchenLive={open}
        onClose={() => setCartOpen(false)}
        onChangeQuantity={changeQuantity}
        onClear={() => updateCart([])}
        onCheckout={() => {
          setCartOpen(false)
          setCheckoutOrder({ pending: true })
        }}
      />

      {/* Checkout modal */}
      {checkoutOrder?.pending && (
        <Checkout
          cart={cart}
          cartTotal={cartTotal}
          deliveryCharge={settings.deliveryCharge}
          kitchenLive={open}
          onClose={() => setCheckoutOrder(null)}
          onPlaced={(order) => {
            updateCart([])
            setCheckoutOrder(order) // keeps online orders open for the payment step
          }}
        />
      )}

      {/* Dummy online payment modal after a paid-online order is placed */}
      {checkoutOrder && !checkoutOrder.pending && checkoutOrder.payment === 'online' && !checkoutOrder.paid && (
        <PaymentModal code={checkoutOrder.code} total={checkoutOrder.total} onDone={() => setCheckoutOrder(null)} />
      )}
    </div>
  )
}
