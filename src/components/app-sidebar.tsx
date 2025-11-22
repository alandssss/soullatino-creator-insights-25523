import { useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Swords,
  BarChart3,
  Settings,
} from 'lucide-react';
import logo from '@/assets/logo-optimized.webp';

const sidebarNav = [
  { name: 'Home', path: '/', icon: LayoutDashboard },
  { name: 'Creadores', path: '/supervision', icon: Users },
  { name: 'Campañas', path: '/batallas', icon: Swords },
  { name: 'Analítica', path: '/ia-effectiveness', icon: BarChart3 },
  { name: 'Admin', path: '/admin', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

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
        <span className="text-xl font-bold text-white">
          Soullatino
        </span>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {sidebarNav.map((item) => (
          <Button
            key={item.name}
            asChild
            variant="ghost"
            className={cn(
              'w-full justify-start text-slate-200 hover:text-white transition-colors',
              isActive(item.path)
                ? 'bg-blue-600 text-white hover:bg-blue-500'
                : 'hover:bg-white/10'
            )}
          >
            <Link to={item.path}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.name}
            </Link>
          </Button>
        ))}
      </nav>
    </div>
  );
}
