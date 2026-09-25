import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { createBrowserRouter, RouterProvider, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ProductsPage } from '@/pages/ProductsPage'
import { OrdersPage } from '@/pages/OrdersPage'

interface AuthUser {
  id: number
  username: string
  name: string
  role: 'admin' | 'staff'
  storeId: number | null
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  login: (user: AuthUser, token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('admin_user')
    return saved ? JSON.parse(saved) : null
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('admin_token'))

  const login = useCallback((u: AuthUser, t: string) => {
    setUser(u)
    setToken(t)
    localStorage.setItem('admin_user', JSON.stringify(u))
    localStorage.setItem('admin_token', t)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('admin_user')
    localStorage.removeItem('admin_token')
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

function ProtectedRoute({ children }: { children?: ReactNode }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (children) return <>{children}</>
  return <Outlet />
}

function AdminRoute({ children }: { children?: ReactNode }) {
  const { user } = useAuth()
  if (user?.role !== 'admin') return <Navigate to="/" replace />
  if (children) return <>{children}</>
  return <Outlet />
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      { path: '/', element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/products', element: <ProductsPage /> },
      { path: '/orders', element: <OrdersPage /> },
      {
        element: <AdminRoute><Outlet /></AdminRoute>,
        children: [
          { path: '/stores', element: <div>门店管理</div> },
          { path: '/members', element: <div>会员管理</div> },
          { path: '/coupons', element: <div>优惠券管理</div> },
          { path: '/accounts', element: <div>账号管理</div> },
        ],
      },
    ],
  },
])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
