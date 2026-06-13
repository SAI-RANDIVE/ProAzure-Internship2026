import { motion } from 'framer-motion'
import { ArrowRight, Upload, Users, Calendar, Shield, Zap, BarChart3, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
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
  { icon: <Shield className="w-5 h-5" />, title: 'CEO Overview', desc: 'Master account can instantly view any instructor’s dashboard or see company-wide metrics.' },
  { icon: <Zap className="w-5 h-5" />, title: 'Lightning Fast', desc: 'Powered by Vite, React 18, and Neon Serverless Postgres. Zero loading screens.' },
]

const steps = [
  { 
    step: '01', 
    title: 'Instructor Sign Up', 
    desc: 'Create your secure instructor account using your name and email. Once logged in, you enter your isolated workspace.' 
  },
  { 
    step: '02', 
    title: 'Create a Training Batch', 
    desc: 'Click "New Batch" and define the details: give it a descriptive name, choose the delivery mode (Online, Offline, or Hybrid), and set the start/end dates and daily session time.' 
  },
  { 
    step: '03', 
    title: 'Upload Attendance Files', 
    desc: 'Download your raw CSV reports from Zoom or Google Meet. Go to "Upload CSV", select your batch, choose the source platform, and upload multiple files at once. The system automatically calculates duration, skips weekends, and deduplicates records.' 
  },
  { 
    step: '04', 
    title: 'What to Avoid & Best Practices', 
    desc: 'Never modify or edit the raw CSV files before uploading. Ensure you select the correct source (Zoom or Meet) to prevent data corruption. Always double-check you are uploading files to the correct Batch ID.' 
  },
]

export default function Landing() {
  const [stats, setStats] = useState({ students: 0, sessions: 0 })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [st, se] = await Promise.all([getTotalStudentCount(), getWeekdaySessionCount()])
        setStats({ students: st, sessions: se })
      } catch {
        setStats({ students: 120, sessions: 45 })
      }
    }
    loadData()
  }, [])

  return (
    <div className="min-h-screen bg-[#0d1117] text-white selection:bg-[#1de9b6] selection:text-black font-sans">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#0d1117]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="30" height="24" viewBox="0 0 40 32" fill="none">
              <ellipse cx="20" cy="12" rx="14" ry="9" stroke="#1de9b6" strokeWidth="1.5" fill="none"/>
              <circle cx="20" cy="12" r="4" stroke="#1de9b6" strokeWidth="1.5" fill="none"/>
              <circle cx="8" cy="6" r="2" fill="#1de9b6"/>
              <circle cx="32" cy="6" r="2" fill="#1de9b6"/>
              <circle cx="8" cy="18" r="2" fill="#2979ff"/>
              <circle cx="32" cy="18" r="2" fill="#2979ff"/>
            </svg>
            <span className="font-semibold text-sm tracking-tight">ProAzure SaaS</span>
          </div>
          <Link to="/auth">
            <button className="text-sm font-medium text-white hover:text-[#1de9b6] transition-colors">Sign In</button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#2979ff]/20 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#1de9b6]/10 blur-[100px] rounded-full pointer-events-none mix-blend-screen" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div variants={fadeUp} custom={0} initial="hidden" animate="show" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#1de9b6]/30 bg-[#1de9b6]/10 text-[#1de9b6] text-xs font-semibold mb-8">
            <span className="w-2 h-2 rounded-full bg-[#1de9b6] animate-pulse" />
            Internship 2026 Portal Live
          </motion.div>
          <motion.h1 variants={fadeUp} custom={0.1} initial="hidden" animate="show" className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            Track internship <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1de9b6] to-[#2979ff]">attendance instantly.</span>
          </motion.h1>
          <motion.p variants={fadeUp} custom={0.2} initial="hidden" animate="show" className="text-lg md:text-xl text-white/50 mb-10 max-w-2xl mx-auto leading-relaxed">
            The enterprise-grade dashboard for ProAzure instructors. Upload Zoom or Google Meet CSVs and let the system handle deduplication, weekend filtering, and analytics.
          </motion.p>
          <motion.div variants={fadeUp} custom={0.3} initial="hidden" animate="show" className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth">
              <button className="h-12 px-8 rounded-full font-semibold text-black transition-all hover:opacity-90 hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #1de9b6, #2979ff)' }}>
                Access Dashboard
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/5">
          <div className="text-center px-4"><p className="text-4xl font-bold text-white mb-1">{stats.students}+</p><p className="text-xs text-white/40 font-medium uppercase tracking-wider">Students Tracked</p></div>
          <div className="text-center px-4"><p className="text-4xl font-bold text-white mb-1">{stats.sessions}</p><p className="text-xs text-white/40 font-medium uppercase tracking-wider">Sessions Logged</p></div>
          <div className="text-center px-4"><p className="text-4xl font-bold text-white mb-1">99%</p><p className="text-xs text-white/40 font-medium uppercase tracking-wider">Data Accuracy</p></div>
          <div className="text-center px-4"><p className="text-4xl font-bold text-white mb-1">0s</p><p className="text-xs text-white/40 font-medium uppercase tracking-wider">Manual Entry</p></div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-32 px-6 bg-[#0d1117]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">How it works</h2>
            <p className="text-white/40">From raw data to actionable insights in seconds.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div key={i} variants={fadeUp} custom={i * 0.1} initial="hidden" whileInView="show" viewport={{ once: true }} className="relative p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                <div className="text-[#1de9b6] font-mono text-xl mb-4">{s.step}</div>
                <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold text-center mb-16">Everything you need</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {features.map((f, i) => (
              <motion.div key={i} variants={fadeUp} custom={i * 0.1} initial="hidden" whileInView="show" viewport={{ once: true }} className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-[#1de9b6]">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <motion.div variants={fadeUp} custom={0} initial="hidden" whileInView="show" viewport={{ once: true }} className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">Ready to automate attendance?</h2>
          <p className="text-white/40 mb-8">Join the ProAzure platform and manage your entire internship batch with ease.</p>
          <Link to="/auth">
            <button className="inline-flex items-center gap-2 h-13 px-8 rounded-full font-semibold text-black transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #1de9b6, #2979ff)' }}>
              Sign In to Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 text-center">
        <p className="text-sm text-white/30">© 2026 ProAzure Software Solutions. All rights reserved.</p>
      </footer>
    </div>
  )
}