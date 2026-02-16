import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const activityEmojis = {
  running: "🏃",
  strength_training: "💪",
  padel: "🎾",
  tennis: "🎾",
  martial_arts: "🥋",
  cycling: "🚴",
  swimming: "🏊",
  football: "⚽",
  basketball: "🏀",
  yoga: "🧘",
  hiking: "🥾",
  other: "🏅",
};

export default function Feed() {
  const groupId = sessionStorage.getItem("base44_group_id");

  const { data: members = [] } = useQuery({
    queryKey: ["team-members"],
    queryFn: () => base44.entities.TeamMember.list(),
  });

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activities"],
    queryFn: () => base44.entities.Activity.list("-created_date"),
  });

  const groupMembers = members.filter((m) => m.group_id === groupId);
  const groupEmails = new Set(groupMembers.map((m) => m.email));

  const feedActivities = activities
    .filter((activity) => groupEmails.has(activity.user_email))
    .slice(0, 25);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 text-white">
      <Card className="bg-[#11131a]/80 border border-white/10">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-white text-2xl">Feed del grupo</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {isLoading ? (
            <p className="text-white/70">Cargando actividad...</p>
          ) : feedActivities.length === 0 ? (
            <p className="text-white/70">Aún no hay actividades en el feed.</p>
          ) : (
            feedActivities.map((activity) => (
              <div
                key={activity.id}
                className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-start justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{activityEmojis[activity.activity_type] || "🏅"}</span>
                  <div>
                    <p className="font-semibold text-white">{activity.user_name}</p>
                    <p className="text-sm text-white/70">{activity.activity_type}</p>
                    <p className="text-xs text-white/50 mt-1 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {format(new Date(activity.date), "d MMM yyyy", { locale: es })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/70">{activity.duration_minutes} min</p>
                  <p className="text-orange-300 text-sm font-bold flex items-center gap-1 justify-end">
                    <Flame className="w-3 h-3" /> {activity.points || 0}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
