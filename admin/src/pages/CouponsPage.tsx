import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/App'
import { apiGet, apiPost, apiPut, apiDelete, formatYuan } from '@/lib/api'
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react'

interface Coupon {
  id: number
  name: string
  type: 'fixed' | 'percent'
  threshold: number
  discount: number
  valid_from: string
  valid_to: string
  total_count: number
}

const EMPTY_FORM = {
  name: '',
  type: 'fixed' as 'fixed' | 'percent',
  threshold: 0,
  discount: 0,
  validFrom: '',
  validTo: '',
  totalCount: 100,
}

export function CouponsPage() {
  const { token } = useAuth()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadCoupons = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const data = await apiGet<Coupon[]>('/admin/coupons', token)
      setCoupons(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { loadCoupons() }, [loadCoupons])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  function openEdit(coupon: Coupon) {
    setEditing(coupon)
    setForm({
      name: coupon.name,
      type: coupon.type,
      threshold: coupon.threshold,
      discount: coupon.discount,
      validFrom: coupon.valid_from,
      validTo: coupon.valid_to,
      totalCount: coupon.total_count,
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!token) return
    if (!form.name) {
      setError('请填写名称')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name,
        type: form.type,
        threshold: form.threshold,
        discount: form.discount,
        validFrom: form.validFrom,
        validTo: form.validTo,
        totalCount: form.totalCount,
      }
      if (editing) {
        await apiPut(`/admin/coupons/${editing.id}`, token, payload)
      } else {
        await apiPost('/admin/coupons', token, payload)
      }
      setShowModal(false)
      await loadCoupons()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(coupon: Coupon) {
    if (!token) return
    if (!confirm(`确定删除「${coupon.name}」？`)) return
    try {
      await apiDelete(`/admin/coupons/${coupon.id}`, token)
      setCoupons(coupons.filter((c) => c.id !== coupon.id))
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">优惠券管理</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90"
        >
          <Plus size={16} /> 新建优惠券
        </button>
      </div>

      {error && <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md">{error}</div>}

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left py-3 px-4 font-medium">名称</th>
              <th className="text-left py-3 px-4 font-medium">类型</th>
              <th className="text-left py-3 px-4 font-medium">门槛</th>
              <th className="text-left py-3 px-4 font-medium">优惠</th>
              <th className="text-left py-3 px-4 font-medium">有效期</th>
              <th className="text-right py-3 px-4 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">加载中...</td></tr>
            ) : coupons.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">暂无优惠券</td></tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-3 px-4 font-medium">{c.name}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {c.type === 'fixed' ? '满减' : '折扣'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">{formatYuan(c.threshold)}</td>
                  <td className="py-3 px-4 font-mono">
                    {c.type === 'fixed' ? formatYuan(c.discount) : `${c.discount}%`}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">
                    {c.valid_from.slice(0, 10)} ~ {c.valid_to.slice(0, 10)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive"
                      >
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
          <div className="bg-card rounded-lg border border-border w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">{editing ? '编辑优惠券' : '新建优惠券'}</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {error && <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md">{error}</div>}
              <div>
                <label className="text-sm font-medium block mb-1">名称 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">类型 *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as 'fixed' | 'percent' })}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
                >
                  <option value="fixed">满减</option>
                  <option value="percent">折扣</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">门槛（分）*</label>
                  <input
                    type="number"
                    value={form.threshold}
                    onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">
                    {form.type === 'fixed' ? '减免（分）' : '折扣（%）'} *
                  </label>
                  <input
                    type="number"
                    value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">生效日期 *</label>
                  <input
                    type="date"
                    value={form.validFrom}
                    onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">失效日期 *</label>
                  <input
                    type="date"
                    value={form.validTo}
                    onChange={(e) => setForm({ ...form, validTo: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">发放总量</label>
                <input
                  type="number"
                  value={form.totalCount}
                  onChange={(e) => setForm({ ...form, totalCount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-border">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
