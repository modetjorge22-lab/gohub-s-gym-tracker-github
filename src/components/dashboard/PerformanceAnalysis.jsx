import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, TrendingUp, Users, Activity, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { startOfMonth, endOfMonth, subMonths, isWithinInterval, startOfYear, getDaysInMonth, getDate, isSameMonth } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

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

const activityColors = {
  running: "#3b82f6", // blue-500
  strength_training: "#ef4444", // red-500
  padel: "#10b981", // emerald-500
  tennis: "#84cc16", // lime-500
  martial_arts: "#f97316", // orange-500
  cycling: "#06b6d4", // cyan-500
  swimming: "#0ea5e9", // sky-500
  football: "#22c55e", // green-500
  basketball: "#f59e0b", // amber-500
  yoga: "#a855f7", // purple-500
  hiking: "#14b8a6", // teal-500
  other: "#64748b" // slate-500
};

export default function PerformanceAnalysis({ activities, members, currentDate = new Date() }) {
  const [selectedActivity, setSelectedActivity] = useState("all");
  const [expandedMember, setExpandedMember] = useState(null);

  // Filter only completed activities for analysis
  const completedActivities = activities.filter(a => a.status === 'completed');

  // Calcular métricas por actividad
  const getActivityMetrics = () => {
    const currentMonth = { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
    const lastMonth = { start: startOfMonth(subMonths(currentDate, 1)), end: endOfMonth(subMonths(currentDate, 1)) };
    const yearStart = startOfYear(currentDate);

    const activityTypes = [...new Set(completedActivities.map(a => a.activity_type))];
    
    return activityTypes.map(type => {
      const typeActivities = completedActivities.filter(a => a.activity_type === type);
      const currentMonthActivities = typeActivities.filter(a => 
        isWithinInterval(new Date(a.date), currentMonth)
      );
      const lastMonthActivities = typeActivities.filter(a => 
        isWithinInterval(new Date(a.date), lastMonth)
      );
      const yearActivities = typeActivities.filter(a => 
        new Date(a.date) >= yearStart
      );

      const currentMonthHours = currentMonthActivities.reduce((sum, a) => sum + a.duration_minutes / 60, 0);
      const lastMonthHours = lastMonthActivities.reduce((sum, a) => sum + a.duration_minutes / 60, 0);
      const yearHours = yearActivities.reduce((sum, a) => sum + a.duration_minutes / 60, 0);
      
      const avgIntensity = currentMonthActivities.length > 0 
        ? currentMonthActivities.reduce((sum, a) => sum + a.intensity, 0) / currentMonthActivities.length 
        : 0;

      // Calcular ritmo (pace)
      const daysInLastMonth = getDaysInMonth(lastMonth.start);
      
      const isCurrent = isSameMonth(currentDate, new Date());
      const daysPassedInCurrentMonth = isCurrent ? getDate(new Date()) : getDaysInMonth(currentDate);

      const lastMonthDailyPace = lastMonthHours / daysInLastMonth;
      const currentMonthDailyPace = currentMonthHours / daysPassedInCurrentMonth;

      let pacePercentage = 0;
      if (lastMonthDailyPace > 0) {
        pacePercentage = (currentMonthDailyPace / lastMonthDailyPace) * 100;
      } else if (currentMonthDailyPace > 0) {
        pacePercentage = 100;
      }

      return {
        type,
        currentMonthHours: currentMonthHours.toFixed(1),
        currentMonthCount: currentMonthActivities.length,
        lastMonthHours: lastMonthHours.toFixed(1),
        yearHours: yearHours.toFixed(1),
        yearCount: yearActivities.length,
        avgIntensity: avgIntensity.toFixed(1),
        pacePercentage: parseFloat(pacePercentage.toFixed(0))
      };
    }).sort((a, b) => parseFloat(b.currentMonthHours) - parseFloat(a.currentMonthHours));
  };

  // Comparación entre miembros
  const getMemberComparison = () => {
    const currentMonth = { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };

    return members.map(member => {
      const memberActivities = completedActivities.filter(a => a.user_email === member.email);
      const monthActivities = memberActivities.filter(a => 
        isWithinInterval(new Date(a.date), currentMonth)
      );

      const hours = monthActivities.reduce((sum, a) => sum + a.duration_minutes / 60, 0);

      // Desglose de horas por actividad
      const activityHours = {};
      monthActivities.forEach(a => {
        if (!activityHours[a.activity_type]) {
          activityHours[a.activity_type] = 0;
        }
        activityHours[a.activity_type] += a.duration_minutes / 60;
      });

      // Win rate en pádel
      const padelActivities = memberActivities.filter(a => a.activity_type === 'padel' && a.match_result);
      const padelWins = padelActivities.filter(a => a.match_result === 'win').length;
      const padelWinRate = padelActivities.length > 0 
        ? ((padelWins / padelActivities.length) * 100).toFixed(0)
        : null;

      return {
        ...member,
        hours: hours.toFixed(1),
        activitiesCount: monthActivities.length,
        activityHours,
        padelWinRate,
        padelMatches: padelActivities.length
      };
    }).sort((a, b) => parseFloat(b.hours) - parseFloat(a.hours));
  };

  // Reporte anual general
  const getYearlyReport = () => {
    const yearStart = startOfYear(currentDate);
    const yearActivities = completedActivities.filter(a => new Date(a.date) >= yearStart);

    const totalHours = yearActivities.reduce((sum, a) => sum + a.duration_minutes / 60, 0);
    const avgIntensity = yearActivities.length > 0
      ? yearActivities.reduce((sum, a) => sum + a.intensity, 0) / yearActivities.length
      : 0;

    const monthlyData = [];
    for (let i = 0; i < 12; i++) {
      const monthStart = startOfMonth(subMonths(currentDate, 11 - i));
      const monthEnd = endOfMonth(subMonths(currentDate, 11 - i));
      const monthActivities = yearActivities.filter(a => 
        isWithinInterval(new Date(a.date), { start: monthStart, end: monthEnd })
      );

      // Build data object for stacked bar chart
      const monthData = {
        month: monthStart.toLocaleString('es', { month: 'short' }),
        totalHours: monthActivities.reduce((sum, a) => sum + a.duration_minutes / 60, 0).toFixed(1)
      };

      // Add hours per activity type
      monthActivities.forEach(a => {
        if (!monthData[a.activity_type]) monthData[a.activity_type] = 0;
        monthData[a.activity_type] += a.duration_minutes / 60;
      });

      // Round values
      Object.keys(monthData).forEach(key => {
        if (key !== 'month' && typeof monthData[key] === 'number') {
          monthData[key] = parseFloat(monthData[key].toFixed(1));
        }
      });

      monthlyData.push(monthData);
    }

    return {
      totalHours: totalHours.toFixed(1),
      totalActivities: yearActivities.length,
      avgIntensity: avgIntensity.toFixed(1),
      monthlyData
    };
  };

  // Reporte anual individual por miembro
  const getMemberYearlyData = (memberEmail) => {
    const yearStart = startOfYear(currentDate);
    const yearActivities = completedActivities.filter(a => 
      new Date(a.date) >= yearStart && a.user_email === memberEmail
    );

    const monthlyData = [];
    for (let i = 0; i < 12; i++) {
      const monthStart = startOfMonth(subMonths(currentDate, 11 - i));
      const monthEnd = endOfMonth(subMonths(currentDate, 11 - i));
      const monthActivities = yearActivities.filter(a => 
        isWithinInterval(new Date(a.date), { start: monthStart, end: monthEnd })
      );

      const monthData = {
        month: monthStart.toLocaleString('es', { month: 'short' }),
      };

      monthActivities.forEach(a => {
        if (!monthData[a.activity_type]) monthData[a.activity_type] = 0;
        monthData[a.activity_type] += a.duration_minutes / 60;
      });

      Object.keys(monthData).forEach(key => {
        if (key !== 'month') {
          monthData[key] = parseFloat(monthData[key].toFixed(1));
        }
      });

      monthlyData.push(monthData);
    }
    return monthlyData;
  };

  const activityMetrics = getActivityMetrics();
  const memberComparison = getMemberComparison();
  const yearlyReport = getYearlyReport();

  return (
    <div>
      <h3 className="text-xl font-bold text-white mb-4">Análisis de Rendimiento</h3>
      
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-white/5 border border-white/10">
          <TabsTrigger value="activities" className="data-[state=active]:bg-white/15 data-[state=active]:text-white text-white/50">
            <Activity className="w-4 h-4 mr-2" />
            Por Actividad
          </TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-white/15 data-[state=active]:text-white text-white/50">
            <Users className="w-4 h-4 mr-2" />
            Comparar Equipo
          </TabsTrigger>
          <TabsTrigger value="yearly" className="data-[state=active]:bg-white/15 data-[state=active]:text-white text-white/50">
            <TrendingUp className="w-4 h-4 mr-2" />
            Reporte Anual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activities">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activityMetrics.map((metric, index) => (
              <motion.div
                key={metric.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-lg p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{activityEmojis[metric.type]}</span>
                        <h4 className="font-bold text-white">{activityLabels[metric.type]}</h4>
                      </div>
                      <p className="text-xs text-white/50">Este mes: {metric.currentMonthCount} actividades</p>
                    </div>
                    <Badge className={metric.pacePercentage >= 100 ? "bg-emerald-500 text-white" : "bg-red-500/80 text-white"}>
                      {metric.pacePercentage}%
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/60">Horas este mes</span>
                      <span className="text-lg font-bold text-white">{metric.currentMonthHours}h</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/60">Mes anterior</span>
                      <span className="text-sm text-white/80">{metric.lastMonthHours}h</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/60">Total año</span>
                      <span className="text-sm text-white/80">{metric.yearHours}h ({metric.yearCount})</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="members">
          <div className="grid md:grid-cols-3 gap-4">
            {memberComparison.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-lg p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-white text-lg">{member.name}</h4>
                      <p className="text-xs text-white/50">{member.activitiesCount} actividades este mes</p>
                    </div>
                    {index === 0 && <Trophy className="w-6 h-6 text-yellow-400" />}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-3xl font-bold text-white text-center mb-1">{member.hours}h</p>
                      <p className="text-xs text-white/50 text-center">Horas entrenadas</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <p className="text-xs font-semibold text-white/60 mb-2">Desglose</p>
                      <div className="space-y-1">
                        {Object.entries(member.activityHours || {}).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([type, hours]) => (
                          <div key={type} className="flex justify-between items-center">
                            <span className="text-xs text-white/60">{activityEmojis[type]} {activityLabels[type]}</span>
                            <span className="text-xs font-bold text-white">{hours.toFixed(1)}h</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {member.padelWinRate !== null && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-semibold text-white/70">Win Rate Pádel</span>
                          </div>
                          <span className="text-lg font-bold text-emerald-400">{member.padelWinRate}%</span>
                        </div>
                        <p className="text-xs text-white/50 mt-1 text-center">{member.padelMatches} partidos</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="yearly">
          <div className="grid gap-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                <Activity className="w-7 h-7 text-blue-400 mx-auto mb-2" />
                <p className="text-4xl font-bold text-white">{yearlyReport.totalActivities}</p>
                <p className="text-sm text-white/50 mt-1">Actividades totales</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                <TrendingUp className="w-7 h-7 text-emerald-400 mx-auto mb-2" />
                <p className="text-4xl font-bold text-white">{yearlyReport.totalHours}h</p>
                <p className="text-sm text-white/50 mt-1">Horas totales</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                <Trophy className="w-7 h-7 text-yellow-400 mx-auto mb-2" />
                <p className="text-4xl font-bold text-white">{yearlyReport.totalActivities > 0 ? Math.round(parseFloat(yearlyReport.totalHours) / yearlyReport.totalActivities * 10) / 10 : 0}h</p>
                <p className="text-sm text-white/50 mt-1">Media por sesión</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h4 className="text-sm font-bold text-white mb-4">Evolución Mensual del Año (Equipo)</h4>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlyReport.monthlyData}>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="rgba(255,255,255,0.1)" tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="rgba(255,255,255,0.1)" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(17,19,26,0.95)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                    <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                    {Object.keys(activityLabels).map((type) => (
                      <Bar key={type} dataKey={type} name={activityLabels[type]} stackId="a" fill={activityColors[type]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-base font-bold text-white">Evolución Individual</h4>
              {members.map((member) => (
                <div key={member.email} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => setExpandedMember(expandedMember === member.email ? null : member.email)}
                  >
                    <span className="font-bold text-white">{member.name}</span>
                    {expandedMember === member.email ? <ChevronUp className="w-5 h-5 text-white/50" /> : <ChevronDown className="w-5 h-5 text-white/50" />}
                  </div>
                  <AnimatePresence>
                    {expandedMember === member.email && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                        <div className="p-4 border-t border-white/10 h-[260px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={getMemberYearlyData(member.email)}>
                              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="rgba(255,255,255,0.1)" tickLine={false} />
                              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="rgba(255,255,255,0.1)" tickLine={false} axisLine={false} />
                              <Tooltip contentStyle={{ backgroundColor: 'rgba(17,19,26,0.95)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                              {Object.keys(activityLabels).map((type) => (
                                <Bar key={type} dataKey={type} name={activityLabels[type]} stackId="a" fill={activityColors[type]} />
                              ))}
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
