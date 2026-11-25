'use client'

import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { addDays, diffDays, formatShortDate, parseISO, toISO, type Plan } from '@/lib/planner'

interface PlanListProps {
  plans: Plan[]
  activeId: string | null
  today: string
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onUpdateDate: (id: string, date: string) => void
}

export function PlanList({ plans, activeId, today, onSelect, onDelete, onUpdateDate }: PlanListProps) {
  if (plans.length === 0) return null
  const minDate = toISO(addDays(parseISO(today), 1))
  return (
    <section aria-labelledby="plans-heading">
      <h2 id="plans-heading" className="mb-3 font-heading text-lg font-semibold">Predmeti i ispiti</h2>
      <ul className="flex flex-col gap-2">
        {plans.map((plan) => {
          const isActive = plan.id === activeId
          const left = diffDays(parseISO(today), parseISO(plan.examDate))
          return (
            <li key={plan.id} className={cn('rounded-lg border bg-card p-3 transition-colors', isActive ? 'border-primary ring-1 ring-primary' : 'border-border')}>
              <div className="flex items-start gap-1">
                <button type="button" onClick={() => onSelect(plan.id)} aria-current={isActive ? 'true' : undefined} className="min-w-0 flex-1 rounded-lg text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/40">
                  <span className="block truncate text-sm font-medium">{plan.subject}</span>
                  <span className="text-xs text-muted-foreground">{left < 0 ? 'Ispit je prošao' : `${left} dana do ispita`}</span>
                </button>
                <button type="button" onClick={() => { if (window.confirm(`Obrisati predmet „${plan.subject}“?`)) onDelete(plan.id) }} aria-label={`Obriši predmet ${plan.subject}`} className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-destructive focus-visible:ring-3 focus-visible:ring-ring/40">
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
              <label htmlFor={`exam-${plan.id}`} className="mt-2 block text-xs text-muted-foreground">Datum ispita</label>
              <input id={`exam-${plan.id}`} type="date" min={minDate} value={plan.examDate} onChange={(event) => { if (event.target.value) onUpdateDate(plan.id, event.target.value) }} className="mt-1 h-9 w-full rounded-md border border-input bg-card px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/30" />
            </li>
          )
        })}
      </ul>
    </section>
  )
}
