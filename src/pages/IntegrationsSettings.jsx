import React from "react";
import { Link } from "react-router-dom";
import { ActivitySquare } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function IntegrationsSettings() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 text-white space-y-4">
      <h2 className="text-2xl font-bold">Integraciones</h2>

      <Card className="bg-[#11131a]/80 border border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Strava</CardTitle>
          <CardDescription className="text-white/70">Conecta y sincroniza tus actividades automáticamente.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to={createPageUrl("StravaConnect")}>
            <Button>Abrir integración de Strava</Button>
          </Link>
        </CardContent>
      </Card>

      <Card className="bg-[#11131a]/80 border border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2"><ActivitySquare className="w-4 h-4" /> WHOOP</CardTitle>
          <CardDescription className="text-white/70">Conecta WHOOP y sincroniza tus entrenamientos con Olympia.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to={createPageUrl("WhoopConnect")}>
            <Button variant="outline" className="text-white border-white/20 hover:bg-white/10">Abrir integración de WHOOP</Button>
          </Link>
        </CardContent>
      </Card>

    </div>
  );
}
