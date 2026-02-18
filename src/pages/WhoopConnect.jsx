import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivitySquare, CheckCircle2, RefreshCw, Link as LinkIcon, AlertTriangle } from "lucide-react";

export default function WhoopConnect() {
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);

  const redirectUri = useMemo(() => `${window.location.origin}/WhoopConnect`, []);

  const { data: user, refetch: refetchUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => base44.auth.me(),
  });

  const isConnected = Boolean(user?.whoop_access_token);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const error = urlParams.get("error");

    if (error) {
      alert(`Error de WHOOP: ${error}`);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code && !isConnecting) {
      setIsConnecting(true);
      handleWhoopCallback(code);
    }
  }, []);

  const handleWhoopCallback = async (code) => {
    try {
      const response = await base44.functions.invoke("whoopAuth", { code, redirectUri });

      if (response?.data?.success) {
        await refetchUser();
        alert("¡Conectado con WHOOP correctamente!");
      } else {
        alert(response?.data?.error || "No se pudo completar la conexión con WHOOP");
      }
    } catch (error) {
      const backendData = error?.response?.data || error?.data;
      const details = [backendData?.error || error?.message, backendData?.whoop_status && `status: ${backendData.whoop_status}`]
        .filter(Boolean)
        .join(" | ");
      alert(`Error conectando WHOOP: ${details}`);
    } finally {
      setIsConnecting(false);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const syncMutation = useMutation({
    mutationFn: () => base44.functions.invoke("whoopSyncActivities", {}),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });

      if (response?.data?.error) {
        const details = [
          response.data.error,
          response.data.whoop_status && `status: ${response.data.whoop_status}`,
          response.data.whoop_body,
        ]
          .filter(Boolean)
          .join(" | ");
        alert(`Error de sincronización WHOOP: ${details}`);
        return;
      }

      alert(response?.data?.message || "Sincronización WHOOP completada");
    },
    onError: (error) => {
      const backendData = error?.response?.data || error?.data;
      const details = [
        backendData?.error || error?.message,
        backendData?.whoop_status && `status: ${backendData.whoop_status}`,
        backendData?.whoop_body,
      ]
        .filter(Boolean)
        .join(" | ");

      alert(`No se pudo sincronizar WHOOP: ${details}`);
    },
  });

  const connectMutation = useMutation({
    mutationFn: () => base44.functions.invoke("getWhoopClientId", {}),
    onSuccess: (response) => {
      const clientId = response?.data?.clientId;
      if (!clientId) {
        alert("WHOOP_CLIENT_ID no configurado en backend");
        return;
      }

      const scope = "read:profile read:workout read:recovery read:sleep read:cycles offline";
      const authUrl =
        `https://api.prod.whoop.com/oauth/oauth2/auth` +
        `?response_type=code&client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${encodeURIComponent(scope)}`;

      window.location.href = authUrl;
    },
    onError: (error) => {
      const backendData = error?.response?.data || error?.data;
      alert(backendData?.error || error?.message || "Error iniciando OAuth de WHOOP");
    },
  });

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-cyan-300" />
          <p className="text-lg">Conectando con WHOOP...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 text-white">
      <Card className="bg-[#11131a]/80 border border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivitySquare className="w-5 h-5 text-cyan-300" />
            Integración WHOOP
          </CardTitle>
          <CardDescription className="text-white/70">
            Conecta tu cuenta de WHOOP para importar entrenamientos de forma automática y manual.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isConnected ? (
            <>
              <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-semibold">Conectado con WHOOP</span>
              </div>

              <Button
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                variant="outline"
                className="w-full text-white border-white/20 hover:bg-white/10"
              >
                {syncMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sincronizando WHOOP...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sincronizar WHOOP manualmente
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-300" />
                <p>
                  Si al conectar aparece error, revisa en WHOOP Developer Console que el callback URI sea exactamente:
                  <br />
                  <span className="font-mono text-amber-200">{redirectUri}</span>
                </p>
              </div>

              <Button
                onClick={() => connectMutation.mutate()}
                disabled={connectMutation.isPending}
                className="w-full bg-cyan-500 hover:bg-cyan-600"
              >
                {connectMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Iniciando conexión...
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Conectar con WHOOP
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
