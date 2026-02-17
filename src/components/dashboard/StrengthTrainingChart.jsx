import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Dumbbell } from "lucide-react";
import { startOfWeek, endOfWeek, subWeeks, format, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#11131a]/95 border border-white/15 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-[10px] text-gray-400 mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: entry.fill }} />
            <span className="text-xs text-white">{entry.name}</span>
          </div>
          <span className="text-xs font-bold text-white ml-4">{entry.value} h</span>
        </div>
      ))}
    </div>
  );
};

export default function StrengthTrainingChart({ activities, userEmail }) {
  const weeks = React.useMemo(() => {
    const now = new Date();
    return Array.from({ length: 16 }, (_, i) => {
      const weekDate = subWeeks(now, 15 - i);
      const start = startOfWeek(weekDate, { weekStartsOn: 1 });
      const end = endOfWeek(weekDate, { weekStartsOn: 1 });

      const strengthActivities = activities.filter(
        (a) =>
          a.user_email === userEmail &&
          a.status === "completed" &&
          a.activity_type === "strength_training" &&
          isWithinInterval(new Date(a.date), { start, end })
      );

      const progressHours = parseFloat(
        strengthActivities
          .filter((a) => a.training_type === "progress")
          .reduce((sum, a) => sum + a.duration_minutes / 60, 0)
          .toFixed(1)
      );

      const consolidationHours = parseFloat(
        strengthActivities
          .filter((a) => a.training_type === "consolidation")
          .reduce((sum, a) => sum + a.duration_minutes / 60, 0)
          .toFixed(1)
      );

      return {
        label: format(start, "d MMM", { locale: es }),
        progress: progressHours,
        consolidation: consolidationHours,
      };
    });
  }, [activities, userEmail]);

  return (
    <Card className="backdrop-blur-xl bg-[#11131a]/80 border border-white/15 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-white/5 to-white/10 border-b border-white/10 py-3 px-4 md:px-6">
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <Dumbbell className="w-4 h-4 text-white" strokeWidth={2.5} />
          Entrenamientos de fuerza
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 md:p-6">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={weeks} margin={{ top: 8, right: 8, left: -14, bottom: 0 }} barCategoryGap="20%" barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: "#64748b" }}
              stroke="rgba(255,255,255,0.1)"
              tickLine={false}
              interval={3}
            />
            <YAxis
              tick={{ fontSize: 9, fill: "#64748b" }}
              stroke="rgba(255,255,255,0.1)"
              tickLine={false}
              axisLine={false}
              width={24}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "#94a3b8", paddingTop: 8 }}
              formatter={(value) => value === "progress" ? "Progreso" : "Consolidación"}
            />
            <Bar dataKey="progress" name="progress" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="consolidation" name="consolidation" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-[10px] text-gray-500 text-center mt-1">Horas de fuerza · últimas 16 semanas</p>
      </CardContent>
    </Card>
  );
}