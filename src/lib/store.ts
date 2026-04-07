import { create } from 'zustand'

export type AppView = 
  | 'landing' 
  | 'dashboard' 
  | 'video-creator' 
  | 'scheduler' 
  | 'ai-trends' 
  | 'settings'

export type SidebarSection = 
  | 'dashboard' 
  | 'video-creator' 
  | 'scheduler' 
  | 'ai-trends' 
  | 'settings'

export interface User {
  id: string
  name: string
  email: string
}

export interface Video {
  id: string
  userId: string
  title: string
  description?: string
  status: 'draft' | 'processing' | 'completed' | 'failed'
  videoUrl?: string
  thumbnailUrl?: string
  duration?: number
  resolution?: string
  format?: string
  createdAt: string
  updatedAt: string
}

export interface ScheduledPost {
  id: string
  videoId: string
  userId: string
  platform: 'youtube' | 'tiktok' | 'instagram' | 'facebook'
  scheduledAt: string
  status: 'scheduled' | 'published' | 'failed'
  publishedAt?: string
  caption?: string
  hashtags?: string
  createdAt: string
}

export interface TrendTopic {
  id: string
  title: string
  category: string
  engagement: number
  growth: number
  description: string
  hashtags: string[]
}

export interface TimelineClip {
  id: string
  type: 'video' | 'image' | 'audio' | 'text'
  name: string
  duration: number
  startTime: number
  file?: File
  color?: string
}

interface AppState {
  // View state
  currentView: AppView
  sidebarOpen: boolean
  setView: (view: AppView) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  // Auth state
  user: User | null
  isAuthenticated: boolean
  isAuthLoading: boolean
  setUser: (user: User | null) => void
  setAuthenticated: (auth: boolean) => void
  setAuthLoading: (loading: boolean) => void
  login: (user: User) => void
  logout: () => void

  // Videos
  videos: Video[]
  setVideos: (videos: Video[]) => void
  addVideo: (video: Video) => void
  updateVideo: (id: string, updates: Partial<Video>) => void
  removeVideo: (id: string) => void

  // Scheduled posts
  scheduledPosts: ScheduledPost[]
  setScheduledPosts: (posts: ScheduledPost[]) => void
  addScheduledPost: (post: ScheduledPost) => void
  updateScheduledPost: (id: string, updates: Partial<ScheduledPost>) => void
  removeScheduledPost: (id: string) => void

  // AI Trends
  trends: TrendTopic[]
  setTrends: (trends: TrendTopic[]) => void

  // Timeline
  timelineClips: TimelineClip[]
  addTimelineClip: (clip: TimelineClip) => void
  removeTimelineClip: (id: string) => void
  updateTimelineClip: (id: string, updates: Partial<TimelineClip>) => void
  clearTimeline: () => void

  // Processing state
  isProcessing: boolean
  processingProgress: number
  setProcessing: (processing: boolean) => void
  setProcessingProgress: (progress: number) => void
}

export const useAppStore = create<AppState>((set) => ({
  // View state
  currentView: 'landing',
  sidebarOpen: false,
  setView: (view) => set({ currentView: view }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Auth state
  user: null,
  isAuthenticated: false,
  isAuthLoading: false,
  setUser: (user) => set({ user }),
  setAuthenticated: (auth) => set({ isAuthenticated: auth }),
  setAuthLoading: (loading) => set({ isAuthLoading: loading }),
  login: (user) => set({ user, isAuthenticated: true, isAuthLoading: false, currentView: 'dashboard' }),
  logout: () => set({ user: null, isAuthenticated: false, currentView: 'landing', videos: [], scheduledPosts: [], trends: [], timelineClips: [] }),

  // Videos
  videos: [],
  setVideos: (videos) => set({ videos }),
  addVideo: (video) => set((state) => ({ videos: [video, ...state.videos] })),
  updateVideo: (id, updates) => set((state) => ({
    videos: state.videos.map((v) => v.id === id ? { ...v, ...updates } : v)
  })),
  removeVideo: (id) => set((state) => ({
    videos: state.videos.filter((v) => v.id !== id)
  })),

  // Scheduled posts
  scheduledPosts: [],
  setScheduledPosts: (posts) => set({ scheduledPosts: posts }),
  addScheduledPost: (post) => set((state) => ({ scheduledPosts: [post, ...state.scheduledPosts] })),
  updateScheduledPost: (id, updates) => set((state) => ({
    scheduledPosts: state.scheduledPosts.map((p) => p.id === id ? { ...p, ...updates } : p)
  })),
  removeScheduledPost: (id) => set((state) => ({
    scheduledPosts: state.scheduledPosts.filter((p) => p.id !== id)
  })),

  // AI Trends
  trends: [],
  setTrends: (trends) => set({ trends }),

  // Timeline
  timelineClips: [],
  addTimelineClip: (clip) => set((state) => ({ timelineClips: [...state.timelineClips, clip] })),
  removeTimelineClip: (id) => set((state) => ({
    timelineClips: state.timelineClips.filter((c) => c.id !== id)
  })),
  updateTimelineClip: (id, updates) => set((state) => ({
    timelineClips: state.timelineClips.map((c) => c.id === id ? { ...c, ...updates } : c)
  })),
  clearTimeline: () => set({ timelineClips: [] }),

  // Processing state
  isProcessing: false,
  processingProgress: 0,
  setProcessing: (processing) => set({ isProcessing: processing }),
  setProcessingProgress: (progress) => set({ processingProgress: progress }),
}))
