import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { startOfWeek, endOfWeek, isWithinInterval, getDay } from "date-fns";
import TeamOverview from "@/components/dashboard/TeamOverview";
import TrainingLoad from "@/components/dashboard/TrainingLoad";
import StrengthTrainingChart from "@/components/dashboard/StrengthTrainingChart";
import WhoopSleepChart from "@/components/dashboard/WhoopSleepChart";

export default function MyActivity() {
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: allMembers = [], isLoading: loadingMembers } = useQuery({
    queryKey: ["team-members"],
    queryFn: () => base44.entities.TeamMember.list(),
    initialData: [],
  });

  const { data: activities = [], isLoading: loadingActivities } = useQuery({
    queryKey: ["activities"],
    queryFn: () => base44.entities.Activity.list("-created_date"),
    initialData: [],
  });

  const groupId = sessionStorage.getItem("base44_group_id");
  const myMember = allMembers.find((m) => m.group_id === groupId && m.email === user?.email);

  const isLoading = loadingMembers || loadingActivities;

  const getMyWeeklyStats = () => {
    if (!myMember) return [];

    const currentDate = new Date();
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const weeklyGoalHours = 10;

    let dayOfWeek = getDay(currentDate);
    if (dayOfWeek === 0) dayOfWeek = 7;
    const expectedHours = (weeklyGoalHours / 7) * dayOfWeek;

    const memberActivities = activities.filter(
      (activity) =>
        activity.user_email === myMember.email &&
        isWithinInterval(new Date(activity.date), { start: weekStart, end: weekEnd })
    );

    const totalMinutes = memberActivities.reduce((sum, a) => sum + (a.duration_minutes || 0), 0);
    const totalHours = totalMinutes / 60;
    const rhythmPercentage = expectedHours > 0 ? (totalHours / expectedHours) * 100 : 0;
    const weeklyPercentage = (totalHours / weeklyGoalHours) * 100;

    return [
      {
        ...myMember,
        totalMinutes,
        totalHours: parseFloat(totalHours.toFixed(1)),
        expectedHours: parseFloat(expectedHours.toFixed(1)),
        activitiesCount: memberActivities.length,
        rhythmPercentage: parseFloat(rhythmPercentage.toFixed(1)),
        weeklyPercentage: parseFloat(weeklyPercentage.toFixed(1)),
        isOnPace: totalHours >= expectedHours,
      },
    ];
  };

  if (isLoading) {
    return <div className="max-w-7xl mx-auto px-4 py-6 text-white/70">Cargando tu actividad...</div>;
  }

  if (!myMember) {
    return <div className="max-w-7xl mx-auto px-4 py-6 text-white/70">No encontramos tu perfil en el grupo actual.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8 text-white">
      <div className="mb-3 md:mb-4">
        <h3 className="text-lg md:text-xl font-bold text-white">Mi actividad</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <TrainingLoad activities={activities} userEmail={myMember.email} />
        <StrengthTrainingChart activities={activities} userEmail={myMember.email} />
      </div>

      <TeamOverview
        stats={getMyWeeklyStats()}
        activities={activities}
        currentDate={new Date()}
      />
    </div>
  );
}