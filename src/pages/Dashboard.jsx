import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Key, Monitor, Calendar, LogOut, CheckCircle, AlertCircle, Copy, RefreshCw } from 'lucide-react'
import api from '../lib/api'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [keyInput, setKeyInput] = useState('')
  const [keyError, setKeyError] = useState('')
  const [keySuccess, setKeySuccess] = useState('')
  const [keyLoading, setKeyLoading] = useState(false)
  const [subscription, setSubscription] = useState(null)
  const [hwid, setHwid] = useState(null)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/subscription').then(r => setSubscription(r.data)).catch(() => {}),
      api.get('/dashboard/hwid').then(r => setHwid(r.data)).catch(() => {}),
    ]).finally(() => setLoadingData(false))
  }, [])

  const activateKey = async e => {
    e.preventDefault()
    setKeyError('')
    setKeySuccess('')
    setKeyLoading(true)
    try {
      const r = await api.post('/keys/activate', { key: keyInput.trim() })
      setKeySuccess(r.data.message || 'Key activated successfully!')
      setKeyInput('')
      const sub = await api.get('/dashboard/subscription')
      setSubscription(sub.data)
    } catch (err) {
      setKeyError(err.response?.data?.message || 'Invalid or expired key')
    } finally {
      setKeyLoading(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  const isExpired = subscription && new Date(subscription.expires_at) < new Date()
  const expiresStr = subscription
    ? new Date(subscription.expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  return (
    <div className="min-h-screen bg-bg">
      {/* Navbar */}
      <nav className="border-b border-border bg-bg/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-1 font-bold">
            <span className="text-gray-100">grime</span>
            <span className="text-accent-hi">.top</span>
          </a>
          <div className="flex items-center gap-3">
            {user?.is_admin && (
              <button onClick={() => navigate('/admin')} className="text-xs text-accent hover:text-accent-hi transition-colors">Admin Panel</button>
            )}
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Welcome, {user?.username}</h1>
          <p className="text-gray-400 text-sm mt-1">{user?.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Subscription card */}
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Calendar size={16} className="text-accent" />
              <h2 className="font-semibold text-white">Subscription</h2>
            </div>
            {loadingData ? (
              <div className="flex justify-center py-6"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
            ) : subscription && !isExpired ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-green-900/30 border border-green-700/50 text-green-400 text-xs font-medium px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Active
                  </span>
                </div>
                <div className="text-sm text-gray-400">
                  <span className="text-gray-500">Product: </span>
                  <span className="text-gray-200 font-medium">{subscription.product || 'GRIME:ALT:V'}</span>
                </div>
                <div className="text-sm text-gray-400">
                  <span className="text-gray-500">Expires: </span>
                  <span className="text-gray-200">{expiresStr}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <span className="inline-flex items-center gap-1.5 bg-red-900/30 border border-red-700/50 text-red-400 text-xs font-medium px-2.5 py-1 rounded-full">
                  <AlertCircle size={10} /> {isExpired ? 'Expired' : 'No subscription'}
                </span>
                <p className="text-sm text-gray-500">Activate a key below to get access.</p>
              </div>
            )}
          </div>

          {/* HWID card */}
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Monitor size={16} className="text-accent" />
              <h2 className="font-semibold text-white">HWID</h2>
            </div>
            {loadingData ? (
              <div className="flex justify-center py-6"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
            ) : hwid?.hwid ? (
              <div className="space-y-3">
                <span className="inline-flex items-center gap-1.5 bg-blue-900/30 border border-blue-700/50 text-blue-400 text-xs font-medium px-2.5 py-1 rounded-full">
                  <CheckCircle size={10} /> Bound
                </span>
                <div className="flex items-center gap-2 bg-bg border border-border rounded-lg px-3 py-2">
                  <code className="text-xs text-gray-400 flex-1 truncate">{hwid.hwid}</code>
                  <button onClick={() => navigator.clipboard.writeText(hwid.hwid)} className="text-gray-500 hover:text-gray-300">
                    <Copy size={12} />
                  </button>
                </div>
                <p className="text-xs text-gray-500">To reset HWID, contact support via Telegram bot.</p>
              </div>
            ) : (
              <div>
                <span className="inline-flex items-center gap-1.5 bg-gray-900/30 border border-gray-700/50 text-gray-400 text-xs font-medium px-2.5 py-1 rounded-full">
                  Not bound
                </span>
                <p className="text-sm text-gray-500 mt-3">HWID will be bound on first loader launch.</p>
              </div>
            )}
          </div>

          {/* Activate key */}
          <div className="md:col-span-2 bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Key size={16} className="text-accent" />
              <h2 className="font-semibold text-white">Activate Key</h2>
            </div>
            <form onSubmit={activateKey} className="flex gap-3">
              <input
                type="text"
                className="flex-1 bg-bg border border-border rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-accent transition-colors font-mono text-sm"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                required
              />
              <button type="submit" disabled={keyLoading} className="bg-accent hover:bg-accent-hi text-white font-medium px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap">
                {keyLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Activate
              </button>
            </form>
            {keyError && (
              <p className="mt-3 flex items-center gap-1.5 text-red-400 text-sm"><AlertCircle size={14} />{keyError}</p>
            )}
            {keySuccess && (
              <p className="mt-3 flex items-center gap-1.5 text-green-400 text-sm"><CheckCircle size={14} />{keySuccess}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
