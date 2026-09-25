import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/App'
import { apiGet } from '@/lib/api'
import { Search, Eye, X, Ticket, ShoppingBag } from 'lucide-react'

interface Member {
  id: number
  phone: string
  points: number
  createdAt: string
  orderCount: number
}

interface MemberDetail {
  id: number
  phone: string
  points: number
  createdAt: string
  orders: Array<{
    id: number
    order_no: string
    pickup_code: string
    type: string
    status: string
    paid_amount: number
    created_at: string
    store_name: string
  }>
  coupons: Array<{
    id: number
    status: string
    claimed_at: string
    name: string
    type: string
    threshold: number
    discount: number
    valid_from: string
    valid_to: string
  }>
}

const STATUS_LABELS: Record<string, string> = {
  pending: '待支付', paid: '已支付', making: '制作中', ready: '待取餐', completed: '已完成', cancelled: '已取消',
}

export function MembersPage() {
  const { token } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<MemberDetail | null>(null)
  const [error, setError] = useState('')

  const loadMembers = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const data = await apiGet<Member[]>('/admin/members', token)
      setMembers(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { loadMembers() }, [loadMembers])

  const filtered = keyword
    ? members.filter((m) => m.phone.includes(keyword))
    : members

  async function viewDetail(member: Member) {
    if (!token) return
    try {
      const data = await apiGet<MemberDetail>(`/admin/members/${member.id}`, token)
      setSelected(data)
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">会员管理</h1>

      <div className="relative max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="搜索手机号..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {error && <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md">{error}</div>}

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left py-3 px-4 font-medium">手机号</th>
              <th className="text-left py-3 px-4 font-medium">积分</th>
              <th className="text-left py-3 px-4 font-medium">订单数</th>
              <th className="text-left py-3 px-4 font-medium">注册时间</th>
              <th className="text-right py-3 px-4 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">加载中...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">暂无会员</td></tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-3 px-4 font-mono">{m.phone}</td>
                  <td className="py-3 px-4">{m.points}</td>
                  <td className="py-3 px-4">{m.orderCount}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">
                    {new Date(m.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => viewDetail(m)}
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="查看详情"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">会员详情</h2>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><span className="text-muted-foreground">手机号：</span><span className="font-mono">{selected.phone}</span></div>
                <div><span className="text-muted-foreground">积分：</span>{selected.points}</div>
                <div><span className="text-muted-foreground">注册时间：</span>{new Date(selected.createdAt).toLocaleDateString('zh-CN')}</div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <ShoppingBag size={14} /> 最近订单
                </h3>
                <div className="border border-border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left py-2 px-3 font-medium">订单号</th>
                        <th className="text-left py-2 px-3 font-medium">门店</th>
                        <th className="text-left py-2 px-3 font-medium">金额</th>
                        <th className="text-left py-2 px-3 font-medium">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.orders.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-4 text-muted-foreground">暂无订单</td></tr>
                      ) : (
                        selected.orders.map((o) => (
                          <tr key={o.id} className="border-b border-border/50">
                            <td className="py-2 px-3 font-mono text-xs">{o.order_no}</td>
                            <td className="py-2 px-3 text-xs">{o.store_name}</td>
                            <td className="py-2 px-3 font-mono">¥{(o.paid_amount / 100).toFixed(2)}</td>
                            <td className="py-2 px-3 text-xs">{STATUS_LABELS[o.status]}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Ticket size={14} /> 优惠券
                </h3>
                <div className="border border-border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left py-2 px-3 font-medium">名称</th>
                        <th className="text-left py-2 px-3 font-medium">类型</th>
                        <th className="text-left py-2 px-3 font-medium">状态</th>
                        <th className="text-left py-2 px-3 font-medium">有效期</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.coupons.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-4 text-muted-foreground">暂无优惠券</td></tr>
                      ) : (
                        selected.coupons.map((c) => (
                          <tr key={c.id} className="border-b border-border/50">
                            <td className="py-2 px-3">{c.name}</td>
                            <td className="py-2 px-3 text-xs">{c.type === 'fixed' ? '满减' : '折扣'}</td>
                            <td className="py-2 px-3 text-xs">
                              <span className={`px-2 py-0.5 rounded-full text-xs ${c.status === 'unused' ? 'bg-green-100 text-green-800' : c.status === 'used' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'}`}>
                                {c.status === 'unused' ? '未使用' : c.status === 'used' ? '已使用' : '已过期'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-xs text-muted-foreground">
                              {c.valid_from.slice(0, 10)} ~ {c.valid_to.slice(0, 10)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
