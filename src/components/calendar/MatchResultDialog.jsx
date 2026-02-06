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
import { Trophy, X } from "lucide-react";

export default function MatchResultDialog({ open, onOpenChange, activityId }) {
  const queryClient = useQueryClient();
  const [result, setResult] = useState(null);

  const updateMutation = useMutation({
    mutationFn: async (matchResult) => {
      const activity = await base44.entities.Activity.list();
      const currentActivity = activity.find(a => a.id === activityId);
      return base44.entities.Activity.update(activityId, {
        ...currentActivity,
        match_result: matchResult
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-activities'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      onOpenChange(false);
      setResult(null);
    },
  });

  const handleSelection = (matchResult) => {
    updateMutation.mutate(matchResult);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">¿Ganaste o perdiste?</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <Button
            onClick={() => handleSelection('win')}
            disabled={updateMutation.isPending}
            className="h-24 bg-green-500 hover:bg-green-600 text-white font-bold text-lg flex flex-col items-center justify-center gap-2"
          >
            <Trophy className="w-8 h-8" />
            Victoria
          </Button>
          <Button
            onClick={() => handleSelection('loss')}
            disabled={updateMutation.isPending}
            variant="destructive"
            className="h-24 font-bold text-lg flex flex-col items-center justify-center gap-2"
          >
            <X className="w-8 h-8" />
            Derrota
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}