import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { motion } from "framer-motion";

export default function PadelWinRate({ activities, members }) {
  // Calcular win rate de cada miembro
  const padelStats = members.map((member, index) => {
    const padelActivities = activities.filter(a => 
      a.user_email === member.email && 
      a.activity_type === 'padel' &&
      a.match_result
    );
    
    const wins = padelActivities.filter(a => a.match_result === 'win').length;
    const total = padelActivities.length;
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(0) : 0;
    
    return {
      ...member,
      wins,
      total,
      winRate: parseFloat(winRate)
    };
  }).sort((a, b) => b.winRate - a.winRate);

  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-4">Win Rate en Pádel</h3>
      <div className="grid md:grid-cols-3 gap-4">
        {padelStats.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="backdrop-blur-xl bg-white/80 border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">{member.name}</h4>
                    <p className="text-xs text-gray-600">
                      {member.wins} victorias / {member.total} partidos
                    </p>
                  </div>
                  {index === 0 && member.total > 0 && (
                    <Trophy className="w-6 h-6 text-yellow-500" />
                  )}
                </div>
                
                <div className="relative">
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${member.winRate}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 + 0.2 }}
                      className={`h-full rounded-full ${
                        member.winRate >= 70 ? "bg-green-500" :
                        member.winRate >= 50 ? "bg-yellow-500" :
                        "bg-red-500"
                      }`}
                    />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 text-center">
                    {member.winRate}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}