"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Volume2, Play, Square, Download, Sparkles, Loader2, Pause,
} from "lucide-react";
import { toast } from "sonner";

const voices = [
  { id: "alloy", label: "Alloy", desc: "Neutral y equilibrado" },
  { id: "echo", label: "Echo", desc: "Masculino, profundo" },
  { id: "fable", label: "Fable", desc: "Britanico, narrativo" },
  { id: "onyx", label: "Onyx", desc: "Masculino, autoritativo" },
  { id: "nova", label: "Nova", desc: "Femenino, amigable" },
  { id: "shimmer", label: "Shimmer", desc: "Femenino, suave" },
];

interface AudioPreviewPanelProps {
  onAudioGenerated?: (audioBase64: string) => void;
}

export function AudioPreviewPanel({ onAudioGenerated }: AudioPreviewPanelProps) {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("nova");
  const [speed, setSpeed] = useState(1.0);
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const maxChars = 2000;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= maxChars) {
      setText(val);
      setCharCount(val.length);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error("Escribe un texto para generar el audio");
      return;
    }
    setGenerating(true);
    setAudioUrl(null);
    setPlaying(false);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice, speed }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error al generar audio");
        return;
      }

      const data = await res.json();

      if (data.audio) {
        const url = `data:audio/mp3;base64,${data.audio}`;
        setAudioUrl(url);
        toast.success("Audio generado correctamente");

        if (onAudioGenerated) {
          onAudioGenerated(data.audio);
        }
      }
    } catch {
      toast.error("Error de conexion");
    } finally {
      setGenerating(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `videoflow_audio_${Date.now()}.mp3`;
    a.click();
    toast.success("Audio descargado");
  };

  const handleSpeedChange = (val: number[]) => {
    setSpeed(val[0]);
  };

  const selectedVoice = voices.find((v) => v.id === voice);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Volume2 className="h-5 w-5 text-fuchsia-400" />
        <h2 className="text-lg font-bold">Audio con IA</h2>
        <Badge variant="secondary" className="text-xs">Text-to-Speech</Badge>
      </div>

      {/* Voice Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Voz</Label>
          <Select value={voice} onValueChange={setVoice}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {voices.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Velocidad: {speed.toFixed(1)}x
          </Label>
          <div className="pt-2 px-1">
            <Slider
              value={[speed]}
              onValueChange={handleSpeedChange}
              min={0.5}
              max={2.0}
              step={0.1}
              className="py-1"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>0.5x</span>
              <span>1.0x</span>
              <span>2.0x</span>
            </div>
          </div>
        </div>
      </div>

      {selectedVoice && (
        <p className="text-xs text-muted-foreground">{selectedVoice.desc}</p>
      )}

      {/* Text Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Texto para narrar</Label>
          <span className={`text-xs ${charCount > 1800 ? "text-red-400" : "text-muted-foreground"}`}>
            {charCount}/{maxChars}
          </span>
        </div>
        <Textarea
          value={text}
          onChange={handleTextChange}
          placeholder="Escribe aqui el texto que quieres convertir en voz..."
          className="min-h-[120px] bg-background/50 border-border/50 resize-none"
        />
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={generating || !text.trim()}
        className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white"
      >
        {generating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generando audio...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generar Audio
          </>
        )}
      </Button>

      {/* Audio Player */}
      {audioUrl && (
        <Card className="border-fuchsia-500/20 bg-fuchsia-500/5">
          <CardContent className="p-4">
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setPlaying(false)}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full border-fuchsia-500/30 hover:bg-fuchsia-500/10"
                onClick={togglePlay}
              >
                {playing ? (
                  <Pause className="h-4 w-4 text-fuchsia-400" />
                ) : (
                  <Play className="h-4 w-4 text-fuchsia-400 ml-0.5" />
                )}
              </Button>
              <div className="flex-1">
                <p className="text-sm font-medium">Audio generado</p>
                <p className="text-xs text-muted-foreground">
                  Voz: {selectedVoice?.label} | {speed.toFixed(1)}x
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      {!audioUrl && !generating && (
        <div className="rounded-lg bg-muted/30 p-3 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Consejos:</p>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            <li>- Usa puntos y comas para pausas naturales</li>
            <li>- Numeros escritos se leen mejor (ej: &quot;2024&quot; no &quot;dos mil veinticuatro&quot;)</li>
            <li>- Prueba diferentes voces y velocidades</li>
            <li>- Maximo 2000 caracteres por generacion</li>
          </ul>
        </div>
      )}
    </div>
  );
}
