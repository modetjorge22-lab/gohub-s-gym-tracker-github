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
import { Pill, Plus, Trash2, Settings } from "lucide-react";

const timeLabels = {
  morning: "Mañana",
  afternoon: "Tarde",
  evening: "Noche",
  anytime: "Cualquier momento"
};

export default function SupplementsDialog({ open, onOpenChange, userEmail }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    time_of_day: "anytime"
  });

  const { data: supplements = [] } = useQuery({
    queryKey: ['supplements', userEmail],
    queryFn: () => base44.entities.Supplement.filter({ user_email: userEmail }),
    enabled: !!userEmail,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Supplement.create({ ...data, user_email: userEmail }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplements'] });
      setFormData({ name: "", dosage: "", time_of_day: "anytime" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Supplement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplements'] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Gestionar Suplementos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lista de suplementos existentes */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Tus suplementos</Label>
            {supplements.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {supplements.map((supp) => (
                  <div
                    key={supp.id}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Pill className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="font-semibold text-gray-900">{supp.name}</p>
                        <p className="text-xs text-gray-600">
                          {supp.dosage} • {timeLabels[supp.time_of_day]}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(supp.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <Pill className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">No tienes suplementos configurados</p>
              </div>
            )}
          </div>

          {/* Formulario para añadir nuevo */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-gray-200">
            <Label className="text-sm font-semibold">Añadir nuevo suplemento</Label>
            
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Creatina, Proteína..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosage">Dosis</Label>
              <Input
                id="dosage"
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                placeholder="Ej: 5g, 1 cápsula..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Momento del día</Label>
              <Select
                value={formData.time_of_day}
                onValueChange={(value) => setFormData({ ...formData, time_of_day: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(timeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {createMutation.isPending ? "Añadiendo..." : "Añadir Suplemento"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}