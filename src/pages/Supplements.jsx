import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pill, Droplet, Zap, Heart, Shield, Sparkles, Check, Settings, Trash2, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const iconMap = {
  pill: Pill,
  droplet: Droplet,
  zap: Zap,
  heart: Heart,
  shield: Shield,
  sparkles: Sparkles
};

const colorMap = {
  blue: "from-blue-500 to-blue-600",
  green: "from-green-500 to-green-600",
  purple: "from-purple-500 to-purple-600",
  orange: "from-orange-500 to-orange-600",
  pink: "from-pink-500 to-pink-600",
  red: "from-red-500 to-red-600",
  yellow: "from-yellow-500 to-yellow-600",
  teal: "from-teal-500 to-teal-600"
};

const timeLabels = {
  morning: "Mañana",
  afternoon: "Tarde",
  evening: "Noche",
  night: "Antes de dormir",
  anytime: "Cualquier momento"
};

export default function Supplements() {
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");
  
  const [newSupplement, setNewSupplement] = useState({
    name: "",
    recommended_time: "anytime",
    daily_target: 1,
    color: "blue",
    icon: "pill"
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: supplements = [] } = useQuery({
    queryKey: ['supplements'],
    queryFn: () => base44.entities.Supplement.list(),
    enabled: !!user,
  });

  const { data: intakes = [] } = useQuery({
    queryKey: ['supplement-intakes', today],
    queryFn: () => base44.entities.SupplementIntake.list('-created_date'),
    enabled: !!user,
  });

  const userSupplements = supplements.filter(s => s.user_email === user?.email && s.active);
  const todayIntakes = intakes.filter(i => i.date === today && i.user_email === user?.email);

  const createSupplementMutation = useMutation({
    mutationFn: (data) => base44.entities.Supplement.create({ ...data, user_email: user.email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplements'] });
      setAddDialogOpen(false);
      setNewSupplement({ name: "", recommended_time: "anytime", daily_target: 1, color: "blue", icon: "pill" });
      toast.success("Suplemento añadido");
    }
  });

  const toggleIntakeMutation = useMutation({
    mutationFn: async ({ supplement, isMarked }) => {
      if (isMarked) {
        const intake = todayIntakes.find(i => i.supplement_id === supplement.id);
        if (intake) {
          await base44.entities.SupplementIntake.delete(intake.id);
        }
      } else {
        await base44.entities.SupplementIntake.create({
          user_email: user.email,
          supplement_id: supplement.id,
          supplement_name: supplement.name,
          date: today,
          taken_at: new Date().toISOString()
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplement-intakes'] });
    }
  });

  const deleteSupplementMutation = useMutation({
    mutationFn: (id) => base44.entities.Supplement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplements'] });
      toast.success("Suplemento eliminado");
    }
  });

  const handleAddSupplement = (e) => {
    e.preventDefault();
    if (!newSupplement.name) {
      toast.error("El nombre es obligatorio");
      return;
    }
    createSupplementMutation.mutate(newSupplement);
  };

  const getIntakeCount = (supplementId) => {
    return todayIntakes.filter(i => i.supplement_id === supplementId).length;
  };

  const groupedSupplements = userSupplements.reduce((acc, supp) => {
    const time = supp.recommended_time;
    if (!acc[time]) acc[time] = [];
    acc[time].push(supp);
    return acc;
  }, {});

  const completedCount = userSupplements.filter(s => getIntakeCount(s.id) >= s.daily_target).length;
  const totalCount = userSupplements.length;
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto px-3 md:px-6 py-4 md:py-8">
      {/* Header con progreso */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Suplementos</h1>
            <p className="text-sm text-gray-600">{format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Gestionar Suplementos</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {userSupplements.map(supp => {
                    const Icon = iconMap[supp.icon];
                    return (
                      <div key={supp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-gradient-to-br ${colorMap[supp.color]} rounded-full flex items-center justify-center`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{supp.name}</p>
                            <p className="text-xs text-gray-500">{timeLabels[supp.recommended_time]}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSupplementMutation.mutate(supp.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    );
                  })}
                  {userSupplements.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No hay suplementos configurados</p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gray-900 hover:bg-gray-800">
                  <Plus className="w-5 h-5 mr-2" />
                  Añadir
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuevo Suplemento</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddSupplement} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input
                      value={newSupplement.name}
                      onChange={(e) => setNewSupplement({ ...newSupplement, name: e.target.value })}
                      placeholder="Ej: Creatina, Omega 3..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Momento del día</Label>
                      <Select value={newSupplement.recommended_time} onValueChange={(v) => setNewSupplement({ ...newSupplement, recommended_time: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(timeLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Veces al día</Label>
                      <Input
                        type="number"
                        min="1"
                        value={newSupplement.daily_target}
                        onChange={(e) => setNewSupplement({ ...newSupplement, daily_target: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <Select value={newSupplement.color} onValueChange={(v) => setNewSupplement({ ...newSupplement, color: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(colorMap).map(color => (
                            <SelectItem key={color} value={color}>{color}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Icono</Label>
                      <Select value={newSupplement.icon} onValueChange={(v) => setNewSupplement({ ...newSupplement, icon: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(iconMap).map(icon => (
                            <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-gray-900 hover:bg-gray-800">
                    Crear Suplemento
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Progress bar */}
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Progreso del día</span>
              <span className="text-sm font-bold text-gray-900">{completedCount}/{totalCount}</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suplementos agrupados por momento del día */}
      <div className="space-y-4">
        {Object.entries(groupedSupplements).map(([time, supps]) => (
          <Card key={time} className="backdrop-blur-xl bg-white/80 border border-gray-200 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-gray-600" />
                {timeLabels[time]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {supps.map(supplement => {
                const Icon = iconMap[supplement.icon];
                const intakeCount = getIntakeCount(supplement.id);
                const isCompleted = intakeCount >= supplement.daily_target;
                
                return (
                  <motion.div
                    key={supplement.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleIntakeMutation.mutate({ supplement, isMarked: intakeCount > 0 })}
                    className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 bg-gradient-to-br ${colorMap[supplement.color]} rounded-full flex items-center justify-center shadow-md`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{supplement.name}</p>
                        {supplement.daily_target > 1 && (
                          <p className="text-xs text-gray-500">{intakeCount}/{supplement.daily_target} tomas</p>
                        )}
                      </div>
                    </div>
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                      isCompleted 
                        ? `${colorMap[supplement.color].replace('from-', 'bg-')} border-transparent` 
                        : 'border-gray-300 bg-white'
                    }`}>
                      {isCompleted && <Check className="w-6 h-6 text-white" strokeWidth={3} />}
                    </div>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        ))}

        {userSupplements.length === 0 && (
          <Card className="bg-white/80 border-2 border-dashed border-gray-300">
            <CardContent className="py-12 text-center">
              <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No tienes suplementos configurados</p>
              <Button onClick={() => setAddDialogOpen(true)} className="bg-gray-900 hover:bg-gray-800">
                <Plus className="w-5 h-5 mr-2" />
                Añadir tu primer suplemento
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}