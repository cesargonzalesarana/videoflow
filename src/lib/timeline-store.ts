import { create } from 'zustand'

export type TrackType = 'video' | 'audio' | 'text' | 'image'

export interface TimelineClipData {
  id: string
  trackId: string
  type: TrackType
  name: string
  startTime: number
  duration: number
  trimStart: number
  trimEnd: number
  file?: File
  previewUrl?: string
  storagePath?: string
  // Audio
  volume: number
  // Visual
  opacity: number
  // Text props
  text?: string
  fontSize?: number
  fontWeight?: 'normal' | 'bold' | 'lighter'
  fontFamily?: string
  textColor?: string
  textAlign?: 'left' | 'center' | 'right'
  // Image / video props
  scale: number
  positionX: number
  positionY: number
  // Effects
  transition: 'none' | 'fade' | 'slide-left' | 'slide-right' | 'dissolve' | 'zoom-in'
  filter: 'none' | 'grayscale' | 'sepia' | 'blur' | 'brightness-up' | 'contrast-up'
}

export interface TimelineTrackData {
  id: string
  type: TrackType
  name: string
  muted: boolean
  locked: boolean
  visible: boolean
  height: number
}

interface TimelineState {
  tracks: TimelineTrackData[]
  clips: TimelineClipData[]
  currentTime: number
  isPlaying: boolean
  zoom: number
  selectedClipId: string | null
  scrollX: number

  addTrack: (track: Omit<TimelineTrackData, 'id'>) => string
  removeTrack: (id: string) => void
  updateTrack: (id: string, updates: Partial<TimelineTrackData>) => void

  addClip: (clip: Omit<TimelineClipData, 'id'>) => string
  removeClip: (id: string) => void
  updateClip: (id: string, updates: Partial<TimelineClipData>) => void
  moveClip: (id: string, newTrackId: string, newStartTime: number) => void
  splitClip: (id: string, splitTime: number) => void
  duplicateClip: (id: string) => void

  setCurrentTime: (time: number) => void
  setIsPlaying: (playing: boolean) => void
  setZoom: (zoom: number) => void
  setSelectedClipId: (id: string | null) => void
  setScrollX: (x: number) => void

  initializeDefaultTracks: () => void
  clearAll: () => void
  getClipsOnTrack: (trackId: string) => TimelineClipData[]
  getSelectedClip: () => TimelineClipData | undefined
  getTotalDuration: () => number
  getActiveClipsAtTime: (time: number) => TimelineClipData[]
}

let clipCounter = 0

// Helper: always ensure clips is an array
const safeClips = (state: TimelineState): TimelineClipData[] => {
  return Array.isArray(state.clips) ? state.clips : []
}

// Helper: always ensure tracks is an array
const safeTracks = (state: TimelineState): TimelineTrackData[] => {
  return Array.isArray(state.tracks) ? state.tracks : []
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  tracks: [],
  clips: [],
  currentTime: 0,
  isPlaying: false,
  zoom: 80,
  selectedClipId: null,
  scrollX: 0,

  addTrack: (track) => {
    const id = `track_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    set((state) => ({ tracks: [...(safeTracks(state) || []), { ...track, id }] }))
    return id
  },

  removeTrack: (id) => {
    set((state) => ({
      tracks: (safeTracks(state) || []).filter((t) => t.id !== id),
      clips: (safeClips(state) || []).filter((c) => c.trackId !== id),
    }))
  },

  updateTrack: (id, updates) => {
    set((state) => ({
      tracks: (safeTracks(state) || []).map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))
  },

  addClip: (clip) => {
    const id = `clip_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    set((state) => ({ clips: [...(safeClips(state) || []), { ...clip, id }] }))
    return id
  },

  removeClip: (id) => {
    set((state) => ({
      clips: (safeClips(state) || []).filter((c) => c.id !== id),
      selectedClipId: state.selectedClipId === id ? null : state.selectedClipId,
    }))
  },

  updateClip: (id, updates) => {
    set((state) => ({
      clips: (safeClips(state) || []).map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }))
  },

  moveClip: (id, newTrackId, newStartTime) => {
    set((state) => ({
      clips: (safeClips(state) || []).map((c) =>
        c.id === id ? { ...c, trackId: newTrackId, startTime: Math.max(0, newStartTime) } : c
      ),
    }))
  },

  splitClip: (id, splitTime) => {
    const clip = (safeClips(get()) || []).find((c) => c.id === id)
    if (!clip) return
    const relativeTime = splitTime - clip.startTime
    if (relativeTime <= 0 || relativeTime >= clip.duration) return

    const firstDuration = relativeTime
    const secondDuration = clip.duration - relativeTime

    const newClipId = `clip_${Date.now()}_split_${Math.random().toString(36).substr(2, 5)}`

    set((state) => {
      const currentClips = safeClips(state) || []
      return {
        clips: [
          ...currentClips.map((c) =>
            c.id === id ? { ...c, duration: firstDuration } : c
          ),
          {
            ...clip,
            id: newClipId,
            startTime: splitTime,
            duration: secondDuration,
            trimStart: clip.trimStart + firstDuration,
          },
        ],
      }
    })
  },

  duplicateClip: (id) => {
    const clip = (safeClips(get()) || []).find((c) => c.id === id)
    if (!clip) return

    const allClips = (safeClips(get()) || []).filter((c) => c.trackId === clip.trackId)
    const lastEnd = allClips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 0)
    const newStartTime = Math.max(lastEnd, clip.startTime + clip.duration)

    get().addClip({
      ...clip,
      startTime: newStartTime,
      name: `${clip.name} (copia)`,
    })
  },

  setCurrentTime: (time) => set({ currentTime: Math.max(0, time) }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setZoom: (zoom) => set({ zoom: Math.max(20, Math.min(300, zoom)) }),
  setSelectedClipId: (id) => set({ selectedClipId: id }),
  setScrollX: (x) => set({ scrollX: x }),

  initializeDefaultTracks: () => {
    try {
      const { tracks } = get()
      if (tracks && tracks.length > 0) return

      get().addTrack({ type: 'video', name: 'Video 1', muted: false, locked: false, visible: true, height: 64 })
      get().addTrack({ type: 'video', name: 'Video 2', muted: false, locked: false, visible: true, height: 64 })
      get().addTrack({ type: 'text', name: 'Texto', muted: false, locked: false, visible: true, height: 48 })
      get().addTrack({ type: 'audio', name: 'Audio', muted: false, locked: false, visible: true, height: 48 })
    } catch (e) {
      console.error('[VideoFlow] initializeDefaultTracks error:', e)
    }
  },

  clearAll: () => {
    set({ clips: [], selectedClipId: null, currentTime: 0, isPlaying: false })
  },

  getClipsOnTrack: (trackId) => {
    try {
      return (safeClips(get()) || []).filter((c) => c.trackId === trackId).sort((a, b) => a.startTime - b.startTime)
    } catch {
      return []
    }
  },

  getSelectedClip: () => {
    try {
      return (safeClips(get()) || []).find((c) => c.id === get().selectedClipId)
    } catch {
      return undefined
    }
  },

  getTotalDuration: () => {
    try {
      const clips = safeClips(get()) || []
      if (!clips || clips.length === 0) return 30
      return Math.max(30, ...clips.map((c) => (c.startTime || 0) + (c.duration || 0))) + 5
    } catch {
      return 30
    }
  },

  getActiveClipsAtTime: (time) => {
    try {
      return (safeClips(get()) || []).filter(
        (c) => time >= c.startTime && time < c.startTime + c.duration
      )
    } catch {
      return []
    }
  },
}))
