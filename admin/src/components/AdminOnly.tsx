import type { ReactNode } from 'react'
import { useAuth } from '@/App'

interface AdminOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  const { user } = useAuth()

  if (user?.role !== 'admin') {
    return <>{fallback}</>
  }

  return <>{children}</>
}
