import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2, Dumbbell, ChevronDown, ChevronUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Workouts() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: workouts, isLoading } = useQuery({
    queryKey: ['workouts'],
    queryFn: () => base44.entities.Workout.list(),
    enabled: !!user
  });

  // Filter workouts for current user
  const userWorkouts = workouts?.filter(w => w.user_email === user?.email) || [];

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50/50">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mis Entrenamientos</h1>
            <p className="text-gray-600">Gestiona tus rutinas y progreso</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-5 h-5 mr-2" />
            Crear Rutina
          </Button>
        </div>

        <div className="grid gap-6">
          {userWorkouts.length === 0 ? (
            <Card className="bg-white/50 border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Dumbbell className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-xl font-semibold text-gray-600">No tienes rutinas creadas</p>
                <Button variant="link" onClick={() => setIsCreateOpen(true)}>
                  Crear tu primera rutina
                </Button>
              </CardContent>
            </Card>
          ) : (
            userWorkouts.map(workout => (
              <WorkoutCard 
                key={workout.id} 
                workout={workout} 
                onEdit={() => {
                  setEditingWorkout(workout);
                  setIsCreateOpen(true);
                }}
              />
            ))
          )}
        </div>

        <WorkoutDialog 
          open={isCreateOpen} 
          onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) setEditingWorkout(null);
          }}
          user={user}
          initialData={editingWorkout}
        />
      </div>
    </div>
  );
}

function WorkoutCard({ workout, onEdit }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Workout.delete(workout.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workouts'] })
  });

  return (
    <Card className="bg-white shadow-sm hover:shadow-md transition-all border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between p-6">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="bg-indigo-100 p-3 rounded-xl">
            <Dumbbell className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <CardTitle className="text-xl mb-1">{workout.name}</CardTitle>
            <p className="text-sm text-gray-500">{workout.exercises?.length || 0} ejercicios</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Edit2 className="w-4 h-4 text-gray-500" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => {
            if(confirm('¿Seguro que quieres borrar esta rutina?')) deleteMutation.mutate();
          }}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="px-6 pb-6 pt-0">
          <div className="mt-4 border-t pt-4 space-y-3">
            {workout.exercises?.map((ex, i) => (
              <div key={i} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-700">{ex.name}</span>
                  <span className="text-xs text-gray-500">{ex.sets_data?.length || ex.sets} sets</span>
                </div>
                <div className="space-y-1">
                  {ex.sets_data ? (
                    ex.sets_data.map((set, j) => (
                      <div key={j} className="flex justify-between text-sm text-gray-600 border-b border-gray-200 last:border-0 pb-1">
                        <span>Set {j + 1}</span>
                        <div className="flex gap-3">
                          <span>{set.reps} reps</span>
                          <span className="font-bold text-indigo-600">{set.weight}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>{ex.reps} reps</span>
                      <span className="font-bold text-indigo-600">{ex.weight}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function WorkoutDialog({ open, onOpenChange, user, initialData }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [exercises, setExercises] = useState([]);

  React.useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      // Migrate old data if needed
      const mappedExercises = (initialData.exercises || []).map(ex => {
        if (ex.sets_data) return ex;
        // Convert old format to new sets_data
        const sets = ex.sets || 3;
        const sets_data = Array(sets).fill({ reps: ex.reps || "10", weight: ex.weight || "" });
        return { ...ex, sets_data };
      });
      setExercises(mappedExercises);
    } else {
      setName("");
      setExercises([{ 
        name: "", 
        sets_data: Array(3).fill({ reps: "10", weight: "" }) 
      }]);
    }
  }, [initialData, open]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Workout.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      onOpenChange(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Workout.update(initialData.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      onOpenChange(false);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      user_email: user.email,
      name,
      exercises: exercises.filter(e => e.name.trim() !== "")
    };
    
    if (initialData) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const addExercise = () => {
    setExercises([...exercises, { 
      name: "", 
      sets_data: Array(3).fill({ reps: "10", weight: "" }) 
    }]);
  };

  const removeExercise = (index) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const updateExerciseName = (index, name) => {
    const newExercises = [...exercises];
    newExercises[index] = { ...newExercises[index], name };
    setExercises(newExercises);
  };

  const updateSetCount = (exerciseIndex, count) => {
    const newExercises = [...exercises];
    const currentSets = newExercises[exerciseIndex].sets_data;
    let newSets = [...currentSets];
    
    if (count > currentSets.length) {
      const diff = count - currentSets.length;
      const lastSet = currentSets[currentSets.length - 1] || { reps: "10", weight: "" };
      newSets = [...newSets, ...Array(diff).fill({ ...lastSet })];
    } else if (count < currentSets.length) {
      newSets = newSets.slice(0, count);
    }
    
    newExercises[exerciseIndex] = { ...newExercises[exerciseIndex], sets_data: newSets };
    setExercises(newExercises);
  };

  const updateSetData = (exerciseIndex, setIndex, field, value) => {
    const newExercises = [...exercises];
    const newSets = [...newExercises[exerciseIndex].sets_data];
    newSets[setIndex] = { ...newSets[setIndex], [field]: value };
    newExercises[exerciseIndex] = { ...newExercises[exerciseIndex], sets_data: newSets };
    setExercises(newExercises);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Rutina' : 'Nueva Rutina'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div>
            <Label>Nombre de la Rutina</Label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Ej: Pierna Hipertrofia" 
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Ejercicios</Label>
              <Button type="button" variant="outline" size="sm" onClick={addExercise}>
                <Plus className="w-4 h-4 mr-2" />
                Añadir Ejercicio
              </Button>
            </div>
            
            {exercises.map((exercise, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 grid grid-cols-12 gap-4">
                    <div className="col-span-8">
                      <Label className="text-xs mb-1 block">Nombre del Ejercicio</Label>
                      <Input 
                        value={exercise.name} 
                        onChange={(e) => updateExerciseName(index, e.target.value)} 
                        placeholder="Ej: Sentadilla"
                      />
                    </div>
                    <div className="col-span-4">
                      <Label className="text-xs mb-1 block">Número de Series</Label>
                      <Input 
                        type="number"
                        min="1"
                        max="10"
                        value={exercise.sets_data?.length || 0} 
                        onChange={(e) => updateSetCount(index, parseInt(e.target.value) || 1)} 
                      />
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeExercise(index)}
                    className="ml-2 text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                  <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 mb-1">
                    <div className="col-span-2">Serie</div>
                    <div className="col-span-5">Repeticiones</div>
                    <div className="col-span-5">Peso (kg/lb)</div>
                  </div>
                  {exercise.sets_data?.map((set, setIndex) => (
                    <div key={setIndex} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-2 text-sm font-medium text-gray-600">
                        Set {setIndex + 1}
                      </div>
                      <div className="col-span-5">
                        <Input 
                          value={set.reps} 
                          onChange={(e) => updateSetData(index, setIndex, 'reps', e.target.value)}
                          className="h-8"
                          placeholder="Reps"
                        />
                      </div>
                      <div className="col-span-5">
                        <Input 
                          value={set.weight} 
                          onChange={(e) => updateSetData(index, setIndex, 'weight', e.target.value)}
                          className="h-8"
                          placeholder="Peso"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Guardar Rutina</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}