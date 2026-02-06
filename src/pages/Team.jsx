import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import MemberCard from "../components/team/MemberCard";
import AddMemberDialog from "../components/team/AddMemberDialog";

export default function Team() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: allMembers, isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => base44.entities.TeamMember.list(),
    initialData: [],
  });

  const groupId = sessionStorage.getItem('base44_group_id');
  const members = allMembers.filter(m => m.group_id === groupId);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TeamMember.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Miembros del Equipo</h2>
          <p className="text-gray-600">{members.length} miembros activos</p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-gray-900 hover:bg-gray-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          Añadir Miembro
        </Button>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-xl text-gray-600 mb-4">No hay miembros aún</p>
          <Button onClick={() => setShowAddDialog(true)}>
            Añadir Primer Miembro
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onDelete={() => deleteMutation.mutate(member.id)}
            />
          ))}
        </div>
      )}

      <AddMemberDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        groupId={groupId}
      />
    </div>
  );
}