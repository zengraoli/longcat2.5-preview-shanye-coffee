import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../lib/api';
import { formatBeijing } from '../lib/utils';
import type { Product } from '../lib/types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
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

interface Promotion {
  id: number;
  name: string;
  type: string;
  startAt: string;
  endAt: string;
  enabled: boolean;
  active: boolean;
  productIds: number[];
}

interface FormState {
  name: string;
  startAt: string;
  endAt: string;
  productIds: number[];
}

const emptyForm: FormState = {
  name: '',
  startAt: '',
  endAt: '',
  productIds: [],
};

/** 后端 UTC ISO8601 → datetime-local 输入框格式 */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local 输入框 → 北京时间 UTC ISO8601 */
function fromLocalInput(value: string): string {
  // 输入框为本地时间，按北京时间（UTC+8）解释后转 UTC
  return new Date(`${value}:00+08:00`).toISOString();
}

export default function Promotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPromotions(await api.get<Promotion[]>('/api/admin/promotions'));
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    api
      .get<Product[]>('/api/admin/products')
      .then(setProducts)
      .catch(() => {});
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (p: Promotion) => {
    setEditing(p);
    setForm({
      name: p.name,
      startAt: toLocalInput(p.startAt),
      endAt: toLocalInput(p.endAt),
      productIds: p.productIds,
    });
    setDialogOpen(true);
  };

  const toggleProduct = (id: number) => {
    setForm((f) => ({
      ...f,
      productIds: f.productIds.includes(id)
        ? f.productIds.filter((x) => x !== id)
        : [...f.productIds, id],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('请填写活动名称');
      return;
    }
    if (!form.startAt || !form.endAt) {
      setError('请选择开始与结束时间');
      return;
    }
    if (new Date(form.endAt).getTime() <= new Date(form.startAt).getTime()) {
      setError('结束时间必须晚于开始时间');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        start_at: fromLocalInput(form.startAt),
        end_at: fromLocalInput(form.endAt),
        product_ids: form.productIds,
      };
      if (editing) {
        await api.patch(`/api/admin/promotions/${editing.id}`, payload);
      } else {
        await api.post('/api/admin/promotions', payload);
      }
      setDialogOpen(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (p: Promotion) => {
    setError('');
    try {
      await api.post(`/api/admin/promotions/${p.id}/toggle`, {});
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失败');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-900">活动管理</h1>
        <Button onClick={openCreate}>
          <Plus /> 新建活动
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded-lg border border-brand-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>开始时间</TableHead>
              <TableHead>结束时间</TableHead>
              <TableHead>适用商品</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promotions.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>第二杯半价</TableCell>
                <TableCell>{formatBeijing(p.startAt)}</TableCell>
                <TableCell>{formatBeijing(p.endAt)}</TableCell>
                <TableCell>{p.productIds.length} 个</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {p.active && <Badge variant="success">生效中</Badge>}
                    <Badge variant={p.enabled ? 'default' : 'muted'}>
                      {p.enabled ? '启用' : '停用'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                      编辑
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggleEnabled(p)}>
                      {p.enabled ? '停用' : '启用'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {promotions.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-brand-400">
                  {loading ? '加载中…' : '暂无活动'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑活动' : '新建活动'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-brand-700">
                活动名称
              </label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="如：第二杯半价"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-brand-700">
                  开始时间
                </label>
                <Input
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-brand-700">
                  结束时间
                </label>
                <Input
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-brand-700">
                适用商品（{form.productIds.length} 个）
              </label>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-brand-100 p-2">
                {products.map((p) => (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-brand-50"
                  >
                    <input
                      type="checkbox"
                      checked={form.productIds.includes(p.id)}
                      onChange={() => toggleProduct(p.id)}
                    />
                    <span className="text-brand-900">{p.name}</span>
                  </label>
                ))}
                {products.length === 0 && (
                  <p className="px-2 py-1 text-sm text-brand-400">暂无商品</p>
                )}
              </div>
            </div>
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
