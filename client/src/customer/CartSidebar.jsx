export default function CartSidebar({
  open,
  cart,
  deliveryCharge,
  kitchenLive,
  onClose,
  onChangeQuantity,
  onClear,
  onCheckout,
}) {
  const subtotal = cart.reduce((n, c) => n + c.price * c.quantity, 0)

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-walnut-deep/40 backdrop-blur-[1px]" onClick={onClose} aria-hidden="true" />}

      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-cream shadow-2xl transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 className="font-display text-xl font-semibold text-walnut">Your Cart</h2>
          <button onClick={onClose} className="rounded p-1 text-2xl leading-none text-stone-400 hover:bg-stone-200/60" aria-label="Close cart">
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.length === 0 ? (
            <div className="mt-16 text-center">
              <p className="text-4xl">🧺</p>
              <p className="mt-3 text-sm text-stone-500">Your cart is empty.</p>
              <p className="mt-1 text-xs text-stone-400">Pick something delicious from the menu.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {cart.map((c) => (
                <li key={c.menuItemId} className="rounded-2xl border border-stone-200/70 bg-white p-4">
                  <div className="flex justify-between gap-3">
                    <p className="text-sm font-semibold text-walnut">{c.name}</p>
                    <p className="whitespace-nowrap font-display font-semibold text-clay">₨{c.price * c.quantity}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-stone-400">₨{c.price} each</p>
                    <div className="flex items-center gap-2 rounded-lg bg-cream p-1">
                      <button onClick={() => onChangeQuantity(c.menuItemId, -1)} className="h-7 w-7 rounded-md bg-white font-bold text-walnut shadow-sm hover:shadow" aria-label={`Decrease ${c.name}`}>−</button>
                      <span className="w-6 text-center text-sm font-semibold text-walnut">{c.quantity}</span>
                      <button onClick={() => onChangeQuantity(c.menuItemId, 1)} className="h-7 w-7 rounded-md bg-white font-bold text-walnut shadow-sm hover:shadow" aria-label={`Increase ${c.name}`}>+</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-stone-200 px-5 py-4">
          <div className="mb-1 flex justify-between text-sm text-stone-500">
            <span>Subtotal</span>
            <span>₨{subtotal}</span>
          </div>
          <div className="mb-1 flex justify-between text-sm text-stone-500">
            <span>Delivery (if chosen)</span>
            <span>₨{deliveryCharge}</span>
          </div>
          <div className="mb-4 flex justify-between font-display text-lg font-semibold text-walnut">
            <span>Total</span>
            <span>₨{subtotal + deliveryCharge}</span>
          </div>
          {cart.length > 0 && (
            <div className="flex gap-2">
              <button onClick={onClear} className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-500 hover:border-red-200 hover:text-red-700">
                Clear
              </button>
              <button
                onClick={onCheckout}
                disabled={!kitchenLive}
                className="flex-1 rounded-xl bg-walnut px-4 py-2.5 text-sm font-semibold text-cream transition hover:bg-walnut-deep disabled:bg-stone-300"
              >
                Checkout →
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
