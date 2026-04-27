"use client";

import { useState, useRef, useEffect } from "react";
import { useTimelineStore } from "@/lib/timeline-store";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface Format {
  id: string;
  name: string;
  platform: string;
  icon: string;
  width: number;
  height: number;
  fps: number;
  bitrate: number;
  maxDuration: number;
  description: string;
  color: string;
}

const formats: Format[] = [
  { id: "youtube", name: "YouTube", platform: "youtube", icon: "\u25B6\uFE0F", width: 1920, height: 1080, fps: 30, bitrate: 8000000, maxDuration: 600, description: "Full HD 1080p, hasta 10 min", color: "from-red-600 to-red-800" },
  { id: "instagram-reel", name: "Instagram Reels", platform: "instagram", icon: "\uD83D\uDCF1", width: 1080, height: 1920, fps: 30, bitrate: 5000000, maxDuration: 90, description: "Vertical 9:16, hasta 90s", color: "from-pink-600 to-purple-800" },
  { id: "instagram-post", name: "Instagram Post", platform: "instagram", icon: "\uD83D\uDCF7", width: 1080, height: 1080, fps: 30, bitrate: 5000000, maxDuration: 60, description: "Cuadrado 1:1, hasta 60s", color: "from-pink-600 to-orange-500" },
  { id: "tiktok", name: "TikTok", platform: "tiktok", icon: "\uD83C\uDFB5", width: 1080, height: 1920, fps: 30, bitrate: 5000000, maxDuration: 180, description: "Vertical 9:16, hasta 3 min", color: "from-gray-800 to-black" },
  { id: "facebook", name: "Facebook", platform: "facebook", icon: "\uD83D\uDC65", width: 1280, height: 720, fps: 30, bitrate: 5000000, maxDuration: 240, description: "HD 720p, hasta 4 min", color: "from-blue-600 to-blue-800" },
  { id: "twitter", name: "X (Twitter)", platform: "twitter", icon: "\uD83D\uDC26", width: 1280, height: 720, fps: 30, bitrate: 5000000, maxDuration: 140, description: "HD 720p, hasta 2:20", color: "from-gray-700 to-gray-900" },
  { id: "linkedin", name: "LinkedIn", platform: "linkedin", icon: "\uD83D\uDCBC", width: 1920, height: 1080, fps: 30, bitrate: 6000000, maxDuration: 600, description: "Full HD 1080p, hasta 10 min", color: "from-blue-700 to-blue-900" },
  { id: "whatsapp", name: "WhatsApp Status", platform: "whatsapp", icon: "\uD83D\uDCAC", width: 720, height: 1280, fps: 30, bitrate: 3000000, maxDuration: 30, description: "Vertical 9:16, hasta 30s", color: "from-green-600 to-green-800" },
  { id: "custom", name: "Personalizado", platform: "custom", icon: "\u2699\uFE0F", width: 1280, height: 720, fps: 30, bitrate: 5000000, maxDuration: 600, description: "Configura tu resolucion", color: "from-purple-600 to-purple-800" },
];

