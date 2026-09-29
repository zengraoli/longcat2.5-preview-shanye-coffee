import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../lib/api';
import type { Store } from '../lib/types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
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

interface Account {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'staff';
  storeId: number | null;
  enabled: boolean;
}

interface FormState {
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'staff';
  storeId: number | '';
}

const emptyForm: FormState = { username: '', password: '', name: '', role: 'staff', storeId: '' };

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAccounts(await api.get<Account[]>('/api/admin/accounts'));
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api.get<Store[]>('/api/stores').then(setStores).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (a: Account) => {
    setEditing(a);
    setForm({
      username: a.username,
      password: '',
      name: a.name,
      role: a.role,
      storeId: a.storeId ?? '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || (!editing && !form.username) || (!editing && !form.password)) {
      setError('请填写完整信息');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        role: form.role,
        store_id: form.role === 'staff' ? (form.storeId === '' ? null : Number(form.storeId)) : null,
      };
      if (editing) {
        if (form.password) payload.password = form.password;
        await api.patch(`/api/admin/accounts/${editing.id}`, payload);
      } else {
        payload.username = form.username;
        payload.password = form.password;
        await api.post('/api/admin/accounts', payload);
      }
      setDialogOpen(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (a: Account) => {
    await api.patch(`/api/admin/accounts/${a.id}`, { enabled: !a.enabled });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-900">账号与角色</h1>
        <Button onClick={openCreate}>
          <Plus /> 新增账号
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded-lg border border-brand-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>账号</TableHead>
              <TableHead>姓名</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>绑定门店</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((a) => (
              <TableRow key={a.id}>
                <TableCell>{a.username}</TableCell>
                <TableCell>{a.name}</TableCell>
                <TableCell>
                  <Badge variant={a.role === 'admin' ? 'default' : 'secondary'}>
                    {a.role === 'admin' ? '管理员' : '店员'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {a.role === 'staff'
                    ? stores.find((s) => s.id === a.storeId)?.name ?? '-'
                    : '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={a.enabled ? 'success' : 'muted'}>
                    {a.enabled ? '启用' : '停用'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(a)}>
                      编辑
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggleEnabled(a)}>
                      {a.enabled ? '停用' : '启用'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {accounts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-brand-400">
                  {loading ? '加载中…' : '暂无账号'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? '编辑账号' : '新增账号'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {!editing && (
              <div>
                <label className="mb-1 block text-sm text-brand-600">账号</label>
                <Input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm text-brand-600">姓名</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-brand-600">
                密码{editing ? '（留空则不修改）' : ''}
              </label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-brand-600">角色</label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v as 'admin' | 'staff' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">管理员</SelectItem>
                  <SelectItem value="staff">店员</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.role === 'staff' && (
              <div>
                <label className="mb-1 block text-sm text-brand-600">绑定门店</label>
                <Select
                  value={form.storeId === '' ? '' : String(form.storeId)}
                  onValueChange={(v) => setForm({ ...form, storeId: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择门店" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
