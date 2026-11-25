'use client'

import {
	PHASE_LABELS,
	formatLongDate,
	formatMinutes,
	formatShortDate,
	formatWeekday,
	generateSchedule,
	getStats,
	groupByWeek,
	pluralDays,
	pluralSessions,
	type Plan,
	type ScheduleDay
} from '@/lib/planner'
import { cn } from '@/lib/utils'
import { GraduationCap } from 'lucide-react'
import { useMemo } from 'react'

interface PlanViewProps {
	plans: Plan[]
	hoursPerWeek: number
	today: string
	onToggleDone: (planId: string, date: string) => void
}

export function PlanView({
	plans,
	hoursPerWeek,
	today,
	onToggleDone
}: PlanViewProps) {
	const schedule = useMemo(
		() => generateSchedule(plans, hoursPerWeek, today),
		[plans, hoursPerWeek, today]
	)
	const weeks = useMemo(() => groupByWeek(schedule), [schedule])
	const stats = getStats(plans, schedule, today)
	const percent = stats.totalMinutes
		? Math.round((stats.doneMinutes / stats.totalMinutes) * 100)
		: 0
	const subjects = new Map(plans.map(plan => [plan.id, plan]))
	if (!plans.length) return <EmptyState />

	return (
		<div className='flex flex-col gap-6'>
			<header className='rounded-2xl border border-border bg-card p-5 sm:p-6'>
				<p className='text-sm text-muted-foreground'>Zajednički raspored</p>
				<h2 className='mt-1 font-heading text-3xl font-bold sm:text-4xl'>
					Svi predmeti
				</h2>
				<p className='mt-2 text-sm text-muted-foreground'>
					Nedeljni fond od {hoursPerWeek.toString().replace('.', ',')} h
					raspoređen je prema najbližem ispitu. Najpre se uči predmet sa
					skorijim ispitom.
				</p>
				<dl className='mt-6 grid grid-cols-3 gap-3 border-t border-border pt-5'>
					<Stat
						label='Planirano'
						value={formatMinutes(stats.totalMinutes)}
					/>
					<Stat
						label='Termini završeni'
						value={`${stats.doneSessions}/${stats.sessions}`}
						hint={pluralSessions(stats.sessions)}
					/>
					<Stat
						label='Završeno'
						value={`${percent}%`}
					/>
				</dl>
				<div
					role='progressbar'
					aria-label='Ukupan napredak u učenju'
					aria-valuemin={0}
					aria-valuemax={100}
					aria-valuenow={percent}
					className='mt-4 h-2 overflow-hidden rounded-full bg-secondary'
				>
					<div
						className='h-full rounded-full bg-primary transition-[width] duration-500'
						style={{ width: `${percent}%` }}
					/>
				</div>
			</header>

			<section
				aria-labelledby='upcoming-heading'
				className='rounded-xl border border-border bg-card p-4'
			>
				<h3
					id='upcoming-heading'
					className='font-heading font-semibold'
				>
					Predstojeći ispiti
				</h3>
				<ul className='mt-3 flex flex-col gap-2'>
					{[...plans]
						.sort((a, b) => a.examDate.localeCompare(b.examDate))
						.map(plan => {
							const days = Math.max(
								0,
								Math.round(
									(Date.parse(`${plan.examDate}T00:00:00`) -
										Date.parse(`${today}T00:00:00`)) /
										86_400_000
								)
							)
							return (
								<li
									key={plan.id}
									className='flex items-center justify-between gap-3 text-sm'
								>
									<span className='truncate font-medium'>{plan.subject}</span>
									<span className='shrink-0 text-muted-foreground'>
										{formatShortDate(plan.examDate)}
										{days >= 0 && (
											<span>
												{' '}
												· {days} {pluralDays(days)}
											</span>
										)}
									</span>
								</li>
							)
						})}
				</ul>
			</section>

			{weeks.map((week, index) => {
				const minutes = week.reduce((sum, day) => sum + day.minutes, 0)
				return (
					<section
						key={week[0]?.date ?? index}
						aria-labelledby={`week-${index}`}
					>
						<div className='mb-2 flex flex-wrap items-baseline justify-between gap-2 px-1'>
							<h3
								id={`week-${index}`}
								className='font-heading text-lg font-semibold'
							>
								Nedelja {index + 1}
								<span className='ml-2 text-sm font-normal text-muted-foreground'>
									{formatShortDate(week[0].date)} –{' '}
									{formatShortDate(week[week.length - 1].date)}
								</span>
							</h3>
							{minutes > 0 && (
								<p className='text-sm text-muted-foreground'>
									{formatMinutes(minutes)} ukupno
								</p>
							)}
						</div>
						<ul className='divide-y divide-border overflow-hidden rounded-xl border border-border bg-card'>
							{week.map((day, i) => (
								<DayRow
									key={`${day.date}-${day.kind}-${day.subjectId ?? i}`}
									day={day}
									today={day.date === today}
									plan={day.subjectId ? subjects.get(day.subjectId) : undefined}
									onToggle={() =>
										day.subjectId && onToggleDone(day.subjectId, day.date)
									}
								/>
							))}
						</ul>
					</section>
				)
			})}
		</div>
	)
}

