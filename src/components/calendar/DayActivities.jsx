import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Flame, Check, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import CompleteActivityDialog from "./CompleteActivityDialog";

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
  strength_training: "Entrenamiento de Fuerza",
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

export default function DayActivities({ activities, eggs, onDeleteActivity, onDeleteEgg, readOnly }) {
  const queryClient = useQueryClient();
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const hasData = activities.length > 0 || eggs.length > 0;

  const cancelActivityMutation = useMutation({
    mutationFn: (id) => base44.entities.Activity.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-activities'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    }
  });

  if (!hasData) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>Sin actividades ni huevos registrados</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto">
      {/* Actividades */}
      {activities.map((activity) => (
        <div
          key={activity.id}
          className={`p-4 rounded-xl border transition-all ${
            activity.status === 'planned' 
              ? 'bg-blue-50 border-blue-200 hover:border-blue-300' 
              : 'bg-gray-50 border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{activityEmojis[activity.activity_type]}</span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-900">
                    {activityLabels[activity.activity_type]}
                  </p>
                  {activity.status === 'planned' && (
                    <Badge className="bg-blue-500 text-white text-xs">Planificada</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {activity.duration_minutes} min
                </p>
              </div>
            </div>
            {!readOnly && (
              <div className="flex items-center gap-1">
                {activity.status === 'planned' ? (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedActivity(activity);
                        setCompleteDialogOpen(true);
                      }}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      title="Marcar como completada"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => cancelActivityMutation.mutate(activity.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Cancelar actividad"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteActivity(activity.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {activity.status === 'completed' && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-orange-50 border-orange-200">
                <Flame className="w-3 h-3 mr-1 text-orange-600" />
                <span className="font-bold text-orange-600">{activity.points} pts</span>
              </Badge>
            </div>
          )}

          {activity.notes && (
            <p className="text-sm text-gray-600 mt-2 italic">{activity.notes}</p>
          )}
        </div>
      ))}

      {/* Huevos */}
      {eggs.map((egg) => (
        <div
          key={egg.id}
          className="p-4 bg-yellow-50 rounded-xl border border-yellow-200 hover:border-yellow-300 transition-all"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🥚</span>
              <div>
                <p className="font-bold text-gray-900">
                  Huevos consumidos
                </p>
                <p className="text-sm text-gray-500">
                  {egg.egg_count} {egg.egg_count === 1 ? 'huevo' : 'huevos'}
                </p>
              </div>
            </div>
            {!readOnly && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDeleteEgg(egg.id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {egg.notes && (
            <p className="text-sm text-gray-600 mt-2 italic">{egg.notes}</p>
          )}
        </div>
      ))}

      <CompleteActivityDialog
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
        activity={selectedActivity}
      />
    </div>
  );
}