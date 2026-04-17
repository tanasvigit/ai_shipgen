import type { ReactNode } from 'react'

interface MetricCardProps {
  title: string
  value: string | number
  sub: string
  icon: string
  danger?: boolean
}

interface DetailProps {
  label: string
  value?: string | null
}

interface InputProps {
  label: string
  value: string
  onChange: (value: string) => void
}

interface InfoCardProps {
  title: string
  value: ReactNode
}

interface MiniMetricProps {
  label: string
  value: string
}

interface TimelineBadgeProps {
  label: string
  active?: boolean
}

interface InfoRowProps {
  label: string
  value: ReactNode
}

interface SummaryCardProps {
  label: string
  value: number
  danger?: boolean
}

interface InsightCardProps {
  text: string
}

export function MetricCard({ title, value, sub, icon, danger = false }: MetricCardProps) {
  return (
    <div className={`p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center justify-between ${danger ? 'bg-error-container/40 border border-error/10' : 'bg-surface-container-lowest'}`}>
      <div>
        <p className={`text-sm font-medium mb-1 ${danger ? 'text-on-error-container' : 'text-on-surface-variant'}`}>{title}</p>
        <h2 className={`text-3xl font-extrabold tracking-tight ${danger ? 'text-on-error-container' : 'text-on-surface'}`}>{value}</h2>
        <p className={`text-[12px] font-semibold mt-2 ${danger ? 'text-error' : 'text-on-tertiary-container'}`}>{sub}</p>
      </div>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${danger ? 'bg-error-container text-error' : 'bg-surface-container-low'}`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
    </div>
  )
}

export function Detail({ label, value }: DetailProps) {
  return (
    <div>
      <p className="text-[10px] text-on-surface-variant font-semibold uppercase">{label}</p>
      <p className="text-sm font-bold">{value || '-'}</p>
    </div>
  )
}

export function Input({ label, value, onChange }: InputProps) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full h-10 rounded-lg border border-outline-variant/30 px-3 bg-white text-sm" />
    </label>
  )
}

export function InfoCard({ title, value }: InfoCardProps) {
  return (
    <div className="bg-surface-container-lowest p-5 rounded-xl flex items-center gap-4">
      <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-primary text-2xl">info</span>
      </div>
      <div>
        <p className="text-[10px] text-on-surface-variant font-semibold uppercase">{title}</p>
        <p className="font-bold text-sm">{value}</p>
      </div>
    </div>
  )
}

export function MiniMetric({ label, value }: MiniMetricProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-sm text-on-surface-variant">payments</span>
        <span className="text-xs text-on-surface-variant">{label}</span>
      </div>
      <p className="text-xl font-headline font-bold">{value}</p>
    </div>
  )
}

export function TimelineBadge({ label, active = false }: TimelineBadgeProps) {
  return (
    <div className="relative z-10 flex flex-col items-center gap-2 text-center w-32">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md ${active ? 'bg-on-tertiary-container text-white' : 'bg-surface-container-highest text-on-surface-variant'}`}>
        <span className="material-symbols-outlined text-lg">{active ? 'check_circle' : 'schedule'}</span>
      </div>
      <span className={`text-xs font-bold ${active ? 'text-on-surface' : 'text-on-surface-variant'}`}>{label}</span>
    </div>
  )
}

export function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-outline-variant/20 last:border-b-0">
      <span className="text-sm text-on-surface-variant">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  )
}

export function SummaryCard({ label, value, danger = false }: SummaryCardProps) {
  return (
    <div className={`px-8 py-5 rounded-2xl border flex flex-col items-center justify-center min-w-[140px] shadow-sm ${danger ? 'bg-red-50 border-red-200/50' : 'bg-slate-50 border-slate-200/60'}`}>
      <span className={`text-[10px] font-bold uppercase tracking-[0.15em] mb-1 ${danger ? 'text-red-600/80' : 'text-slate-500'}`}>{label}</span>
      <span className={`text-3xl font-headline font-extrabold ${danger ? 'text-red-700' : 'text-slate-900'}`}>{value}</span>
    </div>
  )
}

export function InsightCard({ text }: InsightCardProps) {
  return (
    <div className="bg-surface-container-lowest p-4 rounded-xl border-l-4 border-on-primary-fixed-variant shadow-sm">
      <p className="text-sm font-semibold text-on-surface leading-tight">{text}</p>
    </div>
  )
}
