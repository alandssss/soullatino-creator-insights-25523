import { useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  AlertTriangle,
  Swords,
  Trophy,
  Users,
  UserPlus,
  Settings,
  BarChart3,
} from 'lucide-react';
import logo from '@/assets/logo-optimized.webp';

interface SidebarNavItem {
  name: string;
  path: string;
  icon: any;
  roles: string[];
}

const sidebarNav: SidebarNavItem[] = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'viewer', 'supervisor', 'reclutador'] },
  { name: 'Alertas', path: '/alertas', icon: AlertTriangle, roles: ['admin', 'manager', 'viewer'] },
  { name: 'Batallas', path: '/batallas', icon: Swords, roles: ['admin', 'manager', 'supervisor'] },
  { name: 'Rankings', path: '/rankings', icon: Trophy, roles: ['admin', 'manager', 'viewer', 'supervisor'] },
  { name: 'Supervisión', path: '/supervision', icon: Users, roles: ['admin', 'manager', 'supervisor', 'reclutador'] },
  { name: 'Reclutamiento', path: '/reclutamiento', icon: UserPlus, roles: ['admin', 'manager', 'reclutador'] },
  { name: 'Admin', path: '/admin', icon: Settings, roles: ['admin'] },
  { name: 'IA Stats', path: '/ia-effectiveness', icon: BarChart3, roles: ['admin', 'manager'] },
];

interface AppSidebarProps {
  userRole: string | null;
}

export function AppSidebar({ userRole }: AppSidebarProps) {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const filteredNav = sidebarNav.filter(item => 
    userRole && item.roles.includes(userRole)
  );

  return (
    <div className="hidden md:flex md:w-64 flex-col border-r border-white/10 bg-slate-950/80 backdrop-blur-2xl text-white">
      {/* Logo/Header */}
      <div className="flex items-center gap-3 p-6 border-b border-white/10">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
          <img 
            src={logo} 
            alt="Soullatino" 
            className="relative h-10 w-10 object-contain" 
          />
        </div>
        <div>
          <span className="text-xl font-bold text-white block">Soullatino</span>
          <span className="text-xs text-slate-400">Panel de Control</span>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2" aria-label="Navegación principal">
        {filteredNav.map((item) => (
          <Button
            key={item.name}
            asChild
            variant="ghost"
            className={cn(
              'w-full justify-start text-slate-200 hover:text-white transition-all',
              isActive(item.path)
                ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20'
                : 'hover:bg-white/10'
            )}
          >
            <Link to={item.path}>
              <item.icon className="mr-3 h-4 w-4" />
              {item.name}
            </Link>
          </Button>
        ))}
      </nav>
    </div>
  );
}
