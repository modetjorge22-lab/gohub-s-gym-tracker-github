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

  const myGroupIds = members
    .filter(m => m.email === user?.email)
    .map(m => m.group_id);

  const groups = allGroups.filter(g => myGroupIds.includes(g.id));

  const handleSelectGroup = (group) => {
    sessionStorage.setItem("base44_group_id", group.id);
    sessionStorage.setItem("base44_group_name", group.name);
    localStorage.setItem("base44_last_group_id", group.id);
    localStorage.setItem("base44_last_group_name", group.name);
    navigate(createPageUrl("Dashboard"));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 text-white">
      <Card className="bg-[#11131a]/80 border border-white/10">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-white text-2xl flex items-center gap-2">
            <Users className="w-6 h-6" />
            Mis Grupos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {groups.length === 0 ? (
            <p className="text-white/70">No perteneces a ningún grupo aún.</p>
          ) : (
            groups.map((group) => (
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
        </CardContent>
      </Card>
    </div>
  );
}