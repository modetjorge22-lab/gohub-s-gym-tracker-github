import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth } from "date-fns";
import { es } from "date-fns/locale";

const memberColors = [
  "#6366f1", // indigo
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316"  // orange
];

export default function MonthlyTeamChart({ members, activities, currentDate = new Date() }) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // Obtener todos los días del mes
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const isCurrentMonth = isSameMonth(currentDate, new Date());

  // Crear datos para la gráfica
  const chartData = days.map(day => {
    const dataPoint = {
      date: format(day, "d MMM", { locale: es })
    };
    
    const isFuture = day > new Date();
    
    members.forEach(member => {
      // Horas completadas acumuladas hasta este día
      const completedActivities = activities.filter(a => 
        a.user_email === member.email &&
        a.status === 'completed' &&
        new Date(a.date) >= monthStart &&
        new Date(a.date) <= day
      );
      
      const completedHours = completedActivities.reduce((sum, a) => 
        sum + (a.duration_minutes / 60), 0
      );
      
      const isDateFuture = isCurrentMonth && isFuture;

      // Para hoy y días anteriores, mostrar horas completadas solo si hay actividad
      if (!isDateFuture) {
        if (completedHours > 0) {
          dataPoint[member.name] = parseFloat(completedHours.toFixed(1));
        } else {
          dataPoint[member.name] = null;
        }
        dataPoint[`${member.name}_planned`] = null;
      } else {
        // Para días futuros, mostrar línea planificada desde hoy
        const plannedActivities = activities.filter(a => 
          a.user_email === member.email &&
          a.status === 'planned' &&
          new Date(a.date) >= monthStart &&
          new Date(a.date) <= day
        );
        
        const plannedHours = plannedActivities.reduce((sum, a) => 
          sum + (a.duration_minutes / 60), 0
        );
        
        // Sumar horas completadas hasta hoy + horas planificadas hasta este día futuro
        const completedUntilToday = activities.filter(a => 
          a.user_email === member.email &&
          a.status === 'completed' &&
          new Date(a.date) >= monthStart &&
          new Date(a.date) <= (isCurrentMonth ? new Date() : monthEnd)
        ).reduce((sum, a) => sum + (a.duration_minutes / 60), 0);
        
        dataPoint[member.name] = null;
        dataPoint[`${member.name}_planned`] = parseFloat((completedUntilToday + plannedHours).toFixed(1));
      }
    });
    
    return dataPoint;
  });

  return (
    <Card className="backdrop-blur-xl bg-white/80 border-2 border-gray-200 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
        <CardTitle className="flex items-center gap-3 text-xl">
          <TrendingUp className="w-6 h-6 text-gray-700" strokeWidth={2.5} />
          Evolución Mensual del Equipo
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11 }}
              stroke="#6b7280"
            />
            <YAxis 
              tick={{ fontSize: 11 }}
              stroke="#6b7280"
              label={{ value: 'Horas', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255,255,255,0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 12
              }}
            />
            <Legend wrapperStyle={{ fontSize: 14, paddingTop: 10 }} />
            {members.map((member, index) => (
              <Line
                key={member.id}
                type="monotone"
                dataKey={member.name}
                stroke={memberColors[index % memberColors.length]}
                strokeWidth={2.5}
                dot={(props) => (
                  <CustomDot 
                    {...props} 
                    memberImage={member.profile_image}
                    memberName={member.name}
                    memberColor={memberColors[index % memberColors.length]}
                  />
                )}
                activeDot={{ r: 6 }}
                connectNulls={true}
                name={member.name}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-500 text-center mt-4">
          Horas acumuladas de actividad durante {format(currentDate, "MMMM yyyy", { locale: es })}
        </p>
      </CardContent>
    </Card>
  );
}