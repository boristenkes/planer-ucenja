'use client'

import { useState } from 'react'
import { CalendarPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { addDays, parseISO, toISO, type Plan } from '@/lib/planner'

interface PlanFormProps {
  today: string
  onCreate: (plan: Plan) => void
}

const inputClass = 'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive'

export function PlanForm({ today, onCreate }: PlanFormProps) {
  const [subject, setSubject] = useState('')
  const [examDate, setExamDate] = useState('')
  const [error, setError] = useState('')
  const tomorrow = toISO(addDays(parseISO(today), 1))

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!subject.trim()) return setError('Unesi ime predmeta.')
    if (!examDate || examDate < tomorrow) return setError('Izaberi datum ispita koji je najranije sutra.')
    setError('')
    onCreate({ id: crypto.randomUUID(), subject: subject.trim(), examDate, startDate: today, done: [] })
    setSubject('')
    setExamDate('')
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="subject" className="text-sm font-medium">Predmet</label>
        <input id="subject" type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="npr. Matematička analiza" maxLength={80} autoComplete="off" aria-invalid={!!error && !subject.trim()} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="exam-date" className="text-sm font-medium">Datum ispita</label>
        <input id="exam-date" type="date" value={examDate} min={tomorrow} onChange={(e) => setExamDate(e.target.value)} aria-invalid={!!error && (!examDate || examDate < tomorrow)} className={inputClass} />
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg" className="mt-1 h-10 gap-2 text-sm"><CalendarPlus aria-hidden="true" />Dodaj predmet</Button>
    </form>
  )
}
