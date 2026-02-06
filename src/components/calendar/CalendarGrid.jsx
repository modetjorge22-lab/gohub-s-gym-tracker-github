import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, isSameMonth, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function CalendarGrid({ currentMonth, setCurrentMonth, selectedDay, setSelectedDay, activities, isLoading }) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getDayActivities = (day) => {
    return activities.filter(a => isSameDay(new Date(a.date), day));
  };

  const getDayPoints = (day) => {
    return getDayActivities(day).reduce((sum, a) => sum + (a.points || 0), 0);
  };

  if (isLoading) {
    return (
      <div className="backdrop-blur-xl bg-white/80 rounded-2xl border border-gray-200/50 shadow-lg p-6">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-7 gap-2">
          {Array(35).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-xl bg-white/80 rounded-2xl border border-gray-200/50 shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">
          {format(currentMonth, "MMMM yyyy", { locale: es })}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayActivities = getDayActivities(day);
          const dayPoints = getDayPoints(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = isSameDay(day, selectedDay);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={day.toString()}
              onClick={() => setSelectedDay(day)}
              className={`aspect-square p-2 rounded-xl transition-all relative ${
                !isCurrentMonth ? "text-gray-300" :
                isSelected ? "bg-gray-900 text-white shadow-lg scale-105" :
                isToday ? "bg-gray-100 font-bold" :
                "hover:bg-gray-50"
              }`}
            >
              {/* Activity emojis in top right corner */}
              {dayActivities.length > 0 && (
                <div className="absolute top-1 right-1 flex gap-0.5">
                  {dayActivities.slice(0, 2).map((activity, i) => (
                    <span key={i} className="text-xs">
                      {activityEmojis[activity.activity_type]}
                    </span>
                  ))}
                  {dayActivities.length > 2 && (
                    <span className={`text-xs ${isSelected ? "text-white" : "text-gray-500"}`}>
                      +{dayActivities.length - 2}
                    </span>
                  )}
                </div>
              )}

              <div className="text-sm font-medium mb-1">
                {format(day, "d")}
              </div>
              
              {dayActivities.length > 0 && (
                <div className="flex flex-col gap-0.5 items-center">
                  <div className="flex gap-0.5">
                    {dayActivities.slice(0, 3).map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? "bg-white" : "bg-gray-900"
                        }`}
                      />
                    ))}
                  </div>
                  {dayPoints > 0 && (
                    <div className={`text-xs font-bold ${
                      isSelected ? "text-white" : "text-orange-600"
                    }`}>
                      {dayPoints}
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}