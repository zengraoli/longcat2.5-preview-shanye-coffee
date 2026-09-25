import { useEffect, useState } from 'react'
import { useAuth } from '@/App'
import { apiGet, apiPost, apiPut, apiDelete, formatYuan } from '@/lib/api'
import { Plus, Search, Edit2, Trash2, ArrowUpDown } from 'lucide-react'

interface Product {
  id: number
  categoryId: number
  categoryName: string
  name: string
  description: string
  basePrice: number
  price: number
  status: 'on' | 'off'
  soldOut: boolean
  sortOrder: number
}

interface Category {
  id: number
  name: string
  sort_order: number
}

const DEFAULT_SPECS = [
  { cupSize: 'medium', temperature: 'hot', sugar: 'standard', priceDelta: 0 },
  { cupSize: 'medium', temperature: 'hot', sugar: 'less', priceDelta: 0 },
  { cupSize: 'medium', temperature: 'hot', sugar: 'none', priceDelta: 0 },
  { cupSize: 'medium', temperature: 'iced', sugar: 'standard', priceDelta: 0 },
  { cupSize: 'medium', temperature: 'iced', sugar: 'less', priceDelta: 0 },
  { cupSize: 'medium', temperature: 'iced', sugar: 'none', priceDelta: 0 },
  { cupSize: 'large', temperature: 'hot', sugar: 'standard', priceDelta: 300 },
  { cupSize: 'large', temperature: 'hot', sugar: 'less', priceDelta: 300 },
  { cupSize: 'large', temperature: 'hot', sugar: 'none', priceDelta: 300 },
  { cupSize: 'large', temperature: 'iced', sugar: 'standard', priceDelta: 300 },
  { cupSize: 'large', temperature: 'iced', sugar: 'less', priceDelta: 300 },
  { cupSize: 'large', temperature: 'iced', sugar: 'none', priceDelta: 300 },
]

export function ProductsPage() {
  const { token } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [keyword, setKeyword] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [error, setError] = useState('')

  async function loadProducts() {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (keyword) params.set('keyword', keyword)
      if (categoryFilter) params.set('categoryId', categoryFilter)
      const data = await apiGet<Product[]>(`/admin/products?${params}`, token)
      setProducts(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadCategories() {
    if (!token) return
    try {
      const data = await apiGet<Category[]>('/categories', token)
      setCategories(data)
    } catch (e: any) {
      setError(e.message)
    }
  }

  useEffect(() => { loadCategories() }, [token])
  useEffect(() => { loadProducts() }, [token, keyword, categoryFilter])

  async function toggleStatus(p: Product) {
    if (!token) return
    try {
      await apiPost(`/admin/products/${p.id}/status`, token, { status: p.status === 'on' ? 'off' : 'on' })
      setProducts(products.map((x) => x.id === p.id ? { ...x, status: x.status === 'on' ? 'off' : 'on' } : x))
    } catch (e: any) {
      setError(e.message)
    }
  }

  async function toggleSoldOut(p: Product) {
    if (!token) return
    try {
      await apiPost(`/admin/products/${p.id}/sold-out`, token, { soldOut: !p.soldOut })
      setProducts(products.map((x) => x.id === p.id ? { ...x, soldOut: !x.soldOut } : x))
    } catch (e: any) {
      setError(e.message)
    }
  }

  async function deleteProduct(p: Product) {
    if (!token) return
    if (!confirm(`确定删除「${p.name}」？`)) return
    try {
      await apiDelete(`/admin/products/${p.id}`, token)
      setProducts(products.filter((x) => x.id !== p.id))
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">商品管理</h1>
        <button
          onClick={() => { setEditing(null); setShowModal(true) }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90"
        >
          <Plus size={16} /> 新增商品
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索商品名称..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">全部分类</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {error && <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md">{error}</div>}

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left py-3 px-4 font-medium">商品</th>
              <th className="text-left py-3 px-4 font-medium">分类</th>
              <th className="text-left py-3 px-4 font-medium">价格</th>
              <th className="text-left py-3 px-4 font-medium">状态</th>
              <th className="text-left py-3 px-4 font-medium">售罄</th>
              <th className="text-right py-3 px-4 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">加载中...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">暂无商品</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-3 px-4">
                    <div className="font-medium">{p.name}</div>
                    {p.description && <div className="text-xs text-muted-foreground mt-0.5">{p.description}</div>}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{p.categoryName}</td>
                  <td className="py-3 px-4 font-mono">{formatYuan(p.price)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'on' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {p.status === 'on' ? '上架' : '下架'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.soldOut ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {p.soldOut ? '已售罄' : '有货'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleStatus(p)}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                        title={p.status === 'on' ? '下架' : '上架'}
                      >
                        <ArrowUpDown size={14} />
                      </button>
                      <button
                        onClick={() => toggleSoldOut(p)}
                        className={`p-1.5 rounded-md hover:bg-muted text-xs font-medium ${p.soldOut ? 'text-red-600' : 'text-muted-foreground'}`}
                      >
                        {p.soldOut ? '取消售罄' : '售罄'}
                      </button>
                      <button
                        onClick={() => { setEditing(p); setShowModal(true) }}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="编辑"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => deleteProduct(p)}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive"
                        title="删除"
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
        <ProductModal
          product={editing}
          categories={categories}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); loadProducts() }}
        />
      )}
    </div>
  )
}

function ProductModal({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: Product | null
  categories: Category[]
  onClose: () => void
  onSaved: () => void
}) {
  const { token } = useAuth()
  const [name, setName] = useState(product?.name || '')
  const [description, setDescription] = useState(product?.description || '')
  const [categoryId, setCategoryId] = useState(product?.categoryId || categories[0]?.id || 0)
  const [basePrice, setBasePrice] = useState(product?.basePrice || 0)
  const [specs, setSpecs] = useState(
    product
      ? DEFAULT_SPECS.map((s) => ({ ...s }))
      : DEFAULT_SPECS.map((s) => ({ ...s })),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!token) return
    if (!name || !categoryId || !basePrice) {
      setError('请填写必填项')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = { categoryId, name, description, basePrice, specs }
      if (product) {
        await apiPut(`/admin/products/${product.id}`, token, payload)
      } else {
        await apiPost('/admin/products', token, payload)
      }
      onSaved()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">{product ? '编辑商品' : '新增商品'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">&times;</button>
        </div>
        <div className="p-4 space-y-4">
          {error && <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1">商品名称 *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">分类 *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">基础价格（分）*</label>
            <input
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(Number(e.target.value))}
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">中杯热饮标准糖的加价</p>
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">规格加价</label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-md p-3">
              {specs.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="w-20 text-muted-foreground">
                    {s.cupSize === 'medium' ? '中杯' : '大杯'}
                  </span>
                  <span className="w-12 text-muted-foreground">
                    {s.temperature === 'hot' ? '热' : '冰'}
                  </span>
                  <span className="w-12 text-muted-foreground">
                    {s.sugar === 'standard' ? '标准' : s.sugar === 'less' ? '少糖' : '无糖'}
                  </span>
                  <input
                    type="number"
                    value={s.priceDelta}
                    onChange={(e) => {
                      const newSpecs = [...specs]
                      newSpecs[i].priceDelta = Number(e.target.value)
                      setSpecs(newSpecs)
                    }}
                    className="w-24 px-2 py-1 border border-input rounded text-sm"
                  />
                  <span className="text-xs text-muted-foreground">分</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted">
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
  )
}
