import { useCallback, useEffect, useState } from 'react';
import { useWatch } from '../lib/useWatch';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { formatYuan, formatBeijing } from '../lib/utils';
import type { Order, OrderStatus, Store } from '../lib/types';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectDisplay,
  SelectContent,
  SelectItem,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

const statusMeta: Record<OrderStatus, { text: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'muted' }> = {
  pending_payment: { text: '待支付', variant: 'warning' },
  paid: { text: '已支付', variant: 'secondary' },
  making: { text: '制作中', variant: 'default' },
  ready: { text: '待取餐', variant: 'success' },
  completed: { text: '已完成', variant: 'muted' },
  cancelled: { text: '已取消', variant: 'danger' },
};

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  paid: 'making',
  making: 'ready',
  ready: 'completed',
};

export default function Orders() {
  const { user } = useAuth();
  const isStaff = user?.role === 'staff';

  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [stores, setStores] = useState<Store[]>([]);
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [detail, setDetail] = useState<Order | null>(null);
  const [advancing, setAdvancing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (storeFilter !== 'all') params.set('store_id', storeFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      // 日期筛选：发送北京时间 YYYY-MM-DD（server 按此格式解析）
      if (start) params.set('start', start);
      if (end) params.set('end', end);
      params.set('page', String(page));
      params.set('page_size', '20');
      const qs = params.toString();
      const data = await api.get<{ total: number; list: Order[] }>(
        `/api/admin/orders${qs ? `?${qs}` : ''}`,
      );
      setOrders(data.list);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [storeFilter, statusFilter, start, end, page]);

  // 切换筛选条件时页码回到第 1 页
  useWatch([storeFilter, statusFilter, start, end], () => {
    setPage(1);
  });

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api.get<Store[]>('/api/stores').then(setStores).catch(() => {});
  }, []);

  const openDetail = (o: Order) => {
    api.get<Order>(`/api/admin/orders/${o.id}`).then(setDetail).catch(() => {});
  };

  const advance = async () => {
    if (!detail) return;
    const target = nextStatus[detail.status];
    if (!target) return;
    setAdvancing(true);
    setError('');
    try {
      const updated = await api.post<Order>(`/api/admin/orders/${detail.id}/advance`, { target });
      setDetail(updated);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失败');
    } finally {
      setAdvancing(false);
    }
  };

  const next = detail ? nextStatus[detail.status] : undefined;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-brand-900">订单管理</h1>

      <div className="flex flex-wrap gap-2">
        {!isStaff && (
          <Select value={storeFilter} onValueChange={(v) => setStoreFilter(v ?? 'all')}>
            <SelectTrigger className="w-40">
              <SelectDisplay
                value={storeFilter}
                placeholder="全部门店"
                options={[
                  { value: 'all', label: '全部门店' },
                  ...stores.map((s) => ({ value: String(s.id), label: s.name })),
                ]}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部门店</SelectItem>
              {stores.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
          <SelectTrigger className="w-32">
            <SelectDisplay
              value={statusFilter}
              placeholder="全部状态"
              options={[
                { value: 'all', label: '全部状态' },
                ...Object.entries(statusMeta).map(([k, v]) => ({ value: k, label: v.text })),
              ]}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            {Object.entries(statusMeta).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v.text}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-40" />
        <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-40" />
        <Button variant="outline" onClick={load}>
          查询
        </Button>
      </div>

      {isStaff && (
        <p className="text-sm text-brand-400">店员仅可查看与操作本门店订单。</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded-lg border border-brand-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>订单号</TableHead>
              <TableHead>门店</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>取餐码</TableHead>
              <TableHead>会员</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">实付</TableHead>
              <TableHead>下单时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell>{o.orderNo}</TableCell>
                <TableCell>{stores.find((s) => s.id === o.storeId)?.name ?? o.storeId}</TableCell>
                <TableCell>{o.type === 'pickup' ? '自提' : '堂食'}</TableCell>
                <TableCell>{o.pickupCode ?? '-'}</TableCell>
                <TableCell>{o.memberPhone ?? '-'}</TableCell>
                <TableCell>
                  <Badge variant={statusMeta[o.status]?.variant ?? 'muted'}>
                    {statusMeta[o.status]?.text ?? o.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{formatYuan(o.payableAmount)}</TableCell>
                <TableCell>{formatBeijing(o.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => openDetail(o)}>
                    详情
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-brand-400">
                  {loading ? '加载中…' : '暂无订单'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-brand-500">
        <span>共 {total} 条</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            上一页
          </Button>
          <span>{page} / {Math.max(1, Math.ceil(total / 20))}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= Math.ceil(total / 20)}
            onClick={() => setPage(page + 1)}
          >
            下一页
          </Button>
        </div>
      </div>

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>订单详情</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-brand-400">订单号：</span>
                  {detail.orderNo}
                </div>
                <div>
                  <span className="text-brand-400">状态：</span>
                  <Badge variant={statusMeta[detail.status]?.variant ?? 'muted'}>
                    {statusMeta[detail.status]?.text ?? detail.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-brand-400">类型：</span>
                  {detail.type === 'pickup' ? '自提' : '堂食'}
                </div>
                <div>
                  <span className="text-brand-400">取餐码：</span>
                  {detail.pickupCode ?? '-'}
                </div>
                <div>
                  <span className="text-brand-400">原价：</span>
                  {formatYuan(detail.originalAmount)}
                </div>
                {detail.promoDiscountAmount > 0 && (
                  <div>
                    <span className="text-brand-400">活动优惠：</span>
                    <span className="text-caramel-600">
                      -{formatYuan(detail.promoDiscountAmount)}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-brand-400">优惠券优惠：</span>
                  <span className="text-caramel-600">
                    -{formatYuan(detail.discountAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-brand-400">实付：</span>
                  <span className="font-semibold text-brand-700">
                    {formatYuan(detail.payableAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-brand-400">下单时间：</span>
                  {formatBeijing(detail.createdAt)}
                </div>
              </div>

              <div>
                <div className="mb-1 text-sm font-medium text-brand-600">商品明细</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>商品</TableHead>
                      <TableHead>规格</TableHead>
                      <TableHead className="text-right">单价</TableHead>
                      <TableHead className="text-right">数量</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.items.map((it) => (
                      <TableRow key={it.id}>
                        <TableCell>{it.productName}</TableCell>
                        <TableCell>
                          {it.cup
                            ? `${it.cup === 'large' ? '大杯' : '中杯'}/${
                                it.temperature === 'ice' ? '冰' : '热'
                              }/${
                                it.sugar === 'none'
                                  ? '无糖'
                                  : it.sugar === 'less'
                                    ? '少糖'
                                    : '标准糖'
                              }`
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">{formatYuan(it.price)}</TableCell>
                        <TableCell className="text-right">{it.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {next && (
                <div className="flex justify-end">
                  <Button onClick={advance} disabled={advancing}>
                    {advancing ? '处理中…' : `推进到「${statusMeta[next].text}」`}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
