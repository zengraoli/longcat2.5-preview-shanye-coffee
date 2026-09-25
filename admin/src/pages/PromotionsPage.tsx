import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/App'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react'

interface Promotion {
  id: number
  name: string
  startTime: string
  endTime: string
  status: 'active' | 'inactive'
  products: number[]
}

interface Product {
  id: number
  name: string
  categoryName: string
}

const EMPTY_FORM = {
  name: '',
  startTime: '',
  endTime: '',
  productIds: [] as number[],
}

export function PromotionsPage() {
  const { token } = useAuth()
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Promotion | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadPromotions = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const data = await apiGet<Promotion[]>('/admin/promotions', token)
      setPromotions(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  const loadProducts = useCallback(async () => {
    if (!token) return
    try {
      const data = await apiGet<Product[]>('/admin/products', token)
      setProducts(data)
    } catch {}
  }, [token])

  useEffect(() => {
    loadPromotions()
    loadProducts()
  }, [loadPromotions, loadProducts])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  function openEdit(p: Promotion) {
    setEditing(p)
    setForm({
      name: p.name,
      startTime: p.startTime.slice(0, 16),
      endTime: p.endTime.slice(0, 16),
      productIds: p.products,
    })
    setShowModal(true)
  }

  function toggleProduct(id: number) {
    setForm((f) => ({
      ...f,
      productIds: f.productIds.includes(id)
        ? f.productIds.filter((x) => x !== id)
        : [...f.productIds, id],
    }))
  }

  async function handleSave() {
    if (!token) return
    if (!form.name || !form.startTime || !form.endTime || form.productIds.length === 0) {
      setError('请填写完整并选择商品')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        productIds: form.productIds,
      }
      if (editing) {
        await apiPut(`/admin/promotions/${editing.id}`, token, payload)
      } else {
        await apiPost('/admin/promotions', token, payload)
      }
      setShowModal(false)
      await loadPromotions()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(p: Promotion) {
    if (!token) return
    try {
      await apiPost(`/admin/promotions/${p.id}/toggle`, token)
      setPromotions(promotions.map((x) => x.id === p.id ? { ...x, status: x.status === 'active' ? 'inactive' : 'active' } : x))
    } catch (e: any) {
      setError(e.message)
    }
  }

  async function handleDelete(p: Promotion) {
    if (!token) return
    if (!confirm(`确定删除「${p.name}」？`)) return
    try {
      await apiDelete(`/admin/promotions/${p.id}`, token)
      setPromotions(promotions.filter((x) => x.id !== p.id))
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">活动管理</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">
          <Plus size={16} /> 新建活动
        </button>
      </div>

      {error && <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md">{error}</div>}

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left py-3 px-4 font-medium">名称</th>
              <th className="text-left py-3 px-4 font-medium">开始时间</th>
              <th className="text-left py-3 px-4 font-medium">结束时间</th>
              <th className="text-left py-3 px-4 font-medium">适用商品</th>
              <th className="text-left py-3 px-4 font-medium">状态</th>
              <th className="text-right py-3 px-4 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">加载中...</td></tr>
            ) : promotions.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">暂无活动</td></tr>
            ) : (
              promotions.map((p) => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-3 px-4 font-medium">{p.name}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{new Date(p.startTime).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{new Date(p.endTime).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</td>
                  <td className="py-3 px-4 text-xs">{p.products.length} 个商品</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {p.status === 'active' ? '进行中' : '已停用'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => toggleStatus(p)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground text-xs">
                        {p.status === 'active' ? '停用' : '启用'}
                      </button>
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(p)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">{editing ? '编辑活动' : '新建活动'}</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {error && <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md">{error}</div>}
              <div>
                <label className="text-sm font-medium block mb-1">活动名称 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">开始时间 *</label>
                  <input
                    type="datetime-local"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">结束时间 *</label>
                  <input
                    type="datetime-local"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">适用商品 *</label>
                <div className="border border-border rounded-md max-h-48 overflow-y-auto">
                  {products.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.productIds.includes(p.id)}
                        onChange={() => toggleProduct(p.id)}
                        className="rounded"
                      />
                      <span className="text-sm">{p.name}</span>
                      <span className="text-xs text-muted-foreground">({p.categoryName})</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted">
                取消
              </button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