function Stat({
	label,
	value,
	hint
}: {
	label: string
	value: string
	hint?: string
}) {
	return (
		<div>
			<dt className='text-xs text-muted-foreground sm:text-sm'>{label}</dt>
			<dd className='mt-0.5 font-heading text-xl font-semibold tabular-nums sm:text-2xl'>
				{value}
				{hint && <span className='sr-only'> {hint}</span>}
			</dd>
		</div>
	)
}

function DayRow({
	day,
	today,
	plan,
	onToggle
}: {
	day: ScheduleDay
	today: boolean
	plan?: Plan
	onToggle: () => void
}) {
	const checked = !!plan?.done.includes(day.date)
	const dateBlock = (
		<div className='w-16 shrink-0 sm:w-24'>
			<p
				className={cn(
					'text-xs font-medium uppercase tracking-wide text-muted-foreground',
					day.kind === 'exam' && 'text-accent-foreground'
				)}
			>
				{formatWeekday(day.date)}
			</p>
			<p className='text-sm font-medium tabular-nums'>
				{formatShortDate(day.date)}
			</p>
		</div>
	)
	if (day.kind === 'exam')
		return (
			<li className='flex items-center gap-3 bg-accent px-4 py-3 text-accent-foreground'>
				{dateBlock}
				<GraduationCap
					className='size-5 shrink-0'
					aria-hidden='true'
				/>
				<p className='font-heading text-base font-semibold'>
					Ispit – {day.subject}
				</p>
			</li>
		)
	if (day.kind === 'rest')
		return (
			<li
				className={cn(
					'flex items-center gap-3 px-4 py-2.5',
					today && 'bg-secondary/60'
				)}
			>
				{dateBlock}
				<p className='text-sm text-muted-foreground'>Odmor</p>
				{today && <TodayTag />}
			</li>
		)
	return (
		<li
			className={cn(
				'flex items-center gap-3 px-4 py-3',
				today && 'bg-secondary/60',
				checked && 'bg-muted/60'
			)}
		>
			{dateBlock}
			<div className='min-w-0 flex-1'>
				<div className='flex flex-wrap items-center gap-x-2'>
					<p
						className={cn(
							'text-sm font-medium',
							checked && 'text-muted-foreground line-through'
						)}
					>
						{day.subject}
					</p>
					{today && <TodayTag />}
				</div>
				<p className='mt-0.5 text-xs text-muted-foreground'>
					{PHASE_LABELS[day.phase ?? 'learn']}
				</p>
			</div>
			<p className='w-16 shrink-0 text-right text-sm font-medium tabular-nums'>
				{formatMinutes(day.minutes)}
			</p>
			<input
				type='checkbox'
				checked={checked}
				onChange={onToggle}
				aria-label={`Označi kao urađeno: ${day.subject}, ${formatLongDate(day.date)}`}
				className='size-5 shrink-0 cursor-pointer rounded accent-primary'
			/>
		</li>
	)
}

function TodayTag() {
	return (
		<span className='rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground'>
			Danas
		</span>
	)
}

function EmptyState() {
	return (
		<div className='flex flex-col items-start gap-2 rounded-2xl border border-dashed border-input p-8'>
			<p className='font-heading text-xl font-semibold'>
				Raspored će se pojaviti ovde
			</p>
			<p className='max-w-md text-muted-foreground'>
				Dodaj predmete i datume ispita. Zajednički nedeljni fond sati biće
				raspoređen tako da predmeti sa najbližim ispitima imaju prioritet.
			</p>
		</div>
	)
}
