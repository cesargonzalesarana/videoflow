'use client'

import { useState, useEffect } from 'react'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'

export function OnboardingWrapper() {
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(function() {
    var done = localStorage.getItem('videoflow_onboarding_done')
    if (!done) {
      setShowOnboarding(true)
    }
  }, [])

  if (!showOnboarding) return null

  return <OnboardingFlow />
}
