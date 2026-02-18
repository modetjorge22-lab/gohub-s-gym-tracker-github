import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Settings() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 text-white space-y-4">
      <h2 className="text-2xl font-bold">Configuración</h2>

      <Link to={createPageUrl("ProfileSettings")}> 
        <Card className="bg-[#11131a]/80 border border-white/10 hover:border-white/30 transition-colors">
          <CardHeader>
            <CardTitle className="text-white">Perfil</CardTitle>
            <CardDescription className="text-white/70">Gestiona foto, sesión y datos personales.</CardDescription>
          </CardHeader>
        </Card>
      </Link>

      <Link to={createPageUrl("IntegrationsSettings")}> 
        <Card className="bg-[#11131a]/80 border border-white/10 hover:border-white/30 transition-colors">
          <CardHeader>
            <CardTitle className="text-white">Integraciones</CardTitle>
            <CardDescription className="text-white/70">Conecta aplicaciones externas (Strava, etc.).</CardDescription>
          </CardHeader>
        </Card>
      </Link>
    </div>
  );
}
