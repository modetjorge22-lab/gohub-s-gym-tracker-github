import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const activityTypes = [
  { value: "running", label: "Running", emoji: "🏃" },
  { value: "strength_training", label: "Fuerza", emoji: "💪" },
  { value: "padel", label: "Pádel", emoji: "🎾" },
  { value: "tennis", label: "Tenis", emoji: "🎾" },
  { value: "martial_arts", label: "Artes Marciales", emoji: "🥋" },
  { value: "cycling", label: "Ciclismo", emoji: "🚴" },
  { value: "swimming", label: "Natación", emoji: "🏊" },
  { value: "football", label: "Fútbol", emoji: "⚽" },
  { value: "basketball", label: "Baloncesto", emoji: "🏀" },
  { value: "yoga", label: "Yoga", emoji: "🧘" },
  { value: "hiking", label: "Senderismo", emoji: "🥾" },
  { value: "other", label: "Otro", emoji: "🏅" }
];

export default function GoalsDialog({ open, onOpenChange, member }) {
  const queryClient = useQueryClient();
  const [newGoal, setNewGoal] = useState({
    goal_type: "general",
    activity_type: "",
    weekly_hours_target: ""
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals', member.email],
    queryFn: async () => {
      const allGoals = await base44.entities.Goal.list();
      return allGoals.filter(g => g.user_email === member.email);
    },
    enabled: !!member.email
  });

  const createGoalMutation = useMutation({
    mutationFn: (data) => base44.entities.Goal.create({
      ...data,
      user_email: member.email,
      user_name: member.name
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setNewGoal({
        goal_type: "general",
        activity_type: "",
        weekly_hours_target: ""
      });
    }
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id) => base44.entities.Goal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });

  const handleAddGoal = () => {
    if (!newGoal.weekly_hours_target) return;
    if (newGoal.goal_type === "activity_specific" && !newGoal.activity_type) return;

    createGoalMutation.mutate({
      goal_type: newGoal.goal_type,
      activity_type: newGoal.goal_type === "activity_specific" ? newGoal.activity_type : undefined,
      weekly_hours_target: parseFloat(newGoal.weekly_hours_target)
    });
  };

  const getActivityLabel = (type) => {
    const activity = activityTypes.find(a => a.value === type);
    return activity ? `${activity.emoji} ${activity.label}` : type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Objetivos de {member.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lista de objetivos existentes */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3">Objetivos Actuales</h3>
            {goals.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No hay objetivos configurados
              </p>
            ) : (
              <div className="space-y-2">
                {goals.map(goal => (
                  <div key={goal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {goal.goal_type === "general" ? (
                        <Badge className="bg-blue-100 text-blue-700">General</Badge>
                      ) : (
                        <Badge className="bg-purple-100 text-purple-700">
                          {getActivityLabel(goal.activity_type)}
                        </Badge>
                      )}
                      <span className="font-semibold text-gray-900">
                        {goal.weekly_hours_target}h / semana
                      </span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteGoalMutation.mutate(goal.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Formulario para nuevo objetivo */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Añadir Nuevo Objetivo</h3>
            <div className="space-y-4">
              <div>
                <Label>Tipo de Objetivo</Label>
                <Select
                  value={newGoal.goal_type}
                  onValueChange={(value) => setNewGoal({...newGoal, goal_type: value, activity_type: ""})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General (todas las actividades)</SelectItem>
                    <SelectItem value="activity_specific">Por actividad específica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newGoal.goal_type === "activity_specific" && (
                <div>
                  <Label>Actividad</Label>
                  <Select
                    value={newGoal.activity_type}
                    onValueChange={(value) => setNewGoal({...newGoal, activity_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una actividad" />
                    </SelectTrigger>
                    <SelectContent>
                      {activityTypes.map(activity => (
                        <SelectItem key={activity.value} value={activity.value}>
                          {activity.emoji} {activity.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Horas semanales objetivo</Label>
                <Input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={newGoal.weekly_hours_target}
                  onChange={(e) => setNewGoal({...newGoal, weekly_hours_target: e.target.value})}
                  placeholder="5"
                />
              </div>

              <Button
                onClick={handleAddGoal}
                disabled={createGoalMutation.isPending || !newGoal.weekly_hours_target || 
                  (newGoal.goal_type === "activity_specific" && !newGoal.activity_type)}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Añadir Objetivo
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}