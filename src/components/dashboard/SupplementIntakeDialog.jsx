import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Pill, CheckCircle2, Settings } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const timeLabels = {
  morning: "Mañana",
  afternoon: "Tarde",
  evening: "Noche",
  anytime: "Cualquier momento"
};

export default function SupplementIntakeDialog({ open, onOpenChange, userEmail, onOpenSettings }) {
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: supplements = [] } = useQuery({
    queryKey: ['supplements', userEmail],
    queryFn: () => base44.entities.Supplement.filter({ user_email: userEmail }),
    enabled: !!userEmail,
  });

  const { data: todayIntakes = [] } = useQuery({
    queryKey: ['supplement-intakes', userEmail, today],
    queryFn: () => base44.entities.SupplementIntake.filter({ 
      user_email: userEmail,
      date: today
    }),
    enabled: !!userEmail,
  });

  const createIntakeMutation = useMutation({
    mutationFn: (data) => base44.entities.SupplementIntake.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplement-intakes'] });
    },
  });

  const deleteIntakeMutation = useMutation({
    mutationFn: (id) => base44.entities.SupplementIntake.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplement-intakes'] });
    },
  });

  const handleToggle = (supplement, currentlyTaken) => {
    if (currentlyTaken) {
      // Find and delete the intake
      const intake = todayIntakes.find(i => i.supplement_id === supplement.id);
      if (intake) {
        deleteIntakeMutation.mutate(intake.id);
      }
    } else {
      // Create new intake
      createIntakeMutation.mutate({
        user_email: userEmail,
        supplement_id: supplement.id,
        supplement_name: supplement.name,
        date: today,
        taken: true
      });
    }
  };

  const groupedSupplements = {
    morning: supplements.filter(s => s.time_of_day === 'morning'),
    afternoon: supplements.filter(s => s.time_of_day === 'afternoon'),
    evening: supplements.filter(s => s.time_of_day === 'evening'),
    anytime: supplements.filter(s => s.time_of_day === 'anytime'),
  };

  const allTaken = supplements.length > 0 && todayIntakes.length === supplements.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-purple-600" />
              Suplementos de Hoy
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onOpenSettings();
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <Settings className="w-4 h-4 mr-1" />
              Gestionar
            </Button>
          </DialogTitle>
          <p className="text-sm text-gray-600">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {supplements.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <Pill className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-3">No tienes suplementos configurados</p>
              <Button
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onOpenSettings();
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Settings className="w-4 h-4 mr-1" />
                Configurar Suplementos
              </Button>
            </div>
          ) : (
            <>
              {allTaken && (
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-emerald-900">¡Todo tomado!</p>
                    <p className="text-xs text-emerald-700">Has completado tu suplementación de hoy</p>
                  </div>
                </div>
              )}

              {Object.entries(groupedSupplements).map(([timeKey, supps]) => {
                if (supps.length === 0) return null;
                return (
                  <div key={timeKey} className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">{timeLabels[timeKey]}</p>
                    <div className="space-y-2">
                      {supps.map((supp) => {
                        const isTaken = todayIntakes.some(i => i.supplement_id === supp.id);
                        return (
                          <div
                            key={supp.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                              isTaken
                                ? "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300"
                                : "bg-white border-gray-200 hover:border-purple-300"
                            }`}
                            onClick={() => handleToggle(supp, isTaken)}
                          >
                            <Checkbox
                              checked={isTaken}
                              onCheckedChange={() => handleToggle(supp, isTaken)}
                              className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                            />
                            <div className="flex-1">
                              <p className={`font-semibold ${isTaken ? "text-emerald-900 line-through" : "text-gray-900"}`}>
                                {supp.name}
                              </p>
                              {supp.dosage && (
                                <p className={`text-xs ${isTaken ? "text-emerald-700" : "text-gray-600"}`}>
                                  {supp.dosage}
                                </p>
                              )}
                            </div>
                            {isTaken && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}