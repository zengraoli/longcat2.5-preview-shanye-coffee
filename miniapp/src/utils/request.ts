const BASE_URL = 'http://127.0.0.1:3300'

export interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = uni.getStorageSync('member_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}${path}`,
      method: (options?.method || 'GET') as any,
      data: options?.body ? JSON.parse(options.body as string) : undefined,
      header: headers,
      success: (res: any) => {
        const data = res.data as ApiResponse<T>
        if (data.code !== 0) {
          if (data.code === 1002 || data.code === 1003) {
            uni.removeStorageSync('member_token')
          }
          uni.showToast({ title: data.message, icon: 'none' })
          reject(new Error(data.message))
          return
        }
        resolve(data.data)
      },
      fail: (err) => {
        uni.showToast({ title: '网络错误', icon: 'none' })
        reject(err)
      },
    })
  })
}

export function formatYuan(fen: number): string {
  return `¥${(fen / 100).toFixed(2)}`
}

export function formatTime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function getMemberToken(): string {
  return uni.getStorageSync('member_token') || ''
}

export function setMemberToken(token: string) {
  uni.setStorageSync('member_token', token)
}

export function clearMemberToken() {
  uni.removeStorageSync('member_token')
}
