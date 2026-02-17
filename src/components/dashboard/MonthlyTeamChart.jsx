import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth } from "date-fns";
import { es } from "date-fns/locale";

const memberColors = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316"
];



const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const filtered = payload.filter(
    (entry) => entry.value !== null && !String(entry.dataKey).includes("_planned")
  );
  if (!filtered.length) return null;

  return (
    <div className="bg-[#11131a]/95 border border-white/15 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-[10px] text-gray-400 mb-1.5">{label}</p>
      <div className="space-y-1.5">
        {filtered.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
              <span className="text-xs text-white font-medium">{entry.name}</span>
            </div>
            <span className="text-xs font-bold" style={{ color: entry.color }}>
              {entry.value} h
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function MonthlyTeamChart({ members, activities, currentDate = new Date() }) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const isCurrentMonth = isSameMonth(currentDate, new Date());
  const lastDay = isCurrentMonth ? new Date() : monthEnd;
  const days = eachDayOfInterval({ start: monthStart, end: lastDay });

  const membersMap = React.useMemo(() => new Map(members.map((member) => [member.name, member])), [members]);

  const getLastVisibleIndex = (dataKey) => {
    for (let i = chartData.length - 1; i >= 0; i -= 1) {
      if (chartData[i][dataKey] !== null && chartData[i][dataKey] !== undefined) {
        return i;
      }
    }
    return -1;
  };

  const chartData = days.map((day) => {
    const dataPoint = {
      date: format(day, "d MMM", { locale: es })
    };

    const isFuture = day > new Date();

    members.forEach((member) => {
      const completedActivities = activities.filter((a) =>
        a.user_email === member.email &&
        a.status === "completed" &&
        new Date(a.date) >= monthStart &&
        new Date(a.date) <= day
      );

      const completedHours = completedActivities.reduce((sum, a) => sum + a.duration_minutes / 60, 0);
      const isDateFuture = isCurrentMonth && isFuture;

      if (!isDateFuture) {
        dataPoint[member.name] = completedHours > 0 ? parseFloat(completedHours.toFixed(1)) : null;
        dataPoint[`${member.name}_planned`] = null;
      } else {
        const plannedActivities = activities.filter((a) =>
          a.user_email === member.email &&
          a.status === "planned" &&
          new Date(a.date) >= monthStart &&
          new Date(a.date) <= day
        );

        const plannedHours = plannedActivities.reduce((sum, a) => sum + a.duration_minutes / 60, 0);

        const completedUntilToday = activities
          .filter((a) =>
            a.user_email === member.email &&
            a.status === "completed" &&
            new Date(a.date) >= monthStart &&
            new Date(a.date) <= (isCurrentMonth ? new Date() : monthEnd)
          )
          .reduce((sum, a) => sum + a.duration_minutes / 60, 0);

        dataPoint[member.name] = null;
        dataPoint[`${member.name}_planned`] = parseFloat((completedUntilToday + plannedHours).toFixed(1));
      }
    });

    return dataPoint;
  });



  return (
    <Card className="backdrop-blur-xl bg-[#11131a]/80 border border-white/15 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-white/5 to-white/10 border-b border-white/10 py-3 px-4 md:px-6">
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <TrendingUp className="w-4 h-4 text-white" strokeWidth={2.5} />
          Carrera mensual
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 md:p-6">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 30, right: 16, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              stroke="rgba(255,255,255,0.15)"
              interval={Math.floor(chartData.length / 5)}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              stroke="rgba(255,255,255,0.15)"
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <Tooltip content={<CustomTooltip membersMap={membersMap} />} />
            {members.map((member, index) => (
              <Line
                key={member.id}
                type="monotone"
                dataKey={member.name}
                stroke={memberColors[index % memberColors.length]}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5 }}
                connectNulls
                name={member.name}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-400 text-center mt-2">
          Horas acumuladas · {format(currentDate, "MMMM yyyy", { locale: es })}
        </p>
      </CardContent>
    </Card>
  );
}