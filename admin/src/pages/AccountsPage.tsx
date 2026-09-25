import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/App'
import { apiGet, apiPost, apiPut } from '@/lib/api'
import { Plus, Edit2, Trash2, X, Check, KeyRound, UserX, UserCheck } from 'lucide-react'

interface Account {
  id: number
  username: string
  name: string
  role: 'admin' | 'staff'
  store_id: number | null
  store_name: string | null
  status: 'active' | 'disabled'
}

interface Store {
  id: number
  name: string
}

const EMPTY_FORM = {
  username: '',
  password: '',
  name: '',
  role: 'staff' as 'admin' | 'staff',
  storeId: '' as number | '',
}

export function AccountsPage() {
  const { token } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadAccounts = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const data = await apiGet<Account[]>('/admin/accounts', token)
      setAccounts(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  const loadStores = useCallback(async () => {
    if (!token) return
    try {
      const data = await apiGet<Store[]>('/stores', token)
      setStores(data)
    } catch (e: any) {
      setError(e.message)
    }
  }, [token])

  useEffect(() => {
    loadAccounts()
    loadStores()
  }, [loadAccounts, loadStores])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  function openEdit(account: Account) {
    setEditing(account)
    setForm({
      username: account.username,
      password: '',
      name: account.name,
      role: account.role,
      storeId: account.store_id ?? '',
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!token) return
    if (!form.username || !form.name || !form.role) {
      setError('请填写必填项')
      return
    }
    if (!editing && !form.password) {
      setError('请填写密码')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload: Record<string, unknown> = {
        username: form.username,
        name: form.name,
        role: form.role,
        storeId: form.storeId === '' ? null : Number(form.storeId),
      }
      if (form.password) payload.password = form.password

      if (editing) {
        await apiPut(`/admin/accounts/${editing.id}`, token, payload)
      } else {
        await apiPost('/admin/accounts', token, payload)
      }
      setShowModal(false)
      await loadAccounts()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function resetPassword(account: Account) {
    if (!token) return
    const newPassword = prompt(`为「${account.name}」重置新密码（至少 6 位）：`)
    if (!newPassword || newPassword.length < 6) {
      setError('密码至少 6 位')
      return
    }
    try {
      await apiPost(`/admin/accounts/${account.id}/reset-password`, token, { password: newPassword })
      setError('')
    } catch (e: any) {
      setError(e.message)
    }
  }

  async function toggleStatus(account: Account) {
    if (!token) return
    try {
      await apiPost(`/admin/accounts/${account.id}/toggle-status`, token)
      setAccounts(accounts.map((a) =>
        a.id === account.id ? { ...a, status: a.status === 'active' ? 'disabled' : 'active' } : a,
      ))
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">账号管理</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90"
        >
          <Plus size={16} /> 新增账号
        </button>
      </div>

      {error && <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md">{error}</div>}

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left py-3 px-4 font-medium">用户名</th>
              <th className="text-left py-3 px-4 font-medium">姓名</th>
              <th className="text-left py-3 px-4 font-medium">角色</th>
              <th className="text-left py-3 px-4 font-medium">门店</th>
              <th className="text-left py-3 px-4 font-medium">状态</th>
              <th className="text-right py-3 px-4 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">加载中...</td></tr>
            ) : accounts.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">暂无账号</td></tr>
            ) : (
              accounts.map((a) => (
                <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-3 px-4 font-mono">{a.username}</td>
                  <td className="py-3 px-4">{a.name}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {a.role === 'admin' ? '管理员' : '店员'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">
                    {a.store_name ?? '全部门店'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {a.status === 'active' ? '启用' : '停用'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => resetPassword(a)}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="重置密码"
                      >
                        <KeyRound size={14} />
                      </button>
                      <button
                        onClick={() => openEdit(a)}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="编辑"
                      >
                        <Edit2 size={14} />
                      </button>
                      {a.role !== 'admin' && (
                        <button
                          onClick={() => toggleStatus(a)}
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                          title={a.status === 'active' ? '停用' : '启用'}
                        >
                          {a.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">{editing ? '编辑账号' : '新增账号'}</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {error && <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md">{error}</div>}
              <div>
                <label className="text-sm font-medium block mb-1">用户名 *</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  disabled={!!editing}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-muted disabled:text-muted-foreground"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">姓名 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">
                  {editing ? '密码（留空则不修改）' : '密码 *'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">角色 *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'staff' })}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
                >
                  <option value="staff">店员</option>
                  <option value="admin">管理员</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">分配门店（店员必选）</label>
                <select
                  value={form.storeId}
                  onChange={(e) => setForm({ ...form, storeId: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
                >
                  <option value="">请选择门店</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-border">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
