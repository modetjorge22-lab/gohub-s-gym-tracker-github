import React from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Users, ChevronLeft, ChevronRight, Activity, Newspaper, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, addMonths, subMonths, startOfMonth, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";

import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import AddMemberDialog from "@/components/team/AddMemberDialog";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreateProfile, setShowCreateProfile] = React.useState(false);
  
  const groupId = sessionStorage.getItem('base44_group_id');
  const groupName = sessionStorage.getItem('base44_group_name') || "Olympia";

  React.useEffect(() => {
    const isLanding = location.pathname.includes("Landing");

    if (!groupId) {
      const lastGroupId = localStorage.getItem('base44_last_group_id');
      const lastGroupName = localStorage.getItem('base44_last_group_name');

      if (lastGroupId) {
        sessionStorage.setItem('base44_group_id', lastGroupId);
        if (lastGroupName) {
          sessionStorage.setItem('base44_group_name', lastGroupName);
        }
        return;
      }
    }

    if (!groupId && !isLanding) {
      navigate(createPageUrl("Landing"));
    }
  }, [groupId, location, navigate]);
  
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: members } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => base44.entities.TeamMember.list(),
  });

  React.useEffect(() => {
    if (user && members && groupId) {
      const groupMembers = members.filter(m => m.group_id === groupId);
      const hasProfile = groupMembers.some(m => m.email === user.email);
      if (!hasProfile && !location.pathname.includes("Landing")) {
        setShowCreateProfile(true);
      }
    }
  }, [user, members, groupId, location]);

  const currentDateParam = searchParams.get('date');
  const currentDate = currentDateParam ? new Date(currentDateParam) : new Date();

  const handlePrevMonth = () => {
    const newDate = subMonths(currentDate, 1);
    setSearchParams(params => {
      params.set('date', format(newDate, 'yyyy-MM-dd'));
      return params;
    });
  };

  const handleNextMonth = () => {
    const newDate = addMonths(currentDate, 1);
    setSearchParams(params => {
      params.set('date', format(newDate, 'yyyy-MM-dd'));
      return params;
    });
  };

  const navItems = [
    { name: "Feed", path: createPageUrl("Feed"), icon: Newspaper },
    { name: "Mi actividad", path: createPageUrl("MyActivity"), icon: User },
    { name: "Grupos", path: createPageUrl("Groups"), icon: Users },
  ];

  const isLanding = location.pathname.includes("Landing");

  return (
    <div className="min-h-screen bg-transparent text-gray-100">
      {!isLanding && (
      <header className="fixed top-2 md:top-4 left-1/2 -translate-x-1/2 z-50 w-[98%] md:w-[95%] max-w-7xl">
        <div className="backdrop-blur-xl bg-[#11131a]/65 border border-white/10 rounded-full shadow-xl px-3 md:px-6 py-2 md:py-3 relative">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link 
              to={createPageUrl("Landing")}
              onClick={() => {
                sessionStorage.removeItem('base44_group_id');
                sessionStorage.removeItem('base44_group_name');
              }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-gray-900 to-gray-700 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                <span className="text-white font-bold text-sm md:text-base">O</span>
              </div>
              <span className="hidden sm:block text-base md:text-lg font-bold text-white">{groupName}</span>
            </Link>

            {/* Month Navigator - Centered */}
            <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-2 py-1 border border-gray-200/50 shadow-sm">
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={handlePrevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-semibold text-gray-800 w-32 text-center capitalize">
                {format(currentDate, 'MMMM yyyy', { locale: es })}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 rounded-full" 
                onClick={handleNextMonth}
                disabled={isWithinInterval(new Date(), { start: startOfMonth(currentDate), end: addMonths(startOfMonth(currentDate), 1) })}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={`${item.path}?${searchParams.toString()}`}
                    className={`flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 md:py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-gray-900 to-gray-700 text-white shadow-lg scale-105"
                        : "text-gray-300 hover:bg-white/20 hover:scale-105"
                    }`}
                  >
                    <item.icon className="w-4 h-4" strokeWidth={2.5} />
                    <span className="hidden md:inline">{item.name}</span>
                  </Link>
                );
              })}

              {/* Extra links as icons */}
              <Link
                to={createPageUrl("ProfileSettings")}
                className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
                  location.pathname.includes("ProfileSettings")
                    ? "bg-gradient-to-r from-gray-900 to-gray-700 text-white shadow-lg"
                    : "text-gray-300 hover:bg-white/20"
                }`}
                title="Perfil"
              >
                <Settings className="w-4 h-4" strokeWidth={2.5} />
              </Link>
            </nav>
          </div>
        </div>
      </header>
      )}

      {/* Create Profile Dialog */}
      <AddMemberDialog 
        open={showCreateProfile} 
        onOpenChange={setShowCreateProfile}
        forceEmail={user?.email}
        forceName={user?.full_name}
        groupId={groupId}
      />

      {/* Main Content */}
      <main className={!isLanding ? "pt-16 md:pt-24 pb-8 min-h-screen" : "min-h-screen"}>
        {children}
      </main>
    </div>
  );
}