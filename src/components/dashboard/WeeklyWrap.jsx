import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Trophy, TrendingUp, TrendingDown, Award, Flame, Calendar } from "lucide-react";
import { startOfWeek, endOfWeek, subWeeks, format, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

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

export default function WeeklyWrap({ members, activities, onClose }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const today = new Date();
    const isMonday = today.getDay() === 1;
    const hasSeenThisWeek = localStorage.getItem('weekly_wrap_seen') === format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');

    if (isMonday && !hasSeenThisWeek) {
      setShow(true);
    }
  }, []);

  const handleClose = () => {
    const today = new Date();
    localStorage.setItem('weekly_wrap_seen', format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
    setShow(false);
    onClose?.();
  };

  // Calcular stats de la semana pasada
  const lastWeekStart = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });

  const lastWeekActivities = activities.filter(a => 
    a.status === 'completed' &&
    isWithinInterval(new Date(a.date), { start: lastWeekStart, end: lastWeekEnd })
  );

  // Stats por miembro
  const memberStats = members.map(member => {
    const memberActivities = lastWeekActivities.filter(a => a.user_email === member.email);
    const hours = memberActivities.reduce((sum, a) => sum + a.duration_minutes / 60, 0);
    const activitiesCount = memberActivities.length;

    return {
      ...member,
      hours: parseFloat(hours.toFixed(1)),
      activitiesCount
    };
  }).sort((a, b) => b.hours - a.hours);

  const topPerformer = memberStats[0];
  const needsMotivation = memberStats.filter(m => m.hours < 2);

  // Actividad más popular
  const activityCounts = {};
  lastWeekActivities.forEach(a => {
    activityCounts[a.activity_type] = (activityCounts[a.activity_type] || 0) + 1;
  });
  const mostPopularActivity = Object.entries(activityCounts).sort((a, b) => b[1] - a[1])[0];

  // Total del equipo
  const totalTeamHours = memberStats.reduce((sum, m) => sum + m.hours, 0);
  const totalActivities = lastWeekActivities.length;

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          onClick={(e) => e.stopPropagation()}
          className="max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        >
          <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700 text-white shadow-2xl">
            <CardHeader className="relative pb-8">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="absolute right-4 top-4 text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
              
              <div className="text-center space-y-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  <Calendar className="w-16 h-16 mx-auto text-emerald-400 mb-2" />
                </motion.div>
                <CardTitle className="text-3xl font-black">Weekly Wrap</CardTitle>
                <p className="text-slate-400">
                  {format(lastWeekStart, "d 'de' MMMM", { locale: es })} - {format(lastWeekEnd, "d 'de' MMMM", { locale: es })}
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pb-8">
              {/* Stats Generales */}
              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 rounded-xl p-4 text-center"
                >
                  <Flame className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                  <p className="text-3xl font-bold">{totalTeamHours.toFixed(1)}h</p>
                  <p className="text-sm text-slate-300">Horas totales</p>
                </motion.div>

                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-4 text-center"
                >
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                  <p className="text-3xl font-bold">{totalActivities}</p>
                  <p className="text-sm text-slate-300">Actividades</p>
                </motion.div>
              </div>

              {/* Top Performer */}
              {topPerformer && topPerformer.hours > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-2 border-yellow-500/40 rounded-xl p-5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Trophy className="w-7 h-7 text-yellow-400" />
                    <h3 className="text-xl font-bold">MVP de la Semana</h3>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {topPerformer.profile_image ? (
                        <img src={topPerformer.profile_image} alt={topPerformer.name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {topPerformer.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-lg">{topPerformer.name}</p>
                        <p className="text-sm text-slate-300">{topPerformer.activitiesCount} entrenamientos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-yellow-400">{topPerformer.hours}h</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Actividad más popular */}
              {mostPopularActivity && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Award className="w-6 h-6 text-purple-400" />
                      <div>
                        <p className="text-sm text-slate-400">Actividad más popular</p>
                        <p className="text-lg font-bold flex items-center gap-2">
                          <span className="text-2xl">{activityEmojis[mostPopularActivity[0]]}</span>
                          {activityLabels[mostPopularActivity[0]]}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                      {mostPopularActivity[1]} veces
                    </Badge>
                  </div>
                </motion.div>
              )}

              {/* Ranking del equipo */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4"
              >
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Ranking del Equipo
                </h3>
                <div className="space-y-2">
                  {memberStats.slice(0, 5).map((member, index) => (
                    <div key={member.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-slate-500 w-6">#{index + 1}</span>
                        {member.profile_image ? (
                          <img src={member.profile_image} alt={member.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {member.name.charAt(0)}
                          </div>
                        )}
                        <span className="font-medium">{member.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{member.hours}h</p>
                        <p className="text-xs text-slate-400">{member.activitiesCount} actividades</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Necesitan motivación */}
              {needsMotivation.length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-5 h-5 text-orange-400" />
                    <h3 className="font-bold text-orange-300">Necesitan un empujón</h3>
                  </div>
                  <p className="text-sm text-slate-300">
                    {needsMotivation.map(m => m.name).join(", ")} - ¡Vamos equipo, esta semana a por todas! 💪
                  </p>
                </motion.div>
              )}

              <Button
                onClick={handleClose}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-6 text-lg shadow-lg"
              >
                ¡A por esta semana! 🔥
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}