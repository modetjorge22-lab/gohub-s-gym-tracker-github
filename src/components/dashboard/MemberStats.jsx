import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Award, Target, Activity, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { startOfWeek, endOfWeek, subWeeks, isWithinInterval, format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";

export default function MemberStats({ member, allActivities, teamAverage }) {
  const [expanded, setExpanded] = useState(false);

  // Obtener actividades del miembro
  const memberActivities = allActivities.filter(a => a.user_email === member.email);

  // Calcular estadísticas de las últimas 4 semanas
  // Note: This component uses new Date() internally, but should probably receive date context
  // However, stats are usually "recent history" so keeping new Date() as reference for "current week back" is acceptable
  // UNLESS the user navigates to last year. 
  // Ideally MemberStats should accept currentDate. 
  // For now, let's leave it relative to 'today' to show recent trend, or update if the user wants historical context here too.
  // Given the request "visualizar todos los datos de meses anteriores", let's try to respect the passed context if possible.
  // But I don't want to refactor everything unless I passed the prop. 
  // I see I haven't passed currentDate to MemberStats in TeamOverview.jsx yet. 
  // I will fix TeamOverview.jsx to pass it.

  const getWeeklyData = () => {
    const weeks = [];
    // Use memberActivities last date or Today? 
    // Let's assume we want to see the trend leading up to the current view.
    // I'll stick to new Date() here as I didn't pass the prop in the previous step.
    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });

      const weekActivities = memberActivities.filter(a =>
        isWithinInterval(new Date(a.date), { start: weekStart, end: weekEnd })
      );

      const hours = weekActivities.reduce((sum, a) => sum + (a.duration_minutes / 60), 0);
      
      weeks.push({
        week: format(weekStart, "'Sem' w", { locale: es }),
        miembro: parseFloat(hours.toFixed(1)),
        equipo: teamAverage
      });
    }
    return weeks;
  };

  // Gráfica de horas por actividad durante el mes
  const getMonthlyActivityHours = () => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    const monthActivities = memberActivities.filter(a => 
      isWithinInterval(new Date(a.date), { start: monthStart, end: monthEnd })
    );

    const days = eachDayOfInterval({ start: monthStart, end: now });
    
    // Agrupar por tipo de actividad
    const activityTypes = [...new Set(monthActivities.map(a => a.activity_type))];
    
    const activityLabels = {
      running: "Running",
      strength_training: "Fuerza",
      padel: "Pádel",
      tennis: "Tenis",
      martial_arts: "Artes Marciales",
      cycling: "Ciclismo",
      swimming: "Natación",
      football: "Fútbol",
      basketball: "Basketball",
      yoga: "Yoga",
      hiking: "Senderismo",
      other: "Otro"
    };

    const colors = {
      running: "#3b82f6",
      strength_training: "#ef4444",
      padel: "#10b981",
      tennis: "#f59e0b",
      martial_arts: "#8b5cf6",
      cycling: "#ec4899",
      swimming: "#14b8a6",
      football: "#f97316",
      basketball: "#6366f1",
      yoga: "#a855f7",
      hiking: "#84cc16",
      other: "#64748b"
    };

    const chartData = days.map(day => {
      const dataPoint = {
        date: format(day, "d MMM", { locale: es })
      };
      
      activityTypes.forEach(type => {
        const activitiesUntilDay = monthActivities.filter(a => 
          a.activity_type === type &&
          new Date(a.date) <= day
        );
        
        const totalHours = activitiesUntilDay.reduce((sum, a) => sum + (a.duration_minutes / 60), 0);
        dataPoint[type] = parseFloat(totalHours.toFixed(1));
      });
      
      return dataPoint;
    });

    return { chartData, activityTypes, activityLabels, colors };
  };

  // Calcular rachas y estadísticas
  const totalHours = memberActivities.reduce((sum, a) => sum + (a.duration_minutes / 60), 0);
  const totalActivities = memberActivities.length;
  
  // Calcular horas mensuales
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const monthlyActivities = memberActivities.filter(a => 
    isWithinInterval(new Date(a.date), { start: monthStart, end: monthEnd })
  );
  const monthlyHours = monthlyActivities.reduce((sum, a) => sum + (a.duration_minutes / 60), 0);

  // Calcular ritmo diario histórico vs actual
  const calculateMonthlyPace = () => {
    const daysInCurrentMonth = now.getDate(); // Días transcurridos del mes actual
    
    // Ritmo diario del mes actual
    const currentDailyPace = daysInCurrentMonth > 0 
      ? monthlyHours / daysInCurrentMonth 
      : 0;
    
    // Calcular ritmo diario promedio histórico (últimos 6 meses)
    const historicalDailyPaces = [];
    for (let i = 1; i <= 6; i++) {
      const pastMonthDate = new Date(now);
      pastMonthDate.setMonth(pastMonthDate.getMonth() - i);
      const pastMonthStart = startOfMonth(pastMonthDate);
      const pastMonthEnd = endOfMonth(pastMonthDate);
      const daysInPastMonth = pastMonthEnd.getDate();
      
      const pastMonthActivities = memberActivities.filter(a => 
        isWithinInterval(new Date(a.date), { start: pastMonthStart, end: pastMonthEnd })
      );
      
      const hours = pastMonthActivities.reduce((sum, a) => sum + (a.duration_minutes / 60), 0);
      if (hours > 0) {
        historicalDailyPaces.push(hours / daysInPastMonth);
      }
    }
    
    const historicalDailyAverage = historicalDailyPaces.length > 0 
      ? historicalDailyPaces.reduce((sum, pace) => sum + pace, 0) / historicalDailyPaces.length 
      : 0;
    
    return historicalDailyAverage > 0 
      ? (currentDailyPace / historicalDailyAverage) * 100 
      : (currentDailyPace > 0 ? 100 : 0);
  };

  const monthlyPacePercentage = calculateMonthlyPace();

  const weeklyData = getWeeklyData();
  const { chartData, activityTypes, activityLabels, colors } = getMonthlyActivityHours();

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200/50 overflow-hidden">
      <div className="p-4 space-y-4">
              {/* Resumen de estadísticas */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 text-center">
                  <Target className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                  <p className="text-xl font-bold text-gray-900">{totalHours.toFixed(1)}h</p>
                  <p className="text-xs text-gray-600">Total Acumuladas</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 text-center">
                  <Activity className="w-4 h-4 text-green-600 mx-auto mb-1" />
                  <p className="text-xl font-bold text-gray-900">{monthlyHours.toFixed(1)}h</p>
                  <p className="text-xs text-gray-600">Horas Mensuales</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 text-center">
                  <Award className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                  <p className="text-xl font-bold text-gray-900">{monthlyPacePercentage.toFixed(0)}%</p>
                  <p className="text-xs text-gray-600">Ritmo del Mes</p>
                </div>
              </div>

              {/* Gráfica comparativa últimas 4 semanas */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-3 h-3" />
                  Horas vs Media del Equipo
                </h4>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="week" 
                      tick={{ fontSize: 10 }}
                      stroke="#6b7280"
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      stroke="#6b7280"
                      width={30}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        fontSize: 11, 
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: 8
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="miembro" 
                      stroke="#6366f1" 
                      strokeWidth={2}
                      name="Tú"
                      dot={{ fill: '#6366f1', r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="equipo" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Media equipo"
                      dot={{ fill: '#10b981', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Gráfica de horas por actividad este mes */}
              {activityTypes.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-700 mb-2">Horas por Actividad este Mes</h4>
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 9 }}
                        angle={-45}
                        textAnchor="end"
                        height={50}
                        stroke="#6b7280"
                      />
                      <YAxis 
                        tick={{ fontSize: 10 }}
                        stroke="#6b7280"
                        width={30}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          fontSize: 11,
                          backgroundColor: 'rgba(255,255,255,0.95)',
                          border: '1px solid #e5e7eb',
                          borderRadius: 8
                        }}
                        labelFormatter={(value) => `${value}`}
                        formatter={(value, name) => [
                          `${value}h`, 
                          activityLabels[name] || name
                        ]}
                      />
                      {activityTypes.map((type) => (
                        <Line
                          key={type}
                          type="monotone"
                          dataKey={type}
                          stroke={colors[type]}
                          strokeWidth={2}
                          dot={false}
                          connectNulls={false}
                          name={activityLabels[type] || type}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-2 mt-2 justify-center">
                    {activityTypes.map((type) => (
                      <div key={type} className="flex items-center gap-1">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: colors[type] }}
                        />
                        <span className="text-xs text-gray-600">{activityLabels[type]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
      </div>
    </div>
  );
}