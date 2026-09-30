import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../lib/api';
import { formatYuan } from '../lib/utils';
import type { CouponTemplate } from '../lib/types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
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
  DialogFooter,
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

interface FormState {
  name: string;
  type: 'full_reduction' | 'discount';
  threshold: string;
  discountAmount: string;
  discountRate: string;
  validDays: string;
  totalStock: string;
}

const emptyForm: FormState = {
  name: '',
  type: 'full_reduction',
  threshold: '',
  discountAmount: '',
  discountRate: '',
  validDays: '30',
  totalStock: '1000',
};

export default function Coupons() {
  const [templates, setTemplates] = useState<CouponTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CouponTemplate | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTemplates(await api.get<CouponTemplate[]>('/api/admin/coupon-templates'));
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (t: CouponTemplate) => {
    setEditing(t);
    setForm({
      name: t.name,
      type: t.type,
      threshold: t.type === 'full_reduction' ? String(t.threshold / 100) : '',
      discountAmount: t.discountAmount != null ? String(t.discountAmount / 100) : '',
      discountRate: t.discountRate != null ? String(t.discountRate) : '',
      validDays: String(t.validDays),
      totalStock: String(t.totalStock),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) {
      setError('请填写名称');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        type: form.type,
        valid_days: Number(form.validDays) || 30,
        total_stock: Number(form.totalStock) || 0,
      };
      if (form.type === 'full_reduction') {
        payload.threshold = Math.round(Number(form.threshold) * 100);
        payload.discount_amount = Math.round(Number(form.discountAmount) * 100);
      } else {
        payload.discount_rate = Number(form.discountRate);
      }
      if (editing) {
        await api.patch(`/api/admin/coupon-templates/${editing.id}`, payload);
      } else {
        await api.post('/api/admin/coupon-templates', payload);
      }
      setDialogOpen(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (t: CouponTemplate) => {
    setError('');
    try {
      await api.patch(`/api/admin/coupon-templates/${t.id}`, { enabled: !t.enabled });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失败');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-900">优惠券管理</h1>
        <Button onClick={openCreate}>
          <Plus /> 新建优惠券
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded-lg border border-brand-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>门槛</TableHead>
              <TableHead>优惠</TableHead>
              <TableHead>有效期</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.name}</TableCell>
                <TableCell>{t.type === 'full_reduction' ? '满减' : '折扣'}</TableCell>
                <TableCell>
                  {t.type === 'full_reduction' ? formatYuan(t.threshold) : '-'}
                </TableCell>
                <TableCell>
                  {t.type === 'full_reduction'
                    ? `减 ${formatYuan(t.discountAmount ?? 0)}`
                    : `${(t.discountRate ?? 100) / 10} 折`}
                </TableCell>
                <TableCell>{t.validDays} 天</TableCell>
                <TableCell>
                  <Badge variant={t.enabled ? 'success' : 'muted'}>
                    {t.enabled ? '启用' : '停用'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                      编辑
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggleEnabled(t)}>
                      {t.enabled ? '停用' : '启用'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {templates.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-brand-400">
                  {loading ? '加载中…' : '暂无优惠券'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? '编辑优惠券' : '新建优惠券'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="mb-1 block text-sm text-brand-600">名称</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-brand-600">类型</label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as 'full_reduction' | 'discount' })}
              >
                <SelectTrigger>
                  <SelectDisplay
                    value={form.type}
                    options={[
                      { value: 'full_reduction', label: '满减券' },
                      { value: 'discount', label: '折扣券' },
                    ]}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_reduction">满减券</SelectItem>
                  <SelectItem value="discount">折扣券</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.type === 'full_reduction' ? (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-sm text-brand-600">门槛（元）</label>
                  <Input
                    type="number"
                    value={form.threshold}
                    onChange={(e) => setForm({ ...form, threshold: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-brand-600">减（元）</label>
                  <Input
                    type="number"
                    value={form.discountAmount}
                    onChange={(e) => setForm({ ...form, discountAmount: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-sm text-brand-600">折扣率（如 80 表示 8 折）</label>
                <Input
                  type="number"
                  value={form.discountRate}
                  onChange={(e) => setForm({ ...form, discountRate: e.target.value })}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-sm text-brand-600">有效期（天）</label>
                <Input
                  type="number"
                  value={form.validDays}
                  onChange={(e) => setForm({ ...form, validDays: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-brand-600">库存</label>
                <Input
                  type="number"
                  value={form.totalStock}
                  onChange={(e) => setForm({ ...form, totalStock: e.target.value })}
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '保存中…' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
