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
    if (currentUser) {
      const activeGroupId = sessionStorage.getItem("base44_group_id");
      if (activeGroupId) {
        navigate(createPageUrl("Dashboard"));
      } else {
        navigate(createPageUrl("Groups"));
      }
    }
  }, [currentUser, navigate]);

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
      localStorage.setItem("base44_last_group_name", selectedGroup.name);
      navigate(createPageUrl("Dashboard"));
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
        >
          <h1 className="text-6xl md:text-7xl font-black tracking-tight text-white">Olympia</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <Button
            size="lg"
            className="w-full h-14 text-lg font-bold bg-gray-900 hover:bg-gray-800 rounded-xl transition-all hover:scale-[1.01]"
            onClick={() => base44.auth.redirectToLogin()}
          >
            Continuar con Google
          </Button>
        </motion.div>
      </div>
    </div>
  );
}