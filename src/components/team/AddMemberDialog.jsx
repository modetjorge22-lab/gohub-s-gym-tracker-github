import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Link as LinkIcon, Upload, X } from "lucide-react";

const avatarColors = [
  { value: "blue", label: "Azul" },
  { value: "green", label: "Verde" },
  { value: "purple", label: "Morado" },
  { value: "orange", label: "Naranja" },
  { value: "pink", label: "Rosa" },
  { value: "indigo", label: "Índigo" },
  { value: "red", label: "Rojo" },
  { value: "teal", label: "Turquesa" }
];

export default function AddMemberDialog({ open, onOpenChange, forceEmail, forceName, groupId }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("create");
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: forceName || "",
    email: forceEmail || "",
    weekly_goal: 300,
    avatar_color: "blue",
    profile_image: ""
  });

  const { data: existingMembers = [] } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => base44.entities.TeamMember.list(),
  });

  // Filter members for current group
  const groupMembers = existingMembers.filter(m => m.group_id === groupId);
  
  // Check for profiles in other groups
  const otherGroupProfile = existingMembers.find(m => m.email === forceEmail && m.group_id !== groupId);

  React.useEffect(() => {
    if (otherGroupProfile && !formData.name) {
        setFormData(prev => ({ 
            ...prev, 
            name: otherGroupProfile.name,
            avatar_color: otherGroupProfile.avatar_color || "blue"
        }));
    }
  }, [otherGroupProfile, formData.name]);

  React.useEffect(() => {
    if (forceEmail) {
      setFormData(prev => ({ ...prev, email: forceEmail, name: forceName || prev.name }));
    }
  }, [forceEmail, forceName]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TeamMember.create({ ...data, group_id: groupId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      onOpenChange(false);
      setFormData({ name: "", email: "", weekly_goal: 300, avatar_color: "blue", profile_image: "" });
    },
  });

  const linkMutation = useMutation({
    mutationFn: async ({ memberId, email }) => {
      // 1. Get the member to find old email
      const member = groupMembers.find(m => m.id === memberId);
      const oldEmail = member?.email;

      // 2. Update the member
      await base44.entities.TeamMember.update(memberId, { email, group_id: groupId });

      // 3. If email changed, migrate all related data
      if (oldEmail && oldEmail !== email) {
        const migrateEntity = async (entityName) => {
          try {
            // Fetch all records with old email
            const records = await base44.entities[entityName].filter({ user_email: oldEmail }, '-created_date', 1000);
            if (records && records.length > 0) {
              // Update all records in parallel
              await Promise.all(records.map(record => 
                base44.entities[entityName].update(record.id, { user_email: email })
              ));
            }
          } catch (err) {
            console.error(`Failed to migrate ${entityName}`, err);
          }
        };

        await Promise.all([
          migrateEntity('Activity'),
          migrateEntity('Workout'),
          migrateEntity('EggIntake'),
          migrateEntity('Goal')
        ]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      onOpenChange(false);
    }
  });

  const handleSubmitCreate = (e) => {
    e.preventDefault();
    if (!groupId) return;
    createMutation.mutate(formData);
  };

  const handleSubmitLink = (e) => {
    e.preventDefault();
    if (!selectedMemberId || !forceEmail) return;
    linkMutation.mutate({ memberId: selectedMemberId, email: forceEmail });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, profile_image: result.file_url });
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bienvenido a GoHub Ventures</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="create" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Nuevo Perfil
            </TabsTrigger>
            <TabsTrigger value="link" className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Vincular Existente
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <form onSubmit={handleSubmitCreate} className="space-y-4">
              {otherGroupProfile && (
                 <div className="p-4 bg-indigo-50 text-indigo-700 rounded-lg text-sm mb-4 flex flex-col gap-2">
                    <p>
                      ¡Hola <strong>{otherGroupProfile.name}</strong>! Hemos encontrado tu perfil en otro grupo.
                    </p>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      className="self-start bg-indigo-200 hover:bg-indigo-300 text-indigo-800 border-none"
                      onClick={() => {
                          setFormData({
                              name: otherGroupProfile.name,
                              email: forceEmail,
                              weekly_goal: otherGroupProfile.weekly_goal || 300,
                              avatar_color: otherGroupProfile.avatar_color || "blue"
                          });
                      }}
                      type="button"
                    >
                      Usar mis datos de perfil existente
                    </Button>
                 </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Juan Pérez"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="juan@empresa.com"
                  required
                  disabled={!!forceEmail}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal">Objetivo semanal (puntos)</Label>
                <Input
                  id="goal"
                  type="number"
                  value={formData.weekly_goal}
                  onChange={(e) => setFormData({...formData, weekly_goal: parseInt(e.target.value)})}
                  min="1"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Foto de perfil</Label>
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  {formData.profile_image ? (
                    <div className="relative flex-shrink-0">
                      <img 
                        src={formData.profile_image} 
                        alt="Preview" 
                        className="w-24 h-24 rounded-xl object-cover border-2 border-emerald-500 shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, profile_image: "" })}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className={`w-24 h-24 flex-shrink-0 bg-gradient-to-br from-${formData.avatar_color}-500 to-${formData.avatar_color}-600 rounded-xl flex items-center justify-center text-white font-bold text-3xl border-2 border-dashed border-gray-400 shadow-md`}>
                      {formData.name ? formData.name.charAt(0).toUpperCase() : "?"}
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    <label htmlFor="image-upload" className="block">
                      <div className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white border-2 border-gray-300 hover:border-emerald-500 rounded-lg cursor-pointer transition-all hover:shadow-md group">
                        <Upload className="w-5 h-5 text-gray-600 group-hover:text-emerald-600 transition-colors" />
                        <span className="font-semibold text-gray-700 group-hover:text-emerald-700 transition-colors">
                          {uploading ? "Subiendo..." : formData.profile_image ? "Cambiar foto" : "Subir foto"}
                        </span>
                      </div>
                    </label>
                    <p className="text-xs text-gray-500 text-center">
                      {formData.profile_image 
                        ? "Foto cargada correctamente ✓" 
                        : "JPG o PNG, máximo 5MB"}
                    </p>
                  </div>
                </div>
              </div>

              {!formData.profile_image && (
                <div className="space-y-2">
                  <Label>Color del avatar</Label>
                  <Select
                    value={formData.avatar_color}
                    onValueChange={(value) => setFormData({...formData, avatar_color: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {avatarColors.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          {color.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="bg-gray-900 hover:bg-gray-800">
                  {createMutation.isPending ? "Guardando..." : "Crear Perfil"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="link">
            <form onSubmit={handleSubmitLink} className="space-y-4">
              <div className="p-4 bg-blue-50 text-blue-700 rounded-lg text-sm mb-4">
                Si ya tienes un perfil creado en este grupo (creado por un administrador u otro usuario), selecciónalo aquí para vincularlo a tu cuenta actual: <strong>{forceEmail}</strong>
              </div>

              <div className="space-y-2">
                <Label>Selecciona tu perfil</Label>
                <Select
                  value={selectedMemberId}
                  onValueChange={setSelectedMemberId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Buscar por nombre..." />
                  </SelectTrigger>
                  <SelectContent>
                    {groupMembers.length === 0 ? (
                      <SelectItem value="none" disabled>No hay miembros disponibles</SelectItem>
                    ) : (
                      groupMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name} ({member.email})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={linkMutation.isPending || !selectedMemberId} 
                  className="bg-gray-900 hover:bg-gray-800"
                >
                  {linkMutation.isPending ? "Migrando datos..." : "Vincular Perfil"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}