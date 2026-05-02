import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Crosshair, Eye, Zap, Users, Star, ChevronRight, Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

const FEATURES = [
  { icon: Crosshair, title: 'Aimbot', desc: 'Advanced bone-based aimbot with smooth targeting, FOV control, and prediction.' },
  { icon: Eye, title: 'Visuals', desc: 'Full ESP with boxes, skeletons, health bars, distance, and custom colors.' },
  { icon: Shield, title: 'HWID Protection', desc: 'Each key is bound to one PC. Prevents sharing and unauthorized use.' },
  { icon: Zap, title: 'Auto-update', desc: 'Loader checks for updates automatically. Always on the latest version.' },
  { icon: Users, title: 'Player Tab', desc: 'Player modifications including godmode, speed, and more.' },
  { icon: Star, title: 'Configs', desc: 'Save and load configs. Share your settings with others.' },
]

const PLANS = [
  { name: 'Day', price: '$5', period: '/day', features: ['All features', 'HWID lock', '24/7 support', 'Auto-update'] },
  { name: 'Month', price: '$20', period: '/month', features: ['All features', 'HWID lock', '24/7 support', 'Auto-update', 'Priority support'], popular: true },
  { name: 'Lifetime', price: '$60', period: '/forever', features: ['All features', 'HWID lock', '24/7 support', 'Auto-update', 'Priority support', 'Free resets'] },
]

const FAQ = [
  { q: 'Is it undetected?', a: 'Yes. We update within hours of any detection attempt. Status is shown in real-time on the dashboard.' },
  { q: 'How does HWID lock work?', a: 'Your key is bound to your PC on first use. If you change hardware, you can reset HWID once via Telegram bot.' },
  { q: 'How do I get a key?', a: 'Purchase through our Telegram bot or website. After payment, a key is generated and linked to your account.' },
  { q: 'What games are supported?', a: 'Currently GTA V via ALT:V and RAGE:MP. More platforms coming soon.' },
]

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)

  return (
    <div className="min-h-screen bg-bg text-gray-100">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-1 text-xl font-bold">
            <span className="text-gray-100">grime</span>
            <span className="text-accent-hi">.top</span>
          </a>
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} className="text-gray-400 hover:text-white transition-colors text-sm">{l.label}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2">Sign In</Link>
            <Link to="/register" className="text-sm bg-accent hover:bg-accent-hi text-white px-4 py-2 rounded-lg transition-colors">Get Started</Link>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-gray-400">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-border bg-bg px-4 py-4 flex flex-col gap-4">
            {NAV_LINKS.map(l => <a key={l.label} href={l.href} className="text-gray-400">{l.label}</a>)}
            <Link to="/login" className="text-gray-400">Sign In</Link>
            <Link to="/register" className="bg-accent text-white px-4 py-2 rounded-lg text-center">Get Started</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 text-accent text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Currently Undetected
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            The most advanced<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-blue-400">GTA V modification</span>
          </h1>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            Feature-rich cheat for ALT:V and RAGE:MP with aimbot, ESP, player mods and more. Secure, updated, undetected.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/register" className="flex items-center gap-2 bg-accent hover:bg-accent-hi text-white font-medium px-8 py-3 rounded-lg transition-colors">
              Get Started <ChevronRight size={16} />
            </Link>
            <a href="#features" className="flex items-center gap-2 border border-border hover:border-accent text-gray-300 hover:text-white font-medium px-8 py-3 rounded-lg transition-all">
              View Features
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Everything you need</h2>
            <p className="text-gray-400">Powerful features, built for serious players.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-surface border border-border rounded-xl p-6 hover:border-accent/50 transition-colors group">
                <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <f.icon size={18} className="text-accent" />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-surface/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Simple pricing</h2>
            <p className="text-gray-400">No subscriptions. Pay once, use as long as your plan lasts.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map(p => (
              <div key={p.name} className={`relative bg-surface border rounded-xl p-6 flex flex-col ${p.popular ? 'border-accent shadow-lg shadow-accent/10' : 'border-border'}`}>
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-medium px-3 py-1 rounded-full">Most Popular</div>
                )}
                <div className="mb-6">
                  <div className="text-gray-400 text-sm mb-2">{p.name}</div>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold text-white">{p.price}</span>
                    <span className="text-gray-500 mb-1">{p.period}</span>
                  </div>
                </div>
                <ul className="flex-1 space-y-3 mb-6">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="w-4 h-4 bg-accent/20 border border-accent/40 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className={`w-full text-center py-2.5 rounded-lg font-medium text-sm transition-colors ${p.popular ? 'bg-accent hover:bg-accent-hi text-white' : 'border border-border hover:border-accent text-gray-300 hover:text-white'}`}>
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">FAQ</h2>
            <p className="text-gray-400">Common questions answered.</p>
          </div>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <div key={i} className="bg-surface border border-border rounded-xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-6 py-4 text-left">
                  <span className="font-medium text-white">{item.q}</span>
                  <ChevronRight size={16} className={`text-gray-400 transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-gray-400 text-sm leading-relaxed border-t border-border pt-4">{item.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1 font-bold">
            <span className="text-gray-100">grime</span>
            <span className="text-accent-hi">.top</span>
          </div>
          <p className="text-gray-500 text-sm">© 2026 grime.top. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
