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
  volume: number
  opacity: number
  text?: string
  fontSize?: number
  fontWeight?: 'normal' | 'bold' | 'lighter'
  fontFamily?: string
  textColor?: string
  textAlign?: 'left' | 'center' | 'right'
  scale: number
  positionX: number
  positionY: number
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

  setTracks: (tracks: TimelineTrackData[]) => void
  setClips: (clips: TimelineClipData[]) => void

  initializeDefaultTracks: () => void
  clearAll: () => void
  getClipsOnTrack: (trackId: string) => TimelineClipData[]
  getSelectedClip: () => TimelineClipData | undefined
  getTotalDuration: () => number
  getActiveClipsAtTime: (time: number) => TimelineClipData[]
}

let clipCounter = 0

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
    set((state) => ({ tracks: [...state.tracks, { ...track, id }] }))
    return id
  },

  removeTrack: (id) => {
    set((state) => ({
      tracks: state.tracks.filter((t) => t.id !== id),
      clips: state.clips.filter((c) => c.trackId !== id),
    }))
  },

  updateTrack: (id, updates) => {
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))
  },

  addClip: (clip) => {
    const id = `clip_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    set((state) => ({ clips: [...state.clips, { ...clip, id }] }))
    return id
  },

  removeClip: (id) => {
    set((state) => ({
      clips: state.clips.filter((c) => c.id !== id),
      selectedClipId: state.selectedClipId === id ? null : state.selectedClipId,
    }))
  },

  updateClip: (id, updates) => {
    set((state) => ({
      clips: state.clips.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }))
  },

  moveClip: (id, newTrackId, newStartTime) => {
    set((state) => ({
      clips: state.clips.map((c) =>
        c.id === id ? { ...c, trackId: newTrackId, startTime: Math.max(0, newStartTime) } : c
      ),
    }))
  },

  splitClip: (id, splitTime) => {
    const clip = get().clips.find((c) => c.id === id)
    if (!clip) return
    const relativeTime = splitTime - clip.startTime
    if (relativeTime <= 0 || relativeTime >= clip.duration) return

    const firstDuration = relativeTime
    const secondDuration = clip.duration - relativeTime

    const newClipId = `clip_${Date.now()}_split_${Math.random().toString(36).substr(2, 5)}`

    set((state) => ({
      clips: [
        ...state.clips.map((c) =>
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
    }))
  },

  duplicateClip: (id) => {
    const clip = get().clips.find((c) => c.id === id)
    if (!clip) return

    const allClips = get().clips.filter((c) => c.trackId === clip.trackId)
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

  setTracks: (newTracks) => set({ tracks: newTracks }),
  setClips: (newClips) => set({ clips: newClips }),

  initializeDefaultTracks: () => {
    const { tracks } = get()
    if (tracks.length > 0) return

    get().addTrack({ type: 'video', name: 'Video 1', muted: false, locked: false, visible: true, height: 64 })
    get().addTrack({ type: 'video', name: 'Video 2', muted: false, locked: false, visible: true, height: 64 })
    get().addTrack({ type: 'image', name: 'Imagen', muted: false, locked: false, visible: true, height: 56 })
    get().addTrack({ type: 'text', name: 'Texto', muted: false, locked: false, visible: true, height: 48 })
    get().addTrack({ type: 'audio', name: 'Audio', muted: false, locked: false, visible: true, height: 48 })
  },

  clearAll: () => {
    set({ clips: [], selectedClipId: null, currentTime: 0, isPlaying: false })
  },

  getClipsOnTrack: (trackId) => {
    return get().clips.filter((c) => c.trackId === trackId).sort((a, b) => a.startTime - b.startTime)
  },

  getSelectedClip: () => {
    return get().clips.find((c) => c.id === get().selectedClipId)
  },

  getTotalDuration: () => {
    const { clips } = get()
    if (clips.length === 0) return 30
    return Math.max(30, ...clips.map((c) => c.startTime + c.duration)) + 5
  },

  getActiveClipsAtTime: (time) => {
    return get().clips.filter(
      (c) => time >= c.startTime && time < c.startTime + c.duration
    )
  },
}))