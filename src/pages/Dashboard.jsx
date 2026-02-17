import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { startOfWeek, endOfWeek, isWithinInterval, getDay } from "date-fns";
import { useSearchParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import MonthlyTeamChart from "../components/dashboard/MonthlyTeamChart";
import WeeklyWrap from "../components/dashboard/WeeklyWrap";
import TeamOverview from "../components/dashboard/TeamOverview";
import PerformanceAnalysis from "../components/dashboard/PerformanceAnalysis";

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const currentDate = dateParam ? new Date(dateParam) : new Date();

  const { data: allMembers, isLoading: loadingMembers } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => base44.entities.TeamMember.list(),
    initialData: [],
  });

  const groupId = sessionStorage.getItem('base44_group_id');
  const members = allMembers.filter(m => m.group_id === groupId);

  const { data: activities, isLoading: loadingActivities } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.list('-created_date'),
    initialData: [],
  });


  const getWeeklyStats = () => {
    // If looking at past months, calculate stats for the first week of that month or similar?
    // Or maybe just adapt to show stats relative to the selected view.
    // For now, let's stick to "week containing the selected date" logic
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const weeklyGoalHours = 10;

    let dayOfWeek = getDay(currentDate);
    if (dayOfWeek === 0) dayOfWeek = 7;

    // Adjust expected hours based on if we are in the future or past relative to the view date
    // If view date is today/past, use its day index.
    const expectedHours = (weeklyGoalHours / 7) * dayOfWeek;

    return members.map(member => {
      const memberActivities = activities.filter(activity => 
        activity.user_email === member.email &&
        isWithinInterval(new Date(activity.date), { start: weekStart, end: weekEnd })
      );

      const totalMinutes = memberActivities.reduce((sum, a) => sum + (a.duration_minutes || 0), 0);
      const totalHours = totalMinutes / 60;
      
      const rhythmPercentage = (totalHours / expectedHours) * 100;
      const weeklyPercentage = (totalHours / weeklyGoalHours) * 100;

      return {
        ...member,
        totalMinutes,
        totalHours: parseFloat(totalHours.toFixed(1)),
        expectedHours: parseFloat(expectedHours.toFixed(1)),
        activitiesCount: memberActivities.length,
        rhythmPercentage: parseFloat(rhythmPercentage.toFixed(1)),
        weeklyPercentage: parseFloat(weeklyPercentage.toFixed(1)),
        isOnPace: totalHours >= expectedHours
      };
    }).sort((a, b) => b.totalHours - a.totalHours);
  };

  const isLoading = loadingMembers || loadingActivities;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const weeklyStats = getWeeklyStats();

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8 text-white">
      <div className="mb-8 mt-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <MonthlyTeamChart members={members} activities={activities} currentDate={currentDate} />
        </motion.div>
      </div>

      <WeeklyWrap members={members} activities={activities} />

      {/* Month Navigator - Mobile Only */}
      <div className="md:hidden mb-4 flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-2 border border-white/15 shadow-sm w-fit mx-auto">
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => {
          const newDate = new Date(currentDate);
          newDate.setMonth(newDate.getMonth() - 1);
          const searchParams = new URLSearchParams(window.location.search);
          searchParams.set('date', format(newDate, 'yyyy-MM-dd'));
          window.history.pushState({}, '', `?${searchParams.toString()}`);
          window.location.reload();
        }}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-semibold text-white min-w-[120px] text-center capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-full"
          onClick={() => {
            const newDate = new Date(currentDate);
            newDate.setMonth(newDate.getMonth() + 1);
            const searchParams = new URLSearchParams(window.location.search);
            searchParams.set('date', format(newDate, 'yyyy-MM-dd'));
            window.history.pushState({}, '', `?${searchParams.toString()}`);
            window.location.reload();
          }}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <TeamOverview stats={weeklyStats} activities={activities} currentDate={currentDate} />

      <div className="mt-8">
        <PerformanceAnalysis activities={activities} members={members} currentDate={currentDate} />
      </div>
    </div>
  );
}