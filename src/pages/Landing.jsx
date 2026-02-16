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

export default function Landing() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // States for flow control
  const [viewState, setViewState] = useState("initial"); // initial, join, create, password
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);

  // Form state for creating group
  const [newGroupData, setNewGroupData] = useState({
    name: "",
    description: "",
    password: ""
  });

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => base44.entities.Group.list(),
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const isAdminCreator = currentUser?.email?.toLowerCase() === 'modetjorge22@gmail.com';

  // Auto-login effect
  React.useEffect(() => {
    if (!autoLoginAttempted && !isLoading && groups.length > 0) {
      const lastGroupId = localStorage.getItem('base44_last_group_id');
      const lastPassword = localStorage.getItem('base44_last_group_password');
      
      if (lastGroupId && lastPassword) {
        const group = groups.find(g => g.id === lastGroupId);
        if (group && group.password === lastPassword) {
          sessionStorage.setItem('base44_group_id', group.id);
          sessionStorage.setItem('base44_group_name', group.name);
          localStorage.setItem('base44_last_group_name', group.name);
          navigate(createPageUrl("Dashboard"));
        }
      }
      setAutoLoginAttempted(true);
    }
  }, [groups, isLoading, autoLoginAttempted, navigate]);

  const createGroupMutation = useMutation({
    mutationFn: (data) => base44.entities.Group.create(data),
    onSuccess: (newGroup) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success("Grupo creado correctamente");
      setSelectedGroup(newGroup);
      setViewState("password"); // Go directly to password entry (or auto-login)
      // For now, let's act as if we selected it and ask for password to confirm/login
      // Or we could auto-login. Let's auto-login for better UX? 
      // Actually, consistency: go to password screen or just login.
      // Let's just go to password screen to keep flow simple
    }
  });

  const handleJoin = (e) => {
    e.preventDefault();
    if (!selectedGroup) return;

    if (password === selectedGroup.password) {
      sessionStorage.setItem('base44_group_id', selectedGroup.id);
      sessionStorage.setItem('base44_group_name', selectedGroup.name);
      localStorage.setItem('base44_last_group_id', selectedGroup.id);
      localStorage.setItem('base44_last_group_password', selectedGroup.password);
      localStorage.setItem('base44_last_group_name', selectedGroup.name);
      navigate(createPageUrl("Dashboard"));
    } else {
      setError("Contraseña incorrecta");
      toast.error("Contraseña incorrecta");
    }
  };

  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (!isAdminCreator) {
      toast.error('Solo el administrador puede crear grupos');
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
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-indigo-500 opacity-20 blur-[100px]"></div>
      </div>

      <div className="z-10 w-full max-w-md space-y-8 text-center">
        {/* Title with 3D effect */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative"
        >
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-white drop-shadow-xl"
              style={{ textShadow: "2px 4px 6px rgba(0,0,0,0.1)" }}>
            Olympia
          </h1>
        </motion.div>

        <AnimatePresence mode="wait">
          {viewState === "initial" && (
            <motion.div 
              key="initial"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <Button 
                size="lg"
                className="w-full h-14 text-lg font-bold bg-gray-900 hover:bg-gray-800 shadow-lg rounded-xl transition-all hover:scale-[1.02]"
                onClick={() => setViewState("join")}
              >
                <Users className="w-5 h-5 mr-2" />
                Entrar a Grupo
              </Button>
              
              {isAdminCreator && (
                <Button 
                  size="lg"
                  variant="outline"
                  className="w-full h-14 text-lg font-bold border-white/20 text-white hover:bg-white/10 rounded-xl transition-all hover:scale-[1.02]"
                  onClick={() => setViewState("create")}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Crear Grupo
                </Button>
              )}
            </motion.div>
          )}

          {viewState === "join" && (
            <motion.div
              key="join"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 text-left"
            >
              <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="icon" onClick={() => setViewState("initial")} className="rounded-full">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <h3 className="font-bold text-white">Selecciona un grupo</h3>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-white/70" /></div>
              ) : groups.length === 0 ? (
                 <div className="text-center text-white/70 py-8">
                   No hay grupos disponibles para unirse.
                 </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {groups.map((group) => (
                    <motion.button
                      key={group.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedGroup(group);
                        setViewState("password");
                        setError("");
                      }}
                      className="w-full p-4 bg-white/5 border border-white/15 rounded-xl shadow-sm hover:shadow-md hover:border-white/35 transition-all flex items-center justify-between group"
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
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
                    
                    {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

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
                        onChange={(e) => setNewGroupData({...newGroupData, name: e.target.value})}
                        placeholder="Ej: Runners Club 2025"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-white/85">Descripción (Opcional)</Label>
                      <Input
                        id="description"
                        value={newGroupData.description}
                        onChange={(e) => setNewGroupData({...newGroupData, description: e.target.value})}
                        placeholder="Grupo de entrenamiento..."
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
                          onChange={(e) => setNewGroupData({...newGroupData, password: e.target.value})}
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
                      {createGroupMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Crear Grupo"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}