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

const LABEL_W = 72;
const LABEL_H = 22;

const CustomDot = ({ cx, cy, index, lastVisibleIndex, memberImage, memberName, memberColor, chartWidth }) => {
  if (index !== lastVisibleIndex) return null;

  // Flip label to the left if it would overflow the right edge
  const overflows = chartWidth && cx + 16 + LABEL_W > chartWidth;
  const labelX = overflows ? cx - 16 - LABEL_W : cx + 16;
  const labelY = cy - LABEL_H / 2;
  const firstName = memberName.split(" ")[0];

  return (
    <g>
      {/* Dot */}
      <circle cx={cx} cy={cy} r={5} fill={memberColor} stroke="rgba(255,255,255,0.8)" strokeWidth={1.5} />

      {/* Pill label */}
      <rect
        x={labelX}
        y={labelY}
        width={LABEL_W}
        height={LABEL_H}
        rx={11}
        fill="rgba(17,19,26,0.88)"
        stroke={memberColor}
        strokeWidth={1.2}
      />

      {memberImage ? (
        <>
          <defs>
            <clipPath id={`lbl-clip-${memberName}`}>
              <circle cx={labelX + 11} cy={labelY + 11} r={9} />
            </clipPath>
          </defs>
          <circle cx={labelX + 11} cy={labelY + 11} r={9} fill={memberColor} />
          <image
            x={labelX + 2}
            y={labelY + 2}
            width={18}
            height={18}
            href={memberImage}
            clipPath={`url(#lbl-clip-${memberName})`}
            preserveAspectRatio="xMidYMid slice"
          />
          <text x={labelX + 24} y={labelY + 14} fill="#fff" fontSize="11" fontWeight="700">{firstName}</text>
        </>
      ) : (
        <>
          <circle cx={labelX + 11} cy={labelY + 11} r={9} fill={memberColor} />
          <text x={labelX + 11} y={labelY + 15} fill="#fff" fontSize="10" fontWeight="800" textAnchor="middle">
            {memberName.charAt(0).toUpperCase()}
          </text>
          <text x={labelX + 24} y={labelY + 14} fill="#fff" fontSize="11" fontWeight="700">{firstName}</text>
        </>
      )}
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

  const memberLastIndexes = Object.fromEntries(
    members.map((member) => [member.name, getLastVisibleIndex(member.name)])
  );

  return (
    <Card className="backdrop-blur-xl bg-[#11131a]/80 border border-white/15 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-white/5 to-white/10 border-b border-white/10">
        <CardTitle className="flex items-center gap-3 text-xl text-white">
          <TrendingUp className="w-6 h-6 text-white" strokeWidth={2.5} />
          Carrera mensual
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 md:p-6">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
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
                dot={(props) => (
                  <CustomDot
                    {...props}
                    memberImage={member.profile_image}
                    memberName={member.name}
                    memberColor={memberColors[index % memberColors.length]}
                    lastVisibleIndex={memberLastIndexes[member.name]}
                  />
                )}
                activeDot={{ r: 6 }}
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