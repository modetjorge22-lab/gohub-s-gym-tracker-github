import React from "react";
import { Link, useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Users, ChevronLeft, ChevronRight, Activity, Newspaper, User, MoreHorizontal, Settings, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format, addMonths, subMonths, startOfMonth, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
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
  
  const { user, isAuthenticated } = useAuth();

  const { data: members } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => base44.entities.TeamMember.list(),
    enabled: !!user,
  });

  // Check if user has a profile in current group
  React.useEffect(() => {
    if (user && isAuthenticated && members && groupId) {
      // Filter members by group
      const groupMembers = members.filter(m => m.group_id === groupId);
      const hasProfile = groupMembers.some(m => m.email === user.email);
      
      // Only show dialog if not on landing page
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
      {/* Header con Liquid Glass - Ocultar en Landing */}
      {!isLanding && (
      <header className="fixed top-2 md:top-4 left-1/2 -translate-x-1/2 z-50 w-[98%] md:w-[95%] max-w-7xl">
        <div className="backdrop-blur-xl bg-[#11131a]/65 border border-white/10 rounded-full shadow-xl px-3 md:px-8 py-2 md:py-4 relative">
          <div className="flex items-center justify-between">
            {/* Logo y título */}
            <div className="flex items-center gap-2 md:gap-4">
              <Link 
                to={createPageUrl("Landing")}
                onClick={() => {
                  sessionStorage.removeItem('base44_group_id');
                  sessionStorage.removeItem('base44_group_name');
                }}
              >
                <div className="w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br from-gray-900 to-gray-700 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform">
                  <span className="text-white font-bold text-sm md:text-xl">O</span>
                </div>
              </Link>
              <div className="hidden sm:block">
                <h1 className="text-base md:text-xl font-bold text-white">
                  {groupName}
                </h1>
                <p className="text-xs text-gray-300 hidden md:block">Olympia</p>
              </div>
            </div>

            {/* Month Navigator - Centered - Hidden on mobile */}
            <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-2 py-1 border border-gray-200/50 shadow-sm">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handlePrevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-semibold text-gray-800 w-32 text-center capitalize">
                {format(currentDate, 'MMMM yyyy', { locale: es })}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full" 
                onClick={handleNextMonth}
                disabled={isWithinInterval(new Date(), { start: startOfMonth(currentDate), end: addMonths(startOfMonth(currentDate), 1) })}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Navigation Pills */}
            <div className="flex items-center gap-2">
              <nav className="flex items-center gap-1 md:gap-3">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={`${item.path}?${searchParams.toString()}`}
                      className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 lg:px-8 py-1.5 md:py-2 lg:py-3 rounded-full font-semibold transition-all duration-300 ${
                        isActive
                          ? "bg-gradient-to-r from-gray-900 to-gray-700 text-white shadow-lg scale-105"
                          : "text-gray-300 hover:bg-white/20 hover:scale-105"
                      }`}
                    >
                      <item.icon className="w-4 h-4 lg:w-5 lg:h-5" strokeWidth={2.5} />
                      <span className="hidden lg:inline">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-white/10">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#11131a] border border-white/10 text-white">
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to={createPageUrl("Settings")} className="flex items-center gap-2">
                      <Settings className="w-4 h-4" /> Configuración
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to={createPageUrl("ProfileSettings")} className="flex items-center gap-2">
                      <User className="w-4 h-4" /> Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to={createPageUrl("IntegrationsSettings")} className="flex items-center gap-2">
                      <Activity className="w-4 h-4" /> Integraciones
                    </Link>
                  </DropdownMenuItem>
                  {user ? (
                    <DropdownMenuItem
                      className="cursor-pointer text-red-400 hover:text-red-300"
                      onClick={() => {
                        sessionStorage.clear();
                        localStorage.removeItem('base44_last_group_id');
                        localStorage.removeItem('base44_last_group_name');
                        localStorage.removeItem('base44_last_group_password');
                        base44.auth.logout(createPageUrl("Landing"));
                      }}
                    >
                      <LogOut className="w-4 h-4" /> Cerrar sesión
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      className="cursor-pointer text-green-400 hover:text-green-300"
                      onClick={() => base44.auth.redirectToLogin()}
                    >
                      <LogIn className="w-4 h-4" /> Iniciar sesión
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
      <main className={!isLanding ? "pt-16 md:pt-28 pb-8 min-h-screen" : "min-h-screen"}>
        {children}
      </main>


    </div>
  );
}