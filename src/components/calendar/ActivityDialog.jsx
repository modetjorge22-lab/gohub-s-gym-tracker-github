import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import MatchResultDialog from "./MatchResultDialog";
import WorkoutSelector from "@/components/workouts/WorkoutSelector"; // Import WorkoutSelector

const activityTypes = [
  { value: "running", label: "Running", emoji: "🏃", basePoints: 10 },
  { value: "strength_training", label: "Entrenamiento de Fuerza", emoji: "💪", basePoints: 12 },
  { value: "padel", label: "Pádel", emoji: "🎾", basePoints: 11 },
  { value: "tennis", label: "Tenis", emoji: "🎾", basePoints: 11 },
  { value: "martial_arts", label: "Artes Marciales", emoji: "🥋", basePoints: 13 },
  { value: "cycling", label: "Ciclismo", emoji: "🚴", basePoints: 9 },
  { value: "swimming", label: "Natación", emoji: "🏊", basePoints: 13 },
  { value: "football", label: "Fútbol", emoji: "⚽", basePoints: 11 },
  { value: "basketball", label: "Baloncesto", emoji: "🏀", basePoints: 12 },
  { value: "yoga", label: "Yoga", emoji: "🧘", basePoints: 8 },
  { value: "hiking", label: "Senderismo", emoji: "🥾", basePoints: 10 },
  { value: "other", label: "Otro", emoji: "🏅", basePoints: 8 }
];

export default function ActivityDialog({ open, onOpenChange, member, selectedDate }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    activity_type: "",
    duration_minutes: "",
    notes: "",
    status: "completed",
    workout_id: null,
    workout_data: null,
    training_type: null
  });

  const calculatePoints = () => {
    if (!formData.activity_type || !formData.duration_minutes) return 0;
    
    const activityType = activityTypes.find(a => a.value === formData.activity_type);
    const basePoints = activityType?.basePoints || 8;
    const durationFactor = parseInt(formData.duration_minutes) / 60;
    
    return Math.round(basePoints * durationFactor * 10);
  };

  const [showMatchResult, setShowMatchResult] = useState(false);
  const [createdActivityId, setCreatedActivityId] = useState(null);

  const updateWorkoutMutation = useMutation({
    mutationFn: (data) => base44.entities.Workout.update(data.id, { exercises: data.exercises })
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
        // Check if we need to update the workout weights
        if (data.workout_id && data.workout_data && data.workout_data.updateWeights) {
            await updateWorkoutMutation.mutateAsync({
                id: data.workout_id,
                exercises: data.workout_data.exercises
            });
        }
        return base44.entities.Activity.create(data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['member-activities', member?.email] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      
      // Si es pádel, mostrar el diálogo de resultado
      if (formData.activity_type === 'padel' && formData.status === 'completed') {
      setCreatedActivityId(response.id);
      setShowMatchResult(true);
      } else {
      onOpenChange(false);
      setFormData({ activity_type: "", duration_minutes: "", notes: "", status: "completed", workout_id: null, workout_data: null, training_type: null });
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!member) return;
    
    createMutation.mutate({
      ...formData,
      user_email: member.email,
      user_name: member.name,
      duration_minutes: parseInt(formData.duration_minutes),
      points: calculatePoints(),
      date: format(selectedDate, "yyyy-MM-dd"),
      status: formData.status
    });
  };

  if (!member) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Actividad</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Estado</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({...formData, status: 'completed'})}
                className={`p-2 rounded-lg border-2 font-semibold text-sm transition-all ${
                  formData.status === 'completed'
                    ? "bg-green-100 border-green-400 text-green-700"
                    : "bg-gray-50 border-gray-200 text-gray-600"
                }`}
              >
                ✅ Completada
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, status: 'planned'})}
                className={`p-2 rounded-lg border-2 font-semibold text-sm transition-all ${
                  formData.status === 'planned'
                    ? "bg-blue-100 border-blue-400 text-blue-700"
                    : "bg-gray-50 border-gray-200 text-gray-600"
                }`}
              >
                📅 Planificada
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity_type">Tipo de actividad</Label>
            <Select
              value={formData.activity_type}
              onValueChange={(value) => setFormData({...formData, activity_type: value})}
            >
              <SelectTrigger id="activity_type">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map((activity) => (
                  <SelectItem key={activity.value} value={activity.value}>
                    {activity.emoji} {activity.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration_minutes">Duración (minutos)</Label>
            <Input
              id="duration_minutes"
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({...formData, duration_minutes: e.target.value})}
              placeholder="60"
              required
              min="1"
            />
          </div>

          {/* Workout Selector for Strength Training */}
          {formData.activity_type === 'strength_training' && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Tipo de Entrenamiento</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, training_type: 'progress'})}
                    className={`p-3 rounded-lg border-2 font-semibold text-sm transition-all ${
                      formData.training_type === 'progress'
                        ? "bg-red-100 border-red-400 text-red-700"
                        : "bg-gray-50 border-gray-200 text-gray-600"
                    }`}
                  >
                    🔥 Progreso
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, training_type: 'consolidation'})}
                    className={`p-3 rounded-lg border-2 font-semibold text-sm transition-all ${
                      formData.training_type === 'consolidation'
                        ? "bg-blue-100 border-blue-400 text-blue-700"
                        : "bg-gray-50 border-gray-200 text-gray-600"
                    }`}
                  >
                    💪 Consolidación
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Rutina de Entrenamiento (Opcional)</Label>
                <WorkoutSelector 
                  selectedWorkoutId={formData.workout_id}
                  onSelect={(workoutId, workoutData) => {
                    setFormData({
                      ...formData, 
                      workout_id: workoutId,
                      workout_data: workoutData
                    });
                  }}
                  userEmail={member?.email}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Detalles adicionales..."
              rows={3}
            />
          </div>

          {formData.activity_type && formData.duration_minutes && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
              <p className="text-sm text-gray-600 mb-1">Puntos</p>
              <p className="text-2xl font-bold text-orange-600">{calculatePoints()}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || !formData.activity_type || !formData.duration_minutes}
              className="bg-gray-900 hover:bg-gray-800"
            >
              {createMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <MatchResultDialog
      open={showMatchResult}
      onOpenChange={(open) => {
        setShowMatchResult(open);
        if (!open) {
          onOpenChange(false);
          setFormData({ activity_type: "", duration_minutes: "", notes: "", status: "completed", workout_id: null, workout_data: null, training_type: null });
        }
      }}
      activityId={createdActivityId}
    />
    </>
  );
}