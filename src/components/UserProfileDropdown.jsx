import React from 'react';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const UserProfileDropdown = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const getInitials = (email) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
    toast({
      title: "წარმატებით გახვედით სისტემიდან",
      description: "მოგვიანებით გნახავთ!",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="მომხმარებლის მენიუ"
        >
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-semibold flex items-center justify-center text-sm shadow-md">
            {getInitials(user?.email)}
          </div>
          <span className="text-sm font-medium text-slate-700 hidden md:block max-w-[120px] truncate">
            {user?.email?.split('@')[0] || 'მომხმარებელი'}
          </span>
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56" align="end">
        <div className="p-2">
          <div className="flex items-center gap-3 p-2 rounded-md bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm text-white font-bold flex items-center justify-center text-xs">
              {getInitials(user?.email)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{user?.email?.split('@')[0]}</p>
              <p className="text-xs opacity-90 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>პროფილი</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>პარამეტრები</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>გასვლა</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfileDropdown;