import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dumbbell } from "lucide-react";

export default function WorkoutSelector({ selectedWorkoutId, onSelect, userEmail }) {
  const [updateWeights, setUpdateWeights] = useState(true);
  const queryClient = useQueryClient();

  const { data: workouts } = useQuery({
    queryKey: ['workouts'],
    queryFn: () => base44.entities.Workout.list(),
    enabled: !!userEmail
  });

  const userWorkouts = workouts?.filter(w => w.user_email === userEmail) || [];
  const selectedWorkout = userWorkouts.find(w => w.id === selectedWorkoutId);

  // Local state for exercise weights in this session
  const [sessionExercises, setSessionExercises] = useState([]);

  useEffect(() => {
    if (selectedWorkout) {
      // Initialize session exercises with workout defaults if not already set
      if (sessionExercises.length === 0) {
        setSessionExercises(selectedWorkout.exercises);
      }
    } else {
        setSessionExercises([]);
    }
  }, [selectedWorkout]);

  const updateWorkoutMutation = useMutation({
    mutationFn: (data) => base44.entities.Workout.update(selectedWorkout.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    }
  });

  // Trigger parent update when session exercises change
  useEffect(() => {
    if (selectedWorkoutId) {
        // Pass the session data back to parent
        onSelect(selectedWorkoutId, {
            name: selectedWorkout?.name,
            exercises: sessionExercises,
            updateWeights: updateWeights
        });
        
        // If updateWeights is true, we should ideally update the workout entity when the activity is submitted
        // But since we are inside the form, we can't hook into the submit event easily here without prop drilling the submit handler.
        // Instead, we'll handle the update in a useEffect that watches for a specific prop or handle it in the parent.
        // For now, let's attach the 'update' logic to the parent's mutation via the passed data.
    }
  }, [selectedWorkoutId, sessionExercises, updateWeights]);

  const handleWeightChange = (index, newWeight) => {
    const newExercises = [...sessionExercises];
    newExercises[index] = { ...newExercises[index], weight: newWeight };
    setSessionExercises(newExercises);
  };

  const handleRepsChange = (index, newReps) => {
    const newExercises = [...sessionExercises];
    newExercises[index] = { ...newExercises[index], reps: newReps };
    setSessionExercises(newExercises);
  };

  return (
    <div className="space-y-4">
      <Select
        value={selectedWorkoutId || "none"}
        onValueChange={(val) => {
          if (val === "none") onSelect(null, null);
          else {
             const workout = userWorkouts.find(w => w.id === val);
             setSessionExercises(workout ? workout.exercises : []);
             onSelect(val, workout ? { name: workout.name, exercises: workout.exercises } : null);
          }
        }}
      >
        <SelectTrigger className="h-12">
          <SelectValue placeholder="Seleccionar rutina guardada" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Ninguna (Entrenamiento libre)</SelectItem>
          {userWorkouts.map(w => (
            <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedWorkout && (
        <Card className="bg-gray-50 border-dashed border-2">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2 text-indigo-700 font-semibold">
              <Dumbbell className="w-4 h-4" />
              <span>Registrar Pesos de la Sesión</span>
            </div>
            
            {sessionExercises.map((ex, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center text-sm">
                <div className="col-span-5 font-medium">{ex.name}</div>
                <div className="col-span-3 flex items-center gap-1">
                   <Input 
                     className="h-8 px-2 bg-white" 
                     value={ex.reps} 
                     onChange={(e) => handleRepsChange(i, e.target.value)}
                   />
                   <span className="text-xs text-gray-500">reps</span>
                </div>
                <div className="col-span-4 flex items-center gap-1">
                   <Input 
                     className="h-8 px-2 bg-white font-bold text-indigo-600" 
                     value={ex.weight} 
                     onChange={(e) => handleWeightChange(i, e.target.value)}
                   />
                   <span className="text-xs text-gray-500">kg/lb</span>
                </div>
              </div>
            ))}

            <div className="flex items-center space-x-2 pt-2 border-t mt-2">
              <Checkbox 
                id="update-weights" 
                checked={updateWeights}
                onCheckedChange={setUpdateWeights}
              />
              <Label htmlFor="update-weights" className="text-xs text-gray-600 cursor-pointer">
                Actualizar automáticamente mi rutina con estos nuevos pesos/reps
              </Label>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}