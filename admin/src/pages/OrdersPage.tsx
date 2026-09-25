import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/App'
import { apiGet, apiPost, formatYuan } from '@/lib/api'
import { Search, Eye, ChevronRight, X } from 'lucide-react'

interface Order {
  id: number
  order_no: string
  pickup_code: string
  type: string
  status: string
  original_amount: number
  discount_amount: number
  paid_amount: number
  points_earned: number
  promo_discount: number
  created_at: string
  paid_at: string | null
  cancelled_at: string | null
  store_id: number
  store_name: string
}

interface OrderItem {
  id: number
  product_name: string
  cup_size: string
  temperature: string
  sugar: string
  quantity: number
  unit_price: number
}

interface Store {
  id: number
  name: string
  address: string
  openTime: string
  closeTime: string
  status: string
}

const STATUS_LABELS: Record<string, string> = {
  pending: '待支付',
  paid: '已支付',
  making: '制作中',
  ready: '待取餐',
  completed: '已完成',
  cancelled: '已取消',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  making: 'bg-orange-100 text-orange-800',
  ready: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
}

const NEXT_STATUS: Record<string, string | null> = {
  paid: 'making',
  making: 'ready',
  ready: 'completed',
  pending: null,
  completed: null,
  cancelled: null,
}

export function OrdersPage() {
  const { token, user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [keyword, setKeyword] = useState('')
  const [storeFilter, setStoreFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Order | null>(null)
  const [detail, setDetail] = useState<Order & { items: OrderItem[] } | null>(null)
  const [error, setError] = useState('')

  const loadStores = useCallback(async () => {
    if (!token) return
    try {
      const data = await apiGet<Store[]>('/stores', token)
      setStores(data)
    } catch (e: any) {
      setError(e.message)
    }
  }, [token])

  const loadOrders = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (storeFilter) params.set('storeId', storeFilter)
      if (statusFilter) params.set('status', statusFilter)
      const data = await apiGet<Order[]>(`/admin/orders?${params}`, token)
      setOrders(keyword
        ? data.filter((o) => o.order_no.includes(keyword) || o.pickup_code.includes(keyword))
        : data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [token, keyword, storeFilter, statusFilter])

  useEffect(() => { loadStores() }, [loadStores])
  useEffect(() => { loadOrders() }, [loadOrders])

  async function viewDetail(order: Order) {
    if (!token) return
    try {
      const data = await apiGet<Order & { items: OrderItem[] }>(`/admin/orders/${order.id}`, token)
      setDetail(data)
    } catch (e: any) {
      setError(e.message)
    }
  }

  async function advanceStatus(order: Order) {
    if (!token) return
    const next = NEXT_STATUS[order.status]
    if (!next) return
    try {
      await apiPost(`/admin/orders/${order.id}/status`, token, { status: next })
      setOrders(orders.map((o) => o.id === order.id ? { ...o, status: next! } : o))
      if (detail && detail.id === order.id) {
        setDetail({ ...detail, status: next })
      }
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">订单管理</h1>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索订单号或取餐码..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={storeFilter}
          onChange={(e) => setStoreFilter(e.target.value)}
          className="px-3 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">全部门店</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">全部状态</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {error && <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md">{error}</div>}

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left py-3 px-4 font-medium">订单号</th>
              <th className="text-left py-3 px-4 font-medium">取餐码</th>
              <th className="text-left py-3 px-4 font-medium">门店</th>
              <th className="text-left py-3 px-4 font-medium">类型</th>
              <th className="text-left py-3 px-4 font-medium">金额</th>
              <th className="text-left py-3 px-4 font-medium">状态</th>
              <th className="text-left py-3 px-4 font-medium">时间</th>
              <th className="text-right py-3 px-4 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">加载中...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">暂无订单</td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-3 px-4 font-mono text-xs">{o.order_no}</td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-primary">{o.pickup_code}</span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{o.store_name}</td>
                  <td className="py-3 px-4">{o.type === 'pickup' ? '自提' : '堂食'}</td>
                  <td className="py-3 px-4 font-mono">{formatYuan(o.paid_amount)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[o.status]}`}>
                      {STATUS_LABELS[o.status]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">
                    {new Date(o.created_at).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => viewDetail(o)}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="查看详情"
                      >
                        <Eye size={14} />
                      </button>
                      {NEXT_STATUS[o.status] && (
                        <button
                          onClick={() => advanceStatus(o)}
                          className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20"
                        >
                          推进 <ChevronRight size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">订单详情</h2>
              <button onClick={() => setDetail(null)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">订单号：</span><span className="font-mono">{detail.order_no}</span></div>
                <div><span className="text-muted-foreground">取餐码：</span><span className="font-mono font-bold text-primary">{detail.pickup_code}</span></div>
                <div><span className="text-muted-foreground">门店：</span>{detail.store_name}</div>
                <div><span className="text-muted-foreground">类型：</span>{detail.type === 'pickup' ? '自提' : '堂食'}</div>
                <div><span className="text-muted-foreground">状态：</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[detail.status]}`}>
                    {STATUS_LABELS[detail.status]}
                  </span>
                </div>
                <div><span className="text-muted-foreground">下单时间：</span>{new Date(detail.created_at).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">商品明细</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 font-medium">商品</th>
                      <th className="text-left py-2 font-medium">规格</th>
                      <th className="text-right py-2 font-medium">数量</th>
                      <th className="text-right py-2 font-medium">单价</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.items.map((item) => (
                      <tr key={item.id} className="border-b border-border/50">
                        <td className="py-2">{item.product_name}</td>
                        <td className="py-2 text-muted-foreground text-xs">
                          {item.cup_size === 'medium' ? '中杯' : '大杯'} · {item.temperature === 'hot' ? '热' : '冰'} · {item.sugar === 'standard' ? '标准' : item.sugar === 'less' ? '少糖' : '无糖'}
                        </td>
                        <td className="py-2 text-right">{item.quantity}</td>
                        <td className="py-2 text-right font-mono">{formatYuan(item.unit_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-border pt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">原价</span>
                  <span className="font-mono">{formatYuan(detail.original_amount)}</span>
                </div>
                {detail.promo_discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">活动优惠</span>
                    <span className="font-mono text-destructive">-{formatYuan(detail.promo_discount)}</span>
                  </div>
                )}
                {detail.discount_amount - detail.promo_discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">优惠券</span>
                    <span className="font-mono text-destructive">-{formatYuan(detail.discount_amount - detail.promo_discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <span>实付</span>
                  <span className="font-mono">{formatYuan(detail.paid_amount)}</span>
                </div>
                {detail.points_earned > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>积分</span>
                    <span>+{detail.points_earned}</span>
                  </div>
                )}
              </div>

              {NEXT_STATUS[detail.status] && (
                <button
                  onClick={() => advanceStatus(detail)}
                  className="w-full bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium hover:bg-primary/90"
                >
                  推进到「{STATUS_LABELS[NEXT_STATUS[detail.status]!]}」
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
