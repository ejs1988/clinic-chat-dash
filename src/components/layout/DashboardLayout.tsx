import { useState } from "react";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  MessageCircle, 
  Users, 
  BarChart3, 
  Settings, 
  Bell,
  Menu,
  Search,
  Activity
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  { id: "overview", label: "Dashboard", icon: BarChart3 },
  { id: "appointments", label: "Agendamentos", icon: Calendar },
  { id: "chat", label: "Chat ao Vivo", icon: MessageCircle, badge: "3" },
  { id: "patients", label: "Pacientes", icon: Users },
  { id: "settings", label: "Configurações", icon: Settings },
];

export function DashboardLayout({ children, activeSection, onSectionChange }: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar className="border-r border-sidebar-border">
          <SidebarHeader className="border-b border-sidebar-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-sidebar-foreground">Clínica Dashboard</h2>
                <p className="text-sm text-muted-foreground">Sistema Médico</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarMenu className="p-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onSectionChange(item.id)}
                      className={`
                        w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200
                        ${isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border" 
                          : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto text-xs bg-primary text-primary-foreground">
                          {item.badge}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger />
              <div className="flex-1 flex items-center gap-4">
                <div className="relative max-w-md flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar pacientes, agendamentos..." 
                    className="pl-10 pr-4"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-destructive text-destructive-foreground">
                    2
                  </Badge>
                </Button>
                
                <div className="flex items-center gap-2 ml-4 pl-4 border-l border-border">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-foreground">DR</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Dr. Sistema</span>
                    <span className="text-xs text-muted-foreground">Administrador</span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}