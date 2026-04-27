"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppStore, type ScheduledPost } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  format, isSameDay, startOfMonth, endOfMonth,
  eachDayOfInterval, isToday, addMonths, subMonths,
  startOfWeek, endOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarIcon, Clock, Plus, Trash2, Play, Edit3, Copy,
  CheckCircle2, XCircle, AlertCircle, Filter,
  Youtube, Instagram, Facebook, ChevronLeft, ChevronRight,
  Eye, MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const platformIcons: Record<string, React.ReactNode> = {
  youtube: <Youtube className="h-4 w-4 text-red-400" />,
  tiktok: <Play className="h-4 w-4 text-pink-400" />,
  instagram: <Instagram className="h-4 w-4 text-orange-400" />,
  facebook: <Facebook className="h-4 w-4 text-blue-400" />,
};

const platformLabels: Record<string, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  scheduled: { label: "Programado", color: "bg-purple-500/10 text-purple-400 border-purple-500/20", icon: <Clock className="h-3 w-3" /> },
  published: { label: "Publicado", color: "bg-green-500/10 text-green-400 border-green-500/20", icon: <CheckCircle2 className="h-3 w-3" /> },
  failed: { label: "Fallido", color: "bg-red-500/10 text-red-400 border-red-500/20", icon: <XCircle className="h-3 w-3" /> },
};

const emptyForm = { platform: "", caption: "", hashtags: "", scheduledTime: "12:00" };

