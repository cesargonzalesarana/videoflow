const DB_NAME = 'videoflow-projects'
const DB_VERSION = 1
const FILES_STORE = 'files'
const PROJECTS_KEY = 'videoflow-saved-projects'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(FILES_STORE)) {
        db.createObjectStore(FILES_STORE)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

interface SavedProject {
  name: string
  createdAt: string
  updatedAt: string
  tracks: Record<string, unknown>[]
  clips: Record<string, unknown>[]
  mediaItems: Record<string, unknown>[]
}

function getAllProjects(): Record<string, SavedProject> {
  try {
    return JSON.parse(localStorage.getItem(PROJECTS_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveProjectsToStorage(projects: Record<string, SavedProject>) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
}

export async function saveProject(
  name: string,
  tracks: Record<string, unknown>[],
  clips: { id: string; file?: File; previewUrl?: string; [key: string]: unknown }[],
  mediaItems: { id: string; file?: File; previewUrl?: string; [key: string]: unknown }[]
): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(FILES_STORE, 'readwrite')
  const store = tx.objectStore(FILES_STORE)

  for (const clip of clips) {
    if (clip.file) {
      store.put(clip.file, `clip_${clip.id}`)
    }
  }

  for (const item of mediaItems) {
    if (item.file) {
      store.put(item.file, `media_${item.id}`)
    }
  }

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })

  const serializableClips = clips.map(({ file, previewUrl, ...rest }) => rest)
  const serializableMediaItems = mediaItems.map(({ file, previewUrl, ...rest }) => rest)

  const projects = getAllProjects()
  const existing = projects[name]

  projects[name] = {
    name,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tracks: JSON.parse(JSON.stringify(tracks)),
    clips: serializableClips as SavedProject['clips'],
    mediaItems: serializableMediaItems as SavedProject['mediaItems'],
  }

  saveProjectsToStorage(projects)
}

export async function loadProject(
  name: string
): Promise<{
  tracks: Record<string, unknown>[]
  clips: { id: string; file?: File; previewUrl?: string; [key: string]: unknown }[]
  mediaItems: { id: string; file?: File; previewUrl?: string; [key: string]: unknown }[]
}> {
  const projects = getAllProjects()
  const project = projects[name]
  if (!project) throw new Error(`Proyecto "${name}" no encontrado`)

  const db = await openDB()
  const tx = db.transaction(FILES_STORE, 'readonly')
  const fileStore = tx.objectStore(FILES_STORE)
  const files: Record<string, File> = {}

  const keys = [
    ...project.clips.map((c) => `clip_${c.id}`),
    ...project.mediaItems.map((m) => `media_${m.id}`),
  ]

  for (const key of keys) {
    const request = fileStore.get(key)
    request.onsuccess = () => {
      if (request.result) {
        files[key] = request.result as File
      }
    }
  }

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })

  const clips = project.clips.map((clip) => {
    const file = files[`clip_${clip.id}`]
    return {
      ...clip,
      file: file || undefined,
      previewUrl: file ? URL.createObjectURL(file) : undefined,
    }
  })

  const mediaItems = project.mediaItems.map((item) => {
    const file = files[`media_${item.id}`]
    return {
      ...item,
      file: file || undefined,
      previewUrl: file ? URL.createObjectURL(file) : undefined,
    }
  })

  return {
    tracks: project.tracks,
    clips,
    mediaItems,
  }
}

export interface ProjectInfo {
  name: string
  createdAt: string
  updatedAt: string
  clipCount: number
  trackCount: number
  mediaCount: number
}

export function listProjects(): ProjectInfo[] {
  const projects = getAllProjects()
  return Object.values(projects)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .map((p) => ({
      name: p.name,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      clipCount: p.clips.length,
      trackCount: p.tracks.length,
      mediaCount: p.mediaItems.length,
    }))
}

export function deleteProject(name: string): void {
  const projects = getAllProjects()
  delete projects[name]
  saveProjectsToStorage(projects)
}