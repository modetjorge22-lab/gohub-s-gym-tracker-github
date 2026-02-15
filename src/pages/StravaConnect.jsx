import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CheckCircle2, RefreshCw, ExternalLink, Copy, CheckCheck } from "lucide-react";

export default function StravaConnect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const redirectUri = `${window.location.origin}/StravaConnect`;

  const { data: user, refetch: refetchUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const isConnected = user?.strava_access_token;

  useEffect(() => {
    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (error) {
      alert('Error de Strava: ' + error);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }
    
    if (code && !isConnecting) {
      setIsConnecting(true);
      handleStravaCallback(code);
    }
  }, []);

  const handleStravaCallback = async (code) => {
    try {
      const response = await base44.functions.invoke('stravaAuth', { code });
      
      if (response.data.success) {
        await refetchUser();
        alert('¡Conectado con Strava exitosamente!');
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        alert('Error al conectar con Strava');
      }
    } catch (error) {
      console.error('Error conectando con Strava:', error);
      alert('Error al conectar: ' + error.message);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } finally {
      setIsConnecting(false);
    }
  };

  const syncMutation = useMutation({
    mutationFn: () => base44.functions.invoke('stravaSyncActivities', {}),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      alert(response.data.message || `Sincronización completa: ${response.data.imported} nuevos, ${response.data.updated} actualizados`);
    },
  });

  const registerWebhookMutation = useMutation({
    mutationFn: () => base44.functions.invoke('registerStravaWebhook', {}),
    onSuccess: (response) => {
      alert('¡Webhook registrado! Ahora tus entrenamientos se sincronizarán automáticamente.');
    },
    onError: (error) => {
      alert('Error registrando webhook: ' + error.message);
    },
  });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(redirectUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = async () => {
    try {
      // Get client ID from backend
      const response = await base44.functions.invoke('getStravaClientId', {});
      const clientId = response.data.clientId;
      
      const scope = "read,activity:read_all";
      
      window.location.href = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    } catch (error) {
      alert('Error al conectar: ' + error.message);
    }
  };

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-lg">Conectando con Strava...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-orange-500" />
            Conectar con Strava
          </CardTitle>
          <CardDescription>
            Sincroniza tus entrenamientos desde Strava automáticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <>
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-semibold">Conectado con Strava</span>
              </div>
              
              <p className="text-sm text-gray-600">
                Tu cuenta de Strava está conectada. Puedes sincronizar tus actividades de entrenamiento de fuerza.
              </p>

              <div className="space-y-3">
                <Button 
                  onClick={() => registerWebhookMutation.mutate()}
                  disabled={registerWebhookMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {registerWebhookMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Configurando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Activar Sincronización Automática
                    </>
                  )}
                </Button>

                <Button 
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  {syncMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sincronizar Manualmente
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-gray-500">
                Activa la sincronización automática para importar entrenamientos en tiempo real
              </p>
            </>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <p className="text-sm font-semibold text-blue-900">
                  📋 Configuración requerida
                </p>
                <p className="text-sm text-blue-800">
                  Antes de conectar, debes configurar esta URL en tu aplicación de Strava:
                </p>
                <div className="bg-white p-3 rounded border border-blue-200 font-mono text-xs break-all flex items-center justify-between gap-2">
                  <span className="text-blue-900">{redirectUri}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={copyToClipboard}
                    className="shrink-0"
                  >
                    {copied ? (
                      <CheckCheck className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>1. Ve a <a href="https://www.strava.com/settings/api" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">
                    Strava API Settings <ExternalLink className="w-3 h-3" />
                  </a></p>
                  <p>2. En "Authorization Callback Domain" pon: <strong>{window.location.hostname}</strong></p>
                  <p>3. Guarda y vuelve aquí a conectar</p>
                </div>
              </div>

              <Button 
                onClick={handleConnect}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                <Activity className="w-4 h-4 mr-2" />
                Conectar con Strava
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}