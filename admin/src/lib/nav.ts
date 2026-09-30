import type { Role } from './types';

export interface NavItem {
  key: string;
  label: string;
  icon: string; // lucide 图标名
  path: string;
  /** 允许访问的角色；admin 始终可见 */
  roles: Role[];
}

/**
 * 后台菜单与路由权限。
 * 店员仅：数据看板、商品管理（售罄）、订单管理。
 * 管理员：全部。
 */
export const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: '数据看板', icon: 'BarChart3', path: '/', roles: ['admin', 'staff'] },
  { key: 'products', label: '商品管理', icon: 'Package', path: '/products', roles: ['admin', 'staff'] },
  { key: 'orders', label: '订单管理', icon: 'Receipt', path: '/orders', roles: ['admin', 'staff'] },
  { key: 'stores', label: '门店管理', icon: 'Store', path: '/stores', roles: ['admin'] },
  { key: 'members', label: '会员管理', icon: 'Users', path: '/members', roles: ['admin'] },
  { key: 'coupons', label: '优惠券', icon: 'Ticket', path: '/coupons', roles: ['admin'] },
  { key: 'promotions', label: '活动管理', icon: 'Sparkles', path: '/promotions', roles: ['admin'] },
  { key: 'accounts', label: '账号与角色', icon: 'KeyRound', path: '/accounts', roles: ['admin'] },
];

export function canAccess(role: Role | undefined, item: NavItem): boolean {
  if (!role) return false;
  if (role === 'admin') return true;
  return item.roles.includes(role);
}
