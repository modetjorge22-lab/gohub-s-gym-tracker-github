import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Dumbbell, Flame, CheckCircle, ArrowLeft } from "lucide-react";
import WorkoutSelector from "@/components/workouts/WorkoutSelector";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import MatchResultDialog from "../components/calendar/MatchResultDialog";

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
  { value: "golf", label: "Golf", emoji: "⛳", basePoints: 8 },
  { value: "stretching", label: "Estiramientos", emoji: "🧘‍♂️", basePoints: 6 },
  { value: "other", label: "Otro", emoji: "🏅", basePoints: 8 }
];

export default function LogActivity() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("activity");
  
  const [activityData, setActivityData] = useState({
    activity_type: "",
    duration_minutes: "",
    notes: "",
    date: new Date(),
    status: "completed",
    workout_id: null,
    workout_data: null
    });

  const [eggData, setEggData] = useState({
    egg_count: "",
    notes: "",
    date: new Date()
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const calculatePoints = () => {
    if (!activityData.activity_type || !activityData.duration_minutes) return 0;
    
    const activityType = activityTypes.find(a => a.value === activityData.activity_type);
    const basePoints = activityType?.basePoints || 8;
    const durationFactor = parseInt(activityData.duration_minutes) / 60;

    return Math.round(basePoints * durationFactor * 10);
  };

  const [showMatchResult, setShowMatchResult] = useState(false);
  const [createdActivityId, setCreatedActivityId] = useState(null);

  // Mutation to update the workout definition if requested
  const updateWorkoutMutation = useMutation({
    mutationFn: (data) => base44.entities.Workout.update(data.id, { exercises: data.exercises })
  });

  const createActivityMutation = useMutation({
    mutationFn: async (data) => {
      // Check if we need to update the workout weights
      if (data.workout_id && data.workout_data && data.workout_data.updateWeights) {
        await updateWorkoutMutation.mutateAsync({
          id: data.workout_id,
          exercises: data.workout_data.exercises
        });
      }

      return base44.entities.Activity.create({
        ...data,
        user_email: user.email,
        user_name: user.full_name,
        points: calculatePoints()
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      
      // Si es pádel completado, mostrar diálogo de resultado
      if (activityData.activity_type === 'padel' && activityData.status === 'completed') {
        setCreatedActivityId(response.id);
        setShowMatchResult(true);
      } else {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setActivityData({
            activity_type: "",
            duration_minutes: "",
            notes: "",
            date: new Date(),
            status: "completed",
            workout_id: null,
            workout_data: null
          });
        }, 2000);
      }
    },
  });

  const createEggMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.EggIntake.create({
        ...data,
        user_email: user.email,
        user_name: user.full_name,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['egg-intakes'] });
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setEggData({
          egg_count: "",
          notes: "",
          date: new Date()
        });
      }, 2000);
    },
  });

  const handleActivitySubmit = (e) => {
    e.preventDefault();
    createActivityMutation.mutate({
      ...activityData,
      duration_minutes: parseInt(activityData.duration_minutes),
      date: format(activityData.date, "yyyy-MM-dd")
    });
  };

  const handleEggSubmit = (e) => {
    e.preventDefault();
    createEggMutation.mutate({
      ...eggData,
      egg_count: parseInt(eggData.egg_count),
      date: format(eggData.date, "yyyy-MM-dd")
    });
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Dashboard"))}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al Dashboard
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="shadow-2xl border-2 border-gray-200">
            <CardHeader className="bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Dumbbell className="w-8 h-8" strokeWidth={2.5} />
                Registrar Datos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="activity">
                    🏃 {activityData.status === 'completed' ? 'Actividad Completada' : 'Planificar Actividad'}
                  </TabsTrigger>
                  <TabsTrigger value="eggs">🥚 Huevos</TabsTrigger>
                </TabsList>

                <TabsContent value="activity">
                  <form onSubmit={handleActivitySubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-lg font-semibold">Estado</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setActivityData({...activityData, status: 'completed'})}
                          className={`p-3 rounded-xl border-2 font-semibold transition-all ${
                            activityData.status === 'completed'
                              ? "bg-green-100 border-green-400 text-green-700 scale-105 shadow-lg"
                              : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          ✅ Completada
                        </button>
                        <button
                          type="button"
                          onClick={() => setActivityData({...activityData, status: 'planned'})}
                          className={`p-3 rounded-xl border-2 font-semibold transition-all ${
                            activityData.status === 'planned'
                              ? "bg-blue-100 border-blue-400 text-blue-700 scale-105 shadow-lg"
                              : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          📅 Planificada
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="activity_type" className="text-lg font-semibold">
                        Tipo de Actividad
                      </Label>
                      <Select
                        value={activityData.activity_type}
                        onValueChange={(value) => setActivityData({...activityData, activity_type: value})}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Selecciona un deporte" />
                        </SelectTrigger>
                        <SelectContent>
                          {activityTypes.map((activity) => (
                            <SelectItem key={activity.value} value={activity.value}>
                              <span className="text-lg">{activity.emoji} {activity.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration" className="text-lg font-semibold">
                        Duración (minutos)
                      </Label>
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        value={activityData.duration_minutes}
                        onChange={(e) => setActivityData({...activityData, duration_minutes: e.target.value})}
                        placeholder="60"
                        className="h-12 text-lg"
                      />
                    </div>

                    {/* Workout Selector for Strength Training */}
                    {activityData.activity_type === 'strength_training' && (
                      <div className="space-y-2">
                        <Label className="text-lg font-semibold">Rutina de Entrenamiento (Opcional)</Label>
                        <WorkoutSelector 
                          selectedWorkoutId={activityData.workout_id}
                          onSelect={(workoutId, workoutData) => {
                            setActivityData({
                              ...activityData, 
                              workout_id: workoutId,
                              workout_data: workoutData // We can use this to prepopulate notes or tracking
                            });
                          }}
                          userEmail={user?.email}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-lg font-semibold">Fecha</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full h-12 justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-5 w-5" />
                            {format(activityData.date, "PPP", { locale: es })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={activityData.date}
                            onSelect={(date) => setActivityData({...activityData, date: date || new Date()})}
                            locale={es}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-lg font-semibold">
                        Notas (opcional)
                      </Label>
                      <Textarea
                        id="notes"
                        value={activityData.notes}
                        onChange={(e) => setActivityData({...activityData, notes: e.target.value})}
                        placeholder="¿Cómo te fue? ¿Algún logro especial?"
                        className="h-24"
                      />
                    </div>

                    {activityData.activity_type && activityData.duration_minutes && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-r from-orange-100 to-amber-100 p-6 rounded-xl border-2 border-orange-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Flame className="w-8 h-8 text-orange-600" />
                            <span className="text-lg font-semibold text-gray-700">
                              Puntos que ganarás:
                            </span>
                          </div>
                          <span className="text-4xl font-bold text-orange-600">
                            {calculatePoints()}
                          </span>
                        </div>
                      </motion.div>
                    )}

                    <Button
                      type="submit"
                      disabled={createActivityMutation.isPending || !activityData.activity_type || !activityData.duration_minutes}
                      className="w-full h-14 text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 shadow-lg"
                    >
                      {createActivityMutation.isPending ? (
                        "Guardando..."
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Registrar Actividad
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="eggs">
                  <form onSubmit={handleEggSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="egg_count" className="text-lg font-semibold">
                        Huevos consumidos (opcional) {/* Updated label text */}
                      </Label>
                      <Input
                        id="egg_count"
                        type="number"
                        min="1"
                        value={eggData.egg_count}
                        onChange={(e) => setEggData({...eggData, egg_count: e.target.value})}
                        placeholder="3"
                        className="h-12 text-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-lg font-semibold">Fecha</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full h-12 justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-5 w-5" />
                            {format(eggData.date, "PPP", { locale: es })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={eggData.date}
                            onSelect={(date) => setEggData({...eggData, date: date || new Date()})}
                            locale={es}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="egg_notes" className="text-lg font-semibold">
                        Notas (opcional)
                      </Label>
                      <Textarea
                        id="egg_notes"
                        value={eggData.notes}
                        onChange={(e) => setEggData({...eggData, notes: e.target.value})}
                        placeholder="Desayuno, almuerzo, etc."
                        className="h-24"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={createEggMutation.isPending || !eggData.egg_count}
                      className="w-full h-14 text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 shadow-lg"
                    >
                      {createEggMutation.isPending ? (
                        "Guardando..."
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Registrar Huevos
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              className="fixed bottom-8 right-8 bg-green-500 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3"
            >
              <CheckCircle className="w-6 h-6" />
              <span className="font-bold text-lg">¡Registro guardado!</span>
            </motion.div>
          )}
        </AnimatePresence>

        <MatchResultDialog
          open={showMatchResult}
          onOpenChange={(open) => {
            setShowMatchResult(open);
            if (!open) {
              setShowSuccess(true);
              setTimeout(() => {
                setShowSuccess(false);
                setActivityData({
                  activity_type: "",
                  duration_minutes: "",
                  notes: "",
                  date: new Date(),
                  status: "completed",
                  workout_id: null,
                  workout_data: null
                });
              }, 2000);
            }
          }}
          activityId={createdActivityId}
        />
      </div>
    </div>
  );
}