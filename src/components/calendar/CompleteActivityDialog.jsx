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

export default function CompleteActivityDialog({ open, onOpenChange, activity }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    duration_minutes: activity?.duration_minutes || "",
    notes: activity?.notes || ""
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Activity.update(activity.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-activities'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      onOpenChange(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      ...activity,
      status: "completed",
      duration_minutes: parseInt(formData.duration_minutes),
      notes: formData.notes
    });
  };

  if (!activity) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Completar Actividad</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="duration_minutes">Duración real (minutos)</Label>
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

          <div className="space-y-2">
            <Label htmlFor="notes">Comentarios</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="¿Cómo fue el entrenamiento?"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={updateMutation.isPending || !formData.duration_minutes}
              className="bg-green-600 hover:bg-green-700"
            >
              {updateMutation.isPending ? "Guardando..." : "Completar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}