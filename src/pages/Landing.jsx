import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ArrowRight, Plus, Users, ChevronLeft, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

export default function Landing() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, navigateToLogin } = useAuth();

  const [viewState, setViewState] = useState("initial"); // initial, join, create, password
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);

  const [newGroupData, setNewGroupData] = useState({
    name: "",
    description: "",
    password: "",
  });

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: () => base44.entities.Group.list(),
  });

  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => base44.auth.me(),
  });

  const isAdminCreator = currentUser?.email?.toLowerCase() === "modetjorge22@gmail.com";

  React.useEffect(() => {
    if (!autoLoginAttempted && !isLoading && groups.length > 0) {
      const lastGroupId = localStorage.getItem("base44_last_group_id");
      const lastPassword = localStorage.getItem("base44_last_group_password");

      if (lastGroupId && lastPassword) {
        const group = groups.find((g) => g.id === lastGroupId);
        if (group && group.password === lastPassword) {
          sessionStorage.setItem("base44_group_id", group.id);
          sessionStorage.setItem("base44_group_name", group.name);
          localStorage.setItem("base44_last_group_name", group.name);
          navigate(createPageUrl("Feed"));
        }
      }
    }
  }, [isAuthenticated, isLoading, groups, navigate]);

  React.useEffect(() => {
    const activeGroupId = sessionStorage.getItem("base44_group_id");
    const rememberedGroupId = localStorage.getItem("base44_last_group_id");

    if (isAuthenticated && (activeGroupId || rememberedGroupId)) {
      if (!activeGroupId && rememberedGroupId) {
        sessionStorage.setItem("base44_group_id", rememberedGroupId);
        const rememberedName = localStorage.getItem("base44_last_group_name");
        if (rememberedName) sessionStorage.setItem("base44_group_name", rememberedName);
      }
      navigate(createPageUrl("Feed"));
    }
  }, [isAuthenticated, navigate]);

  const createGroupMutation = useMutation({
    mutationFn: (data) => base44.entities.Group.create(data),
    onSuccess: (newGroup) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Grupo creado correctamente");
      setSelectedGroup(newGroup);
      setViewState("password");
    },
  });

  const handleJoin = (e) => {
    e.preventDefault();
    if (!selectedGroup) return;

    if (password === selectedGroup.password) {
      sessionStorage.setItem("base44_group_id", selectedGroup.id);
      sessionStorage.setItem("base44_group_name", selectedGroup.name);
      localStorage.setItem("base44_last_group_id", selectedGroup.id);
      localStorage.setItem("base44_last_group_password", selectedGroup.password);
      localStorage.setItem("base44_last_group_name", selectedGroup.name);
      navigate(createPageUrl("Feed"));
    } else {
      setError("Contraseña incorrecta");
      toast.error("Contraseña incorrecta");
    }
  };

  const handleCreateGroup = (e) => {
    e.preventDefault();

    if (!isAdminCreator) {
      toast.error("Solo el administrador puede crear grupos");
      return;
    }

    if (!newGroupData.name || !newGroupData.password) {
      toast.error("Nombre y contraseña son obligatorios");
      return;
    }

    createGroupMutation.mutate(newGroupData);
  };

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_55%)]" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.2),transparent_60%)] blur-3xl" />
      </div>

      <div className="z-10 w-full max-w-md space-y-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-3 rounded-2xl border border-white/15 bg-[#11131a]/75 backdrop-blur-xl p-4"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/70">
            Olympia · Performance Hub
          </div>
          <h1 className="text-6xl md:text-7xl font-black tracking-tight text-white">Olympia</h1>
          <p className="text-sm text-white/65 tracking-wide">
            Entrena en equipo. Mide progreso. Mantén consistencia.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-white/55">
            <span className="rounded-full bg-white/5 border border-white/10 px-2 py-1">{groups.length} grupos</span>
            <span className="rounded-full bg-white/5 border border-white/10 px-2 py-1">Sincronización Strava</span>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {viewState === "initial" && (
            <motion.div
              key="initial"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              <Button
                size="lg"
                className="w-full h-14 text-lg font-bold bg-gray-900 hover:bg-gray-800 rounded-xl transition-all hover:scale-[1.01]"
                onClick={() => setViewState("join")}
              >
                <Users className="w-5 h-5 mr-2" />
                Entrar a mi grupo
              </Button>

              {!isAuthenticated && (
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-14 text-lg font-semibold border-white/25 text-white hover:bg-white/10 rounded-xl"
                  onClick={() => navigateToLogin()}
                >
                  Continuar con Google
                </Button>
              )}

              {isAdminCreator && (
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-14 text-lg font-semibold border-white/20 text-white hover:bg-white/10 rounded-xl"
                  onClick={() => setViewState("create")}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Crear Grupo
                </Button>
              )}

              <p className="text-xs text-white/50 pt-1">
                Si ya tienes sesión y grupo activo, entrarás automáticamente al Feed.
              </p>
            </motion.div>
          )}

          {viewState === "join" && (
            <motion.div
              key="join"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 text-left rounded-2xl border border-white/15 bg-[#11131a]/75 backdrop-blur-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Button variant="ghost" size="icon" onClick={() => setViewState("initial")} className="rounded-full">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <h3 className="font-bold text-white">Selecciona un grupo</h3>
              </div>
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-white/70" /></div>
              ) : groups.length === 0 ? (
                <div className="text-center text-white/70 py-8">No hay grupos disponibles para unirse.</div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {groups.map((group) => (
                    <motion.button
                      key={group.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        setSelectedGroup(group);
                        setViewState("password");
                        setError("");
                      }}
                      className="w-full p-4 bg-white/5 border border-white/15 rounded-xl hover:border-white/35 transition-all flex items-center justify-between group"
                    >
                      <span className="font-semibold text-white">{group.name}</span>
                      <ArrowRight className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {viewState === "password" && selectedGroup && (
            <motion.div
              key="password"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
            >
              <Card className="border-white/15 bg-[#11131a]/90 text-white shadow-xl">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Button variant="ghost" size="icon" onClick={() => setViewState("join")} className="h-8 w-8 -ml-2">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <CardTitle>{selectedGroup.name}</CardTitle>
                  </div>
                  <CardDescription className="text-white/70">Introduce la contraseña para acceder</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleJoin} className="space-y-4">
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-white/50" />
                      <Input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError("");
                        }}
                        className="pl-9 bg-white/5 border-white/15 text-white placeholder:text-white/45"
                        autoFocus
                      />
                    </div>

                    {error && <p className="text-red-400 text-sm font-medium">{error}</p>}

                    <Button type="submit" className="w-full bg-gray-900 hover:bg-gray-800">
                      Entrar
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {viewState === "create" && isAdminCreator && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="rounded-2xl border border-white/15 bg-[#11131a]/90 p-4 text-left space-y-4"
            >
              <Card className="border-white/15 bg-[#11131a]/90 text-white shadow-xl text-left">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Button variant="ghost" size="icon" onClick={() => setViewState("initial")} className="h-8 w-8 -ml-2">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <CardTitle>Crear Nuevo Grupo</CardTitle>
                  </div>
                  <CardDescription className="text-white/70">Configura tu espacio de equipo</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateGroup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white/85">Nombre del Grupo</Label>
                      <Input
                        id="name"
                        value={newGroupData.name}
                        onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })}
                        placeholder="Ej: Runners Club 2025"
                        className="bg-white/5 border-white/15 text-white placeholder:text-white/45"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-white/85">Descripción (Opcional)</Label>
                      <Input
                        id="description"
                        value={newGroupData.description}
                        onChange={(e) => setNewGroupData({ ...newGroupData, description: e.target.value })}
                        placeholder="Grupo de entrenamiento..."
                        className="bg-white/5 border-white/15 text-white placeholder:text-white/45"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="text-white/85">Contraseña de Acceso</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-white/50" />
                        <Input
                          id="new-password"
                          type="text"
                          value={newGroupData.password}
                          onChange={(e) => setNewGroupData({ ...newGroupData, password: e.target.value })}
                          placeholder="Clave secreta"
                          className="pl-9 bg-white/5 border-white/15 text-white placeholder:text-white/45"
                          required
                        />
                      </div>
                      <p className="text-xs text-white/60">Comparte esta contraseña con tu equipo para que puedan unirse.</p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gray-900 hover:bg-gray-800"
                      disabled={createGroupMutation.isPending}
                    >
                      {createGroupMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear Grupo"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-[11px] text-white/40">Olympia te conecta con tu equipo, tus métricas y tu progreso diario.</p>
      </div>
    </div>
  );
}