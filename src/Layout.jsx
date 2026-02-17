import React from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Users, ChevronLeft, ChevronRight, Activity, Newspaper, User, MoreHorizontal, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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

  const isNextMonthDisabled = isWithinInterval(new Date(), {
    start: startOfMonth(currentDate),
    end: addMonths(startOfMonth(currentDate), 1)
  });

  const navItems = [
    { name: "Feed", path: createPageUrl("Feed"), icon: Newspaper },
    { name: "Actividad", path: createPageUrl("MyActivity"), icon: User },
    { name: "Grupos", path: createPageUrl("Groups"), icon: Users },
    { name: "Más", path: null, icon: MoreHorizontal, isMenu: true },
  ];

  const isLanding = location.pathname.includes("Landing");

  return (
    <div className="min-h-screen bg-transparent text-gray-100">
      {!isLanding && (
        <>
          {/* ── DESKTOP header (unchanged) ── */}
          <header className="hidden md:block fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl">
            <div className="backdrop-blur-xl bg-[#11131a]/65 border border-white/10 rounded-full shadow-xl px-8 py-4 relative">
              <div className="flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-3">
                  <Link
                    to={createPageUrl("Landing")}
                    onClick={() => {
                      sessionStorage.removeItem('base44_group_id');
                      sessionStorage.removeItem('base44_group_name');
                    }}
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

                {/* Month Navigator - Desktop centered */}
                <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-2 py-1 border border-gray-200/50 shadow-sm">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handlePrevMonth}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-semibold text-gray-800 w-32 text-center capitalize">
                    {format(currentDate, 'MMMM yyyy', { locale: es })}
                  </span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handleNextMonth} disabled={isNextMonthDisabled}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Nav + menu */}
                <div className="flex items-center gap-2">
                  <nav className="flex items-center gap-3">
                    {navItems.map((item) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <Link
                          key={item.name}
                          to={`${item.path}?${searchParams.toString()}`}
                          className={`flex items-center gap-2 px-4 lg:px-8 py-2 lg:py-3 rounded-full font-semibold transition-all duration-300 ${
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
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </header>

          {/* ── MOBILE top bar: logo + mes ── */}
          <header className="md:hidden fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#11131a]/80 border-b border-white/10 px-4 py-2">
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
                <div className="w-8 h-8 bg-gradient-to-br from-gray-900 to-gray-700 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">O</span>
                </div>
              </Link>

              {/* Month selector - mobile */}
              <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-1">
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-white" onClick={handlePrevMonth}>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <span className="text-xs font-semibold text-white w-24 text-center capitalize">
                  {format(currentDate, 'MMM yyyy', { locale: es })}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-white" onClick={handleNextMonth} disabled={isNextMonthDisabled}>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Spacer to center month selector */}
              <div className="w-8" />
            </div>
          </header>

          {/* ── MOBILE bottom tab bar ── */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#11131a]/90 border-t border-white/10">
            <div className="flex items-center justify-around px-2 py-2 pb-[env(safe-area-inset-bottom)]">
              {navItems.map((item) => {
                if (item.isMenu) {
                  return (
                    <DropdownMenu key={item.name}>
                      <DropdownMenuTrigger asChild>
                        <button className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-2xl text-gray-500 transition-all duration-200">
                          <div className="p-1.5 rounded-xl">
                            <item.icon className="w-5 h-5" strokeWidth={2} />
                          </div>
                          <span className="text-[10px] font-medium">{item.name}</span>
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
                  );
                }
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={`${item.path}?${searchParams.toString()}`}
                    className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-2xl transition-all duration-200 ${
                      isActive ? "text-white" : "text-gray-500"
                    }`}
                  >
                    <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? "bg-white/15" : ""}`}>
                      <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span className="text-[10px] font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </>
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
      <main className={!isLanding ? "pt-14 md:pt-28 pb-20 md:pb-8 min-h-screen" : "min-h-screen"}>
        {children}
      </main>
    </div>
  );
}