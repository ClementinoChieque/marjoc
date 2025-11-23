import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Menu,
  X,
  Activity,
  FileText,
  LogOut,
  UserCog
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface LayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
    roles: ['administrador', 'farmaceutico', 'operador_caixa']
  },
  {
    title: "Clientes",
    icon: Users,
    path: "/clientes",
    roles: ['administrador', 'farmaceutico', 'operador_caixa']
  },
  {
    title: "Produtos",
    icon: Package,
    path: "/produtos",
    roles: ['administrador', 'farmaceutico']
  },
  {
    title: "Relatórios",
    icon: FileText,
    path: "/relatorios",
    roles: ['administrador']
  },
  {
    title: "Usuários",
    icon: UserCog,
    path: "/usuarios",
    roles: ['administrador']
  },
];

export function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const { signOut, profile, userRole } = useAuth();

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => 
    !userRole || item.roles.includes(userRole)
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen transition-transform duration-300",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full w-64 flex-col bg-sidebar">
          {/* Logo */}
          <div className="flex items-center gap-2 border-b border-sidebar-border px-6 py-5">
            <Activity className="h-7 w-7 text-sidebar-primary" />
            <span className="text-xl font-bold text-sidebar-foreground">Marjoc</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.title}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-sidebar-border px-3 py-4 space-y-3">
            <div className="px-3">
              <p className="text-xs text-sidebar-foreground/60 mb-1">Usuário:</p>
              <p className="text-xs text-sidebar-foreground font-medium truncate">
                {profile?.nome_completo || 'Carregando...'}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                @{profile?.username || '...'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
            <p className="text-xs text-sidebar-foreground/60 px-3">
              Sistema de Gestão Farmacêutica
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300",
          isSidebarOpen ? "ml-64" : "ml-0"
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border bg-card">
          <div className="flex h-16 items-center gap-4 px-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-foreground hover:bg-secondary"
            >
              {isSidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            <h1 className="text-lg font-semibold text-foreground">
              {filteredMenuItems.find((item) => item.path === location.pathname)?.title || "Dashboard"}
            </h1>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
