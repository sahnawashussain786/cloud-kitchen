import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import CustomerApp from './customer/CustomerApp.jsx'
import AdminApp from './admin/AdminApp.jsx'
import './index.css'

// Two site areas:
//   / — customer-facing menu, cart and checkout
//   /admin — password-protected dashboard for the kitchen owner
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="*" element={<CustomerApp />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
