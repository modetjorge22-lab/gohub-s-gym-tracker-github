import React from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProfileSettings() {
  const queryClient = useQueryClient();
  const inputRef = React.useRef(null);

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: members = [] } = useQuery({
    queryKey: ["team-members"],
    queryFn: () => base44.entities.TeamMember.list(),
  });

  const groupId = sessionStorage.getItem("base44_group_id");
  const myMember = members.find((m) => m.group_id === groupId && m.email === user?.email);

  const updatePhoto = useMutation({
    mutationFn: async (file) => {
      const upload = await base44.integrations.Core.UploadFile({ file });
      return base44.entities.TeamMember.update(myMember.id, { profile_image: upload.file_url });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team-members"] }),
  });

  const handleLogout = () => {
    sessionStorage.removeItem("base44_group_id");
    sessionStorage.removeItem("base44_group_name");
    localStorage.removeItem("base44_last_group_id");
    localStorage.removeItem("base44_last_group_name");
    localStorage.removeItem("base44_last_group_password");
    base44.auth.logout(createPageUrl("Landing"));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 text-white space-y-4">
      <h2 className="text-2xl font-bold">Perfil</h2>

      <Card className="bg-[#11131a]/80 border border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Mi cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-white/70">{user?.full_name} · {user?.email}</p>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && myMember) updatePhoto.mutate(file);
            }}
          />

          <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={!myMember || updatePhoto.isPending}>
            {updatePhoto.isPending ? "Subiendo foto..." : "Cambiar foto de perfil"}
          </Button>

          <Button variant="destructive" onClick={handleLogout}>Cerrar sesión</Button>
        </CardContent>
      </Card>
    </div>
  );
}