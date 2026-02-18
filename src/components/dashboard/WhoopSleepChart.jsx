import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import { Moon } from "lucide-react";
import { subDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#11131a]/95 border border-white/15 rounded-xl px-3 py-2 shadow-xl text-xs space-y-1">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white">{p.name}:</span>
          <span className="font-bold" style={{ color: p.color }}>
            {p.dataKey === "duration" ? `${p.value}h` : `${p.value}`}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function WhoopSleepChart({ userEmail }) {
  const { data: tokenCheck = [] } = useQuery({
    queryKey: ["whoop-tokens", userEmail],
    queryFn: () => base44.entities.WhoopToken.filter({ user_email: userEmail }),
    enabled: !!userEmail,
  });

  const { data: sleepRecords = [], isLoading } = useQuery({
    queryKey: ["whoop-sleep", userEmail],
    queryFn: () => base44.entities.WhoopSleep.filter({ user_email: userEmail }),
    enabled: !!userEmail && tokenCheck.length > 0,
  });

  if (tokenCheck.length === 0) return null;

  // Last 30 days
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = subDays(new Date(), 29 - i);
    return format(d, "yyyy-MM-dd");
  });

  const chartData = last30.map((dateStr) => {
    const record = sleepRecords.find((r) => r.date === dateStr);
    return {
      date: format(parseISO(dateStr), "d MMM", { locale: es }),
      duration: record ? parseFloat((record.total_duration_minutes / 60).toFixed(1)) : null,
      sleep: record?.sleep_performance ?? null,
      recovery: record?.recovery_score ?? null,
    };
  });

  return (
    <Card className="backdrop-blur-xl bg-[#11131a]/80 border border-white/15 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-white/5 to-white/10 border-b border-white/10 py-3 px-4 md:px-6">
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <Moon className="w-4 h-4 text-indigo-400" strokeWidth={2.5} />
          Sueño — últimas 2 semanas
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 md:p-6">
        {isLoading ? (
          <div className="h-48 flex items-center justify-center text-white/40 text-sm">Cargando...</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="rgba(255,255,255,0.15)" tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="rgba(255,255,255,0.15)" tickLine={false} axisLine={false} width={28} domain={[0, 12]} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="rgba(255,255,255,0.15)" tickLine={false} axisLine={false} width={28} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
              <Bar yAxisId="left" dataKey="duration" name="Horas sueño" fill="#6366f1" radius={[4, 4, 0, 0]} opacity={0.85} barSize={16} />
              <Line yAxisId="right" type="monotone" dataKey="sleep" name="Calidad %" stroke="#10b981" strokeWidth={2} dot={false} connectNulls />
              <Line yAxisId="right" type="monotone" dataKey="recovery" name="Recuperación %" stroke="#f59e0b" strokeWidth={2} dot={false} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}