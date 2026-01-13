import { ReactNode, useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  FileText,
  Users,
  CreditCard,
  LogOut,
  Menu,
  BarChart3,
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

  /* ======================================================
     AUTH
  ====================================================== */

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate("/");
      return;
    }

    setIsAdmin(authService.isAdmin());
  }, [navigate]);

  /* ======================================================
     PRESERVAR FILTRO DE DATA NA URL
  ====================================================== */

  const currentQuery = useMemo(() => {
    const params = new URLSearchParams(location.search);

    const from = params.get("from");
    const to = params.get("to");

    if (from && to) {
      return `?from=${from}&to=${to}`;
    }

    return "";
  }, [location.search]);

  const navigateWithRange = (path: string) => {
    navigate(`${path}${currentQuery}`);
  };

  /* ======================================================
     MENU
  ====================================================== */

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Receipt, label: "Gastos", path: "/expenses" },
    { icon: CreditCard, label: "Assinantes", path: "/subscriptions" },
    { icon: FileText, label: "Contratos", path: "/contracts" },
    { icon: Users, label: "Clientes", path: "/clients" },
    // {
    //   icon: BarChart3,
    //   label: "Relatórios",
    //   path: "/reports",
    //   adminOnly: true,
    // },
  ];

  const handleLogout = () => {
    authService.logout();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-[#071e30]">
      {/* SIDEBAR */}
      <aside
        className={cn(
          "bg-[#071e30] border-r border-primary/20 transition-all duration-300 flex flex-col",
          isSidebarOpen ? "w-74" : "w-20"
        )}
      >
        <div className="p-6 border-b border-primary/20 flex items-center justify-between">
          {isSidebarOpen && (
            <h2 className="flex gap-3 items-center text-xl font-bold bg-gradient-gold bg-clip-text text-transparent">
              <img src="/logo.jpeg" className="w-12" alt="" />
              Gestão Premium
            </h2>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* MENU */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;

            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => navigateWithRange(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                  isActive
                    ? "bg-gradient-gold text-primary-foreground shadow-gold"
                    : "text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className="w-5 h-5" />
                {isSidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* LOGOUT */}
        <div className="p-4 border-t border-primary/20">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(
              "w-full justify-start gap-3 text-destructive",
              !isSidebarOpen && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span>Sair</span>}
          </Button>
        </div>
      </aside>

      {/* CONTENT */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
};

export default Layout;
