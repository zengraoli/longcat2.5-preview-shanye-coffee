import { useEffect, useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts'
import { useAuth } from '@/App'
import { apiGet, formatYuan } from '@/lib/api'
import {
  Banknote,
  ShoppingBag,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  Truck,
  ChefHat,
} from 'lucide-react'

interface DashboardData {
  today: {
    revenue: number
    orderCount: number
    avgOrderValue: number
    newMembers: number
  }
  trend: Array<{ day: string; revenue: number; orderCount: number }>
  topProducts: Array<{ name: string; totalQty: number; totalRevenue: number }>
  recentOrders: Array<{
    id: number
    order_no: string
    pickup_code: string
    type: string
    status: string
    paid_amount: number
    created_at: string
    store_name: string
  }>
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

const CHART_COLORS = ['#b45309', '#d97706', '#f59e0b', '#fbbf24', '#fcd34d', '#fde68a']

export function DashboardPage() {
  const { token } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    apiGet<DashboardData>('/admin/dashboard', token)
      .then(setData)
      .catch((e) => setError(e.message))
  }, [token])

  if (error) {
    return <div className="text-destructive p-4">加载失败: {error}</div>
  }

  if (!data) {
    return <div className="text-muted-foreground p-4">加载中...</div>
  }

  const cards = [
    { label: '今日营业额', value: formatYuan(data.today.revenue), icon: <Banknote size={20} />, color: 'text-emerald-600 bg-emerald-50' },
    { label: '今日订单量', value: `${data.today.orderCount} 单`, icon: <ShoppingBag size={20} />, color: 'text-blue-600 bg-blue-50' },
    { label: '客单价', value: formatYuan(data.today.avgOrderValue), icon: <TrendingUp size={20} />, color: 'text-amber-600 bg-amber-50' },
    { label: '新增会员', value: `${data.today.newMembers} 人`, icon: <Users size={20} />, color: 'text-purple-600 bg-purple-50' },
  ]

  const trendData = data.trend.map((t) => ({
    ...t,
    day: t.day.slice(5),
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">数据看板</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                {card.icon}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-xl font-semibold">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-lg border border-border p-4">
          <h2 className="text-sm font-medium mb-4">近 7 天营业额趋势</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#78716c" />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="#78716c"
                  tickFormatter={(value) => formatYuan(Number(value))}
                />
                <Tooltip
                  formatter={(value) => [formatYuan(Number(value)), '营业额']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e7e5e4' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#b45309"
                  fill="#fef3c7"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <h2 className="text-sm font-medium mb-4">热销 Top10</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topProducts} layout="vertical">
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={80}
                  tick={{ fontSize: 11 }}
                  stroke="#78716c"
                />
                <Tooltip
                  formatter={(value) => [`${value} 杯`, '销量']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e7e5e4' }}
                />
                <Bar dataKey="totalQty" radius={[0, 4, 4, 0]}>
                  {data.topProducts.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium mb-4">最新订单</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-medium">订单号</th>
                <th className="text-left py-2 px-3 font-medium">取餐码</th>
                <th className="text-left py-2 px-3 font-medium">门店</th>
                <th className="text-left py-2 px-3 font-medium">类型</th>
                <th className="text-left py-2 px-3 font-medium">金额</th>
                <th className="text-left py-2 px-3 font-medium">状态</th>
                <th className="text-left py-2 px-3 font-medium">时间</th>
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-border/50">
                  <td className="py-2 px-3 font-mono text-xs">{order.order_no}</td>
                  <td className="py-2 px-3">
                    <span className="font-mono font-bold text-primary">{order.pickup_code}</span>
                  </td>
                  <td className="py-2 px-3">{order.store_name}</td>
                  <td className="py-2 px-3">
                    {order.type === 'pickup' ? (
                      <span className="flex items-center gap-1"><Truck size={14} /> 自提</span>
                    ) : (
                      <span className="flex items-center gap-1"><ChefHat size={14} /> 堂食</span>
                    )}
                  </td>
                  <td className="py-2 px-3">{formatYuan(order.paid_amount)}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-muted-foreground text-xs">
                    {new Date(order.created_at).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
