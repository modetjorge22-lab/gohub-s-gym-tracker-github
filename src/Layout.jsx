import React from "react";
import { Link, useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Users, Activity, Newspaper, User, MoreHorizontal, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format, addMonths, subMonths, startOfMonth, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
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
        if (lastGroupName) sessionStorage.setItem('base44_group_name', lastGroupName);
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

  const { data: members, isLoading: loadingMembers } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => base44.entities.TeamMember.list(),
  });

  React.useEffect(() => {
    if (user && members && !loadingMembers && groupId && !location.pathname.includes("Landing")) {
      const groupMembers = members.filter(m => m.group_id === groupId);
      const hasProfile = groupMembers.some(m => m.email === user.email);
      setShowCreateProfile(!hasProfile);
    }
  }, [user, members, loadingMembers, groupId, location]);

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

  const isNextMonthDisabled = isWithinInterval(new Date(), {
    start: startOfMonth(currentDate),
    end: addMonths(startOfMonth(currentDate), 1)
  });

  const navItems = [
    { name: "Feed", path: createPageUrl("Feed"), icon: Newspaper },
    { name: "Mi actividad", path: createPageUrl("MyActivity"), icon: User },
    { name: "Grupos", path: createPageUrl("Groups"), icon: Users },
    { name: "Perfil", path: createPageUrl("ProfileSettings"), icon: User },
    { name: "Integraciones", path: createPageUrl("IntegrationsSettings"), icon: Activity },
  ];

  const isLanding = location.pathname.includes("Landing");

  return (
    <div className="min-h-screen bg-transparent text-gray-100">

      {/* ── DESKTOP HEADER (pill flotante, oculto en móvil) ── */}
      {!isLanding && (
        <header className="hidden md:block fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl">
          <div className="backdrop-blur-xl bg-[#11131a]/65 border border-white/10 rounded-full shadow-xl px-8 py-4 relative">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-4">
                <Link
                  to={createPageUrl("Landing")}
                  onClick={() => {
                    sessionStorage.removeItem('base44_group_id');
                    sessionStorage.removeItem('base44_group_name');
                  }}
                  className="flex items-center gap-2"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform">
                    <span className="text-white font-bold text-xl">O</span>
                  </div>
                </Link>
                <div>
                  <h1 className="text-xl font-bold text-white">{groupName}</h1>
                  <p className="text-xs text-gray-300">Olympia</p>
                </div>
              </div>

              {/* Nav Pills */}
              <div className="flex items-center gap-3">
                <nav className="flex items-center gap-3">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.name}
                        to={`${item.path}?${searchParams.toString()}`}
                        className={`flex items-center gap-2 px-8 py-3 rounded-full font-semibold transition-all duration-300 ${
                          isActive
                            ? "bg-gradient-to-r from-gray-900 to-gray-700 text-white shadow-lg scale-105"
                            : "text-gray-300 hover:bg-white/20 hover:scale-105"
                        }`}
                      >
                        <item.icon className="w-5 h-5" strokeWidth={2.5} />
                        <span>{item.name}</span>
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
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* ── MOBILE TOP BAR (logo + selector de mes) ── */}
      {!isLanding && (
        <header className="md:hidden fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#11131a]/80 border-b border-white/10 px-4 py-2 flex items-center justify-between">
          {/* Logo */}
          <Link
            to={createPageUrl("Landing")}
            onClick={() => {
              sessionStorage.removeItem('base44_group_id');
              sessionStorage.removeItem('base44_group_name');
            }}
          >
            <div className="w-9 h-9 bg-gradient-to-br from-gray-900 to-gray-700 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-base">O</span>
            </div>
          </Link>

          {/* Month selector */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white" onClick={handlePrevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold text-white min-w-[110px] text-center capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-white disabled:opacity-30"
              onClick={handleNextMonth}
              disabled={isNextMonthDisabled}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Spacer */}
          <div className="w-9" />
        </header>
      )}

      {/* ── MOBILE BOTTOM TAB BAR ── */}
      {!isLanding && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#11131a]/90 border-t border-white/10 flex items-center justify-around px-2 py-2 safe-area-pb">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={`${item.path}?${searchParams.toString()}`}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                  isActive ? "text-white" : "text-white/40"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-white/40"}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[10px] font-medium ${isActive ? "text-white" : "text-white/40"}`}>{item.name}</span>
              </Link>
            );
          })}

          {/* Más (configuración) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-white/40">
                <MoreHorizontal className="w-5 h-5" strokeWidth={2} />
                <span className="text-[10px] font-medium">Más</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="bg-[#11131a] border border-white/10 text-white mb-2">
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
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
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
      <main className={!isLanding ? "pt-14 md:pt-28 pb-24 md:pb-8 min-h-screen" : "min-h-screen"}>
        {children}
      </main>
    </div>
  );
}