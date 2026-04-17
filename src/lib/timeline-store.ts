import { create } from 'zustand'

export interface Clip {
  id: string
  trackId: string
  type: 'video' | 'audio' | 'text' | 'image'
  name: string
  src?: string
  startTime: number
  duration: number
  volume?: number
  opacity?: number
  text?: string
  fontSize?: number
  color?: string
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
  setTracks: (tracks: Track[]) => void
  addClip: (trackId: string, clip: Clip) => void
  removeClip: (clipId: string) => void
  updateClip: (clipId: string, updates: Partial<Clip>) => void
  setCurrentTime: (time: number) => void
  setIsPlaying: (playing: boolean) => void
  setZoom: (zoom: number) => void
  setSelectedClipId: (id: string | null) => void
  moveClip: (clipId: string, newStartTime: number, newTrackId?: string) => void
}

const defaultTracks: Track[] = [
  { id: 'track-1', name: 'Video 1', type: 'video', clips: [], muted: false, locked: false, visible: true },
  { id: 'track-2', name: 'Audio 1', type: 'audio', clips: [], muted: false, locked: false, visible: true },
  { id: 'track-3', name: 'Texto', type: 'text', clips: [], muted: false, locked: false, visible: true },
  { id: 'track-4', name: 'Imágenes', type: 'image', clips: [], muted: false, locked: false, visible: true },
]

export const useTimelineStore = create<TimelineState>((set) => ({
  tracks: defaultTracks,
  duration: 300,
  currentTime: 0,
  isPlaying: false,
  zoom: 1,
  selectedClipId: null,
  setTracks: (tracks) => set({ tracks }),
  addClip: (trackId, clip) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, clips: [...t.clips, clip] } : t
      ),
    })),
  removeClip: (clipId) =>
    set((state) => ({
      tracks: state.tracks.map((t) => ({
        ...t,
        clips: t.clips.filter((c) => c.id !== clipId),
      })),
      selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId,
    })),
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
  moveClip: (clipId, newStartTime, newTrackId) =>
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
            ? { ...t, clips: [...t.clips, { ...clipToMove!, startTime: newStartTime, trackId: targetTrackId }] }
            : t
        ),
      }
    }),
}))