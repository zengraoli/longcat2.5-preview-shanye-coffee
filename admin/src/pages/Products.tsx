import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../lib/api';
import { formatYuan } from '../lib/utils';
import type { Category, Product, ProductDetail } from '../lib/types';
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
import Can from '../components/auth/Can';

const PAGE_SIZE = 10;

interface FormState {
  name: string;
  categoryId: number | '';
  price: string;
  description: string;
  drink: boolean;
}

const emptyForm: FormState = { name: '', categoryId: '', price: '', description: '', drink: false };

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductDetail | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.set('category_id', categoryFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const qs = params.toString();
      const data = await api.get<Product[]>(`/api/admin/products${qs ? `?${qs}` : ''}`);
      setProducts(data);
      setPage(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api.get<Category[]>('/api/categories').then(setCategories).catch(() => {});
  }, []);

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const pageItems = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    api
      .get<ProductDetail>(`/api/admin/products/${p.id}`)
      .then((detail) => {
        setEditing(detail);
        setForm({
          name: detail.name,
          categoryId: detail.categoryId,
          price: String(detail.price / 100),
          description: detail.description ?? '',
          drink: detail.specs.length > 0,
        });
        setDialogOpen(true);
      })
      .catch((e) => setError(e instanceof Error ? e.message : '加载失败'));
  };

  const handleSave = async () => {
    if (!form.name || form.categoryId === '' || !form.price) {
      setError('请填写名称、分类与价格');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name,
        category_id: Number(form.categoryId),
        price: Math.round(Number(form.price) * 100),
        description: form.description || undefined,
        drink: form.drink,
      };
      if (editing) {
        await api.patch(`/api/admin/products/${editing.id}`, payload);
      } else {
        await api.post('/api/admin/products', payload);
      }
      setDialogOpen(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (p: Product) => {
    setError('');
    try {
      await api.patch(`/api/admin/products/${p.id}/status`, {
        status: p.status === 'on' ? 'off' : 'on',
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失败');
    }
  };

  const toggleSoldOut = async (p: Product) => {
    setError('');
    try {
      await api.patch(`/api/admin/products/${p.id}/sold-out`, { sold_out: p.soldOut ? 0 : 1 });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失败');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-900">商品管理</h1>
        <Can roles={['admin']}>
          <Button onClick={openCreate}>
            <Plus /> 新增商品
          </Button>
        </Can>
      </div>

      <div className="flex gap-2">
        <Select
          value={categoryFilter}
          onValueChange={(v) => setCategoryFilter(v ?? 'all')}
        >
          <SelectTrigger className="w-32">
            <SelectDisplay
              value={categoryFilter}
              placeholder="全部分类"
              options={[
                { value: 'all', label: '全部分类' },
                ...categories.map((c) => ({ value: String(c.id), label: c.name })),
              ]}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分类</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v ?? 'all')}
        >
          <SelectTrigger className="w-32">
            <SelectDisplay
              value={statusFilter}
              placeholder="全部状态"
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'on', label: '上架' },
                { value: 'off', label: '下架' },
              ]}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="on">上架</SelectItem>
            <SelectItem value="off">下架</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded-lg border border-brand-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>分类</TableHead>
              <TableHead className="text-right">价格</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>售罄</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.name}</TableCell>
                <TableCell>{categories.find((c) => c.id === p.categoryId)?.name ?? p.categoryId}</TableCell>
                <TableCell className="text-right">{formatYuan(p.price)}</TableCell>
                <TableCell>
                  <Badge variant={p.status === 'on' ? 'success' : 'muted'}>
                    {p.status === 'on' ? '上架' : '下架'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={p.soldOut ? 'danger' : 'secondary'}>
                    {p.soldOut ? '售罄' : '正常'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Can roles={['admin']}>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                        编辑
                      </Button>
                    </Can>
                    <Can roles={['admin']}>
                      <Button variant="outline" size="sm" onClick={() => toggleStatus(p)}>
                        {p.status === 'on' ? '下架' : '上架'}
                      </Button>
                    </Can>
                    <Button variant="outline" size="sm" onClick={() => toggleSoldOut(p)}>
                      {p.soldOut ? '恢复' : '售罄'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {pageItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-brand-400">
                  {loading ? '加载中…' : '暂无商品'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-brand-500">
        <span>共 {products.length} 条</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            上一页
          </Button>
          <span>
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            下一页
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? '编辑商品' : '新增商品'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="mb-1 block text-sm text-brand-600">名称</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-brand-600">分类</label>
              <Select
                value={form.categoryId === '' ? '' : String(form.categoryId)}
                onValueChange={(v) => setForm({ ...form, categoryId: Number(v) })}
              >
                <SelectTrigger>
                  <SelectDisplay
                    value={form.categoryId === '' ? '' : String(form.categoryId)}
                    placeholder="选择分类"
                    options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
                  />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-brand-600">价格（元）</label>
              <Input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-brand-600">描述</label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-brand-700">
              <input
                type="checkbox"
                checked={form.drink}
                onChange={(e) => setForm({ ...form, drink: e.target.checked })}
                className="h-4 w-4"
              />
              饮品（含杯型/温度/糖度规格）
            </label>
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
