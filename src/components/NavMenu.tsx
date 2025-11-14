import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { LogOut, User, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';

interface NavMenuProps {
  userEmail?: string;
  onSignOut: () => void;
}

const NavMenu = ({ userEmail, onSignOut }: NavMenuProps) => {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white font-semibold text-xs">
                {userEmail?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline text-sm">{userEmail}</span>
            <Menu className="h-4 w-4 sm:hidden" />
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="w-64 p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <span className="text-sm text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>
                
                <Link
                  to="/profile"
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span className="text-sm">Edit Profile</span>
                </Link>
                
                <button
                  onClick={onSignOut}
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors w-full text-left text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm">Sign Out</span>
                </button>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default NavMenu;
