import { ReactNode, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Receipt, 
  FileText, 
  Users, 
  CreditCard,
  LogOut,
  Menu,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { authService } from "@/lib/auth";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(authService.isAdmin());
  }, []);

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Receipt, label: "Gastos", path: "/expenses" },
    { icon: CreditCard, label: "Assinantes", path: "/subscriptions" },
    { icon: FileText, label: "Contratos", path: "/contracts" },
    { icon: Users, label: "Clientes", path: "/clients" },
    { icon: BarChart3, label: "Relatórios", path: "/reports", adminOnly: true },
  ];

  const handleLogout = () => {
    authService.logout();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-gradient-dark">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-card border-r border-primary/20 transition-all duration-300 flex flex-col",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-6 border-b border-primary/20 flex items-center justify-between">
          {isSidebarOpen && (
            <h2 className="text-xl font-bold bg-gradient-gold bg-clip-text text-transparent">
              Gestão Premium
            </h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-primary hover:bg-primary/10"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                  isActive
                    ? "bg-gradient-gold text-primary-foreground shadow-gold"
                    : "text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className="w-5 h-5" />
                {isSidebarOpen && (
                  <span className="font-medium">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-primary/20">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(
              "w-full justify-start gap-3 text-destructive hover:bg-destructive/10",
              !isSidebarOpen && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span>Sair</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
};

export default Layout;
