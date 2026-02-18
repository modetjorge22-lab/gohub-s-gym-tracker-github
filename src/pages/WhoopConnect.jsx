import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, RefreshCw, Loader2, AlertCircle } from "lucide-react";

export default function WhoopConnect() {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [connecting, setConnecting] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: tokens = [], refetch: refetchTokens } = useQuery({
    queryKey: ["whoop-tokens"],
    queryFn: () => base44.entities.WhoopToken.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const isConnected = tokens.length > 0;

  // Check if redirected back after OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
    if (params.get("whoop") === "connected") {
      refetchTokens();
    }
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    const res = await base44.functions.invoke("whoopAuth");
    if (res.data?.url) {
      window.location.href = res.data.url;
    }
    setConnecting(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    const res = await base44.functions.invoke("whoopSyncSleep");
    setSyncResult(res.data);
    setSyncing(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 text-white space-y-6">
      <h2 className="text-2xl font-bold">Whoop</h2>

      <Card className="bg-[#11131a]/80 border border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            {isConnected ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-orange-400" />
            )}
            {isConnected ? "Cuenta conectada" : "Cuenta no conectada"}
          </CardTitle>
          <CardDescription className="text-white/60">
            {isConnected
              ? "Tu cuenta de Whoop está sincronizada. Puedes importar tus datos de sueño."
              : "Conecta tu cuenta de Whoop para importar datos de sueño y recuperación."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!isConnected ? (
            <Button onClick={handleConnect} disabled={connecting} className="bg-emerald-600 hover:bg-emerald-700">
              {connecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Conectar con Whoop
            </Button>
          ) : (
            <div className="space-y-3">
              <Button onClick={handleSync} disabled={syncing} variant="outline" className="border-white/20 text-white hover:bg-white/10">
                {syncing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Sincronizar sueño
              </Button>
              {syncResult && (
                <p className="text-sm text-emerald-400">
                  ✓ Sincronizados {syncResult.synced} nuevos registros de sueño.
                </p>
              )}
              {syncResult?.error && (
                <p className="text-sm text-red-400">Error: {syncResult.error}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}