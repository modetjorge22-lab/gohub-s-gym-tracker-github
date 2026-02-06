import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ChevronRight, Sparkles, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  format, 
  startOfWeek, 
  endOfWeek, 
  isWithinInterval, 
  getDay // Added as per outline
} from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

import MemberStats from "./MemberStats";
import GoalsDialog from "../goals/GoalsDialog";
import WeeklyPlanDialog from "./WeeklyPlanDialog";

const avatarColors = {
  blue: "from-blue-500 to-blue-600",
  green: "from-green-500 to-green-600",
  purple: "from-purple-500 to-purple-600",
  orange: "from-orange-500 to-orange-600",
  pink: "from-pink-500 to-pink-600",
  indigo: "from-indigo-500 to-indigo-600",
  red: "from-red-500 to-red-600",
  teal: "from-teal-500 to-teal-600"
};

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
  other: "🏅"
};

function MiniCalendar({ activities }) {
  const activityDate = activities.length > 0 ? new Date(activities[0].date) : new Date();
  const monthStart = startOfMonth(activityDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfMonth(activityDate);
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getDayActivities = (day) => {
    return activities.filter(a => isSameDay(new Date(a.date), day));
  };

  return (
    <div className="mt-3">
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const dayActivities = getDayActivities(day);
          const hasCompleted = dayActivities.some(a => a.status === 'completed');
          const hasPlanned = dayActivities.some(a => a.status === 'planned');
          const firstActivity = dayActivities[0];
          
          return (
            <div
              key={index}
              className={`aspect-square rounded text-xs flex flex-col items-center justify-center ${
                hasCompleted
                  ? "bg-green-500 text-white font-bold" 
                  : hasPlanned
                  ? "bg-gray-100 text-gray-600 border-2 border-green-500"
                  : "bg-gray-100 text-gray-300"
              }`}
            >
              <div className="text-[10px]">{format(day, "d")}</div>
              {(hasCompleted || hasPlanned) && firstActivity && (
                <div className="text-[10px] leading-none">
                  {activityEmojis[firstActivity.activity_type]}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getFunFact(activities, memberName) {
  if (activities.length === 0) return "¡Empieza tu primera actividad! 💪";
  
  const totalMinutes = activities.reduce((sum, a) => sum + a.duration_minutes, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  
  const activityCounts = {};
  activities.forEach(a => {
    activityCounts[a.activity_type] = (activityCounts[a.activity_type] || 0) + 1;
  });
  
  const favoriteActivity = Object.entries(activityCounts).sort((a, b) => b[1] - a[1])[0];
  
  const activityLabels = {
    running: "corriendo",
    strength_training: "entrenando fuerza",
    padel: "jugando pádel",
    tennis: "jugando tenis",
    martial_arts: "en artes marciales",
    cycling: "en bici",
    swimming: "nadando",
    football: "jugando fútbol",
    basketball: "jugando basket",
    yoga: "haciendo yoga",
    hiking: "haciendo senderismo",
    other: "entrenando"
  };
  
  const intenseCounts = activities.filter(a => a.intensity >= 4).length;
  const consecutiveDays = getConsecutiveDays(activities);
  
  const facts = [
    `${totalHours}h ${totalMinutes % 60}min de entrenamiento este mes`,
    `Favorito: ${activityLabels[favoriteActivity[0]]} 💚`,
    intenseCounts > 0 ? `${intenseCounts} entrenamientos intensos 🔥` : null,
    consecutiveDays >= 3 ? `${consecutiveDays} días seguidos activo 🎯` : null,
    activities.length >= 10 ? `${activities.length} actividades este mes 🚀` : null,
  ].filter(Boolean);
  
  return facts[Math.floor(Math.random() * facts.length)] || `${activities.length} actividades registradas`;
}

function getConsecutiveDays(activities) {
  if (activities.length === 0) return 0;
  
  const sortedDates = activities
    .map(a => new Date(a.date).toDateString())
    .filter((date, index, self) => self.indexOf(date) === index)
    .sort((a, b) => new Date(b) - new Date(a));
  
  let consecutive = 1;
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const current = new Date(sortedDates[i]);
    const next = new Date(sortedDates[i + 1]);
    const diffDays = Math.floor((current - next) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      consecutive++;
    } else {
      break;
    }
  }
  
  return consecutive;
}

// Liquid glass style - tonalidad neutra
      function getCardBackground() {
        return "from-white/70 to-gray-50/70 border-white/50";
      }

export default function TeamOverview({ stats, activities, currentDate = new Date() }) {
  const [goalsDialogOpen, setGoalsDialogOpen] = useState(false);
  const [weeklyPlanOpen, setWeeklyPlanOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const { data: eggIntakes, isLoading: loadingEggs } = useQuery({
    queryKey: ['egg-intakes'],
    queryFn: () => base44.entities.EggIntake.list('-created_date'),
    initialData: [],
  });

  const { data: allGoals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: () => base44.entities.Goal.list(),
    initialData: [],
  });

  const { data: allPlans = [] } = useQuery({
    queryKey: ['weekly-plans'],
    queryFn: () => base44.entities.WeeklyPlan.list(),
    initialData: [],
  });

  // Helper to get activities for the current week
  const getWeeklyActivities = (memberEmail) => {
    // Monday start of week (1 for Monday, 0 for Sunday)
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); 
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });     
    
    return activities.filter(a => {
      const activityDate = new Date(a.date);
      return a.user_email === memberEmail && 
             isWithinInterval(activityDate, { start: weekStart, end: weekEnd });
    });
  };

  const getWeeklyHours = (memberEmail, status = null) => {
    const weeklyActivities = getWeeklyActivities(memberEmail);
    const filtered = status ? weeklyActivities.filter(a => a.status === status) : weeklyActivities;
    const totalMinutes = filtered.reduce((sum, a) => sum + a.duration_minutes, 0);
    return (totalMinutes / 60);
  };

  const getMonthlyActivities = (memberEmail) => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    return activities.filter(a => {
      const activityDate = new Date(a.date);
      return a.user_email === memberEmail && 
             isWithinInterval(activityDate, { start: monthStart, end: monthEnd });
    });
  };

  const getMonthlyEggs = (memberEmail) => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    const memberEggs = eggIntakes.filter(e => {
      const eggDate = new Date(e.date);
      return e.user_email === memberEmail && 
             isWithinInterval(eggDate, { start: monthStart, end: monthEnd });
    });

    return memberEggs.reduce((sum, e) => sum + (e.egg_count || 0), 0);
  };

  // Define weekly goal for members - updated to 10 hours
  const weeklyGoal = 10; 

  // Calcular media del equipo para las últimas 4 semanas
  const getTeamWeeklyAverage = () => {
    const fourWeeksAgo = new Date(currentDate.getTime() - 28 * 24 * 60 * 60 * 1000); 
    
    const recentActivities = activities.filter(a => {
      const d = new Date(a.date);
      return d >= fourWeeksAgo && d <= currentDate;
    });
    
    if (recentActivities.length === 0) return 0;
    
    const totalHours = recentActivities.reduce((sum, a) => sum + (a.duration_minutes / 60), 0);
    const uniqueMembers = new Set(recentActivities.map(a => a.user_email)).size;
    
    return uniqueMembers > 0 ? parseFloat((totalHours / uniqueMembers / 4).toFixed(1)) : 0;
  };

  const teamAverage = getTeamWeeklyAverage();

  // Calculate Member Statistics
  const membersWithCalculatedStats = React.useMemo(() => {
    const dayOfWeekIndex = getDay(currentDate);
    const currentDayOfWeek = dayOfWeekIndex === 0 ? 7 : dayOfWeekIndex;

    return stats.map(member => {
      const completedHours = getWeeklyHours(member.email, 'completed');
      const plannedHours = getWeeklyHours(member.email, 'planned');
      const totalHoursRaw = completedHours + plannedHours;
      const monthlyActivities = getMonthlyActivities(member.email);
      const monthlyEggs = getMonthlyEggs(member.email);

      // Get member goals
      const memberGoals = allGoals.filter(g => g.user_email === member.email);
      const generalGoal = memberGoals.find(g => g.goal_type === 'general');
      const effectiveWeeklyGoal = generalGoal ? generalGoal.weekly_hours_target : weeklyGoal;

      // Calcular ritmo esperado personalizado basado en semanas anteriores
      const last4WeeksActivities = activities.filter(a => {
        const activityDate = new Date(a.date);
        const fourWeeksAgo = new Date(currentDate.getTime() - 28 * 24 * 60 * 60 * 1000);
        return a.user_email === member.email && 
               a.status === 'completed' &&
               activityDate >= fourWeeksAgo &&
               activityDate < startOfWeek(currentDate, { weekStartsOn: 1 });
      });
      
      const avgWeeklyHours = last4WeeksActivities.length > 0 
        ? last4WeeksActivities.reduce((sum, a) => sum + a.duration_minutes / 60, 0) / 4
        : effectiveWeeklyGoal;
      
      const personalExpectedHoursPerDay = avgWeeklyHours / 7;
      const expectedHours = parseFloat((currentDayOfWeek * personalExpectedHoursPerDay).toFixed(1));
      
      const rhythmPercentage = expectedHours > 0 
        ? (completedHours / expectedHours) * 100 
        : (completedHours === 0 ? 100 : 0);

      const isOnPace = rhythmPercentage >= 100;
      const weeklyPercentage = (completedHours / effectiveWeeklyGoal) * 100;
      const plannedPercentage = (plannedHours / effectiveWeeklyGoal) * 100;

      // Activity-specific goals
      const activityGoals = memberGoals.filter(g => g.goal_type === 'activity_specific');

      // Calcular ritmo mensual vs histórico (para badge Performer/Panza)
      const calculateMonthlyPace = () => {
        const monthStart = startOfMonth(currentDate);
        const today = new Date();
        
        // Calcular días transcurridos del mes actual
        const daysInCurrentMonth = today.getDate(); // Día actual (1-31)
        
        const currentMonthActivities = activities.filter(a => {
          const activityDate = new Date(a.date);
          return a.user_email === member.email && 
                 a.status === 'completed' &&
                 activityDate >= monthStart &&
                 activityDate <= today;
        });
        
        const currentMonthHours = currentMonthActivities.reduce((sum, a) => sum + a.duration_minutes / 60, 0);
        
        // Ritmo diario del mes actual
        const currentDailyPace = daysInCurrentMonth > 0 
          ? currentMonthHours / daysInCurrentMonth 
          : 0;
        
        // Calcular ritmo diario promedio de meses anteriores (últimos 6 meses)
        const historicalDailyPaces = [];
        for (let i = 1; i <= 6; i++) {
          const pastMonthDate = new Date(currentDate);
          pastMonthDate.setMonth(pastMonthDate.getMonth() - i);
          const pastMonthStart = startOfMonth(pastMonthDate);
          const pastMonthEnd = endOfMonth(pastMonthDate);
          const daysInPastMonth = pastMonthEnd.getDate();
          
          const pastMonthActivities = activities.filter(a => {
            const activityDate = new Date(a.date);
            return a.user_email === member.email && 
                   a.status === 'completed' &&
                   isWithinInterval(activityDate, { start: pastMonthStart, end: pastMonthEnd });
          });
          
          const hours = pastMonthActivities.reduce((sum, a) => sum + a.duration_minutes / 60, 0);
          if (hours > 0) {
            historicalDailyPaces.push(hours / daysInPastMonth);
          }
        }
        
        const historicalDailyAverage = historicalDailyPaces.length > 0 
          ? historicalDailyPaces.reduce((sum, pace) => sum + pace, 0) / historicalDailyPaces.length 
          : 0;
        
        const monthlyPacePercentage = historicalDailyAverage > 0 
          ? (currentDailyPace / historicalDailyAverage) * 100 
          : (currentDailyPace > 0 ? 100 : 0);
        
        return {
          monthlyPacePercentage,
          currentMonthHours,
          historicalAverage: historicalDailyAverage
        };
      };

      const { monthlyPacePercentage, currentMonthHours, historicalAverage } = calculateMonthlyPace();
      const isPerforming = monthlyPacePercentage >= 100;

      // Get member weekly plan
      const memberPlans = allPlans.filter(p => p.user_email === member.email);
      
      // Calculate plan completion
      let totalPlannedActivities = 0;
      let completedPlannedActivities = 0;
      
      memberPlans.forEach(plan => {
        totalPlannedActivities += plan.weekly_target;
        const planActivities = getWeeklyActivities(member.email).filter(
          a => a.activity_type === plan.activity_type && a.status === 'completed'
        );
        completedPlannedActivities += planActivities.length;
      });

      const planCompletionPercentage = totalPlannedActivities > 0 
        ? (completedPlannedActivities / totalPlannedActivities) * 100 
        : 0;

      return {
        ...member,
        completedHours: completedHours.toFixed(1),
        plannedHours: plannedHours.toFixed(1),
        totalHours: totalHoursRaw.toFixed(1),
        weeklyPercentage: weeklyPercentage,
        plannedPercentage: plannedPercentage,
        expectedHours: expectedHours,
        rhythmPercentage: rhythmPercentage,
        isOnPace: isOnPace,
        monthlyActivities: monthlyActivities,
        monthlyEggs: monthlyEggs,
        effectiveWeeklyGoal: effectiveWeeklyGoal,
        activityGoals: activityGoals,
        memberPlans: memberPlans,
        planCompletionPercentage: planCompletionPercentage,
        totalPlannedActivities: totalPlannedActivities,
        completedPlannedActivities: completedPlannedActivities,
        monthlyPacePercentage: monthlyPacePercentage,
        isPerforming: isPerforming,
        currentMonthHours: currentMonthHours,
        historicalAverage: historicalAverage
      };
    });
  }, [stats, activities, eggIntakes, weeklyGoal, allPlans]);


  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {membersWithCalculatedStats.map((member, index) => {
          const { 
            completedHours, 
            plannedHours,
            totalHours, 
            weeklyPercentage, 
            plannedPercentage,
            expectedHours, 
            rhythmPercentage, 
            isOnPace, 
            monthlyActivities, 
            monthlyEggs,
            effectiveWeeklyGoal,
            activityGoals,
            memberPlans,
            planCompletionPercentage,
            totalPlannedActivities,
            completedPlannedActivities,
            monthlyPacePercentage,
            isPerforming
          } = member;
          
          const funFact = getFunFact(monthlyActivities, member.name);
          const cardBg = getCardBackground();

          return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {/* Liquid glass style */}
              <div className={`group backdrop-blur-2xl bg-gradient-to-br ${cardBg} rounded-3xl border-2 shadow-2xl hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)] transition-all duration-500 p-6 hover:scale-[1.02] hover:cursor-pointer hover:border-gray-200`}>
                {/* Link now wraps the main display part of the card */}
                <Link to={`${createPageUrl("MemberCalendar")}?email=${encodeURIComponent(member.email)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 bg-gradient-to-br ${avatarColors[member.avatar_color]} rounded-xl flex items-center justify-center text-white font-bold shadow-lg`}>
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                          {member.name}
                        </h3>
                        <p className="text-xs text-gray-600">
                          {completedHours}h completadas{plannedHours > 0 ? ` + ${plannedHours}h plan` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={`${
                        isPerforming
                          ? "bg-green-600 text-white" 
                          : "bg-orange-600 text-white"
                      } font-bold shadow-md`}>
                        {isPerforming ? "🏆 Performer" : "😴 Panzeando"}
                      </Badge>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>
                  </div>

                  <MiniCalendar activities={monthlyActivities} />

                  <div className="mt-4 space-y-3">
                    {/* Plan Semanal */}
                    <div 
                      className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200/50 cursor-pointer hover:bg-white/80 transition-all"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedMember(member);
                        setWeeklyPlanOpen(true);
                      }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-600 font-semibold">Plan Semanal</span>
                          <Settings className="w-3 h-3 text-gray-400" />
                        </div>
                        <span className="text-sm font-bold text-gray-900">
                          {completedPlannedActivities}/{totalPlannedActivities}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(planCompletionPercentage, 100)}%` }}
                          transition={{ duration: 0.8, delay: index * 0.05 }}
                          className="h-full rounded-full bg-green-500"
                        />
                      </div>
                      {memberPlans.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {memberPlans.map((plan, idx) => {
                            const planActivitiesCompleted = getWeeklyActivities(member.email).filter(
                              a => a.activity_type === plan.activity_type && a.status === 'completed'
                            ).length;
                            return (
                              <span key={idx} className="text-[10px] bg-white px-2 py-0.5 rounded-full border text-gray-600">
                                {activityEmojis[plan.activity_type]} {planActivitiesCompleted}/{plan.weekly_target}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      {memberPlans.length === 0 && (
                        <div className="text-xs text-gray-500 mt-2">
                          Clic para configurar tu plan
                        </div>
                      )}
                    </div>

                    {/* Fun Fact */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200/50">
                      <div className="flex items-center gap-2 text-sm">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <span className="text-gray-700 font-medium">{funFact}</span>
                      </div>
                    </div>

                    {/* Contador de Huevos Mensuales */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🥚</span>
                          <div>
                            <p className="text-xs text-gray-600">Huevos este mes</p>
                            <p className="text-lg font-bold text-gray-900">{monthlyEggs}</p>
                          </div>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((monthlyEggs / 100) * 100, 100)}%` }}
                          transition={{ duration: 0.8, delay: index * 0.05 }}
                          className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Estadísticas Personales (fuera del Link para evitar navegación al hacer clic) */}
                <div className="mt-3 pt-3 border-t border-gray-200"> {/* Added border-t for visual separation */}
                  <MemberStats 
                    member={member} 
                    allActivities={activities}
                    teamAverage={teamAverage}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}

        {membersWithCalculatedStats.length === 0 && (
          <div className="col-span-full text-center py-16">
            <p className="text-gray-500 mb-4">No hay miembros en el equipo aún</p>
            <Link to={createPageUrl("Team")}>
              <Button className="bg-gray-900 hover:bg-gray-800">
                Añadir Miembros
              </Button>
            </Link>
          </div>
        )}
      </div>

      {selectedMember && (
        <>
          <GoalsDialog
            open={goalsDialogOpen}
            onOpenChange={setGoalsDialogOpen}
            member={selectedMember}
          />
          <WeeklyPlanDialog
            open={weeklyPlanOpen}
            onOpenChange={setWeeklyPlanOpen}
            userEmail={selectedMember.email}
          />
        </>
      )}
    </>
  );
}