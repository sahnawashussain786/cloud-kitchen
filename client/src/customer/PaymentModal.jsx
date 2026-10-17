import { useState } from 'react'
import { api } from '../api.js'

// Simulated payment gateway — accepts a card form, shows a processing
// spinner, then confirms. No real money moves; the server records a receipt.
export default function PaymentModal({ code, total, onClose, onDone, onPaid }) {
  const [card, setCard] = useState({ cardNumber: '', cardName: '', expiry: '', cvc: '' })
  const [phase, setPhase] = useState('form') // form | processing | done
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState('')

  const set = (field) => (e) => {
    let value = e.target.value
    if (field === 'cardNumber') value = value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
    if (field === 'expiry') {
      const digits = value.replace(/\D/g, '').slice(0, 4)
      value = digits.length > 2 ? digits.slice(0, 2) + '/' + digits.slice(2) : digits
    }
    if (field === 'cvc') value = value.replace(/\D/g, '').slice(0, 4)
    setCard((c) => ({ ...c, [field]: value }))
  }

  const pay = async (e) => {
    e.preventDefault()
    setPhase('processing')
    setError('')
    try {
      const result = await api.payOrder({ code, ...card })
      setReceipt(result.receiptNo)
      setPhase('done')
      onPaid?.()
      setTimeout(onDone, 3500)
    } catch (err) {
      setError(err.message)
      setPhase('form')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {phase === 'done' ? (
          <div className="flex flex-col items-center p-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">✅</div>
            <h2 className="mt-4 font-display text-2xl font-semibold text-walnut">Payment successful</h2>
            <p className="mt-1 text-sm text-stone-500">₨{total} paid for order {code}</p>
            <p className="mt-4 rounded-lg bg-stone-50 px-4 py-2 font-mono text-sm text-walnut">Receipt: {receipt}</p>
            <p className="mt-3 text-xs text-stone-400">The kitchen is being notified of your order.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-walnut">Cashless checkout</h2>
                <p className="text-xs text-stone-500">
                  Paying ₨{total} for order <span className="font-mono">{code}</span>
                </p>
              </div>
              {phase === 'form' && (
                <button onClick={onClose} className="rounded p-1 text-2xl leading-none text-stone-400 hover:bg-stone-100" aria-label="Close payment">
                  ×
                </button>
              )}
            </div>

            <form onSubmit={pay} className="space-y-4 px-6 py-5">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-walnut">Card number</span>
                <input inputMode="numeric" placeholder="4242 4242 4242 4242" value={card.cardNumber} onChange={set('cardNumber')} required className="w-full rounded-xl border border-stone-200 px-3 py-2.5 font-mono tracking-wider focus:border-clay focus:outline-none" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-walnut">Name on card</span>
                <input placeholder="FULL NAME" value={card.cardName} onChange={set('cardName')} required className="w-full rounded-xl border border-stone-200 px-3 py-2.5 uppercase focus:border-clay focus:outline-none" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-walnut">Expiry (MM/YY)</span>
                  <input inputMode="numeric" placeholder="09/29" value={card.expiry} onChange={set('expiry')} required className="w-full rounded-xl border border-stone-200 px-3 py-2.5 font-mono focus:border-clay focus:outline-none" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-walnut">CVC</span>
                  <input inputMode="numeric" placeholder="•••" value={card.cvc} onChange={set('cvc')} required className="w-full rounded-xl border border-stone-200 px-3 py-2.5 font-mono focus:border-clay focus:outline-none" />
                </label>
              </div>

              {error && <p className="rounded-xl bg-red-900/10 p-2.5 text-sm text-red-800">{error}</p>}

              <button type="submit" disabled={phase !== 'form'} className="flex w-full items-center justify-center gap-2 rounded-xl bg-walnut py-3 font-semibold text-cream transition hover:bg-walnut-deep disabled:opacity-70">
                {phase === 'processing' ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-cream/40 border-t-cream" />
                    Talking to the bank…
                  </>
                ) : (
                  <>Pay ₨{total}</>
                )}
              </button>
              <p className="text-center text-[11px] text-stone-400">
                Demo payment gateway — no real charge. Any well-formed card (e.g. 4242…) is accepted.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
