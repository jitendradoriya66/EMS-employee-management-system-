import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Sparkles, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useRecruitment } from '@/hooks/useRecruitment'

const pipeline = [
  { stage: 'Sourced', count: 18 },
  { stage: 'Screening', count: 9 },
  { stage: 'Interview', count: 6 },
  { stage: 'Offer', count: 3 },
]

export const RecruitmentPage: React.FC = () => {
  const { jobs, loading } = useRecruitment()

  if (loading) {
    return <div className="p-xl text-center text-text-secondary">Loading recruitment data...</div>
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-lg">
      <div className="rounded-3xl border border-border bg-card p-lg shadow-sm">
        <div className="flex flex-col gap-md lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="section-title">Recruitment Hub</h1>
            <p className="section-subtitle mt-xs">A production-style ATS landing area for hiring visibility and pipeline control.</p>
          </div>
          <Link to="/dashboard" className="button-secondary inline-flex items-center gap-sm self-start">
            Back to dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-lg grid grid-cols-1 gap-md sm:grid-cols-3">
          {[
            { label: 'Open roles', value: jobs.length, icon: BriefcaseBusiness },
            { label: 'Interview round', value: 14, icon: Users },
            { label: 'Offers pending', value: 3, icon: CheckCircle2 },
          ].map(item => {
            const Icon = item.icon
            return (
              <div key={item.label} className="rounded-2xl border border-border bg-background p-md">
                <div className="flex items-start justify-between gap-md">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{item.label}</p>
                    <p className="mt-sm text-3xl font-black text-text-primary">{item.value}</p>
                  </div>
                  <Icon className="h-5 w-5 text-primary-600" />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-lg xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-border bg-card p-lg shadow-sm">
          <div className="flex items-center justify-between gap-md">
            <div>
              <h2 className="text-lg font-bold text-text-primary">Hiring pipeline</h2>
              <p className="text-sm text-text-secondary">Pipeline counts help the team spot bottlenecks immediately.</p>
            </div>
            <Sparkles className="h-5 w-5 text-primary-600" />
          </div>

          <div className="mt-md space-y-sm">
            {pipeline.map(item => (
              <div key={item.stage} className="rounded-2xl border border-border bg-background p-md">
                <div className="flex items-center justify-between gap-md">
                  <span className="text-sm font-semibold text-text-primary">{item.stage}</span>
                  <span className="text-sm font-bold text-text-secondary">{item.count} candidates</span>
                </div>
                <div className="mt-md h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" style={{ width: `${Math.min(100, (item.count / 18) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-lg shadow-sm">
          <h2 className="text-lg font-bold text-text-primary">Real-world module checklist</h2>
          <p className="mt-xs text-sm text-text-secondary">What an enterprise recruiting workspace normally surfaces.</p>
          <div className="mt-md grid gap-sm sm:grid-cols-2">
            {[
              'Open requisitions',
              'Candidate pipeline stages',
              'Interview panel scheduling',
              'Offer and approval workflow',
              'Talent pool segmentation',
              'Hiring analytics',
            ].map(item => (
              <div key={item} className="rounded-2xl border border-border bg-background p-md text-sm text-text-primary">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}