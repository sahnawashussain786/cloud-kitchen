import { useEffect, useMemo, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { api } from '../api.js'
import CartSidebar from './CartSidebar.jsx'
import Checkout from './Checkout.jsx'
import TrackOrder from './TrackOrder.jsx'

const CATEGORIES = ['All', 'Biryani & Rice', 'Karahi & Handi', 'BBQ & Grill', 'Desi', 'Fast Food', 'Add-ons']

export default function CustomerApp() {
  const [menu, setMenu] = useState([])
  const [settings, setSettings] = useState({ kitchenLive: true, deliveryCharge: 0 })
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [category, setCategory] = useState('All')
  const [error, setError] = useState('')

  // cart is persisted in localStorage so a refresh never loses it
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('sk-cart') || '[]')
    if (Array.isArray(saved)) setCart(saved)
    api
      .getMenu()
      .then(setMenu)
      .catch((e) => setError('Could not load the menu: ' + e.message))
    api.getSettings().then(setSettings).catch(() => {})

    // keep the live/closed banner and delivery charge fresh while browsing
    const t = setInterval(() => {
      api.getSettings().then(setSettings).catch(() => {})
    }, 15000)
    return () => clearInterval(t)
  }, [])

  const updateCart = (next) => {
    setCart(next)
    localStorage.setItem('sk-cart', JSON.stringify(next))
  }

  const addItem = (item) => {
    if (!settings.kitchenLive) return
    const existing = cart.find((c) => c.menuItemId === String(item._id))
    if (existing) {
      updateCart(cart.map((c) => (c.menuItemId === String(item._id) ? { ...c, quantity: c.quantity + 1 } : c)))
    } else {
      updateCart([...cart, { menuItemId: String(item._id), name: item.name, price: item.price, quantity: 1 }])
    }
  }

  const changeQuantity = (menuItemId, delta) => {
    updateCart(
      cart
        .map((c) => (c.menuItemId === menuItemId ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0),
    )
  }

  const cartCount = cart.reduce((n, c) => n + c.quantity, 0)
  const cartTotal = cart.reduce((n, c) => n + c.price * c.quantity, 0)

  const visible = useMemo(
    () => (category === 'All' ? menu : menu.filter((m) => m.category === category)),
    [menu, category],
  )

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-amber-900 text-amber-50 shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <a href="/" className="text-lg font-bold tracking-wide sm:text-xl">
            <span className="text-amber-400">🍽</span> Shahnaz Kitchen
          </a>
          <div className="flex items-center gap-3">
            <a href="/track" className="hidden text-sm underline-offset-2 hover:underline sm:inline">
              Track order
            </a>
            <button
              onClick={() => setCartOpen(true)}
              disabled={!settings.kitchenLive}
              className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-stone-600"
            >
              🛒 Cart ({cartCount}) · ₨{cartTotal}
            </button>
          </div>
        </div>
        {/* Kitchen live / closed banner */}
        <div
          className={`py-2 text-center text-sm font-medium ${
            settings.kitchenLive ? 'bg-green-700' : 'bg-red-700'
          }`}
        >
          {settings.kitchenLive
            ? '● We are live — orders are being accepted right now!'
            : '● Kitchen is currently closed — please check back later.'}
        </div>
      </header>

      <Routes>
        <Route
          path="/"
          element={
            <main className="mx-auto max-w-6xl px-4 py-6">
              <section className="mb-6 rounded-xl bg-amber-800 p-6 text-amber-50 sm:p-8">
                <h1 className="text-2xl font-bold sm:text-3xl">Home-style desi food, delivered hot.</h1>
                <p className="mt-2 max-w-2xl text-sm text-amber-100">
                  Place your order and the kitchen confirms it — you&apos;ll see the exact preparation time
                  once accepted. Choose home delivery or pick it up yourself; pay cash or online.
                </p>
              </section>

              {/* Category filter */}
              <div className="mb-4 flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                      category === c ? 'bg-amber-700 text-white' : 'bg-white text-stone-700 hover:bg-amber-100'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {error && <p className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">{error}</p>}

              {/* Menu grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((item) => (
                  <div
                    key={item._id}
                    className="flex flex-col rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-stone-800">{item.name}</h3>
                      <span className="whitespace-nowrap font-bold text-amber-700">₨{item.price}</span>
                    </div>
                    <p className="mt-1 flex-1 text-sm text-stone-500">{item.description}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wide text-stone-400">
                        {item.category}
                      </span>
                      <button
                        onClick={() => addItem(item)}
                        disabled={!settings.kitchenLive || !item.available}
                        className="rounded-lg bg-amber-700 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-stone-300"
                      >
                        {settings.kitchenLive ? (item.available ? 'Add +' : 'Unavailable') : 'Closed'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center sm:hidden">
                <a href="/track" className="text-sm text-amber-700 underline">
                  Track your order →
                </a>
              </div>
            </main>
          }
        />
        <Route path="/track" element={<TrackOrder />} />
      </Routes>

      <footer className="mt-12 bg-amber-950 py-6 text-center text-sm text-amber-200">
        Shahnaz Kitchen · Cash &amp; online payment accepted · Home delivery &amp; pickup available
      </footer>

      {/* Cart drawer */}
      <CartSidebar
        open={cartOpen}
        cart={cart}
        deliveryCharge={settings.deliveryCharge}
        kitchenLive={settings.kitchenLive}
        onClose={() => setCartOpen(false)}
        onChangeQuantity={changeQuantity}
        onClear={() => updateCart([])}
        onCheckout={() => {
          setCartOpen(false)
          setCheckoutOpen(true)
        }}
      />

      {/* Checkout modal */}
      {checkoutOpen && (
        <Checkout
          cart={cart}
          cartTotal={cartTotal}
          deliveryCharge={settings.deliveryCharge}
          kitchenLive={settings.kitchenLive}
          onClose={() => setCheckoutOpen(false)}
          onPlaced={(order) => {
            updateCart([])
            setCheckoutOpen(false)
            window.location.assign(`/track?code=${order.code}`)
          }}
        />
      )}
    </div>
  )
}
