const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('member_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  const json = await res.json()
  if (json.code !== 0) {
    const err = new Error(json.message)
    if (json.code === 1002 || json.code === 1003) {
      localStorage.removeItem('member_token')
      window.dispatchEvent(new Event('member-auth-expired'))
    }
    throw err
  }
  return json.data as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
}

export function formatYuan(fen: number): string {
  return `¥${(fen / 100).toFixed(2)}`
}

export function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
}

export function getMemberToken(): string | null {
  return localStorage.getItem('member_token')
}

export function setMemberToken(token: string) {
  localStorage.setItem('member_token', token)
}

export function clearMemberToken() {
  localStorage.removeItem('member_token')
}
