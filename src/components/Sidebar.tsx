import {
  Home,
  Search,
  MessageSquare,
  Users,
  Calendar,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ListPlus,
  LayoutDashboard,
  MoreHorizontal,
  LogOut
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/api/store/authStore";
import { useMemo } from "react";

interface SidebarProps {
  isExpanded: boolean;
  onToggle: (expanded: boolean) => void;
  activePage?: string;
}

export const Sidebar = ({ isExpanded, onToggle, activePage = 'campaigns' }: SidebarProps) => {
  const sidebarItems = [
    // { icon: LayoutDashboard, path: "/", name: "Dashboard", id: "dashboard" },
    { icon: MessageSquare, path: "/inbox", name: "Unibox", id: "inbox" },
    { icon: ListPlus, path: "/allcampaigns", name: "Campaigns", id: "campaigns" },
    { icon: Users, path: "/accounts", name: "Accounts", id: "accounts" },

    // { icon: Calendar, path: "/calendar", name: "Calendar", id: "calendar" },
    // { icon: BarChart3, path: "/analytics", name: "Analytics", id: "analytics" },
    // { icon: Settings, path: "/settings", name: "Settings", id: "settings" },
  ];

  // Get user data from auth store
  const { user, reset: resetAuthState } = useAuthStore();
  
  console.log("Sidebar user data:", user);
  // Generate user display data with fallbacks
  const userData = useMemo(() => {
    // If no user data, show placeholder
    if (!user) {
      return {
        name: "Guest User",
        image: null,
        initials: "GU",
        role: "Guest"
      };
    }
    
    // Extract name (could be company name or user's name)
    const displayName = user.companyName || 
                       `${user.name || ''} ${user.lastName || ''}`.trim() || 
                       user.email?.split('@')[0] || 
                       "User";
    
    // Generate initials from name
    const initials = displayName
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    
    return {
      name: displayName,
      image: user.profilePicture || user.avatar || user.profileImageUrl || null,
      initials: initials || "U",
      role: user.username || "User"
    };
  }, [user]);

  const queryClient = useQueryClient();

  const handleLogout = () => {
    resetAuthState();
    queryClient.clear();
  };

  // Fix the sidebar structure for better collapsed appearance
  return (
    <div
      className={`${isExpanded ? 'w-64' : 'w-16'} flex flex-col py-6 transition-all duration-300 h-full`}
      style={{ backgroundColor: '#28244c' }}
    >
      {/* Header with toggle */}
      <div className={`flex items-center ${isExpanded ? 'justify-between px-4' : 'justify-center'} mb-8`}>
        {/* Logo */}
        <div className={`flex items-center ${isExpanded ? 'space-x-3' : ''}`}>
          <img
            src="/image.png"
            alt="OutFlo"
            className="w-8 h-8 rounded-full object-cover"
          />
          {isExpanded && (
            <div className="text-white font-bold text-xl">OutFlo</div>
          )}
        </div>

        {/* Toggle Button - Only show in expanded mode */}
        {isExpanded && (
          <button
            onClick={() => onToggle(!isExpanded)}
            className="text-white/60 hover:text-white p-1 rounded-md hover:bg-white/10 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex flex-col space-y-2 px-2">
        {!isExpanded && (
          <button
            onClick={() => onToggle(true)}
            className="flex justify-center items-center py-3 text-white/60 hover:text-white hover:bg-white/10 rounded-xl mb-2"
          >
            <ChevronRight size={20} />
          </button>
        )}
        
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <Link
              to={item.path}
              key={item.id}
              className={`group relative flex items-center ${
                isExpanded ? 'px-4 justify-start' : 'justify-center px-0'
              } py-3 rounded-xl transition-all duration-300 hover:bg-white/10 ${
                isActive
                  ? 'bg-white/20 text-white shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
              title={!isExpanded ? item.name : undefined}
            >
              <Icon size={20} className="transition-transform group-hover:scale-110 flex-shrink-0" />
              {isExpanded && (
                <span className="ml-3 font-medium">{item.name}</span>
              )}
              {isActive && (
                <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-full"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Profile section */}
      <div className="mt-auto px-2">
        <div className={`flex items-center ${
          isExpanded ? 'justify-between px-3' : 'justify-center'
        } p-3 bg-white/10 rounded-xl transition-all duration-300 text-white`}>
          <Avatar className="w-8 h-8 border-2 border-purple-400">
            <AvatarImage src={userData.image || ""} alt={userData.name} />
            <AvatarFallback className="bg-purple-600 text-white text-xs">
              {userData.initials}
            </AvatarFallback>
          </Avatar>
          
          {isExpanded && (
            <>
              <div className="ml-3 truncate flex-1">
                <p className="text-sm font-medium truncate">{userData.name}</p>
                <p className="text-xs text-white/70">{userData.role}</p>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 rounded-full hover:bg-white/20 focus:outline-none">
                    <MoreHorizontal size={16} className="text-white/70" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48" sideOffset={5}>
                  <DropdownMenuItem
                    className="cursor-pointer flex items-center text-red-600"
                    onClick={handleLogout}
                  >
                    <LogOut size={14} className="mr-2" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          
          {/* Only show dropdown trigger when collapsed */}
          {!isExpanded && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="absolute right-1 top-1 p-1 rounded-full hover:bg-white/20 focus:outline-none">
                  <MoreHorizontal size={12} className="text-white/70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48" sideOffset={5}>
                <DropdownMenuItem disabled className="opacity-70">
                  {userData.name}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer flex items-center text-red-600"
                  onClick={handleLogout}
                >
                  <LogOut size={14} className="mr-2" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
};
