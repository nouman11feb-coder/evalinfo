import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { LogOut, User, Menu, Edit2, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
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
  chatTitle?: string;
  isEditingTitle?: boolean;
  tempTitle?: string;
  onStartEditTitle?: () => void;
  onSaveTitle?: () => void;
  onCancelEdit?: () => void;
  onTitleChange?: (value: string) => void;
  onTitleKeyPress?: (e: React.KeyboardEvent) => void;
  titleInputRef?: React.RefObject<HTMLInputElement>;
}

const NavMenu = ({ 
  userEmail, 
  onSignOut,
  chatTitle,
  isEditingTitle,
  tempTitle,
  onStartEditTitle,
  onSaveTitle,
  onCancelEdit,
  onTitleChange,
  onTitleKeyPress,
  titleInputRef
}: NavMenuProps) => {
  return (
    <div className="flex items-center gap-2">
      {/* Chat Title */}
      <div className="flex items-center gap-2">
        {isEditingTitle ? (
          <div className="flex items-center gap-2">
            <Input
              ref={titleInputRef}
              value={tempTitle}
              onChange={(e) => onTitleChange?.(e.target.value)}
              onKeyDown={onTitleKeyPress}
              onBlur={onCancelEdit}
              className="text-lg font-semibold bg-transparent border-0 px-0 py-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder="Chat name..."
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={onSaveTitle}
              className="h-6 w-6 p-0"
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancelEdit}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group">
            <h2 className="text-lg font-semibold text-foreground">
              {chatTitle || 'Chat'}
            </h2>
            <Button
              size="sm"
              variant="ghost"
              onClick={onStartEditTitle}
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* User Menu */}
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
    </div>
  );
};

export default NavMenu;
