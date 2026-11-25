'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Plan } from '@/lib/planner'

const STORAGE_KEY = 'study-planner:v2'

interface Store {
  plans: Plan[]
  activeId: string | null
  hoursPerWeek: number
}

const EMPTY_STORE: Store = { plans: [], activeId: null, hoursPerWeek: 10 }

function readStore(): Store {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Store>
      const plans = Array.isArray(parsed.plans) ? parsed.plans.map((plan) => ({
        id: plan.id,
        subject: plan.subject,
        examDate: plan.examDate,
        startDate: plan.startDate ?? new Date().toISOString().slice(0, 10),
        done: Array.isArray(plan.done) ? plan.done : [],
      })) : []
      const activeId = plans.some((plan) => plan.id === parsed.activeId) ? parsed.activeId! : plans[0]?.id ?? null
      const legacyHours = (JSON.parse(raw) as { plans?: { hoursPerWeek?: number }[] }).plans?.[0]?.hoursPerWeek
      const hoursPerWeek = Number(parsed.hoursPerWeek ?? legacyHours ?? EMPTY_STORE.hoursPerWeek)
      return { plans, activeId, hoursPerWeek: Number.isFinite(hoursPerWeek) ? Math.min(60, Math.max(0.5, hoursPerWeek)) : 10 }
    }
    const legacy = window.localStorage.getItem('study-planner:v1')
    if (legacy) {
      const parsed = JSON.parse(legacy) as { plans?: Plan[]; activeId?: string | null }
      const plans = (parsed.plans ?? []).map((plan) => ({
        id: plan.id, subject: plan.subject, examDate: plan.examDate,
        startDate: plan.startDate ?? new Date().toISOString().slice(0, 10), done: plan.done ?? [],
      }))
      const oldHours = (parsed.plans?.[0] as Plan & { hoursPerWeek?: number } | undefined)?.hoursPerWeek
      return { plans, activeId: parsed.activeId ?? plans[0]?.id ?? null, hoursPerWeek: oldHours ?? 10 }
    }
    return EMPTY_STORE
  } catch {
    return EMPTY_STORE
  }
}

export function usePlans() {
  const [store, setStore] = useState<Store>(EMPTY_STORE)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setStore(readStore())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
    } catch {
      // Skladište je puno ili onemogućeno; aplikacija nastavlja da radi u memoriji.
    }
  }, [store, hydrated])

  const addPlan = useCallback((plan: Plan) => {
    setStore((prev) => ({ ...prev, plans: [...prev.plans, plan], activeId: plan.id }))
  }, [])

  const selectPlan = useCallback((id: string) => setStore((prev) => ({ ...prev, activeId: id })), [])

  const deletePlan = useCallback((id: string) => {
    setStore((prev) => {
      const plans = prev.plans.filter((plan) => plan.id !== id)
      return { ...prev, plans, activeId: prev.activeId === id ? plans[0]?.id ?? null : prev.activeId }
    })
  }, [])

  const updateExamDate = useCallback((id: string, examDate: string) => {
    setStore((prev) => ({ ...prev, plans: prev.plans.map((plan) => plan.id === id ? { ...plan, examDate } : plan) }))
  }, [])

  const setHoursPerWeek = useCallback((hoursPerWeek: number) => {
    setStore((prev) => ({ ...prev, hoursPerWeek }))
  }, [])

  const toggleDone = useCallback((id: string, date: string) => {
    setStore((prev) => ({ ...prev, plans: prev.plans.map((plan) => {
      if (plan.id !== id) return plan
      return { ...plan, done: plan.done.includes(date) ? plan.done.filter((d) => d !== date) : [...plan.done, date] }
    }) }))
  }, [])

  return { hydrated, plans: store.plans, activePlan: store.plans.find((plan) => plan.id === store.activeId) ?? null,
    activeId: store.activeId, hoursPerWeek: store.hoursPerWeek, addPlan, selectPlan, deletePlan, updateExamDate, setHoursPerWeek, toggleDone }
}
