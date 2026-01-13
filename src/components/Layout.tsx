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
  X, // Importar icone de fechar
  // BarChart3,
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

  // Estado inicial baseado no tamanho da tela
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768; // Começa fechado se for mobile (<768px)
    }
    return true;
  });

  const [isAdmin, setIsAdmin] = useState(false);

  /* ======================================================
      AUTH & RESIZE LISTENER
  ====================================================== */

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate("/");
      return;
    }
    setIsAdmin(authService.isAdmin());
  }, [navigate]);

  // Fecha a sidebar automaticamente ao mudar de rota em dispositivos móveis
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };
    
    // Opcional: Se quiser fechar ao navegar apenas no mobile
    if (window.innerWidth < 768) {
       setIsSidebarOpen(false);
    }

    // Opcional: Escutar resize para adaptar layout dinamicamente
    // window.addEventListener('resize', handleResize);
    // return () => window.removeEventListener('resize', handleResize);
  }, [location.pathname]);

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
      MENU ITEMS
  ====================================================== */

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Receipt, label: "Gastos", path: "/expenses" },
    { icon: CreditCard, label: "Assinantes", path: "/subscriptions" },
    { icon: FileText, label: "Contratos", path: "/contracts" },
    { icon: Users, label: "Clientes", path: "/clients" },
  ];

  const handleLogout = () => {
    authService.logout();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-[#071e30] relative">
      
      {/* MOBILE HEADER 
        Aparece apenas em telas pequenas (< md) para abrir o menu 
      */}
      <header className="md:hidden flex items-center justify-between p-4 bg-[#071e30] border-b border-primary/20 fixed top-0 left-0 right-0 z-30">
        <div className="flex items-center gap-2">
           <img src="/logo.jpeg" className="w-8" alt="Logo" />
           <span className="font-bold text-white">Gestão Premium</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu className="w-6 h-6 text-white" />
        </Button>
      </header>

      {/* BACKDROP (OVERLAY)
        Fundo escuro que aparece apenas no mobile quando o menu está aberto
      */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR 
        Classes explicadas:
        - fixed inset-y-0 left-0 z-50: No mobile, fixa na esquerda cobrindo tudo.
        - transform transition-transform: Animação de deslize.
        - -translate-x-full: Esconde por padrão no mobile.
        - md:relative: No desktop, volta a ser relativo (empurra conteúdo).
        - md:translate-x-0: No desktop, sempre visível (a largura controla o estado).
      */}
      <aside
        className={cn(
          "bg-[#071e30] border-r border-primary/20 transition-all duration-300 flex flex-col",
          // Comportamento Mobile (Overlay)
          "fixed inset-y-0 left-0 z-50 h-full",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          // Comportamento Desktop (Empurra conteúdo)
          "md:relative md:translate-x-0",
          // Controle de largura (apenas visual no desktop, físico no mobile)
          isSidebarOpen ? "w-74" : "md:w-20 w-74" // Mobile sempre full width da sidebar (74) quando aberto
        )}
      >
        <div className="p-6 border-b border-primary/20 flex items-center justify-between">
          {/* Logo - Visível se aberto ou se for mobile (já que mobile sempre abre full) */}
          {(isSidebarOpen || window.innerWidth < 768) && (
            <h2 className="flex gap-3 items-center text-xl font-bold bg-gradient-gold bg-clip-text text-transparent truncate">
              <img src="/logo.jpeg" className="w-12" alt="" />
              Gestão Premium
            </h2>
          )}

          {/* Botão de Toggle (Desktop) ou Fechar (Mobile) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-white hover:text-white/80"
          >
            {/* No mobile mostra X quando aberto, no desktop mostra Menu */}
            <span className="md:hidden">
              <X className="w-5 h-5" />
            </span>
            <span className="hidden md:block">
              <Menu className="w-5 h-5" />
            </span>
          </Button>
        </div>

        {/* MENU */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
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
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {/* Texto: Esconde se estiver fechado APENAS no desktop. No mobile sempre mostra se a sidebar estiver visível */}
                <span className={cn(
                    "whitespace-nowrap transition-opacity duration-300",
                    !isSidebarOpen && "md:opacity-0 md:hidden"
                )}>
                    {item.label}
                </span>
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
              !isSidebarOpen && "md:justify-center"
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className={cn(
                "whitespace-nowrap",
                !isSidebarOpen && "md:hidden"
            )}>
                Sair
            </span>
          </Button>
        </div>
      </aside>

      {/* CONTENT */}
      {/* Adicionado padding-top no mobile por causa do header fixo */}
      <main className="flex-1 overflow-auto pt-16 md:pt-0">
          {children}
      </main>
    </div>
  );
};

export default Layout;