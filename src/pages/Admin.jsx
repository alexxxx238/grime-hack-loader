import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Users, Key, RefreshCw, Plus, Search, LogOut, Copy, Trash2, CheckCircle, AlertCircle } from 'lucide-react'
import api from '../lib/api'

const TABS = ['Users', 'Keys']

export default function Admin() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('Users')
  const [users, setUsers] = useState([])
  const [keys, setKeys] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ text: '', type: '' })

  // Create key form
  const [keyForm, setKeyForm] = useState({ product: 'GRIME:ALTV', days: 30 })
  const [newKey, setNewKey] = useState('')
  const [creatingKey, setCreatingKey] = useState(false)

  const flash = (text, type = 'success') => {
    setMsg({ text, type })
    setTimeout(() => setMsg({ text: '', type: '' }), 3000)
  }

  useEffect(() => {
    if (tab === 'Users') fetchUsers()
    if (tab === 'Keys') fetchKeys()
  }, [tab])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const r = await api.get('/admin/users')
      setUsers(r.data)
    } catch {}
    setLoading(false)
  }

  const fetchKeys = async () => {
    setLoading(true)
    try {
      const r = await api.get('/admin/keys')
      setKeys(r.data)
    } catch {}
    setLoading(false)
  }

  const createKey = async e => {
    e.preventDefault()
    setCreatingKey(true)
    setNewKey('')
    try {
      const r = await api.post('/admin/keys/create', keyForm)
      setNewKey(r.data.key)
      fetchKeys()
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to create key', 'error')
    }
    setCreatingKey(false)
  }

  const resetHwid = async (userId) => {
    try {
      await api.post(`/admin/hwid/reset`, { user_id: userId })
      flash('HWID reset successfully')
      fetchUsers()
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to reset HWID', 'error')
    }
  }

  const banUser = async (userId, banned) => {
    try {
      await api.post(`/admin/users/ban`, { user_id: userId, banned: !banned })
      flash(banned ? 'User unbanned' : 'User banned')
      fetchUsers()
    } catch {}
  }

  const deleteKey = async (keyId) => {
    try {
      await api.delete(`/admin/keys/${keyId}`)
      flash('Key deleted')
      fetchKeys()
    } catch {}
  }

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )
  const filteredKeys = keys.filter(k =>
    k.license_key_hash?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-bg">
      <nav className="border-b border-border bg-bg sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-1 font-bold">
              <span className="text-gray-100">grime</span><span className="text-accent-hi">.top</span>
            </a>
            <span className="text-gray-600">/</span>
            <span className="text-gray-400 text-sm">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="text-xs text-gray-400 hover:text-white transition-colors">Dashboard</button>
            <button onClick={() => { logout(); navigate('/') }} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          {msg.text && (
            <div className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg ${msg.type === 'error' ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`}>
              {msg.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
              {msg.text}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface border border-border rounded-lg p-1 w-fit mb-6">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'}`}>{t}</button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
            placeholder={`Search ${tab.toLowerCase()}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {tab === 'Users' && (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-gray-500 font-medium px-4 py-3">User</th>
                  <th className="text-left text-gray-500 font-medium px-4 py-3">Email</th>
                  <th className="text-left text-gray-500 font-medium px-4 py-3">Status</th>
                  <th className="text-left text-gray-500 font-medium px-4 py-3">Joined</th>
                  <th className="text-right text-gray-500 font-medium px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-500">Loading...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-500">No users found</td></tr>
                ) : filteredUsers.map(u => (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-accent/20 border border-accent/30 rounded-full flex items-center justify-center text-xs text-accent font-medium">
                          {u.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="text-gray-200">{u.username}</span>
                        {u.is_admin ? <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded">ADMIN</span> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{u.email}</td>
                    <td className="px-4 py-3">
                      {u.is_active && !u.is_banned
                        ? <span className="inline-flex items-center gap-1 text-green-400 text-xs"><span className="w-1.5 h-1.5 bg-green-400 rounded-full" />Active</span>
                        : <span className="inline-flex items-center gap-1 text-red-400 text-xs"><span className="w-1.5 h-1.5 bg-red-400 rounded-full" />Banned</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => resetHwid(u.id)} title="Reset HWID" className="text-gray-500 hover:text-blue-400 transition-colors">
                          <RefreshCw size={14} />
                        </button>
                        <button onClick={() => banUser(u.id, u.is_banned)} title={u.is_banned ? 'Unban' : 'Ban'} className="text-gray-500 hover:text-red-400 transition-colors">
                          <AlertCircle size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'Keys' && (
          <div className="space-y-6">
            {/* Create key form */}
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Plus size={16} className="text-accent" />Create Key</h3>
              <form onSubmit={createKey} className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Product</label>
                  <select
                    className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-accent"
                    value={keyForm.product}
                    onChange={e => setKeyForm(f => ({ ...f, product: e.target.value }))}
                  >
                    <option value="GRIME:ALTV">GRIME:ALT:V</option>
                    <option value="GRIME:RAGEMP">GRIME:RAGE:MP</option>
                    <option value="GRIME:SPOOFER">GRIME:SPOOFER</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Duration (days)</label>
                  <input
                    type="number" min={1}
                    className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-gray-100 w-24 focus:outline-none focus:border-accent"
                    value={keyForm.days}
                    onChange={e => setKeyForm(f => ({ ...f, days: +e.target.value }))}
                  />
                </div>
                <button type="submit" disabled={creatingKey} className="bg-accent hover:bg-accent-hi text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
                  {creatingKey && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Generate
                </button>
              </form>
              {newKey && (
                <div className="mt-4 flex items-center gap-2 bg-bg border border-green-700/40 rounded-lg px-4 py-2.5">
                  <CheckCircle size={14} className="text-green-400" />
                  <code className="flex-1 text-green-300 text-sm font-mono">{newKey}</code>
                  <button onClick={() => navigator.clipboard.writeText(newKey)} className="text-gray-500 hover:text-gray-300">
                    <Copy size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Keys table */}
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-gray-500 font-medium px-4 py-3">Key Hash</th>
                    <th className="text-left text-gray-500 font-medium px-4 py-3">Product</th>
                    <th className="text-left text-gray-500 font-medium px-4 py-3">Expires</th>
                    <th className="text-left text-gray-500 font-medium px-4 py-3">Status</th>
                    <th className="text-right text-gray-500 font-medium px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-500">Loading...</td></tr>
                  ) : filteredKeys.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-500">No keys found</td></tr>
                  ) : filteredKeys.map(k => {
                    const expired = new Date(k.expires_at) < new Date()
                    return (
                      <tr key={k.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">{k.license_key_hash?.slice(0, 16)}...</td>
                        <td className="px-4 py-3 text-gray-300 text-xs">{k.product || '—'}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{new Date(k.expires_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          {k.is_banned
                            ? <span className="text-red-400 text-xs">Banned</span>
                            : expired
                            ? <span className="text-gray-500 text-xs">Expired</span>
                            : k.hwid
                            ? <span className="text-blue-400 text-xs">In use</span>
                            : <span className="text-green-400 text-xs">Available</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => deleteKey(k.id)} className="text-gray-500 hover:text-red-400 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
