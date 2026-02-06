import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Flame } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

const activityEmojis = {
  running: "🏃",
  gym: "💪",
  padel: "🎾",
  cycling: "🚴",
  swimming: "🏊",
  football: "⚽",
  basketball: "🏀",
  yoga: "🧘",
  other: "🏅"
};

const activityLabels = {
  running: "Running",
  gym: "Gimnasio",
  padel: "Pádel",
  cycling: "Ciclismo",
  swimming: "Natación",
  football: "Fútbol",
  basketball: "Baloncesto",
  yoga: "Yoga",
  other: "Otro"
};



export default function RecentActivities({ activities, isLoading }) {
  if (isLoading) {
    return (
      <Card className="shadow-xl">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full mb-3" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const recentActivities = activities.slice(0, 10);

  return (
    <Card className="shadow-xl border-2 border-orange-200">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b-2 border-orange-200">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Clock className="w-5 h-5 text-orange-600" />
          Actividades Recientes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {recentActivities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay actividades aún</p>
            </div>
          ) : (
            recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{activityEmojis[activity.activity_type]}</span>
                    <div>
                      <p className="font-bold text-gray-900">{activity.user_name}</p>
                      <p className="text-sm text-gray-600">
                        {activityLabels[activity.activity_type]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-orange-100 px-2 py-1 rounded-lg">
                    <Flame className="w-4 h-4 text-orange-600" />
                    <span className="font-bold text-orange-600 text-sm">
                      {activity.points}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    ⏱️ {activity.duration_minutes} min
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {format(new Date(activity.date), "d MMM", { locale: es })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}