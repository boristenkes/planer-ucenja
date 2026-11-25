export interface Plan {
  id: string
  subject: string
  examDate: string
  startDate: string
  done: string[]
}

export type Phase = 'learn' | 'review' | 'final'

export interface ScheduleDay {
  date: string
  kind: 'study' | 'rest' | 'exam'
  minutes: number
  phase?: Phase
  subjectId?: string
  subject?: string
}

const WEEKDAYS = ['nedelja', 'ponedeljak', 'utorak', 'sreda', 'četvrtak', 'petak', 'subota']
const WEEKDAYS_SHORT = ['ned', 'pon', 'uto', 'sre', 'čet', 'pet', 'sub']
const MONTHS = ['januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar']

export const PHASE_LABELS: Record<Phase, string> = {
  learn: 'Učenje gradiva',
  review: 'Ponavljanje',
  final: 'Završno ponavljanje',
}

export function toISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

export function diffDays(from: Date, to: Date): number {
  return Math.round((Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) - Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) / 86_400_000)
}

export function formatShortDate(iso: string): string {
  const date = parseISO(iso)
  return `${date.getDate()}. ${MONTHS[date.getMonth()]}`
}

export function formatLongDate(iso: string): string {
  const date = parseISO(iso)
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()}. ${MONTHS[date.getMonth()]} ${date.getFullYear()}.`
}

export function formatWeekday(iso: string): string {
  return WEEKDAYS_SHORT[parseISO(iso).getDay()]
}

export function formatMinutes(total: number): string {
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  if (!hours) return `${minutes} min`
  if (!minutes) return `${hours} h`
  return `${hours} h ${minutes} min`
}

export function pluralDays(n: number): string {
  return n % 10 === 1 && n % 100 !== 11 ? 'dan' : 'dana'
}

export function pluralSessions(n: number): string {
  return n % 10 === 1 && n % 100 !== 11 ? 'termin' : 'termina'
}

function phaseFor(index: number, total: number): Phase {
  if (total > 1 && index === total - 1) return 'final'
  const progress = index / Math.max(1, total)
  return progress < 0.6 ? 'learn' : progress < 0.85 ? 'review' : 'final'
}

/** Raspoređuje globalni nedeljni fond u termine od po 30 minuta; svaki termin ide ispitu sa najbližim datumom. */
export function generateSchedule(plans: Plan[], hoursPerWeek: number, today: string): ScheduleDay[] {
  if (!plans.length) return []
  const active = plans
    .filter((plan) => plan.examDate >= today)
    .sort((a, b) => a.examDate.localeCompare(b.examDate) || a.subject.localeCompare(b.subject))
  if (!active.length) return []

  const lastExam = active[active.length - 1].examDate
  const count = Math.max(0, diffDays(parseISO(today), parseISO(lastExam)))
  const days: ScheduleDay[] = []
  const blocks = new Map<number, number>()

  for (let offset = 0; offset < count; offset += 7) {
    const length = Math.min(7, count - offset)
    const chunks = Math.max(1, Math.round((hoursPerWeek * 60 * length) / 7 / 30))
    const slots = chunks
    for (let i = 0; i < slots; i++) {
      const dayOffset = offset + Math.min(length - 1, Math.floor((i + 0.5) * length / slots))
      blocks.set(dayOffset, (blocks.get(dayOffset) ?? 0) + 1)
    }
  }

  for (let offset = 0; offset <= count; offset++) {
    const date = toISO(addDays(parseISO(today), offset))
    const examsToday = active.filter((plan) => plan.examDate === date)
    for (const plan of examsToday) days.push({ date, kind: 'exam', minutes: 0, subjectId: plan.id, subject: plan.subject })
    if (offset === count) continue

    const minutes = (blocks.get(offset) ?? 0) * 30
    if (!minutes) {
      days.push({ date, kind: 'rest', minutes: 0 })
      continue
    }

    const eligible = active.filter((plan) => plan.examDate > date)
    const plan = eligible[0]
    if (!plan) continue
    const elapsed = diffDays(parseISO(plan.startDate < today ? today : plan.startDate), parseISO(date))
    const duration = Math.max(1, diffDays(parseISO(plan.startDate < today ? today : plan.startDate), parseISO(plan.examDate)))
    const phase = phaseFor(elapsed, duration)
    days.push({ date, kind: 'study', minutes, phase, subjectId: plan.id, subject: plan.subject })
  }
  return days
}

export function groupByWeek(days: ScheduleDay[]): ScheduleDay[][] {
  const weeks: ScheduleDay[][] = []
  const start = days.find((day) => day.kind !== 'exam')?.date ?? days[0]?.date
  if (!start) return weeks
  const byWeek = new Map<number, ScheduleDay[]>()
  for (const day of days) {
    const index = Math.floor(diffDays(parseISO(start), parseISO(day.date)) / 7)
    const week = byWeek.get(index) ?? []
    week.push(day)
    byWeek.set(index, week)
  }
  for (const [, week] of [...byWeek.entries()].sort(([a], [b]) => a - b)) weeks.push(week)
  return weeks
}

export interface PlanStats {
  totalMinutes: number
  doneMinutes: number
  sessions: number
  doneSessions: number
  daysLeft: number
}

export function getStats(plans: Plan[], schedule: ScheduleDay[], today: string): PlanStats {
  const study = schedule.filter((day) => day.kind === 'study')
  const planById = new Map(plans.map((plan) => [plan.id, plan]))
  const doneStudy = study.filter((day) => !!day.subjectId && planById.get(day.subjectId)?.done.includes(day.date))
  return {
    totalMinutes: study.reduce((sum, day) => sum + day.minutes, 0),
    doneMinutes: doneStudy.reduce((sum, day) => sum + day.minutes, 0),
    sessions: study.length,
    doneSessions: doneStudy.length,
    daysLeft: plans.length ? Math.max(0, diffDays(parseISO(today), parseISO(plans.filter((p) => p.examDate >= today).sort((a, b) => a.examDate.localeCompare(b.examDate))[0]?.examDate ?? today))) : 0,
  }
}
