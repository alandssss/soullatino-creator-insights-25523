import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  AlertTriangle,
  Users,
  Trophy,
  Settings,
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: any;
  roles: string[];
}

const navItems: NavItem[] = [
  { name: 'Inicio', path: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'viewer', 'supervisor', 'reclutador'] },
  { name: 'Alertas', path: '/alertas', icon: AlertTriangle, roles: ['admin', 'manager', 'viewer'] },
  { name: 'Creadores', path: '/supervision', icon: Users, roles: ['admin', 'manager', 'supervisor', 'reclutador'] },
  { name: 'Rankings', path: '/rankings', icon: Trophy, roles: ['admin', 'manager', 'viewer', 'supervisor'] },
  { name: 'Más', path: '/admin', icon: Settings, roles: ['admin', 'manager'] },
];

interface BottomNavProps {
  userRole: string | null;
}

export function BottomNav({ userRole }: BottomNavProps) {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const filteredNav = navItems.filter(item => 
    userRole && item.roles.includes(userRole)
  );

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-white/10 bottom-nav-safe"
      style={{
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className="flex items-center justify-around px-2 pt-2">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 min-w-[64px] touch-target',
                active && [
                  'bg-gradient-to-r from-blue-500/20 to-indigo-500/20',
                  'text-white',
                ],
                !active && [
                  'text-slate-400 hover:text-white',
                  'hover:bg-white/5',
                ]
              )}
            >
              <div className={cn(
                'p-1.5 rounded-lg transition-all duration-300',
                active && 'bg-blue-500/20 scale-110',
                !active && 'bg-white/5'
              )}>
                <Icon className={cn(
                  'h-5 w-5',
                  active && 'text-blue-400'
                )} />
              </div>
              <span className={cn(
                'text-xs font-medium',
                active && 'text-white',
                !active && 'text-slate-400'
              )}>
                {item.name}
              </span>
              {active && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-500 rounded-t-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
