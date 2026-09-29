import { Outlet, useNavigate } from 'react-router-dom';
import { Coffee, LogOut } from 'lucide-react';
import { Button } from '../ui/button';
import { clearSession } from '../../lib/auth';

const menu = [
  { key: 'dashboard', label: '数据看板', icon: '📊' },
  { key: 'products', label: '商品管理', icon: '🛍️' },
  { key: 'orders', label: '订单管理', icon: '🧾' },
  { key: 'stores', label: '门店管理', icon: '🏪' },
  { key: 'members', label: '会员管理', icon: '👥' },
  { key: 'coupons', label: '优惠券', icon: '🎟️' },
  { key: 'accounts', label: '账号与角色', icon: '🔑' },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-56 flex-col border-r border-brand-100 bg-white">
        <div className="flex items-center gap-2 px-5 py-5">
          <Coffee className="h-6 w-6 text-brand-600" />
          <div>
            <div className="text-sm font-bold text-brand-800">山野咖啡</div>
            <div className="text-xs text-brand-400">后台管理</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {menu.map((m) => (
            <a
              key={m.key}
              href={`/${m.key}`}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-brand-700 hover:bg-brand-50"
            >
              <span>{m.icon}</span>
              {m.label}
            </a>
          ))}
        </nav>
        <div className="border-t border-brand-100 p-3">
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleLogout}>
            <LogOut /> 退出登录
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
