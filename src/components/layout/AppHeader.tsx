import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Brain, LogOut, User, Shield, Settings, Home, ClipboardList, BookOpen, MessageCircle, TrendingUp, Bell, Sun, Moon, Target, Users, Library } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/community', label: 'Community', icon: Users },
  { href: '/journal', label: 'Journal', icon: BookOpen },
  { href: '/habits', label: 'Habits', icon: Target },
  { href: '/chat', label: 'AI Chat', icon: MessageCircle },
  { href: '/trends', label: 'Trends', icon: TrendingUp },
  { href: '/assessments', label: 'Tests', icon: ClipboardList },
  { href: '/resources', label: 'Resources', icon: Library },
];

export default function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      const { data: adminData } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      const { data: counselorData } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'counselor'
      });
      setIsAdmin(adminData === true || counselorData === true);
    };
    checkAdmin();
  }, [user]);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user) return;
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);
      setUnreadCount(count || 0);
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <header className="glass-panel sticky top-0 z-50 rounded-b-3xl border-t-0 border-x-0 transition-all duration-300">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/dashboard')}>
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center transition-transform group-hover:scale-105 border border-primary/20">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xl font-semibold font-display tracking-tight text-foreground">MindMate</span>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            <Button
              key={item.href}
              variant={location.pathname === item.href ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate(item.href)}
              className={`gap-2 rounded-full px-4 ${location.pathname === item.href ? 'bg-primary text-primary-foreground shadow-sm hover-lift' : 'hover:bg-primary/10 text-muted-foreground hover:text-foreground'}`}
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden lg:inline font-medium">{item.label}</span>
            </Button>
          ))}
        </nav>

        {/* User Menu */}
        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-9 w-9 rounded-full hover:bg-secondary/10"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Notification Bell */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/notifications')}
            className="relative h-9 w-9 rounded-full hover:bg-secondary/10"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute 0 right-0 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center border-2 border-background">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => navigate('/admin')} className="hidden sm:flex rounded-full">
              <Shield className="h-4 w-4 mr-2" />
              Admin
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 rounded-full hover:bg-secondary/10 pl-2">
                <div className="bg-primary/10 p-1.5 rounded-full">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="hidden sm:inline font-medium pr-1">{userName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
              <DropdownMenuItem onClick={() => navigate('/notifications')} className="rounded-xl cursor-pointer">
                <Bell className="h-4 w-4 mr-2 text-muted-foreground" />
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-auto text-xs bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5">
                    {unreadCount}
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/profile')} className="rounded-xl cursor-pointer">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')} className="rounded-xl cursor-pointer">
                <Settings className="h-4 w-4 mr-2 text-muted-foreground" />
                Settings
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem onClick={() => navigate('/admin')} className="sm:hidden rounded-xl cursor-pointer">
                  <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
                  Admin Panel
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive focus:bg-destructive/10 rounded-xl cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-border/40 bg-card/40 backdrop-blur-md overflow-x-auto rounded-b-3xl">
        <nav className="container flex items-center gap-2 py-3 px-4">
          {navItems.map(item => (
            <Button
              key={item.href}
              variant={location.pathname === item.href ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate(item.href)}
              className={`flex-shrink-0 rounded-full h-10 w-10 p-0 ${location.pathname === item.href ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'}`}
            >
              <item.icon className="h-4 w-4" />
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}
