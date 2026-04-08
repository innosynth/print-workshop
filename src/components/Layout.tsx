import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell, Search, User, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const today = format(new Date(), "yyyy-MM-dd");

  const { data: machinesList = [] } = useQuery({ 
    queryKey: ["machines"], 
    queryFn: () => fetch("/api/system?resource=machines").then(res => {
      if (!res.ok) throw new Error("Failed to fetch machines");
      return res.json();
    }) 
  });

  const { data: readingsData = [] } = useQuery({
    queryKey: ["meter_readings"],
    queryFn: () => fetch("/api/system?resource=meter_readings").then(res => {
      if (!res.ok) throw new Error("Failed to fetch readings");
      return res.json();
    })
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Generate dynamic notifications
  const notifications = (() => {
    const alerts: any[] = [];
    
    // 1. Missing Opening Reading for Today
    machinesList.forEach((m: any) => {
      const reading = readingsData.find((r: any) => r.machineName === m.name && r.date === today);
      if (!reading) {
        alerts.push({
          id: `missing-op-${m.id}`,
          type: "Alert",
          title: "Missing Opening Reading",
          description: `${m.name} reading needed for today`,
          variant: "destructive"
        });
      } else if (!reading.closingReading || parseFloat(reading.closingReading) === 0) {
        // 2. Pending Closing Reading for Today
        alerts.push({
          id: `pending-cl-${reading.id}`,
          type: "Pending",
          title: "Shift Ending Required",
          description: `Close shift for ${m.name} (${today})`,
          variant: "secondary"
        });
      }
    });

    // 3. Yesterday's unfinished shifts (optional but helpful)
    const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");
    readingsData.forEach((r: any) => {
      if (r.date === yesterday && (!r.closingReading || parseFloat(r.closingReading) === 0)) {
        alerts.push({
          id: `unclosed-yes-${r.id}`,
          type: "Critical",
          title: "Unclosed Previous Shift",
          description: `${r.machineName} was not closed on ${yesterday}`,
          variant: "destructive"
        });
      }
    });

    return alerts;
  })();

  const unreadCount = notifications.length;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-3 border-b border-border bg-card px-4 shrink-0">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex-1 max-w-xs hidden sm:flex items-center gap-2 bg-muted rounded-md px-3 py-1.5">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="h-auto border-0 bg-transparent p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              {/* Notification Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-8 w-8">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full bg-destructive text-[10px] font-black text-white border-2 border-background">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-0 border-none shadow-2xl rounded-2xl overflow-hidden">
                  <div className="p-4 bg-primary text-primary-foreground">
                    <DropdownMenuLabel className="p-0 font-black uppercase tracking-tighter text-lg">Notifications</DropdownMenuLabel>
                    <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest mt-0.5">{unreadCount} Pending actions today</p>
                  </div>
                  <div className="max-h-[400px] overflow-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="p-3 bg-green-50 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                          <Badge variant="outline" className="border-none p-0 text-green-500">✓</Badge>
                        </div>
                        <p className="font-bold text-gray-500 text-sm">All readings up to date!</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <DropdownMenuItem 
                          key={n.id} 
                          className="flex flex-col items-start gap-1 p-4 border-b last:border-0 hover:bg-gray-50 focus:bg-gray-50 cursor-pointer"
                          onClick={() => navigate("/meter-readings")}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <Badge variant={n.variant as any} className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0">
                              {n.type}
                            </Badge>
                            <span className="font-black text-xs uppercase tracking-tight flex-1">{n.title}</span>
                            <span className="text-[9px] font-bold text-gray-400">NOW</span>
                          </div>
                          <p className="text-[11px] font-bold text-gray-500 leading-tight mt-1">{n.description}</p>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <>
                      <DropdownMenuSeparator className="m-0" />
                      <DropdownMenuItem 
                        className="justify-center py-3 text-[11px] font-black uppercase tracking-widest text-primary hover:text-primary transition-colors cursor-pointer"
                        onClick={() => navigate("/meter-readings")}
                      >
                        Go to Meter Audit →
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Account Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold hover:bg-primary/90 uppercase">
                    {user?.name?.substring(0, 2) || "AD"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 overflow-hidden rounded-xl border-none shadow-2xl">
                  <DropdownMenuLabel className="p-4 bg-gray-50">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-black uppercase tracking-tight">{user?.name || "User"}</p>
                      <p className="text-[10px] font-bold text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="m-0" />
                  <div className="p-1">
                    <DropdownMenuItem className="gap-2 font-bold text-xs uppercase cursor-pointer">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 font-bold text-xs uppercase cursor-pointer" onClick={() => navigate("/settings")}>
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="p-1">
                    <DropdownMenuItem className="gap-2 text-destructive font-black text-xs uppercase cursor-pointer" onClick={handleLogout}>
                      <LogOut className="h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>

  );
}
