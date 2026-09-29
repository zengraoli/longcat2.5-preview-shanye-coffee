import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Store } from '../lib/types';
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

interface StoreForm {
  name: string;
  address: string;
  phone: string;
  openTime: string;
  closeTime: string;
}

export default function Stores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Store | null>(null);
  const [form, setForm] = useState<StoreForm>({
    name: '',
    address: '',
    phone: '',
    openTime: '08:00',
    closeTime: '21:00',
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setStores(await api.get<Store[]>('/api/stores'));
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = (s: Store) => {
    setEditing(s);
    setForm({
      name: s.name,
      address: s.address,
      phone: s.phone ?? '',
      openTime: s.openTime,
      closeTime: s.closeTime,
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    setError('');
    try {
      await api.patch(`/api/admin/stores/${editing.id}`, {
        name: form.name,
        address: form.address,
        phone: form.phone || null,
        open_time: form.openTime,
        close_time: form.closeTime,
      });
      setEditing(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (s: Store) => {
    setError('');
    try {
      await api.patch(`/api/admin/stores/${s.id}`, {
        status: s.status === 'open' ? 'closed' : 'open',
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失败');
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-brand-900">门店管理</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded-lg border border-brand-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>地址</TableHead>
              <TableHead>电话</TableHead>
              <TableHead>营业时间</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stores.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.name}</TableCell>
                <TableCell>{s.address}</TableCell>
                <TableCell>{s.phone ?? '-'}</TableCell>
                <TableCell>
                  {s.openTime} - {s.closeTime}
                </TableCell>
                <TableCell>
                  <Badge variant={s.status === 'open' ? 'success' : 'muted'}>
                    {s.status === 'open' ? '营业中' : '休息中'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="outline" size="sm" onClick={() => openEdit(s)}>
                      编辑
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggleStatus(s)}>
                      {s.status === 'open' ? '休息' : '营业'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {stores.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-brand-400">
                  {loading ? '加载中…' : '暂无门店'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑门店</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="mb-1 block text-sm text-brand-600">名称</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-brand-600">地址</label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-brand-600">电话</label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-sm text-brand-600">开门时间</label>
                <Input
                  type="time"
                  value={form.openTime}
                  onChange={(e) => setForm({ ...form, openTime: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-brand-600">关门时间</label>
                <Input
                  type="time"
                  value={form.closeTime}
                  onChange={(e) => setForm({ ...form, closeTime: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
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
