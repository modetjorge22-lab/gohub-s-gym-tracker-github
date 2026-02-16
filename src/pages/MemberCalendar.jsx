import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { isSameDay, format } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

import CalendarGrid from "../components/calendar/CalendarGrid";
import ActivityDialog from "../components/calendar/ActivityDialog";
import EggDialog from "../components/calendar/EggDialog";
import DayActivities from "../components/calendar/DayActivities";

export default function MemberCalendar() {
  const [urlParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const memberEmail = decodeURIComponent(urlParams.get('email') || '');
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [showEggDialog, setShowEggDialog] = useState(false);

  useEffect(() => {
    if (!memberEmail) {
      navigate(createPageUrl("Dashboard"));
    }
  }, [memberEmail, navigate]);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allMembers = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => base44.entities.TeamMember.list(),
    initialData: [],
  });

  const member = allMembers.find(m => m.email === memberEmail);
  const isCurrentUser = user?.email === member?.email;

  const { data: activities = [], isLoading: loadingActivities } = useQuery({
    queryKey: ['member-activities', memberEmail],
    queryFn: async () => {
      const allActivities = await base44.entities.Activity.list('-date');
      return allActivities.filter(a => a.user_email === memberEmail);
    },
    enabled: !!memberEmail,
  });

  const { data: eggIntakes = [] } = useQuery({
    queryKey: ['egg-intakes', memberEmail],
    queryFn: async () => {
      const allEggs = await base44.entities.EggIntake.list('-date');
      return allEggs.filter(e => e.user_email === memberEmail);
    },
    enabled: !!memberEmail,
  });

  const deleteActivityMutation = useMutation({
    mutationFn: (id) => base44.entities.Activity.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-activities', memberEmail] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });

  const deleteEggMutation = useMutation({
    mutationFn: (id) => base44.entities.EggIntake.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['egg-intakes', memberEmail] });
      queryClient.invalidateQueries({ queryKey: ['egg-intakes'] });
    },
  });

  if (!memberEmail) {
    return null;
  }

  if (loadingMembers || loadingActivities) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Skeleton className="h-10 w-64 mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Dashboard"))}
          className="mb-6 text-gray-200 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <p className="text-gray-500">Miembro no encontrado</p>
      </div>
    );
  }

  const selectedDayActivities = activities.filter(a => 
    isSameDay(new Date(a.date), selectedDay)
  );

  const selectedDayEggs = eggIntakes.filter(e => 
    isSameDay(new Date(e.date), selectedDay)
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 pb-24 md:pb-8">
      <Button
        variant="ghost"
        onClick={() => navigate(createPageUrl("Dashboard"))}
        className="mb-6 text-gray-200 hover:text-white hover:bg-white/10"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver
      </Button>

      <div className="mb-8 flex items-center gap-4">
        {member.profile_image ? (
          <img src={member.profile_image} alt={member.name} className="w-16 h-16 rounded-full object-cover border-2 border-white/30" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center text-2xl font-bold">
            {member.name?.charAt(0)?.toUpperCase()}
          </div>
        )}
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">{member.name}</h2>
          <p className="text-gray-300">{member.email}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CalendarGrid
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            activities={activities}
            isLoading={loadingActivities}
          />
        </div>

        <div className="space-y-4">
          <div className="backdrop-blur-xl bg-white/80 rounded-2xl border border-gray-200/50 shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {format(selectedDay, "d 'de' MMMM", { locale: es })}
              </h3>
              {isCurrentUser && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setShowActivityDialog(true)}
                    className="bg-gray-900 hover:bg-gray-800"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Actividad
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowEggDialog(true)}
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    🥚 Huevos
                  </Button>
                </div>
              )}
            </div>

            <DayActivities
              activities={selectedDayActivities}
              eggs={selectedDayEggs}
              onDeleteActivity={(id) => isCurrentUser ? deleteActivityMutation.mutate(id) : null}
              onDeleteEgg={(id) => isCurrentUser ? deleteEggMutation.mutate(id) : null}
              readOnly={!isCurrentUser}
            />
          </div>
        </div>
      </div>

      <ActivityDialog
        open={showActivityDialog}
        onOpenChange={setShowActivityDialog}
        member={member}
        selectedDate={selectedDay}
      />

      <EggDialog
        open={showEggDialog}
        onOpenChange={setShowEggDialog}
        member={member}
        selectedDate={selectedDay}
      />
    </div>
  );
}