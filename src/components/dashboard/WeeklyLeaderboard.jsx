import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Flame, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const getMedalEmoji = (position) => {
  if (position === 0) return "🥇";
  if (position === 1) return "🥈";
  if (position === 2) return "🥉";
  return null;
};

const getProgressColor = (points, goal) => {
  const percentage = (points / goal) * 100;
  if (percentage >= 100) return "bg-green-500";
  if (percentage >= 70) return "bg-yellow-500";
  return "bg-orange-500";
};

const getProgressStatus = (points, goal) => {
  const percentage = (points / goal) * 100;
  if (percentage >= 100) return { icon: TrendingUp, text: "¡Objetivo cumplido!", color: "text-green-600" };
  if (percentage >= 70) return { icon: Minus, text: "Cerca del objetivo", color: "text-yellow-600" };
  return { icon: TrendingDown, text: "Necesita activarse", color: "text-orange-600" };
};

export default function WeeklyLeaderboard({ stats, weeklyGoal, isLoading }) {
  if (isLoading) {
    return (
      <Card className="shadow-xl">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full mb-4" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-2 border-orange-200">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b-2 border-orange-200">
        <CardTitle className="flex items-center gap-3 text-2xl">
          <Trophy className="w-7 h-7 text-orange-600" strokeWidth={2.5} />
          Tabla de Clasificación
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {stats.length === 0 ? (
            <div className="text-center py-12">
              <Flame className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-xl text-gray-500 font-medium">
                Aún no hay actividades esta semana
              </p>
              <p className="text-gray-400 mt-2">¡Sé el primero en registrar!</p>
            </div>
          ) : (
            stats.map((user, index) => {
              const percentage = Math.min((user.totalPoints / weeklyGoal) * 100, 100);
              const status = getProgressStatus(user.totalPoints, weeklyGoal);
              const StatusIcon = status.icon;

              return (
                <motion.div
                  key={user.email}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative p-5 rounded-2xl border-2 transition-all hover:shadow-lg ${
                    index === 0 
                      ? "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300"
                      : index === 1
                      ? "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300"
                      : index === 2
                      ? "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-300"
                      : "bg-white border-gray-200"
                  }`}
                >
                  {/* Position and Medal */}
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      {getMedalEmoji(index) && (
                        <span className="text-3xl">{getMedalEmoji(index)}</span>
                      )}
                      {!getMedalEmoji(index) && (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-lg font-bold text-gray-600">{index + 1}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusIcon className={`w-4 h-4 ${status.color}`} />
                        <span className={`text-sm font-medium ${status.color}`}>
                          {status.text}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Flame className="w-5 h-5 text-orange-500" />
                        <span className="text-3xl font-bold text-orange-600">
                          {user.totalPoints}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {user.activitiesCount} actividades
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span className="font-medium">Progreso semanal</span>
                      <span className="font-bold">{percentage.toFixed(0)}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        className={`h-full ${getProgressColor(user.totalPoints, weeklyGoal)} rounded-full`}
                      />
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                      Objetivo: {weeklyGoal} puntos
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}