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
  }, [currentUser, navigate]);

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

      <div className="z-10 w-full max-w-xs space-y-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-2"
        >
          <h1 className="text-7xl font-black tracking-tight text-white">Olympia</h1>
          <p className="text-sm text-white/50 tracking-widest uppercase">Performance Hub</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="space-y-3"
        >
          {!isAuthenticated ? (
            <Button
              size="lg"
              className="w-full h-14 text-base font-semibold bg-white text-black hover:bg-white/90 rounded-2xl transition-all"
              onClick={() => navigateToLogin()}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar con Google
            </Button>
          ) : (
            <Button
              size="lg"
              className="w-full h-14 text-base font-semibold bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl"
              onClick={() => setViewState("join")}
            >
              <Users className="w-5 h-5 mr-2" />
              Entrar a mi grupo
            </Button>
          )}

          {isAdminCreator && (
            <Button
              size="sm"
              variant="ghost"
              className="text-white/40 hover:text-white/70 text-xs"
              onClick={() => setViewState("create")}
            >
              <Plus className="w-3 h-3 mr-1" /> Crear grupo
            </Button>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {viewState === "join" && (
            <motion.div
              key="join"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3 text-left rounded-2xl border border-white/15 bg-[#11131a]/75 backdrop-blur-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Button variant="ghost" size="icon" onClick={() => setViewState("initial")} className="rounded-full h-8 w-8">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h3 className="font-bold text-white text-sm">Selecciona un grupo</h3>
              </div>
              {isLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="animate-spin text-white/70" /></div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {groups.map((group) => (
                    <motion.button
                      key={group.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setSelectedGroup(group); setViewState("password"); setError(""); }}
                      className="w-full p-3 bg-white/5 border border-white/15 rounded-xl hover:border-white/35 transition-all flex items-center justify-between"
                    >
                      <span className="font-semibold text-white text-sm">{group.name}</span>
                      <ArrowRight className="w-4 h-4 text-white/50" />
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
              className="rounded-2xl border border-white/15 bg-[#11131a]/90 p-4 text-left space-y-4"
            >
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setViewState("join")} className="h-8 w-8">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-bold text-white text-sm">{selectedGroup.name}</span>
              </div>
              <form onSubmit={handleJoin} className="space-y-3">
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-white/50" />
                  <Input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    className="pl-9 bg-white/5 border-white/15 text-white placeholder:text-white/45"
                    autoFocus
                  />
                </div>
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <Button type="submit" className="w-full bg-white text-black hover:bg-white/90">Entrar</Button>
              </form>
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
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setViewState("initial")} className="h-8 w-8">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-bold text-white text-sm">Crear Nuevo Grupo</span>
              </div>
              <form onSubmit={handleCreateGroup} className="space-y-3">
                <Input value={newGroupData.name} onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })} placeholder="Nombre del grupo" className="bg-white/5 border-white/15 text-white placeholder:text-white/45" required />
                <Input value={newGroupData.description} onChange={(e) => setNewGroupData({ ...newGroupData, description: e.target.value })} placeholder="Descripción (opcional)" className="bg-white/5 border-white/15 text-white placeholder:text-white/45" />
                <Input value={newGroupData.password} onChange={(e) => setNewGroupData({ ...newGroupData, password: e.target.value })} placeholder="Contraseña" className="bg-white/5 border-white/15 text-white placeholder:text-white/45" required />
                <Button type="submit" className="w-full bg-white text-black hover:bg-white/90" disabled={createGroupMutation.isPending}>
                  {createGroupMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear Grupo"}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}