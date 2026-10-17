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
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-xl transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
          <h2 className="text-lg font-bold">Your Cart</h2>
          <button onClick={onClose} className="rounded p-1 text-2xl leading-none text-stone-500 hover:bg-stone-100" aria-label="Close cart">
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {cart.length === 0 ? (
            <p className="mt-10 text-center text-sm text-stone-500">
              Your cart is empty. Add some delicious items from the menu!
            </p>
          ) : (
            <ul className="space-y-3">
              {cart.map((c) => (
                <li key={c.menuItemId} className="flex items-center justify-between gap-2 rounded-lg bg-stone-50 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-stone-500">
                      ₨{c.price} × {c.quantity} = <span className="font-semibold text-stone-700">₨{c.price * c.quantity}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onChangeQuantity(c.menuItemId, -1)}
                      className="h-7 w-7 rounded bg-stone-200 font-bold hover:bg-stone-300"
                      aria-label={`Decrease ${c.name}`}
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{c.quantity}</span>
                    <button
                      onClick={() => onChangeQuantity(c.menuItemId, 1)}
                      className="h-7 w-7 rounded bg-stone-200 font-bold hover:bg-stone-300"
                      aria-label={`Increase ${c.name}`}
                    >
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-stone-200 px-4 py-4">
          <div className="mb-1 flex justify-between text-sm text-stone-600">
            <span>Subtotal</span>
            <span>₨{subtotal}</span>
          </div>
          <div className="mb-1 flex justify-between text-sm text-stone-600">
            <span>Delivery (if chosen at checkout)</span>
            <span>₨{deliveryCharge}</span>
          </div>
          <div className="mb-3 flex justify-between font-bold">
            <span>Total (with delivery)</span>
            <span>₨{subtotal + deliveryCharge}</span>
          </div>
          {cart.length > 0 && (
            <div className="flex gap-2">
              <button onClick={onClear} className="rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-stone-100">
                Clear
              </button>
              <button
                onClick={onCheckout}
                disabled={!kitchenLive}
                className="flex-1 rounded-lg bg-amber-700 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:bg-stone-300"
              >
                Proceed to Checkout
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
