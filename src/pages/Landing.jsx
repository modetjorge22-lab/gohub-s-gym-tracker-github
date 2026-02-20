import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function Landing() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    base44.auth.isAuthenticated().then(setIsAuthenticated);
  }, []);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: () => base44.entities.Group.list(),
    enabled: isAuthenticated,
  });

  // Si ya está autenticado y tiene grupo guardado → entrar directamente
  React.useEffect(() => {
    if (!isAuthenticated) return;

    const activeGroupId = sessionStorage.getItem("base44_group_id");
    const rememberedGroupId = localStorage.getItem("base44_last_group_id");
    const rememberedPassword = localStorage.getItem("base44_last_group_password");

    if (activeGroupId) {
      navigate(createPageUrl("Groups"));
      return;
    }

    if (!isLoading && groups.length > 0 && rememberedGroupId && rememberedPassword) {
      const group = groups.find((g) => g.id === rememberedGroupId);
      if (group && group.password === rememberedPassword) {
        sessionStorage.setItem("base44_group_id", group.id);
        sessionStorage.setItem("base44_group_name", group.name);
        navigate(createPageUrl("Groups"));
      }
    }
  }, [isAuthenticated, isLoading, groups, navigate]);

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_55%)]" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.18),transparent_60%)] blur-3xl" />
      </div>

      <div className="z-10 w-full max-w-sm text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-2"
        >
          <h1 className="text-7xl font-black tracking-tight text-white">Olympia</h1>
          <p className="text-sm text-white/50 tracking-widest uppercase">Performance Hub</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          <Button
            size="lg"
            className="w-full h-13 text-base font-semibold bg-white text-black hover:bg-white/90 rounded-xl flex items-center justify-center gap-3"
            onClick={() => base44.auth.redirectToLogin(window.location.href)}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </Button>
        </motion.div>
      </div>
    </div>
  );
}