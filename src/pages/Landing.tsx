import { motion } from 'framer-motion'
import { ArrowRight, Play, Upload, Users, Calendar, Shield, Zap, BarChart3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import { useState, useEffect } from 'react'
import { getTotalStudentCount, getWeekdaySessionCount } from '@/lib/db'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (d: number) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: d, ease: [0.25, 0.4, 0.25, 1] } }),
}

const features = [
  { icon: <Upload className="w-5 h-5" />, title: 'CSV Upload', desc: 'Drop your Zoom report. We handle everything — name normalization, deduplication, weekends excluded.' },
  { icon: <BarChart3 className="w-5 h-5" />, title: 'Live Dashboard', desc: 'Beautiful charts update instantly. Leaderboards, daily breakdowns, missing session alerts.' },
  { icon: <Users className="w-5 h-5" />, title: 'Multi-Instructor', desc: 'Each instructor manages their own batches. Complete data isolation with shared infrastructure.' },
  { icon: <Calendar className="w-5 h-5" />, title: 'Smart Scheduling', desc: 'Internship runs Jun–Aug 2026. Dashboard flags every missing CSV so nothing slips through.' },
  { icon: <Shield className="w-5 h-5" />, title: 'Google Auth', desc: 'Sign in with your Google account. No passwords, no friction.' },
  { icon: <Zap className="w-5 h-5" />, title: 'Real-time DB', desc: 'Backed by Neon Postgres. Data persists across sessions and devices.' },
]

