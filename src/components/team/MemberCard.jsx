import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Calendar, Trash2, Dumbbell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const avatarColors = {
  blue: "from-blue-500 to-blue-600",
  green: "from-green-500 to-green-600",
  purple: "from-purple-500 to-purple-600",
  orange: "from-orange-500 to-orange-600",
  pink: "from-pink-500 to-pink-600",
  indigo: "from-indigo-500 to-indigo-600",
  red: "from-red-500 to-red-600",
  teal: "from-teal-500 to-teal-600"
};

export default function MemberCard({ member, onDelete }) {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const isCurrentUser = user?.email === member.email;

  return (
    <div className="backdrop-blur-xl bg-white/80 rounded-2xl border border-gray-200/50 shadow-lg p-6 hover:shadow-xl transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {member.profile_image ? (
            <img 
              src={member.profile_image} 
              alt={member.name}
              className="w-14 h-14 rounded-xl object-cover shadow-lg"
            />
          ) : (
            <div className={`w-14 h-14 bg-gradient-to-br ${avatarColors[member.avatar_color]} rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
              {member.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{member.name}</h3>
            <p className="text-sm text-gray-500">{member.email}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Objetivo semanal:</span>
          <span className="font-bold text-gray-900">{member.weekly_goal} pts</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Link to={`${createPageUrl("MemberCalendar")}?email=${member.email}`} className="flex-1">
          <Button variant="outline" className="w-full">
            <Calendar className="w-4 h-4 mr-2" />
            Ver Calendario
          </Button>
        </Link>
        {isCurrentUser && (
          <Link to={createPageUrl("Workouts")} className="flex-1">
            <Button variant="outline" className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50">
              <Dumbbell className="w-4 h-4 mr-2" />
              Mis Rutinas
            </Button>
          </Link>
        )}
        
        {isCurrentUser && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 mt-2 w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar Perfil
          </Button>
        )}
      </div>
    </div>
  );
}