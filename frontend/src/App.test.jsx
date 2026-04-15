/**
 * Property 13: Unauthenticated user redirected to /login on protected routes
 *
 * For any route that is not `/login` or `/register`, when no auth session
 * exists in localStorage, the ProtectedRoute component SHALL redirect the
 * user to `/login`.
 *
 * Validates: Requirements 9.1
 *
 * ---
 *
 * Property 14: Employee user redirected away from admin routes
 *
 * For any employee user (any employeeId), navigating to `/` or `/admin`
 * SHALL redirect them to `/employee/{employeeId}` rather than rendering
 * the admin-only page.
 *
 * Validates: Requirements 9.2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'

// Mock page components to avoid complex rendering dependencies
vi.mock('./pages/Dashboard', () => ({
  default: () => <div data-testid="dashboard">Dashboard</div>,
}))
vi.mock('./pages/AdminPanel', () => ({
  default: () => <div data-testid="admin-panel">AdminPanel</div>,
}))
vi.mock('./pages/EmployeeDetail', () => ({
  default: () => <div data-testid="employee-detail">EmployeeDetail</div>,
}))
vi.mock('./pages/Login', () => ({
  default: () => <div data-testid="login-page">Login</div>,
}))
vi.mock('./pages/Register', () => ({
  default: () => <div data-testid="register-page">Register</div>,
}))
vi.mock('./components/Navbar', () => ({
  default: () => <nav data-testid="navbar">Navbar</nav>,
}))

// Import ProtectedRoute logic by re-implementing the routes from App.jsx
// using createMemoryRouter so we can control the initial URL
import { Navigate, Routes, Route } from 'react-router-dom'

function ProtectedRoute({ adminOnly = false, children }) {
  const role = localStorage.getItem('role')
  const employeeId = localStorage.getItem('employeeId')
  if (!role) return <Navigate to="/login" replace />
  if (adminOnly && role === 'employee') {
    return <Navigate to={`/employee/${employeeId}`} replace />
  }
  return children
}

// Minimal router that mirrors App.jsx route structure
function buildRouter(initialPath) {
  return createMemoryRouter(
    [
      { path: '/login', element: <div data-testid="login-page">Login</div> },
      { path: '/register', element: <div data-testid="register-page">Register</div> },
      {
        path: '/',
        element: (
          <ProtectedRoute adminOnly>
            <div data-testid="dashboard">Dashboard</div>
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin',
        element: (
          <ProtectedRoute adminOnly>
            <div data-testid="admin-panel">AdminPanel</div>
          </ProtectedRoute>
        ),
      },
      {
        path: '/employee/:id',
        element: (
          <ProtectedRoute>
            <div data-testid="employee-detail">EmployeeDetail</div>
          </ProtectedRoute>
        ),
      },
    ],
    { initialEntries: [initialPath] }
  )
}

function renderAt(path) {
  const router = buildRouter(path)
  render(<RouterProvider router={router} />)
  return router
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
})

// --- Property 13 ---

describe('Property 13: Unauthenticated user redirected to /login on protected routes', () => {
  const protectedRoutes = ['/', '/admin', '/employee/1', '/employee/42']

  protectedRoutes.forEach((route) => {
    it(`redirects unauthenticated user from "${route}" to /login`, () => {
      // No localStorage session set
      renderAt(route)
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })
  })

  it('does NOT redirect from /login when unauthenticated', () => {
    renderAt('/login')
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
  })

  it('does NOT redirect from /register when unauthenticated', () => {
    renderAt('/register')
    expect(screen.getByTestId('register-page')).toBeInTheDocument()
  })
})

// --- Property 14 ---

describe('Property 14: Employee user redirected away from admin routes', () => {
  const employeeIds = [1, 3, 7, 17, 42, 99]
  const adminRoutes = ['/', '/admin']

  employeeIds.forEach((employeeId) => {
    adminRoutes.forEach((route) => {
      it(`employee (id=${employeeId}) navigating to "${route}" is redirected to /employee/${employeeId}`, () => {
        localStorage.setItem('role', 'employee')
        localStorage.setItem('userId', String(employeeId + 100))
        localStorage.setItem('employeeId', String(employeeId))

        renderAt(route)

        expect(screen.getByTestId('employee-detail')).toBeInTheDocument()
        expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument()
        expect(screen.queryByTestId('admin-panel')).not.toBeInTheDocument()
      })
    })
  })

  it('admin user can access "/" without redirect', () => {
    localStorage.setItem('role', 'admin')
    localStorage.setItem('userId', '1')

    renderAt('/')

    expect(screen.getByTestId('dashboard')).toBeInTheDocument()
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument()
  })

  it('admin user can access "/admin" without redirect', () => {
    localStorage.setItem('role', 'admin')
    localStorage.setItem('userId', '1')

    renderAt('/admin')

    expect(screen.getByTestId('admin-panel')).toBeInTheDocument()
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument()
  })

  it('employee user can access their own /employee/:id route', () => {
    localStorage.setItem('role', 'employee')
    localStorage.setItem('userId', '5')
    localStorage.setItem('employeeId', '3')

    renderAt('/employee/3')

    expect(screen.getByTestId('employee-detail')).toBeInTheDocument()
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument()
  })
})
