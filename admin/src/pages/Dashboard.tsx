import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../lib/api';
import { formatYuan, formatBeijing } from '../lib/utils';
import type { DashboardStats, OrderStatus } from '../lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

const statusLabel: Record<OrderStatus, { text: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'muted' }> = {
  pending_payment: { text: '待支付', variant: 'warning' },
  paid: { text: '已支付', variant: 'secondary' },
  making: { text: '制作中', variant: 'default' },
  ready: { text: '待取餐', variant: 'success' },
  completed: { text: '已完成', variant: 'muted' },
  cancelled: { text: '已取消', variant: 'danger' },
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<DashboardStats>('/api/admin/stats/dashboard')
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : '加载失败'));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!stats) return <p className="text-sm text-brand-400">加载中…</p>;

  const cards = [
    { label: '今日营业额', value: formatYuan(stats.todayRevenue) },
    { label: '订单量', value: String(stats.todayOrders) },
    { label: '客单价', value: formatYuan(stats.avgOrderAmount) },
    { label: '新增会员', value: String(stats.newMembers) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-900">数据看板</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-brand-500">{c.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-brand-900">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>近 7 天营业额趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.trend7d}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0ede2" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(d: string) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => formatYuan(Number(value))}
                    labelFormatter={(d) => String(d)}
                  />
                  <Bar dataKey="revenue" name="营业额" fill="#356a47" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>热销 Top10</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length === 0 ? (
              <p className="text-sm text-brand-400">暂无销售数据</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>商品</TableHead>
                    <TableHead className="text-right">销量</TableHead>
                    <TableHead className="text-right">营业额</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topProducts.map((p) => (
                    <TableRow key={p.name}>
                      <TableCell>{p.name}</TableCell>
                      <TableCell className="text-right">{p.quantity}</TableCell>
                      <TableCell className="text-right">{formatYuan(p.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>最新订单</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentOrders.length === 0 ? (
            <p className="text-sm text-brand-400">暂无订单</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>订单号</TableHead>
                  <TableHead>门店</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">实付</TableHead>
                  <TableHead>下单时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentOrders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>{o.orderNo}</TableCell>
                    <TableCell>{o.storeId}</TableCell>
                    <TableCell>{o.type === 'pickup' ? '自提' : '堂食'}</TableCell>
                    <TableCell>
                      <Badge variant={statusLabel[o.status as OrderStatus]?.variant ?? 'muted'}>
                        {statusLabel[o.status as OrderStatus]?.text ?? o.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatYuan(o.payableAmount)}</TableCell>
                    <TableCell>{formatBeijing(o.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
