import { type ReactNode, useState } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../App'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Coffee,
  ShoppingCart,
  Store,
  Users,
  Ticket,
  UserCog,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: '数据看板', icon: <LayoutDashboard size={18} /> },
  { to: '/products', label: '商品管理', icon: <Coffee size={18} /> },
  { to: '/orders', label: '订单管理', icon: <ShoppingCart size={18} /> },
  { to: '/stores', label: '门店管理', icon: <Store size={18} />, adminOnly: true },
  { to: '/members', label: '会员管理', icon: <Users size={18} />, adminOnly: true },
  { to: '/coupons', label: '优惠券', icon: <Ticket size={18} />, adminOnly: true },
  { to: '/accounts', label: '账号管理', icon: <UserCog size={18} />, adminOnly: true },
]

export function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const visibleItems = navItems.filter((item) => !item.adminOnly || user?.role === 'admin')

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={cn(
          'flex flex-col border-r border-border bg-card transition-all duration-200',
          collapsed ? 'w-16' : 'w-56',
        )}
      >
        <div className="flex h-14 items-center justify-between px-4 border-b border-border">
          {!collapsed && (
            <span className="font-bold text-primary text-lg">山野咖啡</span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
          >
            {collapsed ? <Menu size={18} /> : <X size={18} />}
          </button>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          {visibleItems.map((item) => {
            const active = location.pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 mx-2 px-3 py-2 rounded-md text-sm transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
                title={collapsed ? item.label : undefined}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
              {user?.name?.charAt(0)}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.role === 'admin' ? '管理员' : '店员'}
                </p>
              </div>
            )}
            <button
              onClick={logout}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive"
              title="退出登录"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-background p-6">
        <Outlet />
      </main>
    </div>
  )
}
