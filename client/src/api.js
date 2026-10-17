// Small fetch wrapper for the Shahnaz Kitchen API.
// All app code lives in one origin, so relative /api URLs work through the Vite dev proxy.

async function request(path, { method = 'GET', body, adminPassword } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (adminPassword) headers['x-admin-password'] = adminPassword

  const res = await fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  let data = null
  try {
    data = await res.json()
  } catch {
    // empty or non-JSON body — leave data as null
  }

  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`)
  }
  return data
}

export const api = {
  getMenu: () => request('/api/menu'),
  getSettings: () => request('/api/settings'),
  placeOrder: (payload) => request('/api/orders', { method: 'POST', body: payload }),
  trackOrder: (code) => request(`/api/orders/${encodeURIComponent(code)}`),
  payOrder: (payload) => request('/api/payments', { method: 'POST', body: payload }),

  adminLogin: (password) =>
    request('/api/admin/login', { method: 'POST', body: { password } }),
  adminOrders: (password) => request('/api/admin/orders', { adminPassword: password }),
  adminUpdateOrder: (password, id, body) =>
    request(`/api/admin/orders/${id}`, { method: 'PATCH', body, adminPassword: password }),
  adminUpdateSettings: (password, body) =>
    request('/api/admin/settings', { method: 'PUT', body, adminPassword: password }),
}
