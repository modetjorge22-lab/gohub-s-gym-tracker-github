import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const activityTypes = [
  { value: "running", label: "Running", emoji: "🏃" },
  { value: "strength_training", label: "Entrenamiento de Fuerza", emoji: "💪" },
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

export default function WeeklyPlanDialog({ open, onOpenChange, userEmail }) {
  const queryClient = useQueryClient();
  const [newPlan, setNewPlan] = useState({
    activity_type: "",
    weekly_target: 1,
    subtypes: []
  });
  const [showSubtypes, setShowSubtypes] = useState(false);
  const [subtypeName, setSubtypeName] = useState("");
  const [subtypeCount, setSubtypeCount] = useState(1);

  const { data: plans = [] } = useQuery({
    queryKey: ['weekly-plans', userEmail],
    queryFn: () => base44.entities.WeeklyPlan.filter({ user_email: userEmail }),
    enabled: !!userEmail
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.WeeklyPlan.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-plans'] });
      setNewPlan({ activity_type: "", weekly_target: 1, subtypes: [] });
      setShowSubtypes(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WeeklyPlan.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-plans'] });
    }
  });

  const handleAddSubtype = () => {
    if (!subtypeName || subtypeCount < 1) return;
    setNewPlan({
      ...newPlan,
      subtypes: [...newPlan.subtypes, { name: subtypeName, count: subtypeCount }]
    });
    setSubtypeName("");
    setSubtypeCount(1);
  };

  const handleRemoveSubtype = (index) => {
    setNewPlan({
      ...newPlan,
      subtypes: newPlan.subtypes.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newPlan.activity_type || !userEmail) return;

    createMutation.mutate({
      user_email: userEmail,
      ...newPlan
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-green-600" />
            Mi Plan Semanal
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Plans */}
          {plans.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-gray-700">Plan Actual</h4>
              {plans.map((plan) => {
                const activity = activityTypes.find(a => a.value === plan.activity_type);
                return (
                  <Card key={plan.id} className="bg-gray-50">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{activity?.emoji}</span>
                          <span className="font-semibold">{activity?.label}</span>
                          <span className="text-sm text-gray-600">× {plan.weekly_target}/semana</span>
                        </div>
                        {plan.subtypes && plan.subtypes.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {plan.subtypes.map((sub, i) => (
                              <span key={i} className="text-xs bg-white px-2 py-1 rounded-full border">
                                {sub.name}: {sub.count}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(plan.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Add New Plan */}
          <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
            <h4 className="font-semibold text-sm text-gray-700">Añadir al Plan</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Actividad</Label>
                <Select
                  value={newPlan.activity_type}
                  onValueChange={(value) => setNewPlan({...newPlan, activity_type: value})}
                >
                  <SelectTrigger>
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
                <Label>Veces por Semana</Label>
                <Input
                  type="number"
                  min="1"
                  value={newPlan.weekly_target}
                  onChange={(e) => setNewPlan({...newPlan, weekly_target: parseInt(e.target.value)})}
                />
              </div>
            </div>

            {/* Subtypes Section */}
            {newPlan.activity_type === 'strength_training' && (
              <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Desglose (Opcional)</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSubtypes(!showSubtypes)}
                  >
                    {showSubtypes ? "Ocultar" : "Mostrar"}
                  </Button>
                </div>

                {showSubtypes && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-7">
                        <Input
                          placeholder="Ej: Push, Pull, Legs"
                          value={subtypeName}
                          onChange={(e) => setSubtypeName(e.target.value)}
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          min="1"
                          value={subtypeCount}
                          onChange={(e) => setSubtypeCount(parseInt(e.target.value))}
                        />
                      </div>
                      <div className="col-span-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          onClick={handleAddSubtype}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {newPlan.subtypes.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {newPlan.subtypes.map((sub, i) => (
                          <div key={i} className="flex items-center gap-1 bg-white px-3 py-1 rounded-full text-sm border">
                            <span>{sub.name}: {sub.count}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSubtype(i)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={!newPlan.activity_type || createMutation.isPending}
              className="w-full"
            >
              {createMutation.isPending ? "Guardando..." : "Añadir al Plan"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}