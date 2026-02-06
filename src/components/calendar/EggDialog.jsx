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
import { format } from "date-fns";

export default function EggDialog({ open, onOpenChange, member, selectedDate }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    egg_count: "",
    notes: ""
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.EggIntake.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['egg-intakes', member?.email] });
      queryClient.invalidateQueries({ queryKey: ['egg-intakes'] });
      onOpenChange(false);
      setFormData({ egg_count: "", notes: "" });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!member) return;
    
    createMutation.mutate({
      ...formData,
      user_email: member.email,
      user_name: member.name,
      egg_count: parseInt(formData.egg_count),
      date: format(selectedDate, "yyyy-MM-dd")
    });
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>🥚 Registrar Huevos</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="egg_count">Huevos consumidos</Label>
            <Input
              id="egg_count"
              type="number"
              value={formData.egg_count}
              onChange={(e) => setFormData({...formData, egg_count: e.target.value})}
              placeholder="3"
              required
              min="1"
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Desayuno, almuerzo, etc."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || !formData.egg_count}
              className="bg-gray-900 hover:bg-gray-800"
            >
              {createMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}