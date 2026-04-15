import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar, { MobileMenuButton } from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import EmployeeDetail from './pages/EmployeeDetail'
import AdminPanel from './pages/AdminPanel'
import Login from './pages/Login'
import Register from './pages/Register'

function ProtectedRoute({ adminOnly = false, children }) {
  const role = localStorage.getItem('role')
  const employeeId = localStorage.getItem('employeeId')
  if (!role) return <Navigate to="/login" replace />
  if (adminOnly && role === 'employee') return <Navigate to={`/employee/${employeeId}`} replace />
  return children
}

function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
          <MobileMenuButton onClick={() => setMobileOpen(true)} />
          <span className="font-bold text-[#0f172a] text-base">OnboardAI</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
            <Route path="/employee/:id" element={<ProtectedRoute><EmployeeDetail /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </BrowserRouter>
  )
}