export function ExportPanel({ isOpen, onClose }: Props) {
  const { tracks } = useTimelineStore();
  const [status, setStatus] = useState<"idle" | "preparing" | "recording" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<Format>(formats[0]);
  const [customWidth, setCustomWidth] = useState(1280);
  const [customHeight, setCustomHeight] = useState(720);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chunksRef = useRef<Blob[]>([]);
  const abortRef = useRef(false);

  const getProjectDuration = () => {
    let maxEnd = 0;
    tracks.forEach((t) => t.clips.forEach((c) => {
      const end = c.startTime + c.duration;
      if (end > maxEnd) maxEnd = end;
    }));
    return maxEnd || 5;
  };

  const getTotalClips = () => tracks.reduce((sum, t) => sum + t.clips.length, 0);
  const isDurationValid = () => getProjectDuration() <= selectedFormat.maxDuration;

  const getEffectiveFormat = (): Format => {
    if (selectedFormat.id === "custom") {
      return { ...selectedFormat, width: customWidth, height: customHeight };
    }
    return selectedFormat;
  };

  const loadMediaElement = (src: string, type: "video" | "audio" | "image"): Promise<HTMLVideoElement | HTMLAudioElement | HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      if (type === "image") {
        const img = document.createElement("img");
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`No se pudo cargar imagen: ${src}`));
        img.src = src;
      } else {
        const el = document.createElement(type);
        el.crossOrigin = "anonymous";
        if (type === "video") {
          (el as HTMLVideoElement).muted = true;
          (el as HTMLVideoElement).playsInline = true;
          (el as HTMLVideoElement).preload = "auto";
        }
        el.preload = "auto";
        el.oncanplaythrough = () => resolve(el);
        el.onerror = () => reject(new Error(`No se pudo cargar ${type}: ${src}`));
        el.src = src;
        el.load();
      }
    });
  };

  const startExport = async () => {
    if (getTotalClips() === 0) return;
    abortRef.current = false;
    setStatus("preparing");
    setProgress(0);
    setDownloadUrl(null);
    setErrorMsg("");
    onClose();

    const format = getEffectiveFormat();
    const canvas = canvasRef.current;
    if (!canvas) { setStatus("error"); setErrorMsg("Error al crear canvas"); return; }

    canvas.width = format.width;
    canvas.height = format.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) { setStatus("error"); setErrorMsg("Error al obtener contexto 2D"); return; }

    try {
      // Collect all unique sources
      const videoSources = new Map<string, HTMLVideoElement>();
      const audioSources = new Map<string, HTMLAudioElement>();
      const imageSources = new Map<string, HTMLImageElement>();

      // Collect all clips with their sources
      const allVideoClips: { clip: any; el: HTMLVideoElement }[] = [];
      const allAudioClips: { clip: any; el: HTMLAudioElement }[] = [];
      const allImageClips: { clip: any; el: HTMLImageElement }[] = [];
      const allTextClips: any[] = [];

      for (const track of tracks) {
        for (const clip of track.clips) {
          if (!clip.src && !clip.storagePath) continue;
          const src = clip.storagePath || clip.src || "";

          if (track.type === "video" && src) {
            if (!videoSources.has(src)) {
              const el = await loadMediaElement(src, "video") as HTMLVideoElement;
              videoSources.set(src, el);
            }
            allVideoClips.push({ clip, el: videoSources.get(src)! });
          } else if (track.type === "audio" && src) {
            if (!audioSources.has(src)) {
              const el = await loadMediaElement(src, "audio") as HTMLAudioElement;
              audioSources.set(src, el);
            }
            allAudioClips.push({ clip, el: audioSources.get(src)! });
          } else if (track.type === "image" && src) {
            if (!imageSources.has(src)) {
              const el = await loadMediaElement(src, "image") as HTMLImageElement;
              imageSources.set(src, el);
            }
            allImageClips.push({ clip, el: imageSources.get(src)! });
          } else if (track.type === "text" && clip.text) {
            allTextClips.push(clip);
          }
        }
      }

      if (abortRef.current) return;

      const duration = getProjectDuration();
      const stream = canvas.captureStream(format.fps);

      // Setup MediaRecorder
      let mimeType = "video/webm;codecs=vp9,opus";
      const mimeTypes = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
      for (const mt of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mt)) { mimeType = mt; break; }
      }

      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: format.bitrate });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setStatus("done");
        setProgress(100);
        // Cleanup
        videoSources.forEach((el) => { el.pause(); el.src = ""; });
        audioSources.forEach((el) => { el.pause(); el.src = ""; });
      };

      // Setup audio capture
      const audioCtx = new AudioContext();
      if (audioCtx.state === "suspended") await audioCtx.resume();
      const audioDest = audioCtx.createMediaStreamDestination();

      // Connect all video/audio elements for audio capture
      videoSources.forEach((el) => {
        try {
          const src = audioCtx.createMediaElementSource(el);
          src.connect(audioDest);
          src.connect(audioCtx.destination);
        } catch (e) {
          console.warn("Audio capture failed for video element");
        }
      });
      audioSources.forEach((el) => {
        try {
          const src = audioCtx.createMediaElementSource(el);
          src.connect(audioDest);
          src.connect(audioCtx.destination);
        } catch (e) {
          console.warn("Audio capture failed for audio element");
        }
      });

      // Add audio tracks to stream
      audioDest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));

      setStatus("recording");
      recorder.start();

      const startTime = performance.now();
      const w = format.width;
      const h = format.height;

      // Track which elements are currently playing
      const playingVideos = new Set<string>();
      const playingAudios = new Set<string>();

      const renderFrame = () => {
        if (abortRef.current) {
          recorder.stop();
          return;
        }

        const elapsed = performance.now() - startTime;
        const currentSec = elapsed / 1000;

        if (currentSec >= duration) {
          playingVideos.forEach((s) => videoSources.get(s)?.pause());
          playingAudios.forEach((s) => audioSources.get(s)?.pause());
          recorder.stop();
          return;
        }

        setProgress(Math.min(Math.round((currentSec / duration) * 100), 99));

        ctx!.fillStyle = "#000000";
        ctx!.fillRect(0, 0, w, h);

        // Render active video clips
        for (const { clip, el } of allVideoClips) {
          const isActive = currentSec >= clip.startTime && currentSec < clip.startTime + clip.duration;
          const clipTime = currentSec - clip.startTime;

          if (isActive && el.readyState >= 2) {
            // Sync video to clip timeline
            const expectedTime = clipTime + (clip.trimStart || 0);
            if (Math.abs(el.currentTime - expectedTime) > 0.3) {
              el.currentTime = expectedTime;
            }
            if (!playingVideos.has(clip.id || clip.startTime.toString())) {
              try { el.play().catch(() => {}); } catch (e) { /* ignore */ }
              playingVideos.add(clip.id || clip.startTime.toString());
            }

            const s = clip.scale ?? 1;
            const px = (clip.posX ?? 0) * (w / 200);
            const py = (clip.posY ?? 0) * (h / 200);
            ctx!.globalAlpha = clip.opacity ?? 1;
            ctx!.save();
            ctx!.translate(w / 2 + px, h / 2 + py);
            ctx!.scale(s, s);

            const aspect = el.videoWidth / el.videoHeight || 16 / 9;
            let dw = w;
            let dh = h;
            if (aspect > w / h) { dh = w / aspect; } else { dw = h * aspect; }
            ctx!.drawImage(el, -dw / 2, -dh / 2, dw, dh);
            ctx!.restore();
            ctx!.globalAlpha = 1;
          } else if (!isActive && playingVideos.has(clip.id || clip.startTime.toString())) {
            el.pause();
            playingVideos.delete(clip.id || clip.startTime.toString());
          }
        }

        // Render active image clips
        for (const { clip, el } of allImageClips) {
          const isActive = currentSec >= clip.startTime && currentSec < clip.startTime + clip.duration;

          if (isActive) {
            const s = clip.scale ?? 1;
            const px = (clip.posX ?? 0) * (w / 200);
            const py = (clip.posY ?? 0) * (h / 200);
            ctx!.globalAlpha = clip.opacity ?? 1;
            ctx!.save();
            ctx!.translate(w / 2 + px, h / 2 + py);
            ctx!.scale(s, s);

            const aspect = el.naturalWidth / el.naturalHeight || 1;
            let dw = w;
            let dh = h;
            if (aspect > w / h) { dh = w / aspect; } else { dw = h * aspect; }
            ctx!.drawImage(el, -dw / 2, -dh / 2, dw, dh);
            ctx!.restore();
            ctx!.globalAlpha = 1;
          }
        }

        // Render active text clips
        const activeTexts = allTextClips.filter((c) => currentSec >= c.startTime && currentSec < c.startTime + c.duration);
        for (const t of activeTexts) {
          ctx!.globalAlpha = t.opacity ?? 1;
          ctx!.fillStyle = t.color ?? "#ffffff";
          const scaleFactor = w / 1280;
          ctx!.font = `bold ${(t.fontSize ?? 32) * (t.scale ?? 1) * 1.5 * scaleFactor}px Arial`;
          ctx!.textAlign = "center";
          ctx!.shadowColor = "rgba(0,0,0,0.8)";
          ctx!.shadowBlur = 6 * scaleFactor;
          ctx!.shadowOffsetX = 2 * scaleFactor;
          ctx!.shadowOffsetY = 2 * scaleFactor;
          const tx = w / 2 + (t.posX ?? 0) * (w / 200);
          const ty = h / 2 + (t.posY ?? 0) * (h / 200);
          ctx!.fillText(t.text ?? "", tx, ty);
          ctx!.shadowBlur = 0;
          ctx!.globalAlpha = 1;
        }

        // Sync audio clips
        for (const { clip, el } of allAudioClips) {
          const isActive = currentSec >= clip.startTime && currentSec < clip.startTime + clip.duration;
          const clipTime = currentSec - clip.startTime;
          const key = clip.id || clip.startTime.toString();

          if (isActive) {
            const expectedTime = clipTime + (clip.trimStart || 0);
            if (Math.abs(el.currentTime - expectedTime) > 0.3) {
              el.currentTime = expectedTime;
            }
            el.volume = clip.volume ?? 1;
            if (!playingAudios.has(key)) {
              try { el.play().catch(() => {}); } catch (e) { /* ignore */ }
              playingAudios.add(key);
            }
          } else if (playingAudios.has(key)) {
            el.pause();
            playingAudios.delete(key);
          }
        }

        requestAnimationFrame(renderFrame);
      };

      requestAnimationFrame(renderFrame);
    } catch (error: unknown) {
      console.error("Export error:", error);
      const msg = error instanceof Error ? error.message : "Error desconocido";
      setStatus("error");
      setErrorMsg(msg);
    }
  };

  const download = () => {
    if (!downloadUrl) return;
    const a = document.createElement("a");
    a.href = downloadUrl;
    const format = getEffectiveFormat();
    a.download = `videoflow-${format.id}-${format.width}x${format.height}.webm`;
    a.click();
  };

  const cancelExport = () => {
    abortRef.current = true;
    setStatus("idle");
    setProgress(0);
    setErrorMsg("");
    setDownloadUrl(null);
  };

  if (!isOpen && status === "idle") return null;

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      {(isOpen || status === "preparing" || status === "recording" || status === "done" || status === "error") && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-6 w-full max-w-[550px] max-h-[90vh] overflow-y-auto">
            {status === "idle" && (
              <>
                <h3 className="text-lg font-semibold mb-1">Exportar Video</h3>
                <p className="text-xs text-gray-500 mb-4">Selecciona el formato para tu red social</p>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  {formats.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFormat(f)}
                      className={`p-2.5 rounded-lg border transition-all text-left ${
                        selectedFormat.id === f.id
                          ? "border-purple-500 bg-purple-500/10 ring-1 ring-purple-500"
                          : "border-[#2a2a4a] bg-[#12122a] hover:border-gray-500"
                      }`}
                    >
                      <span className="text-lg">{f.icon}</span>
                      <p className="text-[11px] font-medium text-white mt-1 truncate">{f.name}</p>
                      <p className="text-[9px] text-gray-500">{f.width}x{f.height}</p>
                    </button>
                  ))}
                </div>

                {selectedFormat.id === "custom" && (
                  <div className="flex gap-2 mb-4">
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-500 uppercase">Ancho (px)</label>
                      <input type="number" value={customWidth} onChange={(e) => setCustomWidth(Number(e.target.value))} className="w-full mt-1 px-2 py-1 text-xs bg-[#1a1a3a] border border-[#2a2a4a] rounded text-white focus:border-purple-500 focus:outline-none" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-500 uppercase">Alto (px)</label>
                      <input type="number" value={customHeight} onChange={(e) => setCustomHeight(Number(e.target.value))} className="w-full mt-1 px-2 py-1 text-xs bg-[#1a1a3a] border border-[#2a2a4a] rounded text-white focus:border-purple-500 focus:outline-none" />
                    </div>
                  </div>
                )}

                <div className="bg-[#12122a] rounded-lg p-3 mb-4 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{selectedFormat.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{selectedFormat.name}</p>
                      <p className="text-[10px] text-gray-400">{selectedFormat.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Resolucion</span>
                      <span className="text-white">{selectedFormat.width} x {selectedFormat.height}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">FPS</span>
                      <span className="text-white">{selectedFormat.fps}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Duracion max</span>
                      <span className="text-white">{Math.floor(selectedFormat.maxDuration / 60)}:{(selectedFormat.maxDuration % 60).toString().padStart(2, "0")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tu video</span>
                      <span className={isDurationValid() ? "text-green-400" : "text-red-400"}>
                        {getProjectDuration().toFixed(1)}s
                        {!isDurationValid() && " (excede)"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Clips</span>
                      <span className="text-white">{getTotalClips()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Formato</span>
                      <span className="text-white">WebM (VP9 + Audio)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center mb-4">
                  <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${selectedFormat.color} flex items-center justify-center text-2xl shadow-lg`} />
                  <div className="ml-3">
                    <p className="text-[11px] text-gray-400">
                      Aspecto: {selectedFormat.width / selectedFormat.height > 1 ? "Horizontal" : selectedFormat.width / selectedFormat.height < 1 ? "Vertical" : "Cuadrado"}
                    </p>
                    <p className="text-[10px] text-gray-500">{selectedFormat.width}:{selectedFormat.height}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-[#2a2a4a] text-gray-300 text-sm hover:bg-[#3a3a5a] transition-colors">Cancelar</button>
                  <button
                    onClick={startExport}
                    disabled={!isDurationValid() || getTotalClips() === 0}
                    className={`flex-1 py-2.5 rounded-lg text-white text-sm font-medium transition-colors ${
                      !isDurationValid() || getTotalClips() === 0 ? "bg-gray-600 cursor-not-allowed" : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                    }`}
                  >Exportar</button>
                </div>
              </>
            )}

            {status === "preparing" && (
              <div className="text-center py-8">
                <div className="animate-spin w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Preparando exportacion...</h3>
                <p className="text-xs text-gray-400 mt-1">Cargando {getTotalClips()} clips multimedia</p>
              </div>
            )}

            {status === "recording" && (
              <>
                <h3 className="text-lg font-semibold mb-4">Exportando para {selectedFormat.name}...</h3>
                <div className="flex items-center justify-center mb-4">
                  <span className="text-4xl">{selectedFormat.icon}</span>
                </div>
                <div className="mb-4">
                  <div className="w-full h-3 bg-[#2a2a4a] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-sm text-gray-400 mt-2 text-center">{progress}%</p>
                </div>
                <p className="text-xs text-gray-500 text-center">{selectedFormat.width}x{selectedFormat.height} - No cierres esta ventana</p>
                <button onClick={cancelExport} className="mt-4 w-full py-2 rounded-lg bg-red-600/20 text-red-400 text-xs hover:bg-red-600/30 transition-colors">Cancelar exportacion</button>
              </>
            )}

            {status === "done" && (
              <>
                <div className="text-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h3 className="text-lg font-semibold text-green-400">Exportacion completa</h3>
                  <p className="text-sm text-gray-400 mt-1">{selectedFormat.icon} {selectedFormat.name} ({selectedFormat.width}x{selectedFormat.height})</p>
                  <p className="text-xs text-gray-500 mt-2">{getTotalClips()} clips procesados</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setStatus("idle"); setDownloadUrl(null); }} className="flex-1 py-2.5 rounded-lg bg-[#2a2a4a] text-gray-300 text-sm hover:bg-[#3a3a5a] transition-colors">Cerrar</button>
                  <button onClick={download} className="flex-1 py-2.5 rounded-lg bg-green-600 text-white text-sm hover:bg-green-500 transition-colors font-medium">Descargar</button>
                </div>
              </>
            )}

            {status === "error" && (
              <>
                <div className="text-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </div>
                  <h3 className="text-lg font-semibold text-red-400">Error en la exportacion</h3>
                  <p className="text-xs text-gray-400 mt-2">{errorMsg}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setStatus("idle"); setErrorMsg(""); }} className="flex-1 py-2.5 rounded-lg bg-[#2a2a4a] text-gray-300 text-sm hover:bg-[#3a3a5a] transition-colors">Cerrar</button>
                  <button onClick={startExport} className="flex-1 py-2.5 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-500 transition-colors font-medium">Reintentar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
