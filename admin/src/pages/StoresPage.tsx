import { useEffect, useState } from 'react'
import { useAuth } from '@/App'
import { apiGet, apiPut, formatYuan } from '@/lib/api'
import { MapPin, Clock, Edit2, Check, X } from 'lucide-react'

interface Store {
  id: number
  name: string
  address: string
  phone: string
  openTime: string
  closeTime: string
  status: 'open' | 'closed'
}

export function StoresPage() {
  const { token } = useAuth()
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<Store>>({})
  const [error, setError] = useState('')

  const loadStores = async () => {
    if (!token) return
    setLoading(true)
    try {
      const data = await apiGet<Store[]>('/admin/stores', token)
      setStores(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadStores() }, [token])

  function startEdit(store: Store) {
    setEditingId(store.id)
    setEditForm({
      name: store.name,
      address: store.address,
      openTime: store.openTime,
      closeTime: store.closeTime,
      status: store.status,
    })
  }

  async function saveEdit(id: number) {
    if (!token) return
    try {
      await apiPut(`/admin/stores/${id}`, token, editForm)
      setEditingId(null)
      await loadStores()
    } catch (e: any) {
      setError(e.message)
    }
  }

  async function toggleStatus(store: Store) {
    if (!token) return
    try {
      await apiPut(`/admin/stores/${store.id}`, token, { status: store.status === 'open' ? 'closed' : 'open' })
      setStores(stores.map((s) => s.id === store.id ? { ...s, status: s.status === 'open' ? 'closed' : 'open' } : s))
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">门店管理</h1>
      {error && <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md">{error}</div>}
      {loading ? (
        <div className="text-muted-foreground p-4">加载中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((store) => (
            <div key={store.id} className="bg-card rounded-lg border border-border p-4">
              {editingId === store.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">名称</label>
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-1.5 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">地址</label>
                    <input
                      type="text"
                      value={editForm.address || ''}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full px-3 py-1.5 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">开门时间</label>
                      <input
                        type="time"
                        value={editForm.openTime || ''}
                        onChange={(e) => setEditForm({ ...editForm, openTime: e.target.value })}
                        className="w-full px-3 py-1.5 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">关门时间</label>
                      <input
                        type="time"
                        value={editForm.closeTime || ''}
                        onChange={(e) => setEditForm({ ...editForm, closeTime: e.target.value })}
                        className="w-full px-3 py-1.5 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(store.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
                    >
                      <Check size={14} /> 保存
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-md text-sm hover:bg-muted"
                    >
                      <X size={14} /> 取消
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold">{store.name}</h3>
                    <button
                      onClick={() => toggleStatus(store)}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${store.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {store.status === 'open' ? '营业中' : '休息中'}
                    </button>
                  </div>
                  <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} /> {store.address}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} /> {store.openTime} - {store.closeTime}
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => startEdit(store)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                    >
                      <Edit2 size={14} /> 编辑
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
