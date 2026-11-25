'use client'

import { PlanForm } from '@/components/plan-form'
import { PlanList } from '@/components/plan-list'
import { PlanView } from '@/components/plan-view'
import { toISO } from '@/lib/planner'
import { usePlans } from '@/lib/use-plans'
import { BookOpenCheck, Clock3 } from 'lucide-react'
import { useEffect, useState } from 'react'

const hoursInputClass =
	'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30'

export function StudyPlanner() {
	const {
		hydrated,
		plans,
		activeId,
		hoursPerWeek,
		addPlan,
		selectPlan,
		deletePlan,
		updateExamDate,
		setHoursPerWeek,
		toggleDone
	} = usePlans()
	const [today, setToday] = useState<string | null>(null)
	const [hoursDraft, setHoursDraft] = useState('10')

	useEffect(() => {
		setToday(toISO(new Date()))
	}, [])
	useEffect(() => {
		if (hydrated) setHoursDraft(String(hoursPerWeek))
	}, [hydrated, hoursPerWeek])
	const ready = hydrated && today !== null

	function changeHours(value: string) {
		setHoursDraft(value)
		const parsed = Number(value.replace(',', '.'))
		if (value && Number.isFinite(parsed) && parsed >= 0.5 && parsed <= 60)
			setHoursPerWeek(Math.round(parsed * 2) / 2)
	}

	return (
		<div className='mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:py-12'>
			<header className='mb-8 flex items-center gap-3'>
				<span className='flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground'>
					<BookOpenCheck
						className='size-5'
						aria-hidden='true'
					/>
				</span>
				<div>
					<h1 className='font-heading text-2xl font-bold leading-tight sm:text-3xl'>
						Plan učenja
					</h1>
					<p className='text-sm text-muted-foreground'>
						Jedan fond vremena, svi predmeti.
					</p>
				</div>
			</header>

			<main className='grid flex-1 gap-8 lg:grid-cols-[20rem_1fr] lg:items-start'>
				<aside className='flex flex-col gap-6 lg:sticky lg:top-8'>
					<section
						aria-labelledby='hours-heading'
						className='rounded-2xl border border-border bg-card p-5'
					>
						<div className='mb-4 flex items-center gap-2'>
							<Clock3
								className='size-4 text-primary'
								aria-hidden='true'
							/>
							<h2
								id='hours-heading'
								className='font-heading text-lg font-semibold'
							>
								Vreme za učenje
							</h2>
						</div>
						<label
							htmlFor='weekly-hours'
							className='mb-1.5 block text-sm font-medium'
						>
							Ukupno sati nedeljno
						</label>
						{ready ? (
							<input
								id='weekly-hours'
								type='number'
								inputMode='decimal'
								min='0.5'
								max='60'
								step='0.5'
								value={hoursDraft}
								onChange={event => changeHours(event.target.value)}
								onBlur={() => {
									const parsed = Number(hoursDraft.replace(',', '.'))
									if (!Number.isFinite(parsed) || parsed < 0.5 || parsed > 60)
										setHoursDraft(String(hoursPerWeek))
								}}
								className={hoursInputClass}
							/>
						) : (
							<div
								className='h-10 animate-pulse rounded-lg bg-muted'
								aria-hidden='true'
							/>
						)}
						<p className='mt-2 text-xs text-muted-foreground'>
							Ovaj fond se deli na sve predmete. Svaka promena odmah preračunava
							raspored.
						</p>
					</section>

					<section
						aria-labelledby='new-plan-heading'
						className='rounded-2xl border border-border bg-card p-5'
					>
						<h2
							id='new-plan-heading'
							className='mb-4 font-heading text-lg font-semibold'
						>
							Dodaj predmet
						</h2>
						{ready ? (
							<PlanForm
								today={today}
								onCreate={addPlan}
							/>
						) : (
							<div
								className='h-52 animate-pulse rounded-lg bg-muted'
								aria-hidden='true'
							/>
						)}
					</section>

					{ready && (
						<PlanList
							plans={plans}
							activeId={activeId}
							today={today}
							onSelect={selectPlan}
							onDelete={deletePlan}
							onUpdateDate={updateExamDate}
						/>
					)}
				</aside>

				<div aria-live='polite'>
					{!ready ? (
						<div
							className='h-64 animate-pulse rounded-2xl bg-muted'
							aria-hidden='true'
						/>
					) : (
						<PlanView
							plans={plans}
							hoursPerWeek={hoursPerWeek}
							today={today}
							onToggleDone={toggleDone}
						/>
					)}
				</div>
			</main>
		</div>
	)
}
