'use client'

import { useEffect, useRef } from 'react'
import { useTimelineStore } from '@/lib/timeline-store'
import { useAppStore } from '@/lib/store'

export function useAutoSave() {
  const { tracks, duration } = useTimelineStore()
  const { currentProjectId, setSaveStatus, setCurrentProjectId } = useAppStore()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedRef = useRef<string>('')
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (!currentProjectId) return

    const currentData = JSON.stringify({ tracks, duration })
    if (currentData === lastSavedRef.current) return

    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    setSaveStatus('saving')

    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/projects/${currentProjectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tracksJson: currentData,
            duration,
          }),
        })

        if (res.ok) {
          lastSavedRef.current = currentData
          setSaveStatus('saved')
        } else {
          setSaveStatus('error')
        }
      } catch {
        setSaveStatus('error')
      }
    }, 2000)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [tracks, duration, currentProjectId, setSaveStatus])
}
