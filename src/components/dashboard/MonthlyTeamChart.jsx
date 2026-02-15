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

const CustomDot = ({ cx, cy, memberImage, memberName, memberColor }) => {
  if (!memberImage) {
    return <circle cx={cx} cy={cy} r={4} fill={memberColor} stroke="#fff" strokeWidth={2} />;
  }

  return (
    <g>
      <defs>
        <clipPath id={`clip-${memberName}-${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r={6} />
        </clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={7} fill="#fff" />
      <image
        x={cx - 6}
        y={cy - 6}
        width={12}
        height={12}
        href={memberImage}
        clipPath={`url(#clip-${memberName}-${cx}-${cy})`}
        preserveAspectRatio="xMidYMid slice"
      />
    </g>
  );
};

const CustomTooltip = ({ active, payload, label, membersMap }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-[#11131a]/95 border border-white/15 rounded-xl p-3 shadow-xl min-w-[200px]">
      <p className="text-xs text-gray-300 mb-2">{label}</p>
      <div className="space-y-2">
        {payload
          .filter((entry) => entry.value !== null && !String(entry.dataKey).includes("_planned"))
          .map((entry) => {
            const member = membersMap.get(entry.name);
            return (
              <div key={entry.dataKey} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {member?.profile_image ? (
                    <img
                      src={member.profile_image}
                      alt={member.name}
                      className="w-6 h-6 rounded-full object-cover border border-white/20"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold flex items-center justify-center">
                      {member?.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}
                  <span className="text-sm text-white">{entry.name}</span>
                </div>
                <span className="text-sm font-semibold" style={{ color: entry.color }}>
                  {entry.value} h
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default function MonthlyTeamChart({ members, activities, currentDate = new Date() }) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const isCurrentMonth = isSameMonth(currentDate, new Date());

  const membersMap = React.useMemo(() => new Map(members.map((member) => [member.name, member])), [members]);

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
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#6b7280" />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="#6b7280"
              label={{ value: "Horas", angle: -90, position: "insideLeft", style: { fontSize: 11 } }}
            />
            <Tooltip content={<CustomTooltip membersMap={membersMap} />} />
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
                connectNulls
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
