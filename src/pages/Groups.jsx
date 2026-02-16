import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, ArrowRight, Plus, ChevronLeft, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function Groups() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [viewState, setViewState] = useState("list"); // list, join, password, create
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [newGroupData, setNewGroupData] = useState({
    name: "",
    description: "",
    password: "",
  });
  
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: members = [] } = useQuery({
    queryKey: ["team-members"],
    queryFn: () => base44.entities.TeamMember.list(),
  });

  const { data: allGroups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: () => base44.entities.Group.list(),
  });

  const isAdminCreator = user?.email?.toLowerCase() === "modetjorge22@gmail.com";

  const myGroupIds = members
    .filter(m => m.email === user?.email)
    .map(m => m.group_id);

  const myGroups = allGroups.filter(g => myGroupIds.includes(g.id));
  const availableGroups = allGroups.filter(g => !myGroupIds.includes(g.id));

  const createGroupMutation = useMutation({
    mutationFn: (data) => base44.entities.Group.create(data),
    onSuccess: (newGroup) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Grupo creado correctamente");
      setViewState("list");
      setNewGroupData({ name: "", description: "", password: "" });
    },
  });

  const handleSelectGroup = (group) => {
    sessionStorage.setItem("base44_group_id", group.id);
    sessionStorage.setItem("base44_group_name", group.name);
    localStorage.setItem("base44_last_group_id", group.id);
    localStorage.setItem("base44_last_group_name", group.name);
    navigate(createPageUrl("Dashboard"));
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!selectedGroup) return;

    if (password === selectedGroup.password) {
      handleSelectGroup(selectedGroup);
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
    <div className="max-w-4xl mx-auto px-4 py-6 text-white">
      <AnimatePresence mode="wait">
        {viewState === "list" && (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="bg-[#11131a]/80 border border-white/10">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="text-white text-2xl flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  Mis Grupos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {myGroups.length === 0 ? (
                  <p className="text-white/70">No perteneces a ningún grupo aún.</p>
                ) : (
                  myGroups.map((group) => (
                    <div
                      key={group.id}
                      className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => handleSelectGroup(group)}
                    >
                      <div>
                        <h3 className="font-semibold text-white text-lg">{group.name}</h3>
                        {group.description && (
                          <p className="text-sm text-white/70 mt-1">{group.description}</p>
                        )}
                      </div>
                      <ArrowRight className="w-5 h-5 text-white/50" />
                    </div>
                  ))
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => setViewState("join")}
                    className="flex-1 bg-gray-900 hover:bg-gray-800"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Unirme a un grupo
                  </Button>
                  {isAdminCreator && (
                    <Button
                      onClick={() => setViewState("create")}
                      variant="outline"
                      className="flex-1 border-white/20 text-white hover:bg-white/10"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Crear grupo
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {viewState === "join" && (
          <motion.div
            key="join"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="bg-[#11131a]/80 border border-white/10">
              <CardHeader className="border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setViewState("list")} className="rounded-full">
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <CardTitle className="text-white text-xl">Selecciona un grupo</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {availableGroups.length === 0 ? (
                  <p className="text-white/70">No hay más grupos disponibles.</p>
                ) : (
                  availableGroups.map((group) => (
                    <motion.button
                      key={group.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        setSelectedGroup(group);
                        setViewState("password");
                        setError("");
                        setPassword("");
                      }}
                      className="w-full p-4 bg-white/5 border border-white/15 rounded-xl hover:border-white/35 transition-all flex items-center justify-between group"
                    >
                      <div className="text-left">
                        <span className="font-semibold text-white block">{group.name}</span>
                        {group.description && (
                          <span className="text-sm text-white/60">{group.description}</span>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
                    </motion.button>
                  ))
                )}
              </CardContent>
            </Card>
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
          >
            <Card className="border-white/15 bg-[#11131a]/90 text-white shadow-xl text-left">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Button variant="ghost" size="icon" onClick={() => setViewState("list")} className="h-8 w-8 -ml-2">
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
    </div>
  );
}