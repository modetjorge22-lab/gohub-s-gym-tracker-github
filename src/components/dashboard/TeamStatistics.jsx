import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Zap, Target, Award, Flame, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

export default function TeamStatistics({ stats, activities, members }) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const monthlyActivities = activities.filter(a => 
    isWithinInterval(new Date(a.date), { start: monthStart, end: monthEnd })
  );

  // Estadísticas del equipo
  const totalHoursThisMonth = monthlyActivities.reduce((sum, a) => sum + (a.duration_minutes / 60), 0);
  const totalActivitiesThisMonth = monthlyActivities.length;
  const avgIntensity = monthlyActivities.length > 0 
    ? (monthlyActivities.reduce((sum, a) => sum + a.intensity, 0) / monthlyActivities.length).toFixed(1)
    : 0;

  // Miembro con más actividades este mes
  const activityCountsByMember = {};
  monthlyActivities.forEach(a => {
    activityCountsByMember[a.user_email] = (activityCountsByMember[a.user_email] || 0) + 1;
  });
  const mostActiveMember = Object.keys(activityCountsByMember).length > 0
    ? members.find(m => m.email === Object.entries(activityCountsByMember).sort((a, b) => b[1] - a[1])[0][0])
    : null;

  // Miembro más consistente (más días diferentes con actividad)
  const uniqueDaysByMember = {};
  monthlyActivities.forEach(a => {
    if (!uniqueDaysByMember[a.user_email]) uniqueDaysByMember[a.user_email] = new Set();
    uniqueDaysByMember[a.user_email].add(new Date(a.date).toDateString());
  });
  const mostConsistentMember = Object.keys(uniqueDaysByMember).length > 0
    ? members.find(m => m.email === Object.entries(uniqueDaysByMember)
        .map(([email, days]) => ({ email, count: days.size }))
        .sort((a, b) => b.count - a.count)[0].email)
    : null;
  const consistentDays = mostConsistentMember ? uniqueDaysByMember[mostConsistentMember.email].size : 0;

  // Actividad con mayor intensidad promedio
  const intensityByActivity = {};
  const countByActivity = {};
  monthlyActivities.forEach(a => {
    if (!intensityByActivity[a.activity_type]) {
      intensityByActivity[a.activity_type] = 0;
      countByActivity[a.activity_type] = 0;
    }
    intensityByActivity[a.activity_type] += a.intensity;
    countByActivity[a.activity_type]++;
  });
  const avgIntensityByActivity = Object.keys(intensityByActivity).map(type => ({
    type,
    avg: intensityByActivity[type] / countByActivity[type]
  })).sort((a, b) => b.avg - a.avg);
  const mostIntenseActivity = avgIntensityByActivity[0];

  const activityLabels = {
    running: "Running",
    strength_training: "Fuerza",
    padel: "Pádel",
    tennis: "Tenis",
    martial_arts: "Artes Marciales",
    cycling: "Ciclismo",
    swimming: "Natación",
    football: "Fútbol",
    basketball: "Baloncesto",
    yoga: "Yoga",
    hiking: "Senderismo",
    other: "Otro"
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

  const teamStats = [
    {
      icon: Flame,
      label: "Horas Totales Este Mes",
      value: `${totalHoursThisMonth.toFixed(1)}h`,
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-50"
    },
    {
      icon: Calendar,
      label: "Actividades Este Mes",
      value: totalActivitiesThisMonth,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      icon: Zap,
      label: "Intensidad Media",
      value: `${avgIntensity}/5`,
      color: "from-yellow-500 to-yellow-600",
      bgColor: "bg-yellow-50"
    },
    mostActiveMember && {
      icon: Trophy,
      label: "Más Activo del Mes",
      value: mostActiveMember.name,
      subtitle: `${activityCountsByMember[mostActiveMember.email]} actividades`,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50"
    },
    mostConsistentMember && {
      icon: Target,
      label: "Más Consistente",
      value: mostConsistentMember.name,
      subtitle: `${consistentDays} días activos`,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50"
    },
    mostIntenseActivity && {
      icon: Award,
      label: "Actividad Más Intensa",
      value: activityLabels[mostIntenseActivity.type],
      subtitle: `Intensidad media: ${mostIntenseActivity.avg.toFixed(1)}/5`,
      emoji: activityEmojis[mostIntenseActivity.type],
      color: "from-red-500 to-pink-500",
      bgColor: "bg-red-50"
    }
  ].filter(Boolean);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {teamStats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="backdrop-blur-xl bg-white/80 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-4">
              <div className={`w-10 h-10 ${stat.bgColor} rounded-xl flex items-center justify-center mb-3`}>
                {stat.emoji ? (
                  <span className="text-xl">{stat.emoji}</span>
                ) : (
                  <stat.icon className={`w-5 h-5 bg-gradient-to-br ${stat.color} bg-clip-text`} strokeWidth={2.5} style={{WebkitTextFillColor: 'transparent'}} />
                )}
              </div>
              <div className="text-lg font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-xs text-gray-600 font-medium mb-1">
                {stat.label}
              </div>
              {stat.subtitle && (
                <div className="text-xs text-gray-500">
                  {stat.subtitle}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}