import type { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { Role } from '../../lib/types';

/** 按钮级权限：角色不符时不渲染子元素。 */
export default function Can({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === 'admin') return <>{children}</>;
  if (!roles.includes(user.role)) return null;
  return <>{children}</>;
}
