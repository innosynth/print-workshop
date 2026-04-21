import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, ShoppingCart, Package, BookOpen,
  Warehouse, Tag, BarChart2, Settings, Building2, Gauge
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";

import { useAuth } from "@/lib/auth-context";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Contacts", url: "/contacts", icon: Users },
  { title: "Sales", url: "/sales", icon: ShoppingCart },
  { title: "Purchase", url: "/purchase", icon: Package },
  { title: "Accounting", url: "/accounting", icon: BookOpen },
  { title: "Inventory", url: "/inventory", icon: Warehouse },
  { title: "Products", url: "/products", icon: Tag },
  { title: "Meter Readings", url: "/meter-readings", icon: Gauge },
  { title: "Reports", url: "/reports", icon: BarChart2 },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { hasPermission } = useAuth();

  const filteredNavItems = navItems.filter(item => {
    if (item.title === "Meter Readings") return true; // Always visible as requested
    return hasPermission(item.title, 'view');
  });

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="bg-sidebar border-b border-sidebar-border px-4 py-3">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-sidebar-primary-foreground leading-tight">Print Workshop</p>
              <p className="text-[0.625rem] text-sidebar-foreground/70 leading-tight">Coimbatore</p>
            </div>
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground mx-auto">
            <Building2 className="h-4 w-4" />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-[0.625rem] uppercase tracking-wider px-4 pt-4 pb-1">
              Main Menu
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent className="px-2 pt-2">
            <SidebarMenu>
              {filteredNavItems.map((item) => {
                const isActive = item.url === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors
                          ${isActive
                            ? "bg-sidebar-primary/20 text-sidebar-primary font-semibold"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          }`}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
