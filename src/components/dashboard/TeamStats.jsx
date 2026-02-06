import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Target, Crown, AlertCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { startOfWeek, endOfWeek, isWithinInterval } from "date-fns";

export default function TeamStats({ stats, activities }) {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const weeklyActivities = activities.filter(a => 
    isWithinInterval(new Date(a.date), { start: weekStart, end: weekEnd })
  );

  const performingMembers = stats.filter(s => s.isOnPace).length;
  const totalMembers = stats.length;
  
  const avgHoursPerWeek = totalMembers > 0 
    ? (stats.reduce((sum, s) => sum + s.totalHours, 0) / totalMembers).toFixed(1)
    : 0;

  // Actividad más realizada esta semana
  const activityCounts = {};
  weeklyActivities.forEach(a => {
    activityCounts[a.activity_type] = (activityCounts[a.activity_type] || 0) + 1;
  });
  const mostPopularActivity = Object.keys(activityCounts).length > 0
    ? Object.entries(activityCounts).sort((a, b) => b[1] - a[1])[0]
    : null;

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

  // Performer y Panza de la semana
  const topPerformer = stats.length > 0 ? stats[0] : null;
  const bottomPerformer = stats.length > 0 ? stats[stats.length - 1] : null;

  const statCards = [
    {
      icon: Target,
      label: "Cumpliendo Ritmo",
      value: `${performingMembers}/${totalMembers}`,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50"
    },
    {
      icon: Clock,
      label: "Media Semanal",
      value: `${avgHoursPerWeek}h`,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      icon: Activity,
      label: "Actividad Favorita",
      value: mostPopularActivity 
        ? `${activityEmojis[mostPopularActivity[0]]} ${activityLabels[mostPopularActivity[0]]}`
        : "N/A",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  return (
    <div className="mb-8 space-y-6">
      {/* Estadísticas Generales */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Estadísticas de la Semana</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="backdrop-blur-xl bg-white/80 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-4">
                  <div className={`w-10 h-10 ${stat.bgColor} rounded-xl flex items-center justify-center mb-3`}>
                    <stat.icon className={`w-5 h-5 bg-gradient-to-br ${stat.color} bg-clip-text`} strokeWidth={2.5} style={{WebkitTextFillColor: 'transparent'}} />
                  </div>
                  <div className="text-xl font-bold text-gray-900 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-600 font-medium">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Performer y Panza de la Semana */}
      <div className="grid md:grid-cols-2 gap-4">
        {topPerformer && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="backdrop-blur-xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-6 shadow-xl"
          >
            <div className="flex items-center gap-3 mb-3">
              <Crown className="w-8 h-8 text-green-600" strokeWidth={2.5} />
              <div>
                <h3 className="text-sm font-semibold text-green-700 uppercase tracking-wide">Performer de la Semana</h3>
                <p className="text-2xl font-bold text-gray-900">{topPerformer.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <Badge className="bg-green-600 text-white">
                {topPerformer.totalHours}h entrenadas
              </Badge>
              <span className="text-gray-600">{topPerformer.activitiesCount} actividades</span>
            </div>
          </motion.div>
        )}

        {bottomPerformer && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-xl bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300 rounded-2xl p-6 shadow-xl"
          >
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="w-8 h-8 text-orange-600" strokeWidth={2.5} />
              <div>
                <h3 className="text-sm font-semibold text-orange-700 uppercase tracking-wide">Panza de la Semana</h3>
                <p className="text-2xl font-bold text-gray-900">{bottomPerformer.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <Badge className="bg-orange-600 text-white">
                {bottomPerformer.totalHours}h entrenadas
              </Badge>
              <span className="text-gray-600">{bottomPerformer.activitiesCount} actividades</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}