import React from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";

export default function Groups() {
  const navigate = useNavigate();
  
  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: () => base44.entities.Group.list(),
  });

  const handleJoinGroup = (group) => {
    sessionStorage.setItem("base44_group_id", group.id);
    sessionStorage.setItem("base44_group_name", group.name);
    localStorage.setItem("base44_last_group_id", group.id);
    localStorage.setItem("base44_last_group_name", group.name);
    navigate(createPageUrl("Feed"));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 text-white">
      <Card className="bg-[#11131a]/80 border border-white/10">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-white text-2xl flex items-center gap-2">
            <Users className="w-6 h-6" />
            Grupos Disponibles
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {groups.length === 0 ? (
            <p className="text-white/70">No hay grupos disponibles.</p>
          ) : (
            groups.map((group) => (
              <div
                key={group.id}
                className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center justify-between hover:bg-white/10 transition-colors"
              >
                <div>
                  <h3 className="font-semibold text-white text-lg">{group.name}</h3>
                  {group.description && (
                    <p className="text-sm text-white/70 mt-1">{group.description}</p>
                  )}
                </div>
                <Button
                  onClick={() => handleJoinGroup(group)}
                  className="bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600"
                >
                  Unirse
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}