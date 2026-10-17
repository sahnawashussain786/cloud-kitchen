import { useState } from 'react'
import { api } from '../api.js'
import AdminDashboard from './AdminDashboard.jsx'

// Separate /admin area for the kitchen owner only — protected by a passcode.
// The passcode is kept in localStorage so the owner stays signed in on this device.
export default function AdminApp() {
  const [password, setPassword] = useState(localStorage.getItem('sk-admin-pass') || '')
  const [loginError, setLoginError] = useState('')
  const [checking, setChecking] = useState(false)

  if (password) {
    return <AdminDashboard password={password} onSignOut={() => { localStorage.removeItem('sk-admin-pass'); setPassword('') }} />
  }

  const login = async (e) => {
    e.preventDefault()
    setChecking(true)
    setLoginError('')
    try {
      await api.adminLogin(password)
      localStorage.setItem('sk-admin-pass', password)
    } catch {
      setLoginError('Invalid password. Try again.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-900 px-4">
      <form onSubmit={login} className="w-full max-w-sm rounded-xl bg-white p-8 shadow-2xl">
        <h1 className="text-xl font-bold text-stone-800">🔐 Shahnaz Kitchen — Admin</h1>
        <p className="mt-1 mb-6 text-sm text-stone-500">Sign in to manage orders and kitchen settings.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin password"
          autoFocus
          className="mb-3 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-amber-600 focus:outline-none"
        />
        {loginError && <p className="mb-3 text-sm text-red-700">{loginError}</p>}
        <button type="submit" disabled={checking || !password} className="w-full rounded-lg bg-amber-700 py-2 font-semibold text-white hover:bg-amber-600 disabled:bg-stone-300">
          {checking ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
