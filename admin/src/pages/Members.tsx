import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Member } from '../lib/types';

const ORDER_STATUS_TEXT: Record<string, string> = {
  pending_payment: '待支付',
  paid: '已支付',
  making: '制作中',
  ready: '待取餐',
  completed: '已完成',
  cancelled: '已取消',
};

const COUPON_STATUS_TEXT: Record<string, string> = {
  unused: '未使用',
  used: '已使用',
  expired: '已过期',
};
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { formatBeijing } from '../lib/utils';
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

interface MemberDetail extends Member {
  orders: { id: number; orderNo: string; status: string; payableAmount: number; createdAt: string }[];
  coupons: { id: number; name: string; type: string; status: string; expiresAt: string }[];
}

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<MemberDetail | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setMembers(await api.get<Member[]>('/api/admin/members'));
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = (m: Member) => {
    api.get<MemberDetail>(`/api/admin/members/${m.id}`).then(setDetail).catch(() => {});
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-brand-900">会员管理</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded-lg border border-brand-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>手机号</TableHead>
              <TableHead>昵称</TableHead>
              <TableHead className="text-right">积分</TableHead>
              <TableHead>等级</TableHead>
              <TableHead>注册时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{m.phone}</TableCell>
                <TableCell>{m.nickname ?? '-'}</TableCell>
                <TableCell className="text-right">{m.points}</TableCell>
                <TableCell>
                  <Badge
                    variant={m.level === '黑卡' ? 'default' : m.level === '金卡' ? 'warning' : 'secondary'}
                  >
                    {m.level}
                  </Badge>
                </TableCell>
                <TableCell>{formatBeijing(m.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => openDetail(m)}>
                    详情
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {members.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-brand-400">
                  {loading ? '加载中…' : '暂无会员'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>会员详情</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-brand-400">手机号：</span>
                  {detail.phone}
                </div>
                <div>
                  <span className="text-brand-400">昵称：</span>
                  {detail.nickname ?? '-'}
                </div>
                <div>
                  <span className="text-brand-400">积分：</span>
                  {detail.points}
                </div>
                <div>
                  <span className="text-brand-400">等级：</span>
                  {detail.level}
                </div>
              </div>

              <div>
                <div className="mb-1 text-sm font-medium text-brand-600">最近订单</div>
                {detail.orders.length === 0 ? (
                  <p className="text-sm text-brand-400">暂无订单</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>订单号</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead className="text-right">实付</TableHead>
                        <TableHead>时间</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.orders.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell>{o.orderNo}</TableCell>
                          <TableCell>{ORDER_STATUS_TEXT[o.status] ?? o.status}</TableCell>
                          <TableCell className="text-right">¥{(o.payableAmount / 100).toFixed(2)}</TableCell>
                          <TableCell>{formatBeijing(o.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <div>
                <div className="mb-1 text-sm font-medium text-brand-600">优惠券</div>
                {detail.coupons.length === 0 ? (
                  <p className="text-sm text-brand-400">暂无优惠券</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>名称</TableHead>
                        <TableHead>类型</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>到期</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.coupons.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>{c.name}</TableCell>
                          <TableCell>{c.type === 'full_reduction' ? '满减' : '折扣'}</TableCell>
                          <TableCell>{COUPON_STATUS_TEXT[c.status] ?? c.status}</TableCell>
                          <TableCell>{formatBeijing(c.expiresAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
