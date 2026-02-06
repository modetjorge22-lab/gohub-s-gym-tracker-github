import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, Activity, Users, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function StatsOverview({ activities, weeklyActivities, isLoading }) {
  const stats = [
    {
      icon: Users,
      label: "Participantes Activos",
      value: weeklyActivities.length,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      icon: Activity,
      label: "Actividades Esta Semana",
      value: activities.filter(a => {
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay() + 1));
        return new Date(a.date) >= weekStart;
      }).length,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-100"
    },
    {
      icon: Flame,
      label: "Puntos Totales",
      value: weeklyActivities.reduce((sum, u) => sum + u.totalPoints, 0),
      color: "from-orange-500 to-amber-500",
      bgColor: "bg-orange-100"
    },
    {
      icon: TrendingUp,
      label: "Minutos de Actividad",
      value: weeklyActivities.reduce((sum, u) => sum + u.totalMinutes, 0),
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-100"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-12 w-12 rounded-2xl mb-4" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="shadow-lg hover:shadow-xl transition-shadow border-2 border-gray-100">
            <CardContent className="p-6">
              <div className={`w-12 h-12 ${stat.bgColor} rounded-2xl flex items-center justify-center mb-4`}>
                <stat.icon className={`w-6 h-6 bg-gradient-to-br ${stat.color} bg-clip-text`} strokeWidth={2.5} style={{WebkitTextFillColor: 'transparent'}} />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 font-medium">
                {stat.label}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}