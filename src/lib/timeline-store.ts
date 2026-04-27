import { create } from 'zustand'

export interface Clip {
  id: string
  trackId: string
  type: 'video' | 'audio' | 'text' | 'image'
  name: string
  src?: string
  storagePath?: string
  startTime: number
  duration: number
  volume?: number
  opacity?: number
  text?: string
  fontSize?: number
  color?: string
  fadeIn?: number
  fadeOut?: number
}

export interface Track {
  id: string
  name: string
  type: 'video' | 'audio' | 'text' | 'image'
  clips: Clip[]
  muted: boolean
  locked: boolean
  visible: boolean
}

interface TimelineState {
  tracks: Track[]
  duration: number
  currentTime: number
  isPlaying: boolean
  zoom: number
  selectedClipId: string | null
  snapEnabled: boolean
  history: string[]
  historyIndex: number
  setTracks: (tracks: Track[]) => void
  addClip: (trackId: string, clip: Clip) => void
  removeClip: (clipId: string) => void
  updateClip: (clipId: string, updates: Partial<Clip>) => void
  setCurrentTime: (time: number) => void
  setIsPlaying: (playing: boolean) => void
  setZoom: (zoom: number) => void
  setSelectedClipId: (id: string | null) => void
  moveClip: (clipId: string, newStartTime: number, newTrackId?: string) => void
  splitClip: (clipId: string) => void
  duplicateClip: (clipId: string) => void
  setSnapEnabled: (enabled: boolean) => void
  saveHistory: () => void
  undo: () => void
  redo: () => void
}

const defaultTracks: Track[] = [
  { id: 'track-1', name: 'Video 1', type: 'video', clips: [], muted: false, locked: false, visible: true },
  { id: 'track-2', name: 'Audio 1', type: 'audio', clips: [], muted: false, locked: false, visible: true },
  { id: 'track-3', name: 'Texto', type: 'text', clips: [], muted: false, locked: false, visible: true },
  { id: 'track-4', name: 'Imagenes', type: 'image', clips: [], muted: false, locked: false, visible: true },
]

export const useTimelineStore = create<TimelineState>((set, get) => ({
  tracks: defaultTracks,
  duration: 300,
  currentTime: 0,
  isPlaying: false,
  zoom: 1,
  selectedClipId: null,
  snapEnabled: true,
  history: [],
  historyIndex: -1,
  setTracks: (tracks) => set({ tracks }),
  addClip: (trackId, clip) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, clips: [...t.clips, clip] } : t
      ),
    })),
  removeClip: (clipId) => {
    const state = get()
    state.saveHistory()
    set((state) => ({
      tracks: state.tracks.map((t) => ({
        ...t,
        clips: t.clips.filter((c) => c.id !== clipId),
      })),
      selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId,
    }))
  },
  updateClip: (clipId, updates) =>
    set((state) => ({
      tracks: state.tracks.map((t) => ({
        ...t,
        clips: t.clips.map((c) => (c.id === clipId ? { ...c, ...updates } : c)),
      })),
    })),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(4, zoom)) }),
  setSelectedClipId: (selectedClipId) => set({ selectedClipId }),
  moveClip: (clipId, newStartTime, newTrackId) => {
    const state = get()
    let snappedTime = newStartTime
    if (state.snapEnabled) {
      const allEdges: number[] = []
      state.tracks.forEach((t) =>
        t.clips.forEach((c) => {
          if (c.id !== clipId) {
            allEdges.push(c.startTime)
            allEdges.push(c.startTime + c.duration)
          }
        })
      )
      allEdges.push(0)
      let closest = 0
      let minDist = Infinity
      allEdges.forEach((edge) => {
        const dist = Math.abs(newStartTime - edge)
        if (dist < minDist) { minDist = dist; closest = edge }
      })
      if (minDist < 5 / (10 * state.zoom)) snappedTime = closest
    }
    set((state) => {
      let clipToMove: Clip | undefined
      const tracksWithoutClip = state.tracks.map((t) => {
        const clip = t.clips.find((c) => c.id === clipId)
        if (clip) clipToMove = clip
        return { ...t, clips: t.clips.filter((c) => c.id !== clipId) }
      })
      if (!clipToMove) return state
      const targetTrackId = newTrackId || clipToMove.trackId
      return {
        tracks: tracksWithoutClip.map((t) =>
          t.id === targetTrackId
            ? { ...t, clips: [...t.clips, { ...clipToMove!, startTime: snappedTime, trackId: targetTrackId }] }
            : t
        ),
      }
    })
  },
  splitClip: (clipId) => {
    const state = get()
    state.saveHistory()
    const { currentTime, tracks } = state
    let found = false
    const newTracks = tracks.map((t) => {
      const clip = t.clips.find((c) => c.id === clipId)
      if (!clip) return t
      if (currentTime <= clip.startTime || currentTime >= clip.startTime + clip.duration) return t
      found = true
      const splitPoint = currentTime - clip.startTime
      const clip1: Clip = { ...clip, duration: splitPoint, id: `clip-${Date.now()}-a`, fadeIn: clip.fadeIn, fadeOut: 0 }
      const clip2: Clip = { ...clip, startTime: currentTime, duration: clip.duration - splitPoint, id: `clip-${Date.now()}-b`, fadeIn: 0, fadeOut: clip.fadeOut }
      return { ...t, clips: t.clips.map((c) => (c.id === clipId ? clip1 : c)).concat(clip2) }
    })
    if (found) set({ tracks: newTracks, selectedClipId: null })
  },
  duplicateClip: (clipId) => {
    const state = get()
    state.saveHistory()
    const newTracks = state.tracks.map((t) => {
      const clip = t.clips.find((c) => c.id === clipId)
      if (!clip) return t
      const dup: Clip = { ...clip, id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, startTime: clip.startTime + clip.duration + 0.1 }
      return { ...t, clips: [...t.clips, dup] }
    })
    set({ tracks: newTracks })
  },
  setSnapEnabled: (snapEnabled) => set({ snapEnabled }),
  saveHistory: () => {
    const state = get()
    const historySlice = state.history.slice(0, state.historyIndex + 1)
    historySlice.push(JSON.stringify(state.tracks))
    set({ history: historySlice.slice(-50), historyIndex: historySlice.length - 1 })
  },
  undo: () => {
    const state = get()
    if (state.historyIndex <= 0) return
    const newIndex = state.historyIndex - 1
    const tracks = JSON.parse(state.history[newIndex])
    set({ tracks, historyIndex: newIndex, selectedClipId: null })
  },
  redo: () => {
    const state = get()
    if (state.historyIndex >= state.history.length - 1) return
    const newIndex = state.historyIndex + 1
    const tracks = JSON.parse(state.history[newIndex])
    set({ tracks, historyIndex: newIndex, selectedClipId: null })
  },
}))
