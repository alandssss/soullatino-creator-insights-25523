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
    <div className="hidden md:flex md:w-64 flex-col border-r border-white/10 bg-slate-950/80 backdrop-blur-2xl text-white relative">
      {/* Gradient overlay sutil en el fondo */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Logo/Header */}
      <div className="relative flex items-center gap-3 p-6 border-b border-white/10">
        <div className="relative group">
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-lg opacity-30 group-hover:opacity-60 transition-opacity duration-500"></div>
          <img 
            src={logo} 
            alt="Soullatino" 
            className="relative h-10 w-10 object-contain" 
          />
        </div>
        <div>
          <span className="text-xl font-bold text-white block">Soullatino</span>
          <span className="text-xs text-slate-400">Analytics CRM</span>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="relative flex-1 p-4 space-y-2" aria-label="Navegación principal">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Button
              key={item.name}
              asChild
              variant="ghost"
              className={cn(
                'w-full justify-start relative overflow-hidden',
                'min-h-[48px] text-base',
                'touch-manipulation',
                'active:scale-95',
                'transition-all duration-200',
                active && [
                  'bg-gradient-to-r from-blue-500/20 to-indigo-500/20',
                  'border border-blue-500/30',
                  'text-white font-semibold',
                  'shadow-lg shadow-blue-500/20',
                ],
                !active && [
                  'text-slate-200 hover:text-white',
                  'hover:bg-white/10',
                  'border border-transparent hover:border-white/10',
                ]
              )}
            >
              <Link to={item.path} className="flex items-center gap-3 w-full">
                <div className={cn(
                  'p-2 rounded-lg transition-all duration-300',
                  active && 'bg-blue-500/20 shadow-lg shadow-blue-500/30',
                  !active && 'bg-white/5'
                )}>
                  <Icon className={cn(
                    'h-5 w-5 transition-transform duration-300',
                    active && 'scale-110'
                  )} />
                </div>
                <span className="flex-1">{item.name}</span>
                {active && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                )}
              </Link>
            </Button>
          );
        })}
      </nav>
    </div>
  );
}
