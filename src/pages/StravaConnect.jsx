import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CheckCircle2, RefreshCw } from "lucide-react";

export default function StravaConnect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const queryClient = useQueryClient();

  const { data: user, refetch: refetchUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const isConnected = user?.strava_access_token;

  useEffect(() => {
    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
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
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      console.error('Error conectando con Strava:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const syncMutation = useMutation({
    mutationFn: () => base44.functions.invoke('stravaSyncActivities', {}),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      alert(`Se importaron ${response.data.imported} entrenamientos de ${response.data.total} actividades`);
    },
  });

  const handleConnect = async () => {
    try {
      // Get client ID from backend
      const response = await base44.functions.invoke('getStravaClientId', {});
      const clientId = response.data.clientId;
      
      const redirectUri = window.location.origin + window.location.pathname;
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

              <Button 
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                {syncMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sincronizar Entrenamientos
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500">
                Se importarán las actividades de entrenamiento de fuerza de los últimos 30 días
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Conecta tu cuenta de Strava para importar automáticamente tus entrenamientos de fuerza.
              </p>

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