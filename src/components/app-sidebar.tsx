import { Home, Users, Trophy, BarChart3, Settings, ChevronRight } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

interface MenuItem {
  icon: any;
  label: string;
  path: string;
  roles: string[];
  children?: { label: string; path: string }[];
}

interface AppSidebarProps {
  userRole: string | null;
}

export function AppSidebar({ userRole }: AppSidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    campanas: true,
    analitica: true,
  });

  const menuItems: MenuItem[] = [
    {
      icon: Home,
      label: "Centro de Comando",
      path: "/",
      roles: ["admin", "manager", "viewer", "supervisor", "reclutador"],
    },
    {
      icon: Users,
      label: "Creadores",
      path: "/creadores",
      roles: ["admin", "manager", "supervisor", "reclutador"],
    },
    {
      icon: Trophy,
      label: "Campañas",
      path: "/campanas",
      roles: ["admin", "manager", "supervisor"],
      children: [
        { label: "Batallas", path: "/campanas/batallas" },
        { label: "Rankings", path: "/campanas/rankings" },
        { label: "Competencias", path: "/campanas/competencias" },
      ],
    },
    {
      icon: BarChart3,
      label: "Analítica",
      path: "/analitica",
      roles: ["admin", "manager", "viewer"],
      children: [
        { label: "Performance", path: "/analitica/performance" },
        { label: "IA Insights", path: "/analitica/ia" },
      ],
    },
    {
      icon: Settings,
      label: "Admin",
      path: "/admin",
      roles: ["admin"],
    },
  ];

  const filteredMenuItems = menuItems.filter(
    (item) => userRole && item.roles.includes(userRole)
  );

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Sidebar
      className={`border-r border-border bg-[hsl(220,15%,11%)] ${
        state === "collapsed" ? "w-16" : "w-64"
      }`}
      collapsible="icon"
    >
      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground px-3 mb-2">
            {state !== "collapsed" && "NAVEGACIÓN"}
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                const hasChildren = item.children && item.children.length > 0;
                const groupKey = item.path.slice(1); // Quitar el /

                if (hasChildren) {
                  return (
                    <Collapsible
                      key={item.path}
                      open={openGroups[groupKey]}
                      onOpenChange={() => toggleGroup(groupKey)}
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            className={`w-full justify-start gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                              isActive(item.path)
                                ? "bg-accent/10 text-accent-foreground font-medium"
                                : "text-muted-foreground hover:bg-accent/5 hover:text-foreground"
                            }`}
                          >
                            <Icon className="h-4 w-4 flex-shrink-0" />
                            {state !== "collapsed" && (
                              <>
                                <span className="flex-1 text-left">{item.label}</span>
                                <ChevronRight
                                  className={`h-4 w-4 transition-transform ${
                                    openGroups[groupKey] ? "rotate-90" : ""
                                  }`}
                                />
                              </>
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>

                        {state !== "collapsed" && (
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.children!.map((child) => (
                                <SidebarMenuSubItem key={child.path}>
                                  <SidebarMenuSubButton asChild>
                                    <NavLink
                                      to={child.path}
                                      className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-2 pl-11 rounded-lg transition-colors ${
                                          isActive
                                            ? "bg-accent/10 text-accent-foreground font-medium"
                                            : "text-muted-foreground hover:bg-accent/5 hover:text-foreground"
                                        }`
                                      }
                                    >
                                      {child.label}
                                    </NavLink>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        )}
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.path}
                        end={item.path === "/"}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                            isActive
                              ? "bg-accent/10 text-accent-foreground font-medium"
                              : "text-muted-foreground hover:bg-accent/5 hover:text-foreground"
                          }`
                        }
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        {state !== "collapsed" && <span>{item.label}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Trigger en la parte inferior del sidebar */}
      <div className="p-4 border-t border-border">
        <SidebarTrigger className="w-full" />
      </div>
    </Sidebar>
  );
}