export function CalendarView() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [previewPost, setPreviewPost] = useState<ScheduledPost | null>(null);
  const { user } = useAppStore();

  const filteredPosts = platformFilter === "all"
    ? posts
    : posts.filter((p) => p.platform === platformFilter);

  const fetchPosts = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await fetch("/api/schedule");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const postsForDate = (date: Date) =>
    filteredPosts.filter((p) => isSameDay(new Date(p.scheduledAt), date));

  const upcomingPosts = filteredPosts
    .filter((p) => new Date(p.scheduledAt) >= new Date())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const openCreate = () => {
    setEditingPost(null);
    setFormData(emptyForm);
    setIsDialogOpen(true);
  };

  const openEdit = (post: ScheduledPost) => {
    setEditingPost(post);
    const d = new Date(post.scheduledAt);
    setFormData({
      platform: post.platform,
      caption: post.caption || "",
      hashtags: post.hashtags || "",
      scheduledTime: format(d, "HH:mm"),
    });
    setSelectedDate(d);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedDate || !formData.platform || !user?.id) {
      toast.error("Completa todos los campos requeridos");
      return;
    }
    setSaving(true);
    try {
      const scheduledAt = new Date(selectedDate);
      const [hours, minutes] = formData.scheduledTime.split(":");
      scheduledAt.setHours(parseInt(hours), parseInt(minutes));

      const body = {
        platform: formData.platform,
        scheduledAt: scheduledAt.toISOString(),
        caption: formData.caption,
        hashtags: formData.hashtags,
      };

      const url = editingPost ? "/api/schedule" : "/api/schedule";
      const method = editingPost ? "PUT" : "POST";
      const payload = editingPost ? { ...body, id: editingPost.id, videoId: editingPost.videoId || "manual" } : { ...body, videoId: "manual" };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error al guardar");
        return;
      }

      toast.success(editingPost ? "Post actualizado" : "Post programado");
      setIsDialogOpen(false);
      setFormData(emptyForm);
      setEditingPost(null);
      fetchPosts();
    } catch {
      toast.error("Error de conexion");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      const res = await fetch(`/api/schedule?id=${postId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Post eliminado");
        fetchPosts();
      }
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const handleDuplicate = async (post: ScheduledPost) => {
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: post.videoId || "manual",
          platform: post.platform,
          scheduledAt: new Date(post.scheduledAt).toISOString(),
          caption: post.caption,
          hashtags: post.hashtags,
        }),
      });
      if (res.ok) {
        toast.success("Post duplicado");
        fetchPosts();
      }
    } catch {
      toast.error("Error al duplicar");
    }
  };

  const handleStatusChange = async (post: ScheduledPost, newStatus: string) => {
    try {
      const res = await fetch("/api/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Estado cambiado a ${statusConfig[newStatus]?.label}`);
        fetchPosts();
      }
    } catch {
      toast.error("Error al cambiar estado");
    }
  };

  const monthStart = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
  const monthEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const weekDays = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl font-bold">Programar</h1>
          <p className="text-muted-foreground text-sm">
            Gestiona la publicacion de tus videos en redes sociales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="h-4 w-4" />
                {platformFilter === "all" ? "Todas" : platformLabels[platformFilter]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setPlatformFilter("all")}>
                Todas las plataformas
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {Object.entries(platformLabels).map(([key, label]) => (
                <DropdownMenuItem key={key} onClick={() => setPlatformFilter(key)}>
                  <span className="mr-2">{platformIcons[key]}</span>
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/20"
            onClick={openCreate}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Post
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card className="glass border-border/30">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-purple-400" />
                  {format(currentMonth, "MMMM yyyy", { locale: es })}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setCurrentMonth(new Date())}>
                    Hoy
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {loading ? (
                <Skeleton className="h-80 rounded-lg bg-muted/20" />
              ) : (
                <>
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {weekDays.map((day) => (
                      <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day) => {
                      const dayPosts = postsForDate(day);
                      const isSelected = selectedDate && isSameDay(day, selectedDate);
                      const isCurrent = isToday(day);
                      const isOutsideMonth = day.getMonth() !== currentMonth.getMonth();

                      return (
                        <div
                          key={day.toISOString()}
                          onClick={() => setSelectedDate(day)}
                          className={`
                            relative p-1.5 rounded-lg text-center cursor-pointer transition-all min-h-[56px]
                            ${isOutsideMonth ? "opacity-30" : ""}
                            ${isSelected ? "bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30" : "hover:bg-muted/30 border border-transparent"}
                          `}
                        >
                          <span className={`text-xs font-medium ${isCurrent ? "text-purple-400 font-bold" : ""}`}>
                            {format(day, "d")}
                          </span>
                          {dayPosts.length > 0 && (
                            <div className="flex flex-wrap gap-0.5 mt-1 justify-center">
                              {dayPosts.slice(0, 4).map((post) => (
                                <div
                                  key={post.id}
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    post.platform === "youtube" ? "bg-red-400" :
                                    post.platform === "tiktok" ? "bg-pink-400" :
                                    post.platform === "instagram" ? "bg-orange-400" : "bg-blue-400"
                                  }`}
                                />
                              ))}
                              {dayPosts.length > 4 && (
                                <span className="text-[8px] text-muted-foreground">+{dayPosts.length - 4}</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Right sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {/* Selected date posts */}
          <Card className="glass border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                {selectedDate
                  ? format(selectedDate, "d 'de' MMMM", { locale: es })
                  : "Selecciona una fecha"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {selectedDate ? (
                postsForDate(selectedDate).length > 0 ? (
                  <ScrollArea className="max-h-56">
                    <div className="divide-y divide-border/30">
                      {postsForDate(selectedDate).map((post) => {
                        const status = statusConfig[post.status] || statusConfig.scheduled;
                        return (
                          <div key={post.id} className="px-4 py-3 flex items-center gap-3 group">
                            <div className="flex-shrink-0">{platformIcons[post.platform]}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {post.caption || "Sin descripcion"}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(post.scheduledAt), "HH:mm")}
                                </span>
                                <Badge variant="outline" className={`text-[9px] px-1 py-0 ${status.color}`}>
                                  {status.label}
                                </Badge>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setPreviewPost(post)}>
                                  <Eye className="h-4 w-4 mr-2" /> Ver detalle
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEdit(post)}>
                                  <Edit3 className="h-4 w-4 mr-2" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicate(post)}>
                                  <Copy className="h-4 w-4 mr-2" /> Duplicar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleStatusChange(post, "published")}>
                                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-400" /> Marcar publicado
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(post, "failed")}>
                                  <AlertCircle className="h-4 w-4 mr-2 text-red-400" /> Marcar fallido
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-400" onClick={() => handleDelete(post.id)}>
                                  <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No hay posts para este dia
                  </div>
                )
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  Haz clic en un dia del calendario
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming posts */}
          <Card className="glass border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Proximos Programados</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 rounded-lg bg-muted/20" />
                  ))}
                </div>
              ) : upcomingPosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>No hay posts programados</p>
                  <Button variant="link" size="sm" onClick={openCreate}>
                    Crear el primero
                  </Button>
                </div>
              ) : (
                <ScrollArea className="max-h-64">
                  <div className="divide-y divide-border/30">
                    {upcomingPosts.map((post, i) => {
                      const status = statusConfig[post.status] || statusConfig.scheduled;
                      return (
                        <motion.div
                          key={post.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + i * 0.05 }}
                          className="px-4 py-3 hover:bg-muted/20 transition-colors group"
                        >
                          <div className="flex items-center gap-3 mb-1">
                            {platformIcons[post.platform]}
                            <span className="text-xs text-muted-foreground">
                              {platformLabels[post.platform]}
                            </span>
                            <Badge variant="outline" className={`text-[10px] ml-auto ${status.color}`}>
                              {status.label}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium truncate">
                            {post.caption || "Sin descripcion"}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(post.scheduledAt), "d MMM, HH:mm", { locale: es })}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle>
              {editingPost ? "Editar Publicacion" : "Programar Nueva Publicacion"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Plataforma</Label>
              <Select value={formData.platform} onValueChange={(v) => setFormData({ ...formData, platform: v })}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Seleccionar plataforma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descripcion</Label>
              <Textarea
                placeholder="Describe tu publicacion..."
                value={formData.caption}
                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                className="bg-background/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Hashtags</Label>
              <Input
                placeholder="#tech #viral #content"
                value={formData.hashtags}
                onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                className="bg-background/50 border-border/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="bg-background/50 border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Hora</Label>
                <Input
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  className="bg-background/50 border-border/50"
                />
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white"
            >
              {saving
                ? "Guardando..."
                : editingPost
                ? "Actualizar Publicacion"
                : "Programar Publicacion"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewPost} onOpenChange={() => setPreviewPost(null)}>
        <DialogContent className="glass-strong max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle del Post</DialogTitle>
          </DialogHeader>
          {previewPost && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3">
                {platformIcons[previewPost.platform]}
                <span className="font-medium">{platformLabels[previewPost.platform]}</span>
                <Badge variant="outline" className={statusConfig[previewPost.status]?.color}>
                  {statusConfig[previewPost.status]?.label}
                </Badge>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Fecha programada</Label>
                <p className="text-sm font-medium">
                  {format(new Date(previewPost.scheduledAt), "EEEE d 'de' MMMM yyyy, HH:mm", { locale: es })}
                </p>
              </div>
              {previewPost.caption && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Descripcion</Label>
                  <p className="text-sm bg-muted/30 rounded-lg p-3">{previewPost.caption}</p>
                </div>
              )}
              {previewPost.hashtags && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Hashtags</Label>
                  <div className="flex flex-wrap gap-1">
                    {previewPost.hashtags.split(/[\s,]+/).filter(Boolean).map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { setPreviewPost(null); openEdit(previewPost); }}>
                  <Edit3 className="h-4 w-4 mr-1" /> Editar
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { handleDuplicate(previewPost); setPreviewPost(null); }}>
                  <Copy className="h-4 w-4 mr-1" /> Duplicar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
