const BASE = '/api'

export async function apiGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const json = await res.json()
  if (json.code !== 0) throw new Error(json.message)
  return json.data as T
}

export async function apiPost<T>(path: string, token: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  if (json.code !== 0) throw new Error(json.message)
  return json.data as T
}

export function formatYuan(fen: number): string {
  return `¥${(fen / 100).toFixed(2)}`
}
