import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isSameDay, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import DayActivities from "@/components/calendar/DayActivities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MemberStats from "@/components/dashboard/MemberStats";

export default function MyActivity() {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: members = [] } = useQuery({
    queryKey: ["team-members"],
    queryFn: () => base44.entities.TeamMember.list(),
  });

  const { data: activities = [], isLoading: loadingActivities } = useQuery({
    queryKey: ["activities"],
    queryFn: () => base44.entities.Activity.list("-date"),
  });

  const { data: eggIntakes = [] } = useQuery({
    queryKey: ["egg-intakes"],
    queryFn: () => base44.entities.EggIntake.list("-date"),
  });

  const member = members.find((m) => m.email === user?.email);

  const myActivities = activities.filter((a) => a.user_email === user?.email);
  const myEggs = eggIntakes.filter((e) => e.user_email === user?.email);

  const deleteActivityMutation = useMutation({
    mutationFn: (id) => base44.entities.Activity.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["activities"] }),
  });

  const deleteEggMutation = useMutation({
    mutationFn: (id) => base44.entities.EggIntake.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["egg-intakes"] }),
  });

  const selectedDayActivities = myActivities.filter((a) => isSameDay(new Date(a.date), selectedDay));
  const selectedDayEggs = myEggs.filter((e) => isSameDay(new Date(e.date), selectedDay));

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekActivities = myActivities.filter((a) => isWithinInterval(new Date(a.date), { start: weekStart, end: weekEnd }));
  const weeklyHours = weekActivities.reduce((sum, a) => sum + (a.duration_minutes || 0), 0) / 60;

  if (!user || !member) {
    return <div className="max-w-5xl mx-auto px-4 py-6 text-white/70">Cargando tu actividad...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-white">
      <div className="flex items-center gap-3">
        {member.profile_image ? (
          <img src={member.profile_image} alt={member.name} className="w-12 h-12 rounded-full object-cover border border-white/20" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold">{member.name?.charAt(0)}</div>
        )}
        <div>
          <h2 className="text-2xl font-bold">Mi actividad</h2>
          <p className="text-sm text-white/70">{member.name} · {weeklyHours.toFixed(1)}h esta semana</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CalendarGrid
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            activities={myActivities}
            isLoading={loadingActivities}
          />
        </div>

        <Card className="bg-[#11131a]/80 border border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Detalle del día</CardTitle>
          </CardHeader>
          <CardContent>
            <DayActivities
              activities={selectedDayActivities}
              eggs={selectedDayEggs}
              onDeleteActivity={(id) => deleteActivityMutation.mutate(id)}
              onDeleteEgg={(id) => deleteEggMutation.mutate(id)}
              readOnly={false}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#11131a]/80 border border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Estadísticas personales</CardTitle>
        </CardHeader>
        <CardContent>
          <MemberStats member={member} allActivities={myActivities} teamAverage={weeklyHours || 0.1} />
        </CardContent>
      </Card>
    </div>
  );
}