export default function Landing() {
  const [stats, setStats] = useState([
    { value: '3 months', label: 'Internship Duration' },
    { value: '...', label: 'Weekday Sessions' },
    { value: '...', label: 'Students Tracked' },
    { value: '100%', label: 'Automated' },
  ])

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [studentCount, weekdaySessions] = await Promise.all([
          getTotalStudentCount(),
          getWeekdaySessionCount(),
        ])

        setStats([
          { value: '3 months', label: 'Internship Duration' },
          { value: `~${weekdaySessions}`, label: 'Weekday Sessions' },
          { value: `${studentCount}+`, label: 'Students Tracked' },
          { value: '100%', label: 'Automated' },
        ])
      } catch (error) {
        console.error('Error loading stats:', error)
      }
    }

    loadStats()
    const interval = setInterval(loadStats, 5000) // Refresh every 5 seconds for real-time updates
    return () => clearInterval(interval)
  }, [])
  return (
    <div className="min-h-screen bg-[#0d1117] text-white font-body overflow-x-hidden">
      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 lg:px-20 py-4 bg-[#0d1117]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg width="36" height="28" viewBox="0 0 40 32" fill="none">
              <ellipse cx="20" cy="12" rx="14" ry="9" stroke="#1de9b6" strokeWidth="1.5" fill="none"/>
              <circle cx="20" cy="12" r="4" stroke="#1de9b6" strokeWidth="1.5" fill="none"/>
              <line x1="8" y1="6" x2="16" y2="10" stroke="#2979ff" strokeWidth="1"/>
              <line x1="32" y1="6" x2="24" y2="10" stroke="#2979ff" strokeWidth="1"/>
              <line x1="8" y1="18" x2="16" y2="14" stroke="#2979ff" strokeWidth="1"/>
              <line x1="32" y1="18" x2="24" y2="14" stroke="#2979ff" strokeWidth="1"/>
              <circle cx="8" cy="6" r="2" fill="#1de9b6"/>
              <circle cx="32" cy="6" r="2" fill="#1de9b6"/>
              <circle cx="8" cy="18" r="2" fill="#2979ff"/>
              <circle cx="32" cy="18" r="2" fill="#2979ff"/>
            </svg>
            <span className="text-lg font-semibold">
              <span style={{ color: '#1de9b6' }}>Pro</span>
              <span style={{ color: '#2979ff' }}>Azure</span>
            </span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-white/50">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how" className="hover:text-white transition-colors">How it works</a>
          <a href="#stats" className="hover:text-white transition-colors">Stats</a>
        </div>
        <Link to="/auth">
          <Button className="rounded-full bg-gradient-to-r from-[#1de9b6] to-[#2979ff] text-black hover:opacity-90 font-semibold text-sm h-9 px-5 border-0">
            Get Started
          </Button>
        </Link>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16">
        {/* Video background */}
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-20 z-0"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4"
            type="video/mp4"
          />
        </video>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1117]/60 via-transparent to-[#0d1117] z-[1]" />

        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-5xl mx-auto">
          {/* Badge */}
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/60 mb-8 backdrop-blur-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#1de9b6] animate-pulse" />
            Web Internship 2026 · Jun – Aug · 80+ Students
          </motion.div>

          {/* Headline */}
          <motion.h1
            custom={0.1}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tight mb-6"
          >
            Attendance tracking,
            <br />
            <span className="font-display italic" style={{ background: 'linear-gradient(135deg, #1de9b6, #2979ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              finally effortless.
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            custom={0.2}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="text-base md:text-lg text-white/50 max-w-xl leading-relaxed mb-10"
          >
            ProAzure Software Solutions' attendance SaaS for Web Internship 2026.
            Upload your Zoom CSV and get a full dashboard in seconds — for every instructor, every batch.
          </motion.p>

          {/* CTAs */}
          <motion.div
            custom={0.3}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="flex items-center gap-4"
          >
            <Link to="/auth">
              <button className="group flex items-center gap-2 h-12 px-7 rounded-full font-semibold text-sm text-black transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #1de9b6, #2979ff)' }}>
                Sign in with Google
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </Link>
            <a href="#how" className="flex items-center gap-2 h-12 px-6 rounded-full border border-white/10 text-white/70 hover:text-white hover:border-white/20 text-sm font-medium transition-all">
              <Play className="w-4 h-4 fill-current" />
              See how it works
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────────────── */}
      <section id="stats" className="py-16 border-y border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              custom={i * 0.08}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="flex flex-col items-center text-center"
            >
              <p className="text-3xl font-bold gradient-text mb-1">{s.value}</p>
              <p className="text-sm text-white/40">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 max-w-5xl mx-auto px-6">
        <motion.div
          variants={fadeUp} custom={0}
          initial="hidden" whileInView="show" viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-sm font-medium text-[#1de9b6] mb-3 tracking-widest uppercase">What you get</p>
          <h2 className="text-3xl md:text-4xl font-semibold">Everything you need. Nothing you don't.</h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              custom={i * 0.08}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="group rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-[#1de9b6]"
                style={{ background: 'rgba(29,233,182,0.1)' }}>
                {f.icon}
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────────── */}
      <section id="how" className="py-20 border-t border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            variants={fadeUp} custom={0}
            initial="hidden" whileInView="show" viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-sm font-medium text-[#2979ff] mb-3 tracking-widest uppercase">3 steps</p>
            <h2 className="text-3xl md:text-4xl font-semibold">From Zoom export to full analytics</h2>
          </motion.div>
          <div className="flex flex-col md:flex-row gap-6 relative">
            {[
              { n: '01', title: 'Sign in with Google', desc: 'Create your instructor account in one click. No passwords needed.' },
              { n: '02', title: 'Create a batch', desc: 'Name your class, choose online/offline, set the schedule. Done in 30 seconds.' },
              { n: '03', title: 'Upload your Zoom CSV', desc: 'Drop the meeting report. Dashboard updates in real-time with full attendance analytics.' },
            ].map((s, i) => (
              <motion.div
                key={s.n}
                custom={i * 0.1}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="flex-1 flex flex-col"
              >
                <div className="text-4xl font-bold gradient-text mb-4 font-display">{s.n}</div>
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <motion.div
          variants={fadeUp} custom={0}
          initial="hidden" whileInView="show" viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">Ready to automate attendance?</h2>
          <p className="text-white/40 mb-8">Join the ProAzure platform and manage your entire internship batch with ease.</p>
          <Link to="/auth">
            <button className="inline-flex items-center gap-2 h-13 px-8 rounded-full font-semibold text-black transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #1de9b6, #2979ff)' }}>
              Start free · Sign in with Google
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 text-center">
        <p className="text-xs text-white/20">© 2026 ProAzure Software Solutions Private Limited · Internship Attendance Platform</p>
      </footer>
    </div>
  )
}
